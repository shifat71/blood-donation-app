const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: '.env' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary Configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***configured***' : 'NOT CONFIGURED');

// Test with a simple base64 image (1x1 red pixel)
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function testUpload() {
  try {
    console.log('\nAttempting to upload test image...');
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'test-uploads',
      resource_type: 'image',
    });
    
    console.log('✅ SUCCESS! Upload worked!');
    console.log('Uploaded URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Clean up - delete the test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Test image cleaned up');
    
  } catch (error) {
    console.error('❌ ERROR! Upload failed:');
    console.error('Error message:', error.message);
    console.error('Error details:', error.error || error);
    
    if (error.message.includes('Invalid cloud_name')) {
      console.log('\n⚠️  ISSUE: Your CLOUDINARY_CLOUD_NAME is invalid!');
      console.log('Please check your Cloudinary dashboard for the correct cloud name.');
      console.log('It should look like: "dxyz123abc" not "blood-donation-app"');
    }
  }
}

testUpload();
