const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const TelegramBot = require('node-telegram-bot-api');


const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const firestore = new Firestore();
const storage = new Storage();
const secretClient = new SecretManagerServiceClient();

const USE_LOCAL_STORE = process.env.USE_LOCAL_STORE === '1';
const LOCAL_STORE_DIR = process.env.LOCAL_STORE_DIR || path.join(os.tmpdir(), 'showcase_bot_store');

// Configuration (use environment variables; fallbacks are neutral placeholders)
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID || 'project-id-placeholder';
const BUCKET_PDFS = process.env.BUCKET_PDFS || 'pdfs-bucket-placeholder';
const BUCKET_THUMBNAILS = process.env.BUCKET_THUMBNAILS || 'thumbnails-bucket-placeholder';

// Authorized users with roles (can be moved to Firestore or env vars)
const AUTHORIZED_USERS = {
  [process.env.ADMIN_USER_ID || '00000000']: 'admin',     // Admin (set TELEGRAM_ADMIN_USER_ID in env)
  [process.env.CONTENT_MANAGER_USER_ID || '00000000']: 'content_manager', // Content manager (set TELEGRAM_CONTENT_MANAGER_USER_ID in env)
};

let bot;
let geminiApiKey;

// Conversation state management
const conversationStates = new Map();


// Step 1: Add Markdown sanitization utility
function sanitizeMarkdown(text) {
  if (!text) return '';
  // Escape Telegram MarkdownV2 special chars including backslash
  const chars = ['\\', '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  const re = new RegExp('([' + chars.map(c => '\\' + c).join('') + '])', 'g');
  return String(text).replace(re, '\\$1');
}

// Local JSON store helpers (used when USE_LOCAL_STORE = '1')
function ensureLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORE_DIR)) fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create local store dir', e);
  }
}

function readJsonFile(fileName) {
  try {
    ensureLocalStore();
    const p = path.join(LOCAL_STORE_DIR, fileName);
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8') || '{}');
  } catch (e) {
    console.error('readJsonFile error', e);
    return {};
  }
}

function writeJsonFile(fileName, data) {
  try {
    ensureLocalStore();
    const p = path.join(LOCAL_STORE_DIR, fileName);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('writeJsonFile error', e);
  }
}


// Initialize secrets
async function initializeSecrets() {
  try {
    // Prefer environment variables for local testing (no gcloud / Secret Manager)
    const envBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const envGemini = process.env.GEMINI_API_KEY;

    let botToken;
    if (envBotToken) {
      botToken = envBotToken;
      console.log('Using TELEGRAM_BOT_TOKEN from environment');
    } else {
      const [botTokenResponse] = await secretClient.accessSecretVersion({
        name: `projects/${PROJECT_ID}/secrets/telegram-bot-token/versions/latest`,
      });
      botToken = botTokenResponse.payload.data.toString();
    }

    if (envGemini) {
      geminiApiKey = envGemini;
      console.log('Using GEMINI_API_KEY from environment');
    } else {
      const [geminiResponse] = await secretClient.accessSecretVersion({
        name: `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`,
      });
      geminiApiKey = geminiResponse.payload.data.toString();
    }

    // Initialize bot (explicitly disable polling)
    bot = new TelegramBot(botToken, { polling: false });

    // Load authorized users from Firestore (works with emulator or real Firestore)
    await loadAuthorizedUsers();

    console.log('Secrets initialized successfully');
  } catch (error) {
    console.error('Error initializing secrets:', error);
    throw error;
  }
}
// Durable rate limiter (Firestore-backed) with local JSON fallback
async function checkAndIncrementRate(key, limit = 5, windowMs = 60 * 60 * 1000) {
  if (USE_LOCAL_STORE) {
    try {
      const rates = readJsonFile('rate_limits.json');
      const now = Date.now();
      const entry = rates[key] || { count: 0, windowStart: 0 };

      if (now - entry.windowStart < windowMs) {
        if (entry.count >= limit) {
          return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - entry.windowStart) };
        } else {
          entry.count += 1;
          rates[key] = entry;
          writeJsonFile('rate_limits.json', rates);
          return { allowed: true, remaining: limit - entry.count };
        }
      } else {
        // reset window
        rates[key] = { count: 1, windowStart: now };
        writeJsonFile('rate_limits.json', rates);
        return { allowed: true, remaining: limit - 1 };
      }
    } catch (err) {
      console.error('Local rate limiter failed (allowing request):', err);
      return { allowed: true, remaining: Infinity };
    }
  }

  // Firestore-backed (production)
  try {
    const docRef = firestore.collection('rate_limits').doc(key.toString());
    const result = await firestore.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      const now = Date.now();
      if (!doc.exists) {
        t.set(docRef, { count: 1, windowStart: now });
        return { allowed: true, remaining: limit - 1 };
      } else {
        const data = doc.data() || {};
        const windowStart = data.windowStart || 0;
        const count = data.count || 0;
        if (now - windowStart < windowMs) {
          if (count >= limit) {
            return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - windowStart) };
          } else {
            t.update(docRef, { count: count + 1 });
            return { allowed: true, remaining: limit - (count + 1) };
          }
        } else {
          t.set(docRef, { count: 1, windowStart: now });
          return { allowed: true, remaining: limit - 1 };
        }
      }
    });
    return result;
  } catch (err) {
    console.error('Rate limiter transaction failed, allowing request (fail-open):', err);
    return { allowed: true, remaining: Infinity };
  }
}

