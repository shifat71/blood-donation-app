#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Cloudinary Setup Wizard for Blood Donation App        ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('This wizard will help you configure Cloudinary properly.');
console.log('');
console.log('📋 You will need:');
console.log('   1. Cloud Name (e.g., "dbc3hpymv")');
console.log('   2. API Key (e.g., "123456789012345")');
console.log('   3. API Secret (e.g., "abcdefghijklmnop")');
console.log('');
console.log('🌐 Get these from: https://cloudinary.com/console');
console.log('');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testCloudinaryCredentials(cloudName, apiKey, apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

  try {
    console.log('\n🔄 Testing credentials...');
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'test-uploads',
      resource_type: 'image',
    });
    
    // Clean up test image
    await cloudinary.uploader.destroy(result.public_id);
    
    return { success: true, message: 'Credentials are valid!' };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Unknown error',
      error: error 
    };
  }
}

function updateEnvFile(cloudName, apiKey, apiSecret) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('⚠️  .env file not found, creating new one...');
  }

  // Update or add Cloudinary variables
  const lines = envContent.split('\n');
  const updatedLines = [];
  let cloudNameUpdated = false;
  let apiKeyUpdated = false;
  let apiSecretUpdated = false;

  for (const line of lines) {
    if (line.startsWith('CLOUDINARY_CLOUD_NAME=')) {
      updatedLines.push(`CLOUDINARY_CLOUD_NAME="${cloudName}"`);
      cloudNameUpdated = true;
    } else if (line.startsWith('CLOUDINARY_API_KEY=')) {
      updatedLines.push(`CLOUDINARY_API_KEY="${apiKey}"`);
      apiKeyUpdated = true;
    } else if (line.startsWith('CLOUDINARY_API_SECRET=')) {
      updatedLines.push(`CLOUDINARY_API_SECRET="${apiSecret}"`);
      apiSecretUpdated = true;
    } else {
      updatedLines.push(line);
    }
  }

  // Add missing variables
  if (!cloudNameUpdated) updatedLines.push(`CLOUDINARY_CLOUD_NAME="${cloudName}"`);
  if (!apiKeyUpdated) updatedLines.push(`CLOUDINARY_API_KEY="${apiKey}"`);
  if (!apiSecretUpdated) updatedLines.push(`CLOUDINARY_API_SECRET="${apiSecret}"`);

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log('✅ .env file updated successfully!');
}

async function main() {
  try {
    const cloudName = await question('Enter your Cloud Name: ');
    const apiKey = await question('Enter your API Key: ');
    const apiSecret = await question('Enter your API Secret: ');

    if (!cloudName || !apiKey || !apiSecret) {
      console.log('\n❌ All fields are required!');
      rl.close();
      return;
    }

    const result = await testCloudinaryCredentials(
      cloudName.trim(),
      apiKey.trim(),
      apiSecret.trim()
    );

    console.log('');
    if (result.success) {
      console.log('✅ SUCCESS! ' + result.message);
      console.log('');
      
      const save = await question('Save these credentials to .env? (yes/no): ');
      
      if (save.toLowerCase() === 'yes' || save.toLowerCase() === 'y') {
        updateEnvFile(cloudName.trim(), apiKey.trim(), apiSecret.trim());
        console.log('');
        console.log('🎉 Setup complete! Your Cloudinary is now configured.');
        console.log('');
        console.log('Next steps:');
        console.log('1. Restart your development server (if running)');
        console.log('2. Try uploading a profile picture in the dashboard');
        console.log('');
      } else {
        console.log('\n⚠️  Configuration not saved.');
      }
    } else {
      console.log('❌ FAILED! ' + result.message);
      console.log('');
      console.log('Please check your credentials and try again.');
      console.log('Visit: https://cloudinary.com/console');
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
