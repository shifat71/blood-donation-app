# Blood Donation App

A modern, social-media-style blood donation web application that enables users to find verified blood donors and manage blood-related information securely and efficiently.

The platform is designed with a strong focus on **authenticity**, **trust**, and **usability**, ensuring that donor data remains accurate while providing a clean and modern user experience.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Frontend** | Next.js 15 with React 19 |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6.19.1 |
| **Authentication** | NextAuth.js with Credentials & Google OAuth |
| **Styling** | Tailwind CSS |
| **Image Upload** | Cloudinary |
| **Email Service** | Resend |
| **SMS Service** | BD HTTP gateway (SSL Wireless, BulkSMSBD, Mim SMS, etc.) |

---

## Objective

The primary objective of this application is to build a **reliable blood donor network** within the university ecosystem, making it easier to locate verified donors during emergencies while maintaining data integrity and privacy.

---

## Core Features

### Donor Registration & Verification

Donors can register through two methods:

1. **Auto-Verification**: University email ending with `@student.sust.edu` with OTP verification
2. **Manual Verification**: Upload a valid student ID card for review

Manual verification is handled by designated moderators to ensure authenticity.

**OTP Verification System:**
- Email-based OTP sent during registration
- 10-minute expiration time
- Secure verification before account activation

---

### Role-Based Access System

#### Donor

- Create and manage comprehensive donor profile
- Update blood group, phone number, address, and district information
- Update department and session details
- Upload and manage profile picture via Cloudinary
- Update last donation date with automatic 90-day availability tracking
- Toggle donation availability (enforced: cannot self-mark available within 90 days of last donation)
- Create, edit, and delete posts with images and captions
- View and respond to blood request notifications
- Accept blood donation requests
- Change password functionality

#### Requester

- Sign in with Google OAuth to submit blood donation requests
- Create urgent blood requests with blood group, district, location, hospital, and patient details
- Cancel pending requests
- Track request status (Pending / Approved / Rejected / Fulfilled / Cancelled)
- View request history and donor notifications in personal dashboard
- No verification required — instant access

#### Moderator

- Access a dedicated moderator dashboard
- Verify donor profiles submitted for manual verification
- Approve or reject donor registrations
- Review and approve/reject blood donation requests
- Trigger email and SMS notifications to compatible donors upon approval
- Update or correct donor information
- Monitor platform activity

#### System Admin

- Full access to the moderator dashboard
- Add and manage moderators
- Manage all user roles (Donor, Requester, Moderator)
- Oversee the entire verification workflow
- System-wide configuration and management

---

### Dashboards

#### Donor Dashboard

- **Overview Tab**: View complete profile information and verification status
- **Edit Tab**: Update personal information, blood donation details, and profile picture
- **Posts Tab**: Manage personal posts with image upload, edit, and delete capabilities
- **Notifications Tab**: View blood request notifications and accept requests
- Real-time donation eligibility tracking (90-day rule)
- Profile completion status indicators
- Password change functionality

#### Moderator Dashboard

- **Verifications Tab**: Review and approve pending donor verifications
- **Blood Requests Tab**: Review and approve/reject blood donation requests
- Edit donor information when required
- Trigger email + SMS notifications to compatible donors upon approval

#### Admin Dashboard

- Includes all moderator capabilities
- Manage moderator accounts and permissions
- View and manage all users (Donors, Requesters, Moderators)
- Separate tabs for different user roles

#### Requester Dashboard

- View all submitted blood requests with live status
- Cancel pending requests
- Track donor acceptance notifications
- Submit new blood requests
- Responsive design for all devices

---

### Blood Request System

- **Public Access**: Anyone with a Google account can submit blood requests
- **Request Form**: Blood group, urgency level, location, district, hospital, patient details, units needed
- **Moderator Approval**: All requests reviewed before donors are notified
- **Compatible Donor Matching**: Notifies all blood-type-compatible donors (e.g. O- donors are notified for any request), not just exact matches
- **District-Aware Matching**: Same-district donors are prioritised; falls back to all compatible donors if fewer than 3 are found locally
- **Email Notifications**: Sent to compatible donors via Resend with full request details
- **SMS Notifications**: Sent to compatible donors who have a phone number via BD HTTP gateway (when configured)
- **Donor Notifications**: In-app notification system for donors to view and accept requests
- **Requester SMS on Accept**: Requester receives an SMS the moment a donor accepts their request
- **Request Tracking**: Requesters can view status and history in personal dashboard
- **Status Lifecycle**: Pending → Approved → Fulfilled / Rejected / Cancelled
- **Acceptance System**: Donors accept requests; the 90-day unavailability clock starts from the acceptance date
- **Rate Limiting**: 5 blood requests per email per 10 minutes to prevent abuse

### Social Features

- **Post Creation**: Upload images with captions to share donation experiences (via Cloudinary)
- **Post Management**: Edit captions and delete posts
- **Profile Customization**: Upload profile pictures and personalize donor profiles
- **Activity Feed**: View and manage personal posts in a grid layout
- **Donor Profiles**: View individual donor profiles with their posts and information

---

## Availability & 90-Day Rule

- Availability is auto-calculated when a donor sets their last donation date
- Donors cannot manually mark themselves available within 90 days of their last donation
- When a donor accepts a blood request, `lastDonationDate` is set to the acceptance date — starting the 90-day clock
- Availability is automatically restored after 90 days via a bulk update on every donor list load and on individual profile fetch
- Moderators/admins can override availability if needed

---

## SMS Setup

SMS is optional and silently disabled when not configured. To enable, add the following to your production environment:

```env
SMS_API_URL=https://api.bulksmsbd.net/api/smsapi   # your provider's endpoint
SMS_API_KEY=your_key
SMS_SENDER_ID=BloodApp
```

The implementation is provider-agnostic via env var overrides for param names — works with any BD bulk-SMS HTTP gateway out of the box.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- npm or yarn package manager
- Cloudinary account for image uploads
- Resend account for email notifications
- Google OAuth credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/shifat71/blood-donation-app.git
cd blood-donation-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see .env.example for all required vars)

# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Run the production improvements migration (Supabase SQL editor or psql)
# prisma/migrations/001_production_improvements.sql

# (Optional) Seed database with sample data
npm run prisma:seed

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

### Environment Variables

See [.env.example](.env.example) for all required and optional variables, including `FROM_EMAIL` for a custom sender address and the SMS gateway config.

---

## Roadmap

- [x] Public blood request system with Google OAuth
- [x] Email notifications to compatible donors via Resend
- [x] SMS notifications to donors and requesters via BD HTTP gateway
- [x] Blood-group compatibility matching (not just exact match)
- [x] District-aware donor matching with fallback
- [x] Moderator approval workflow for requests
- [x] Requester dashboard with request cancellation
- [x] In-app notification system for donors
- [x] Blood request acceptance workflow with 90-day cycle anchoring
- [x] OTP-based email verification
- [x] Password change functionality
- [x] Cloudinary image upload integration
- [x] Rate limiting on blood request submissions
- [x] Phone number validation and normalization (E.164)
- [ ] Location-based donor discovery with map integration
- [ ] Donation history analytics and insights
- [ ] Privacy controls for donor information
- [ ] Donation confirmation step (requester confirms blood was received)

---

## Contributing

Contributions are welcome. Please submit a Pull Request.

---

## License

This project is licensed under the MIT License.

---

Built for the SUST community.
