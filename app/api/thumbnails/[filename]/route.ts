import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  try {
    const filePath = join(process.cwd(), 'public', 'thumbnails', filename);
    
    if (!existsSync(filePath)) {
      return new NextResponse('Thumbnail not found', { status: 404 });
    }
    
    const fileBuffer = readFileSync(filePath);
    
    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    
    const contentType = contentTypes[ext || ''] || 'image/jpeg';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return new NextResponse('Error serving thumbnail', { status: 500 });
  }
}