import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  // In Cloud Run, use default service account
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  } else {
    // For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
    initializeApp();
  }
}

const db = getFirestore();

// Rate limiting: in-memory store (use Firestore for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

// Verify CAPTCHA token with Google reCAPTCHA
async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not found, skipping CAPTCHA verification');
      return true; // Allow in development if key not set
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      console.error('CAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // Check score for reCAPTCHA v3 (if using v3)
    if (data.score !== undefined && data.score < 0.5) {
      console.error('CAPTCHA score too low:', data.score);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return false;
  }
}

// Send Telegram notification for new applications
async function sendTelegramNotification(applicationData: FirestoreApplicationData, applicationId: string) {
  try {
    // Get bot token from environment or Secret Manager
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not found, skipping notification');
      return;
    }

    // Get user IDs
    const adminUserId = process.env.TELEGRAM_ADMIN_USER_ID || '41661658';
    const teacherUserId = process.env.TELEGRAM_TEACHER_USER_ID;

    // Sanitize for MarkdownV2
    const sanitizeMarkdown = (text: string) => text.replace(/[*_\[\]()~`>#+=|{}.!-]/g, match => '\\' + match);

    // Teacher message (concise, with phone highlighted)
    if (teacherUserId) {
      const teacherMessage = `📞 New application: ${sanitizeMarkdown(applicationData.studentName)} \\- ${sanitizeMarkdown(applicationData.phoneNumber)}`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: teacherUserId,
          text: teacherMessage,
          parse_mode: 'MarkdownV2',
        }),
      });
    }

    // Admin message (technical details)
    const adminMessage = `
📋 **New Application Received\\!**

👤 **Student:** ${sanitizeMarkdown(applicationData.studentName)}
📚 **Grade:** ${sanitizeMarkdown(applicationData.grade)}
📞 **Phone:** ${sanitizeMarkdown(applicationData.phoneNumber)}
🎓 **Program:** ${sanitizeMarkdown(applicationData.program)}
💬 **Comments:** ${sanitizeMarkdown(applicationData.comments || 'None')}

📅 **Submitted:** ${new Date().toLocaleString()}
🆔 **Application ID:** ${applicationId}
🌐 **IP:** ${applicationData.ipAddress}
✅ **CAPTCHA:** ${applicationData.captchaVerified ? 'Verified' : 'Not verified'}
📊 **Status:** ${applicationData.status}
    `;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminUserId,
        text: adminMessage,
        parse_mode: 'MarkdownV2',
      }),
    });

    console.log('Telegram notifications sent successfully');
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

interface ApplicationFormData {
  name: string;
  grade: string;
  phone: string;
  program: string;
  comments?: string;
  captchaToken?: string;
}

interface FirestoreApplicationData {
  studentName: string;
  grade: string;
  phoneNumber: string;
  program: string;
  comments: string;
  submittedAt: FieldValue;
  ipAddress: string;
  captchaVerified: boolean;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData: ApplicationFormData = await request.json();
    
    // Basic validation
    if (!formData.name || !formData.grade || !formData.phone || !formData.program) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify CAPTCHA token
    if (formData.captchaToken) {
      const captchaValid = await verifyCaptcha(formData.captchaToken);
      if (!captchaValid) {
        return NextResponse.json(
          { success: false, message: 'CAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    } else {
      // Require CAPTCHA for all submissions
      return NextResponse.json(
        { success: false, message: 'CAPTCHA verification is required.' },
        { status: 400 }
      );
    }

    // Get client IP for spam prevention
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Save application to Firestore
    const applicationData = {
      studentName: formData.name,
      grade: formData.grade,
      phoneNumber: formData.phone,
      program: formData.program,
      comments: formData.comments || '',
      submittedAt: FieldValue.serverTimestamp(),
      ipAddress: clientIP,
      captchaVerified: !!formData.captchaToken,
      status: 'new',
    };

    const docRef = await db.collection('applications').add(applicationData);

    // Send Telegram notification
    try {
      await sendTelegramNotification(applicationData, docRef.id);
    } catch (notificationError) {
      console.error('Failed to send Telegram notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! The teacher will contact you soon.',
      applicationId: docRef.id,
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}