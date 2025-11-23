import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

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
const storage = new Storage();

export async function GET() {
  try {
    // Fetch showcase items from Firestore
    const showcaseRef = db.collection('showcase');
    const snapshot = await showcaseRef
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get();

    const collections = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      let pdfUrl = data.pdfUrl; // fallback
      let thumbnailUrl = data.thumbnailUrl;

      // Generate signed URL if pdfObjectName exists
      if (data.pdfObjectName) {
        try {
          const pdfBucket = process.env.BUCKET_PDFS || 'your-pdfs-bucket';
          const file = storage.bucket(pdfBucket).file(data.pdfObjectName);
          const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          });
          pdfUrl = signedUrl;
        } catch (error) {
          console.error('Error generating signed URL for', data.pdfObjectName, error);
        }
      }

      // Ensure thumbnailUrl is a public HTTPS URL if possible
      if (thumbnailUrl && thumbnailUrl.startsWith('gs://')) {
        // Convert gs://bucket/object to https://storage.googleapis.com/bucket/object
        const match = thumbnailUrl.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (match) {
          const bucket = match[1];
          const object = encodeURIComponent(match[2]);
          thumbnailUrl = `https://storage.googleapis.com/${bucket}/${object}`;
        }
      }

      return {
        id: doc.id,
        ...data,
        pdfUrl,
        thumbnailUrl,
        // Convert Firestore timestamps to strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }));

    return NextResponse.json({
      collections,
      lastUpdated: new Date().toISOString(),
      totalItems: collections.length,
    });

  } catch (error) {
    console.error('Error fetching showcase data:', error);
    
    // Fallback to static data if Firestore fails
    const staticShowcase = [
      {
        id: 1,
        title: "Student Work A",
        author: "Student A",
        type: "Creative Writing Collection",
        description: "A creative writing collection showcasing imaginative storytelling and expression.",
        pdfUrl: "/pdfs/student-a-portfolio.pdf",
        thumbnailUrl: "/thumbnails/student-a-portfolio.jpg",
        publishedDate: "August 2024",
        status: "published",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Student Work B",
        author: "Student B",
        type: "Poetry Collection",
        description: "A collection of original poems exploring themes of nature and imagination.",
        pdfUrl: "/pdfs/student-b-portfolio.pdf",
        thumbnailUrl: "/thumbnails/student-b-portfolio.jpg",
        publishedDate: "August 2024",
        status: "published",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Student Work C",
        author: "Student C",
        type: "Poetry Collection",
        description: "An inspiring portfolio showcasing creative expression and developing poetic voice.",
        pdfUrl: "/pdfs/student-c-portfolio.pdf",
        thumbnailUrl: "/thumbnails/student-c-portfolio.jpg",
        publishedDate: "August 2024",
        status: "published",
        createdAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json({
      collections: staticShowcase,
      lastUpdated: new Date().toISOString(),
      totalItems: staticShowcase.length,
      fallback: true,
    });
  }
}