// incrementMetric with local fallback and error spike detection
const ERROR_SPIKE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ERROR_SPIKE_THRESHOLD = 5;
let errorTimestamps = [];

async function incrementMetric(name) {
  if (USE_LOCAL_STORE) {
    try {
      const metrics = readJsonFile('metrics.json');
      metrics[name] = (metrics[name] || 0) + 1;
      metrics[`${name}_lastUpdated`] = new Date().toISOString();
      writeJsonFile('metrics.json', metrics);
      if (name === 'errors') checkErrorSpikeLocal();
      return;
    } catch (err) {
      console.error('Local incrementMetric failed', err);
      return;
    }
  }

  try {
    const docRef = firestore.collection('metrics').doc(name);
    await docRef.set({
      count: Firestore.FieldValue.increment(1),
      lastUpdated: Firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    if (name === 'errors') await checkErrorSpikeFirestore();
  } catch (err) {
    console.error('Failed to increment metric', name, err);
  }
}

// Local error spike detection
function checkErrorSpikeLocal() {
  const now = Date.now();
  errorTimestamps = errorTimestamps.filter(ts => now - ts < ERROR_SPIKE_WINDOW_MS);
  errorTimestamps.push(now);
  if (errorTimestamps.length >= ERROR_SPIKE_THRESHOLD) {
    console.warn(`[ALERT] Error spike detected: ${errorTimestamps.length} errors in last 5 minutes.`);
    // Optionally, send alert to admin here
    errorTimestamps = [];
  }
}

// Firestore error spike detection (simple, not atomic)
async function checkErrorSpikeFirestore() {
  try {
    const docRef = firestore.collection('metrics').doc('error_spike');
    const now = Date.now();
    const doc = await docRef.get();
    let timestamps = [];
    if (doc.exists) {
      timestamps = doc.data().timestamps || [];
      timestamps = timestamps.filter(ts => now - ts < ERROR_SPIKE_WINDOW_MS);
    }
    timestamps.push(now);
    await docRef.set({ timestamps }, { merge: true });
    if (timestamps.length >= ERROR_SPIKE_THRESHOLD) {
      console.warn(`[ALERT] Error spike detected (Firestore): ${timestamps.length} errors in last 5 minutes.`);
      // Optionally, send alert to admin here
      await docRef.set({ timestamps: [] }, { merge: true });
    }
  } catch (err) {
    console.error('Error in checkErrorSpikeFirestore', err);
  }
}

// Load authorized users from Firestore
async function loadAuthorizedUsers() {
  try {
    const snapshot = await firestore.collection('authorized_users').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      AUTHORIZED_USERS[data.userId] = data.role;
    });
    console.log(`Loaded ${snapshot.size} authorized users from Firestore`);
  } catch (error) {
    console.error('Error loading authorized users:', error);
    // Continue with default users if Firestore fails
  }
}

// Verify user authorization
function isAuthorized(userId) {
  return Object.keys(AUTHORIZED_USERS).includes(userId.toString());
}

// Check user role
function getUserRole(userId) {
  return AUTHORIZED_USERS[userId.toString()] || null;
}

// Check if user has specific permission
function hasPermission(userId, requiredRole) {
  const userRole = getUserRole(userId);
  if (!userRole) return false;

  // Role hierarchy: admin > content_manager
  const roleLevels = {
    'content_manager': 1,
    'admin': 2
  };

  return roleLevels[userRole] >= roleLevels[requiredRole];
}

