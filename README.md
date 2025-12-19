# 🩸 Blood Donation App

A modern, social-media–style blood donation web application that enables users to find verified blood donors and manage blood-related information securely and efficiently.

The platform is designed with a strong focus on **authenticity**, **trust**, and **usability**, ensuring that donor data remains accurate while providing a clean and modern user experience.

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Frontend** | Next.js |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js with Email-based & Manual Verification |
| **UI/UX** | Clean, intuitive, and modern design principles |

---

## 🎯 Objective

The primary objective of this application is to build a **reliable blood donor network** within the university ecosystem, making it easier to locate verified donors during emergencies while maintaining data integrity and privacy.

---

## ✨ Core Features

### 🧑🦰 Donor Registration & Verification

Donors can register through two methods:

1. **Auto-Verification**: University email ending with `@student.sust.edu`
2. **Manual Verification**: Upload a valid student ID card for review

Manual verification is handled by designated moderators to ensure authenticity.

---

### 🛡️ Role-Based Access System

#### 👤 **Donor**

- Create and manage comprehensive donor profile
- Update blood group, phone number, address, and district information
- Update department and session details
- Upload and manage profile picture
- Update last donation date with automatic availability tracking
- Toggle donation availability status (restricted to 90 days after last donation)
- Create, edit, and delete posts with images and captions
- View personal donation history and statistics
- Maintain accurate and up-to-date blood donation information

#### 🩸 **Requester**

- Sign in with Google to submit blood donation requests
- Create urgent blood requests with detailed information
- Track request status (Pending/Approved/Rejected)
- View request history in personal dashboard
- Receive notifications when requests are approved
- No verification required - instant access

#### 🧑⚖️ **Moderator**

- Access a dedicated moderator dashboard
- Verify donor profiles submitted for manual verification
- Review and approve/reject blood donation requests
- Trigger email notifications to available donors
- Update or correct donor information
- Monitor platform activity

#### 👑 **System Admin**

- Full access to the moderator dashboard
- Add and manage moderators
- Manage all user roles (Donor, Requester, Moderator)
- Oversee the entire verification workflow
- System-wide configuration and management
 

### 📊 Dashboards

#### **Donor Dashboard**

- **Overview Tab**: View complete profile information and verification status
- **Edit Tab**: Update personal information, blood donation details, and profile picture
- **Posts Tab**: Manage personal posts with image upload, edit, and delete capabilities
- Real-time donation eligibility tracking (90-day rule)
- Profile completion status indicators

#### **Moderator Dashboard**

- Review and approve pending donor verifications
- Edit donor information when required
- Access to verification requests queue

#### **Admin Dashboard**

- Includes all moderator capabilities
- Manage moderator accounts and permissions
- View and manage all users (Donors, Requesters, Moderators)
- Separate tabs for different user roles
- Platform oversight and analytics

#### **Requester Dashboard**

- View all submitted blood requests
- Track request status in real-time
- Submit new blood requests
- Responsive design for all devices

---

### 🩸 Blood Request System

- **Public Access**: Anyone can submit blood requests via Google Sign-In
- **Request Form**: Comprehensive form with blood group, urgency, location, hospital, patient details
- **Moderator Approval**: All requests reviewed by moderators before notification
- **Email Notifications**: Automatic emails sent to all available donors with matching blood group
- **Request Tracking**: Requesters can view status and history in personal dashboard
- **Status Management**: Track requests through Pending → Approved/Rejected states

### 📱 Social Features

- **Post Creation**: Upload images with captions to share donation experiences
- **Post Management**: Edit captions and delete posts
- **Profile Customization**: Upload profile pictures and personalize donor profiles
- **Activity Feed**: View and manage personal posts in a grid layout

---

## 🎨 UI & UX Principles

- ✅ Clean, minimal, and modern interface
- ✅ Intuitive navigation inspired by social platforms
- ✅ Responsive design for all devices
- ✅ Clear visual indicators for verification and availability status
- ✅ Tab-based navigation for organized content
- ✅ Real-time feedback and success notifications

---

## 🧩 Future Improvements (Planned)

- [x] Public blood request system with Google OAuth
- [x] Email notifications to available donors
- [x] Moderator approval workflow for requests
- [x] Requester dashboard for tracking requests
- [ ] SMS notifications to donors (currently email only)
- [ ] Location-based donor discovery with map integration
- [ ] Donation history analytics and insights
- [ ] Privacy controls for donor information
- [ ] Public feed for all donor posts
- [ ] Commenting and interaction features
- [ ] Mobile app version

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/shifat71/blood-donation-app.git
cd blood-donation-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your database connection in .env
# DATABASE_URL="postgresql://..."

# Add Google OAuth credentials
# GOOGLE_CLIENT_ID="your_google_client_id"
# GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Run Prisma migrations
npx prisma db push
npx prisma generate

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ for the SUST community

---

**Note:** This application is specifically designed for university blood donation management and requires valid university credentials for registration. 
