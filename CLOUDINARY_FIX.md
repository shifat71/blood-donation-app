# Fix Cloudinary Cloud Name Issue

## Problem
Your current cloud name `blood-donation-app` is invalid. This is causing the "Failed to upload profile picture" error.

## Solution Options

### Option 1: Get Your Actual Cloud Name (Recommended)

1. **Visit Cloudinary Dashboard**: https://cloudinary.com/console
2. **Login** to your account
3. On the dashboard home page, you'll see a section called **"Product Environment Credentials"** or **"Account Details"**
4. Look for **"Cloud name"** - it should look like one of these examples:
   - `dbc3hpymv`
   - `demo-account`
   - `mycompany-prod`
   - (Usually a mix of letters and numbers, or a slug)

5. **Copy the exact cloud name** and update your `.env` file

### Option 2: Create a New Free Cloudinary Account

If you don't have a Cloudinary account or lost access:

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. After email verification, go to your dashboard
4. Copy your credentials:
   - **Cloud name** (this is what you need!)
   - **API Key**
   - **API Secret**

### Update Your .env File

Once you have the correct cloud name, update `.env`:

```env
# Replace these with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME="your_actual_cloud_name_here"
CLOUDINARY_API_KEY="your_api_key_here"
CLOUDINARY_API_SECRET="your_api_secret_here"
```

### Test After Updating

1. Save your `.env` file
2. Run the test script:
   ```bash
   node test-cloudinary.js
   ```
3. You should see: `✅ SUCCESS! Upload worked!`

### Restart Your App

After confirming the test works:
```bash
npm run dev
```

Now profile picture uploads will work correctly!

## Common Mistakes

❌ **Wrong**: `CLOUDINARY_CLOUD_NAME="blood-donation-app"`
✅ **Correct**: `CLOUDINARY_CLOUD_NAME="dbc3hpymv"`

❌ **Wrong**: `CLOUDINARY_CLOUD_NAME="My Cloud"`
✅ **Correct**: `CLOUDINARY_CLOUD_NAME="my-cloud-prod"`

## Need Help?

If you're still having issues:
1. Check that you're logged into the correct Cloudinary account
2. Verify you're on the free tier (which should work fine)
3. Make sure the API credentials match the cloud name
4. Try creating a fresh Cloudinary account if all else fails
