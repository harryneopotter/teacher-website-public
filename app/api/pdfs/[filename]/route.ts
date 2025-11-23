import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const BUCKET_PDFS = 'your-pdfs-bucket-private';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  try {
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Generate signed URL for the PDF
    const file = storage.bucket(BUCKET_PDFS).file(filename);
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl, { status: 302 });
    
  } catch (error) {
    console.error('Error generating signed URL for PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF URL' }, { status: 500 });
  }
}