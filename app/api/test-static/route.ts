import { NextResponse } from 'next/server';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const publicPath = join(process.cwd(), 'public');
    const logoPath = join(publicPath, 'logo.png');
    
    const publicExists = existsSync(publicPath);
    const logoExists = existsSync(logoPath);
    
    let publicContents: string[] = [];
    if (publicExists) {
      publicContents = readdirSync(publicPath);
    }
    
    return NextResponse.json({
      cwd: process.cwd(),
      publicPath,
      logoPath,
      publicExists,
      logoExists,
      publicContents,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      cwd: process.cwd(),
    });
  }
}