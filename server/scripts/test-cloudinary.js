import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Testing Cloudinary Configuration...\n');
console.log('Cloud Name:', cloudName ? '✓ Set' : '✗ Missing');
console.log('API Key:', apiKey ? '✓ Set' : '✗ Missing');
console.log('API Secret:', apiSecret ? '✓ Set (hidden)' : '✗ Missing');
console.log('');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('✗ Cloudinary credentials are missing!');
  console.error('Please check your .env file.');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
  timeout: 60000
});

console.log('Testing connection to Cloudinary...\n');

// Test 1: Verify credentials by pinging the API
async function testConnection() {
  try {
    console.log('Test 1: Verifying API credentials...');
    const result = await cloudinary.api.ping();
    console.log('✓ API Ping successful:', result.status);
    return true;
  } catch (error) {
    console.error('✗ API Ping failed:', error.message);
    if (error.http_code === 401) {
      console.error('  Invalid API credentials. Please check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
    } else if (error.http_code === 403) {
      console.error('  Access forbidden. Please check your account permissions');
    }
    return false;
  }
}

// Test 2: Try uploading a small test image
async function testUpload() {
  try {
    console.log('\nTest 2: Testing image upload...');
    
    // Create a minimal 1x1 transparent PNG in base64
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'taskmtaa/test',
          public_id: `test-${Date.now()}`,
          timeout: 30000
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(testImage);
    });

    console.log('✓ Upload successful!');
    console.log('  URL:', result.secure_url);
    console.log('  Public ID:', result.public_id);
    
    // Clean up test image
    console.log('\nCleaning up test image...');
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✓ Test image removed');
    
    return true;
  } catch (error) {
    console.error('✗ Upload failed:', error.message);
    if (error.http_code) {
      console.error('  HTTP Code:', error.http_code);
    }
    return false;
  }
}

// Test 3: Check account usage
async function checkUsage() {
  try {
    console.log('\nTest 3: Checking account usage...');
    const usage = await cloudinary.api.usage();
    console.log('✓ Account Usage:');
    console.log('  Plan:', usage.plan);
    console.log('  Credits:', usage.credits?.usage || 'N/A', '/', usage.credits?.limit || 'N/A');
    console.log('  Bandwidth:', Math.round((usage.bandwidth?.usage || 0) / 1024 / 1024), 'MB /', Math.round((usage.bandwidth?.limit || 0) / 1024 / 1024), 'MB');
    console.log('  Storage:', Math.round((usage.storage?.usage || 0) / 1024 / 1024), 'MB /', Math.round((usage.storage?.limit || 0) / 1024 / 1024), 'MB');
    console.log('  Transformations:', usage.transformations?.usage || 0, '/', usage.transformations?.limit || 'unlimited');
    return true;
  } catch (error) {
    console.error('✗ Could not check usage:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════\n');
  
  const test1 = await testConnection();
  if (!test1) {
    console.log('\n✗ Connection test failed. Please check your credentials.');
    process.exit(1);
  }
  
  const test2 = await testUpload();
  if (!test2) {
    console.log('\n✗ Upload test failed. Check your network connection or Cloudinary account status.');
  }
  
  await checkUsage();
  
  console.log('\n═══════════════════════════════════════════════');
  if (test1 && test2) {
    console.log('\n✓ All tests passed! Cloudinary is configured correctly.');
  } else {
    console.log('\n⚠ Some tests failed. Please review the errors above.');
  }
  console.log('');
}

runTests().catch(err => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
