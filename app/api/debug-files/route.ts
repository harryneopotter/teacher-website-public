import { NextResponse } from 'next/server';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const publicPath = join(process.cwd(), 'public');
    const logoPath = join(publicPath, 'logo.png');
    
    const debug = {
      cwd: process.cwd(),
      publicPath,
      logoPath,
      publicExists: existsSync(publicPath),
      logoExists: existsSync(logoPath),
      publicContents: existsSync(publicPath) ? readdirSync(publicPath) : [],
      nodeEnv: process.env.NODE_ENV,
    };
    
    return NextResponse.json(debug);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}