# Blood Donation Request Feature

## Overview
Public blood donation request system with Google Sign-In, moderator approval, and automated email notifications to available donors.

## Features Implemented

### 1. Database Schema
- **BloodRequest Model**: Stores donation requests with requester info, blood group, urgency, location, and status
- **RequestStatus Enum**: PENDING, APPROVED, REJECTED, FULFILLED

### 2. Google OAuth Integration
- Added Google Sign-In provider to NextAuth
- Auto-creates user accounts for Google sign-ins
- No password required for Google users

### 3. Public Request Submission
- **Route**: `/request-blood`
- Anyone can sign in with Google and submit a request
- Form fields:
  - Requester name & phone
  - Blood group needed
  - Urgency level (URGENT, MODERATE, NORMAL)
  - Location & hospital
  - Patient name
  - Units needed
  - Additional information

### 4. Moderator Approval System
- **Route**: `/moderator/blood-requests`
- Moderators/Admins can view pending requests
- Approve or reject requests
- On approval: Automatically sends emails to all available donors with matching blood group

### 5. Email Notifications
- Uses Resend API
- Sends to all available donors of matching blood group
- Email includes:
  - Blood group needed
  - Patient details
  - Location & hospital
  - Urgency level
  - Requester contact info
  - Additional notes

## Setup Instructions

### 1. Add Google OAuth Credentials
Get credentials from [Google Cloud Console](https://console.cloud.google.com/):

1. Create a new project or select existing
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret

Add to `.env`:
```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 2. Run Database Migration
```bash
npx prisma migrate dev --name add_blood_requests
npx prisma generate
```

### 3. Test the Feature

#### Submit a Request:
1. Go to `/request-blood`
2. Sign in with Google
3. Fill out the form
4. Submit request

#### Approve Request (Moderator):
1. Sign in as moderator/admin
2. Go to `/moderator/blood-requests`
3. Review pending requests
4. Click "Approve & Notify Donors"
5. Emails will be sent to all available donors with matching blood group

## API Routes

### POST `/api/blood-requests`
Submit a new blood donation request
- Requires authentication (Google Sign-In)
- Body: requester details, blood group, urgency, location, etc.

### GET `/api/blood-requests`
Fetch blood requests
- Query param: `status` (PENDING, APPROVED, REJECTED)
- Moderators see all requests
- Regular users see only their own requests

### POST `/api/blood-requests/approve`
Approve or reject a request (Moderator only)
- Body: `{ requestId, action: 'approve' | 'reject' }`
- On approve: Sends emails to matching donors

## SMS Integration (Future)
To add SMS notifications:
1. Sign up for SMS service (Twilio, AWS SNS, etc.)
2. Add API credentials to `.env`
3. Update `/api/blood-requests/approve/route.ts`
4. Add SMS sending logic after email sending

Example with Twilio:
```typescript
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

// In approve route, after email sending:
const smsPromises = donors.map((donor) =>
  client.messages.create({
    body: `Blood needed: ${bloodGroup}. Contact: ${phone}`,
    from: '+1234567890',
    to: donor.phoneNumber,
  })
);
await Promise.allSettled(smsPromises);
```

## Security Notes
- Only authenticated users can submit requests
- Only moderators/admins can approve requests
- Email addresses are validated through Google OAuth
- Donor phone numbers are stored securely in database

## Testing Checklist
- [ ] Google Sign-In works
- [ ] Request form submission
- [ ] Moderator can view pending requests
- [ ] Approval sends emails to donors
- [ ] Rejection updates status
- [ ] Only available donors receive emails
- [ ] Email contains all necessary information
