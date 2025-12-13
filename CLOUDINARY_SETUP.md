# Cloudinary Integration Guide

## Overview
This application uses Cloudinary for cloud-based image storage and delivery. All student ID card uploads are stored on Cloudinary with automatic optimization and CDN delivery.

## Features
- ✅ Automatic image optimization (quality, format, dimensions)
- ✅ CDN delivery for fast global access
- ✅ Organized folder structure (`student-id-cards/`)
- ✅ Support for both file uploads and base64 conversion
- ✅ Secure URL storage in database

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Access your dashboard

### 2. Get Your Credentials
From your Cloudinary dashboard, you'll find:
- **Cloud Name**: Your account identifier (e.g., `dxyz123abc`)
- **API Key**: Public key for authentication
- **API Secret**: Private key for authentication

### 3. Configure Environment Variables

Update your `.env` file with:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="wOwEZt01kdkikLQDPrAdyYL9mwU"
CLOUDINARY_API_SECRET="your_api_secret"
```

**Important**: Replace:
- `your_cloud_name` with your actual Cloudinary cloud name
- `your_api_secret` with your actual API secret
- API Key is already configured

### 4. Verify Setup

Test the integration:
```bash
# Run the development server
npm run dev

# Try uploading a student ID card through:
# - Signup page (manual verification)
# - Dashboard (verification upload component)
```

## Technical Implementation

### Upload Utility (`lib/cloudinary.ts`)

```typescript
// Handles both Buffer and base64 uploads
uploadToCloudinary(file: Buffer | string, folder: string): Promise<string>

// Returns secure Cloudinary URL
// Automatically optimizes images:
// - Max dimensions: 1000x1000
// - Quality: auto
// - Format: auto (WebP for modern browsers)
```

### API Integration

**Verification Request API** (`/api/verification/request`)
- Accepts file uploads via FormData (signup)
- Accepts base64 via JSON (dashboard)
- Uploads to Cloudinary automatically
- Stores secure URL in database

### Image Organization

All uploads go to organized folders:
```
cloudinary.com/your_cloud_name/
  └── student-id-cards/
      ├── image1.jpg
      ├── image2.png
      └── ...
```

## Benefits

### Performance
- **CDN Delivery**: Images served from nearest CDN node
- **Auto Optimization**: Automatically serves best format (WebP, AVIF)
- **Lazy Loading**: URLs can be used with lazy loading
- **Responsive**: Can generate different sizes on-the-fly

### Storage
- **Scalable**: No database bloat from base64
- **Cost-Effective**: Free tier includes 25GB storage + 25GB bandwidth
- **Backup**: Cloudinary maintains backups
- **Management**: Web dashboard for browsing/managing uploads

### Security
- **Secure URLs**: HTTPS delivery by default
- **Access Control**: Can set upload presets and permissions
- **No Public Access**: Only authorized apps can upload
- **Signed URLs**: Optional signed URLs for private content

## Usage Examples

### From Signup Page (FormData)
```typescript
const formData = new FormData();
formData.append('idCardImage', file);
formData.append('studentId', '12345');

const response = await fetch('/api/verification/request', {
  method: 'POST',
  body: formData,
});
```

### From Dashboard (JSON with Base64)
```typescript
const base64 = await fileToBase64(file);

const response = await fetch('/api/verification/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: '12345',
    idCardImageUrl: base64,
  }),
});
```

Both methods upload to Cloudinary and return the URL.

## Troubleshooting

### Upload Fails
- ✅ Check `.env` has correct credentials
- ✅ Verify Cloudinary cloud name is correct
- ✅ Check API secret is not expired
- ✅ Ensure file size < 10MB (Cloudinary free tier limit)

### Images Not Displaying
- ✅ Verify URL is stored in database
- ✅ Check URL starts with `https://res.cloudinary.com/`
- ✅ Try accessing URL directly in browser
- ✅ Check Cloudinary dashboard for uploaded files

### Invalid Credentials Error
```
Error: Invalid API credentials
```
**Solution**: Double-check cloud name, API key, and API secret in `.env`

## Monitoring

View your uploads in Cloudinary:
1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to "Media Library"
3. Navigate to `student-id-cards` folder
4. View all uploaded student ID cards

## Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

For production with many users, consider upgrading to a paid plan.

## Next Steps

1. **Get your Cloud Name and API Secret** from Cloudinary dashboard
2. **Update `.env`** with these values
3. **Test upload** through signup or dashboard
4. **Verify in Cloudinary** that images appear in Media Library
5. **Deploy** with environment variables configured

## Additional Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload Parameters](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)
