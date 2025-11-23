// Test script to debug PDF processing issues
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

// Initialize clients
const firestore = new Firestore();
const storage = new Storage();

// Configuration from environment variables
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-gcp-project-id';
const BUCKET_PDFS = process.env.BUCKET_PDFS || 'your-pdfs-bucket-private';
const BUCKET_THUMBNAILS = process.env.BUCKET_THUMBNAILS || 'your-thumbnails-bucket-public';

async function testCloudStorage() {
  try {
    console.log('Testing Cloud Storage connection...');

    // Test bucket access
    const [buckets] = await storage.getBuckets();
    console.log('Available buckets:', buckets.map(b => b.name));

    // Test PDF bucket
    const pdfBucket = storage.bucket(BUCKET_PDFS);
    const [pdfFiles] = await pdfBucket.getFiles({ maxResults: 5 });
    console.log('PDF bucket files:', pdfFiles.map(f => f.name));

    // Test thumbnail bucket
    const thumbBucket = storage.bucket(BUCKET_THUMBNAILS);
    const [thumbFiles] = await thumbBucket.getFiles({ maxResults: 5 });
    console.log('Thumbnail bucket files:', thumbFiles.map(f => f.name));

    console.log('✅ Cloud Storage test passed');
  } catch (error) {
    console.error('❌ Cloud Storage test failed:', error);
  }
}

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');

    const snapshot = await firestore.collection('showcase').limit(5).get();
    console.log('Showcase items count:', snapshot.size);

    snapshot.forEach(doc => {
      console.log('Item:', doc.id, doc.data());
    });

    console.log('✅ Firestore test passed');
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
  }
}

async function testFileUpload() {
  try {
    console.log('Testing file upload...');

    const testContent = 'This is a test file';
    const buffer = Buffer.from(testContent);
    const fileName = `test-${Date.now()}.txt`;

    const file = storage.bucket(BUCKET_PDFS).file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: 'text/plain',
      },
    });

    console.log('✅ File upload test passed');
    console.log('Test file uploaded:', fileName);

    // Clean up
    await file.delete();
    console.log('Test file cleaned up');

  } catch (error) {
    console.error('❌ File upload test failed:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting PDF processing tests...\n');

  await testCloudStorage();
  console.log('');

  await testFirestore();
  console.log('');

  await testFileUpload();
  console.log('');

  console.log('🏁 Tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCloudStorage, testFirestore, testFileUpload };