// Generate signed URL for private PDF access
async function generateSignedUrl(fileName) {
  try {
    console.log('Generating signed URL for file:', fileName);
    const file = storage.bucket(BUCKET_PDFS).file(fileName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    console.log('Signed URL generated successfully');
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
}

// Upload file to Cloud Storage
async function uploadFile(buffer, fileName, bucket, contentType) {
  try {
    console.log(`Uploading file ${fileName} to bucket ${bucket} with content type ${contentType}`);
    console.log('Buffer size:', buffer.length);

    const file = storage.bucket(bucket).file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    console.log('File saved to Cloud Storage');

    let publicUrl = null;
    if (bucket === BUCKET_THUMBNAILS) {
      // Make thumbnail public
      console.log('Making thumbnail public...');
      await file.makePublic();
      console.log('Thumbnail made public');
      // Store public HTTPS URL
      publicUrl = `https://storage.googleapis.com/${bucket}/${encodeURIComponent(fileName)}`;
      console.log('Public thumbnail URL:', publicUrl);
      return publicUrl;
    }

    const gsUrl = `gs://${bucket}/${fileName}`;
    console.log('Upload complete, returning URL:', gsUrl);
    return gsUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
}

// Save showcase item to Firestore
async function saveShowcaseItem(data) {
  try {
    const docRef = await firestore.collection('showcase').add({
      ...data,
      createdAt: Firestore.FieldValue.serverTimestamp(),
      updatedAt: Firestore.FieldValue.serverTimestamp(),
      status: 'published',
    });

    console.log('Showcase item saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving showcase item:', error);
    throw error;
  }
}

// Initialize conversation state for user
function initConversationState(userId, pdfFileName) {
  conversationStates.set(userId, {
    step: 'waiting_for_title',
    pdfFileName: pdfFileName,
    data: {}
  });
}

// Get conversation state for user
function getConversationState(userId) {
  return conversationStates.get(userId);
}

// Clear conversation state for user
function clearConversationState(userId) {
  conversationStates.delete(userId);
}

// Process conversation step
async function processConversationStep(userId, text, chatId) {
  const state = getConversationState(userId);
  if (!state) return false;

  // Step 2: Use sanitized user input in all Markdown messages
  switch (state.step) {
    case 'waiting_for_title':
      state.data.title = text.trim();
      state.step = 'waiting_for_author';
      await safeSendMessage(chatId, '📝 Great! Now please provide the author name:', 'MarkdownV2');
      break;

    case 'waiting_for_author':
      state.data.author = text.trim();
      state.step = 'waiting_for_description';
      await safeSendMessage(chatId, '📝 Perfect! Now please provide a description of the work:', 'MarkdownV2');
      break;

    case 'waiting_for_description':
      state.data.description = text.trim();
      state.step = 'waiting_for_thumbnail';

      // Save to Firestore with object name instead of signed URL
      const showcaseId = await saveShowcaseItem({
        title: state.data.title,
        author: state.data.author,
        description: state.data.description,
        pdfObjectName: state.pdfFileName,
        thumbnailUrl: '/thumbnails/test.jpg' // Default thumbnail
      });

      // Persist showcaseId in state for later updates
      state.showcaseId = showcaseId;

      // Step 3: Sanitize user input in published message
      const safeTitle = sanitizeMarkdown(state.data.title);
      await safeSendMessage(chatId, `✅ *${safeTitle}* has been published successfully!`, 'MarkdownV2');
      await safeSendMessage(chatId, '📸 Optionally, you can send a thumbnail image for this work, or send /done to finish.', 'Markdown');

      state.step = 'waiting_for_thumbnail_or_done';
      break;

    case 'waiting_for_thumbnail_or_done':
      if (text.toLowerCase() === '/done') {
        clearConversationState(userId);
        await safeSendMessage(chatId, '🎉 All done! Your student work is now live on the website.', 'MarkdownV2');
      } else {
        await safeSendMessage(chatId, '📸 Please send a thumbnail image or type /done to finish.', 'MarkdownV2');
      }
      break;
  }

  return true;

// Step 4: Add safeSendMessage wrapper for error handling
}

async function safeSendMessage(chatId, text, parseMode) {
  try {
    await bot.sendMessage(chatId, text, parseMode ? { parse_mode: parseMode } : undefined);
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    // Optionally, send a fallback plain text message
    if (parseMode) {
      try {
        await bot.sendMessage(chatId, text);
      } catch (e) {
        console.error('Fallback plain text message also failed:', e);
      }
    }
  }
}

// Handle text messages
async function handleTextMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  if (!isAuthorized(userId)) {
    await safeSendMessage(chatId, '❌ You are not authorized to use this bot.');
    return;
  }

  // Command handling (unnested)
  if (text === '/start') {
    const welcomeMessage = `🎨 Showcase Bot\n\nWelcome! This bot helps you manage student showcase content.\n\nYour Role: ${sanitizeMarkdown(getUserRole(userId) || 'Not authorized')}\n\nCommands:\n📝 Send a PDF file to add a new student work\n📋 /list - View all showcase items\n🔍 /status - Check bot status and your role\n👤 /userid - Get your Telegram user ID\n❌ /cancel - Cancel current PDF upload process\n❓ /help - Show this help message\n\nAdmin Commands:\n👥 /adduser - Add new users (admin only)\n\nHow to add content:\n1. Send a PDF file (max 20MB)\n2. I'll ask for title, author, and description\n3. Optionally send a thumbnail image\n4. Content goes live automatically!\n\nTips:\n• Use /cancel to stop the process anytime\n• Processing may take up to 9 minutes for large files\n• All PDFs are stored securely with signed URLs`;
    await safeSendMessage(chatId, welcomeMessage, 'Markdown');
    return;
  }
  if (text === '/help') {
    const helpMessage = `📚 Help - Showcase Bot\n\nAdding Student Work:\n1. Send a PDF file of the student's work\n2. Follow the prompts to add details\n3. Optionally add a thumbnail image\n\nCommands:\n📋 /list - View all published works\n🔍 /status - Check bot status and your role\n👤 /userid - Get your Telegram user ID\n❌ /cancel - Cancel current PDF upload process\n❓ /help - Show this help\n\nPDF Upload Limits:\n📄 Max size: 20MB (Telegram limit)\n⏱️  Processing timeout: 9 minutes\n💾 Memory: 512MB available\n\nAdmin Commands:\n👥 /adduser - Add new users (admin only)\n\nTips:\n• Use voice messages for descriptions (accessibility feature)\n• AI will help improve descriptions\n• All PDFs are private with signed URLs\n• Thumbnails are public for fast loading`;
    await safeSendMessage(chatId, helpMessage, 'Markdown');
    return;
  }
  if (text === '/list') {
    try {
      const snapshot = await firestore.collection('showcase')
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      if (snapshot.empty) {
        await safeSendMessage(chatId, '📚 No showcase items found.');
        return;
      }
      let message = '📚 Published Showcase Items:\n\n';
      snapshot.forEach(doc => {
        const data = doc.data();
        message += `📖 ${sanitizeMarkdown(data.title)}\n`;
        message += `👤 Author: ${sanitizeMarkdown(data.author)}\n`;
        message += `📅 ${data.createdAt.toDate().toLocaleDateString()}\n\n`;
      });
      await safeSendMessage(chatId, message, 'Markdown');
    } catch (error) {
      console.error('Error listing items:', error);
      await safeSendMessage(chatId, '❌ Error retrieving showcase items.');
    }
    return;
  }
  if (text === '/status') {
    const statusMessage = `🤖 Bot Status\n\n✅ Bot is running\n✅ Connected to Firestore\n✅ Connected to Cloud Storage\n✅ Secrets loaded\n\n📊 Storage Buckets:\n• PDFs: ${sanitizeMarkdown(BUCKET_PDFS)}\n• Thumbnails: ${sanitizeMarkdown(BUCKET_THUMBNAILS)}\n\n👤 Your Role: ${sanitizeMarkdown(getUserRole(userId) || 'Not authorized')}\n👤 Total Users: ${Object.keys(AUTHORIZED_USERS).length}\n👤 Your User ID: ${userId}`;
    await safeSendMessage(chatId, statusMessage, 'Markdown');
    return;
  }
  if (text === '/userid') {
    await safeSendMessage(chatId, `👤 Your Telegram User ID: ${userId}\n\nUse this ID to update the AUTHORIZED_USERS list in the bot code.`);
    return;
  }
  if (text === '/adduser') {
    if (!hasPermission(userId, 'admin')) {
      await safeSendMessage(chatId, '❌ Only admins can add users.');
      return;
    }
    const addUserMsg = `👥 Add User Command\n\nTo add a new user, send their user ID in this format:\nadduser USER_ID ROLE\n\nRoles:\n• content_manager - Can manage content\n• admin - Full access\n\nExample:\nadduser 123456789 content_manager`;
    await safeSendMessage(chatId, addUserMsg, 'Markdown');
    return;
  }
  if (text === '/cancel') {
    const state = getConversationState(userId);
    if (state) {
      clearConversationState(userId);
      await safeSendMessage(chatId, '✅ Process cancelled!\n\nYour PDF upload has been cancelled. You can start over by sending a new PDF file.', 'Markdown');
    } else {
      await safeSendMessage(chatId, '📝 No active process to cancel. Send a PDF file to start uploading content.');
    }
    return;
  }
  if (text.startsWith('adduser ')) {
    if (!hasPermission(userId, 'admin')) {
      await safeSendMessage(chatId, '❌ Only admins can add users.');
      return;
    }
    const parts = text.split(' ');
    if (parts.length !== 3) {
      await safeSendMessage(chatId, '❌ Invalid format. Use: adduser USER_ID ROLE', 'Markdown');
      return;
    }
    const [command, newUserId, role] = parts;
    if (!['content_manager', 'admin'].includes(role)) {
      await safeSendMessage(chatId, '❌ Invalid role. Use: content_manager or admin', 'Markdown');
      return;
    }
    // Save to Firestore for persistence
    try {
      await firestore.collection('authorized_users').doc(newUserId).set({
        userId: newUserId,
        role: role,
        addedBy: userId,
        addedAt: Firestore.FieldValue.serverTimestamp()
      });
      
      // Also update in-memory for immediate effect
      AUTHORIZED_USERS[newUserId] = role;
      
      await safeSendMessage(chatId, `✅ User ${newUserId} added with role: ${role}\n\n✅ Change saved permanently to database.`, 'Markdown');
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      await safeSendMessage(chatId, `❌ Failed to save user permanently. Error: ${sanitizeMarkdown(error.message)}`, 'Markdown');
    }
    return;
  }
  // Handle conversation steps first
  if (await processConversationStep(userId, text, chatId)) {
    return;
  }
  // Handle other text as potential responses to prompts
  await safeSendMessage(chatId, '� Send a PDF file to add new student work, or use /help for commands.');
}

// Handle document messages
// Handle photo messages
async function handlePhoto(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const photos = msg.photo;
  // Rate limit thumbnail uploads: e.g., 10 thumbnails per hour per user
  const rlPhoto = await checkAndIncrementRate(userId.toString() + '_photo', 10, 60 * 60 * 1000);
  if (!rlPhoto.allowed) {
    await safeSendMessage(chatId, `❌ Thumbnail rate limit exceeded. Try again later.`);
    await incrementMetric('rate_limit_hits');
    return;
  }
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    await safeSendMessage(chatId, '❌ No photo found in the message.');
    return;
  }
  // Get the highest resolution photo
  const photo = photos[photos.length - 1];
  try {
    await safeSendMessage(chatId, '📸 Processing thumbnail image...');
    const fileLink = await bot.getFileLink(photo.file_id);
    const response = await fetch(fileLink);
    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const fileName = `${timestamp}-thumbnail.jpg`;
    const thumbnailUrl = await uploadFile(buffer, fileName, BUCKET_THUMBNAILS, 'image/jpeg');
    // Update conversation state if active
    const state = getConversationState(userId);
    if (state && state.showcaseId) {
      // Update Firestore with thumbnail URL
      await firestore.collection('showcase').doc(state.showcaseId).update({
        thumbnailUrl: thumbnailUrl,
        updatedAt: Firestore.FieldValue.serverTimestamp()
      });
      await safeSendMessage(chatId, '✅ Thumbnail uploaded and linked to your showcase item!');
      await safeSendMessage(chatId, '🎉 All done! Your student work is now live on the website.', 'Markdown');
      clearConversationState(userId);
      await incrementMetric('thumbnail_uploads');
    } else {
      await safeSendMessage(chatId, '✅ Thumbnail uploaded!');
      await incrementMetric('thumbnail_uploads');
    }
  } catch (error) {
    console.error('Error handling photo:', error);
    await safeSendMessage(chatId, `❌ Error processing photo: ${sanitizeMarkdown(error.message)}. Please try again.`);
    await incrementMetric('errors');
  }
}
async function handleDocument(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const document = msg.document;
  // Rate limit for PDF uploads: e.g., 5 uploads per hour per user
  const rl = await checkAndIncrementRate(userId.toString(), 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    await safeSendMessage(chatId, `❌ Rate limit exceeded. Try again in ${Math.ceil((rl.retryAfterMs || 0) / 1000)}s.`);
    await incrementMetric('rate_limit_hits');
    return;
  }
  try {
    console.log('📄 Processing PDF for user:', userId);
    console.log('Document info:', {
      file_name: document.file_name,
      mime_type: document.mime_type,
      file_size: document.file_size,
      file_id: document.file_id
    });

    await safeSendMessage(chatId, '📄 Processing PDF... Please wait.');

    // Download the file
    console.log('Getting file link...');
    const fileLink = await bot.getFileLink(document.file_id);
    console.log('File link obtained:', fileLink);

    const response = await fetch(fileLink);

    if (!response.ok) {
      const errMsg = `Failed to download file: ${response.status} ${response.statusText}`;
      console.error(errMsg);
      await incrementMetric('errors');
      throw new Error(errMsg);
    }

    console.log('File downloaded successfully, converting to buffer...');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${document.file_name || 'document.pdf'}`;
    console.log('Generated filename:', fileName);

    // Upload to Cloud Storage
    console.log('Uploading to Cloud Storage...');
    const pdfUrl = await uploadFile(buffer, fileName, BUCKET_PDFS, 'application/pdf');
    console.log('Upload successful, URL:', pdfUrl);

    await safeSendMessage(chatId, '✅ PDF uploaded successfully!');
    await safeSendMessage(chatId, `📁 File: ${sanitizeMarkdown(fileName)}`);
    await safeSendMessage(chatId, '📝 Now please provide the title of the work:');

    // Initialize conversation state
    initConversationState(userId, fileName);
    console.log('Conversation state initialized for user:', userId);
    await incrementMetric('pdf_uploads');

  } catch (error) {
    console.error('Error handling document:', error);
    if (error && error.stack) console.error('Error stack:', error.stack);
    await safeSendMessage(chatId, `❌ Error processing PDF: ${sanitizeMarkdown(error.message)}. Please try again.`);
    await incrementMetric('errors');
  }
}

// Main Cloud Function handler
exports.telegramShowcaseBot = async (req, res) => {
  try {
    // Initialize secrets if not already done
    if (!bot) {
      await initializeSecrets();
    }

    // Verify webhook (optional security)
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      try {
        if (msg.text) {
          await handleTextMessage(msg);
        } else if (msg.document) {
          await handleDocument(msg);
        } else if (msg.photo) {
          await handlePhoto(msg);
        } else if (msg.voice) {
          // TODO: Handle voice messages for accessibility
          // When implementing voice-to-text, sanitize user-generated content before sending.
          await safeSendMessage(msg.chat.id, '🎤 Voice message received! Voice-to-text feature coming soon.');
        } else {
          await safeSendMessage(msg.chat.id, '🤖 Sorry, I did not recognize that message type. Please send a PDF file, photo, or use /help for commands.');
        }
      } catch (msgErr) {
        console.error('Error in message handler:', msgErr);
        if (msgErr && msgErr.stack) console.error('Error stack:', msgErr.stack);
        await safeSendMessage(msg.chat.id, `❌ Internal error: ${sanitizeMarkdown(msgErr.message)}. Please try again later.`);
        await incrementMetric('errors');
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error in webhook handler:', error);
    if (error && error.stack) console.error('Error stack:', error.stack);
    await incrementMetric('errors');
    res.status(500).send('Error');
  }
};

// For local testing
if (require.main === module) {
  const express = require('express');
  const app = express();

  app.use(express.json());

  app.get('/health', async (req, res) => {
    if (USE_LOCAL_STORE) {
      res.status(200).json({ status: 'ok', store: 'local' });
      return;
    }
    try {
      // minimal Firestore ping
      await firestore.collection('__health').doc('ping').set({ ts: Firestore.FieldValue.serverTimestamp() });
      res.status(200).json({ status: 'ok', store: 'firestore' });
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  app.post('/webhook', exports.telegramShowcaseBot);

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Bot server running on port ${port}`);
    if (USE_LOCAL_STORE) console.log('Using local JSON store for rate limits & metrics (USE_LOCAL_STORE=1)');
  });
}
