import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: 'unknown',
      storage: 'unknown',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Test Firestore connection
    await db.collection('system_health').limit(1).get();
    healthCheck.services.database = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    healthCheck.services.database = 'error';
    healthCheck.status = 'degraded';
  }

  // TODO: Test Cloud Storage connection
  // try {
  //   const storage = getStorage();
  //   await storage.bucket().getMetadata();
  //   healthCheck.services.storage = 'healthy';
  // } catch (error) {
  //   healthCheck.services.storage = 'error';
  //   healthCheck.status = 'degraded';
  // }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthCheck, { status: statusCode });
}