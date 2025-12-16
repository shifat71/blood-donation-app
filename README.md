# 🩸 Blood Donation App

A modern, social-media–style blood donation web application that enables users to find verified blood donors and manage blood-related information securely and efficiently.

The platform is designed with a strong focus on **authenticity**, **trust**, and **usability**, ensuring that donor data remains accurate while providing a clean and modern user experience.

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Frontend** | Next.js 15 (App Router) |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **Authentication** | NextAuth.js v4 |
| **File Storage** | Cloudinary |
| **Styling** | Tailwind CSS |
| **Form Handling** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Language** | TypeScript |

---

## 🎯 Objective

The primary objective of this application is to build a **reliable blood donor network** within the university ecosystem, making it easier to locate verified donors during emergencies while maintaining data integrity and privacy.

---

## ✨ Core Features

### 🧑‍🦰 Donor Registration & Verification

Donors can register through two methods:

1. **Auto-Verification**: University email ending with `@student.sust.edu`
2. **Manual Verification**: Upload a valid student ID card for review

Manual verification is handled by designated moderators to ensure authenticity.

---

### 🛡️ Role-Based Access System

#### 👤 **Donor**

- Create and manage a donor profile
- Update blood group information
- Update last donation date
- Toggle donation availability status
- Maintain accurate and up-to-date blood donation information

#### 🧑‍⚖️ **Moderator**

- Access a dedicated moderator dashboard
- Verify donor profiles submitted for manual verification
- Update or correct donor information
- Approve or reject donor registrations

#### 👑 **System Admin**

- Full access to the moderator dashboard
- Add and manage moderators
- Oversee the entire verification workflow
 

### 📊 Dashboards

#### **Moderator Dashboard**

- Review and approve pending donor verifications
- Edit donor information when required

#### **Admin Dashboard**

- Includes all moderator capabilities
- Manage moderator accounts and permissions

---

## 🎨 UI & UX Principles

- ✅ Clean, minimal, and modern interface
- ✅ Intuitive navigation inspired by social platforms
- ✅ Responsive design for all devices
- ✅ Clear visual indicators for verification and availability status

---

## 🧩 Future Improvements (Planned)

- [ ] Search and filter donors by blood group and availability
- [ ] Location-based donor discovery
- [ ] Notification system for urgent blood requests
- [ ] Donation history analytics
- [ ] Privacy controls for donor information

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- Cloudinary account for image uploads
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
```

### Environment Configuration

Configure the following in your `.env` file:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database (optional)
npm run prisma:seed

# Or run all setup commands at once
npm run db:setup
```

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

### Build for Production

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
blood-donation-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── donor/        # Donor management
│   │   ├── moderator/    # Moderator actions
│   │   ├── admin/        # Admin operations
│   │   └── verification/ # Manual verification
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # Donor dashboard
│   ├── donors/           # Browse donors
│   ├── moderator/        # Moderator dashboard
│   └── admin/            # Admin dashboard
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── cloudinary.ts     # Cloudinary setup
├── prisma/               # Database schema & migrations
├── types/                # TypeScript type definitions
└── middleware.ts         # Route protection
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based session management
- ✅ Protected API routes with middleware
- ✅ Role-based access control (RBAC)
- ✅ Email verification for auto-approval
- ✅ Secure file uploads to Cloudinary
- ✅ SQL injection prevention via Prisma ORM

---

## 🗄️ Database Schema

### Models

- **User**: Core user authentication and role management
- **DonorProfile**: Blood donor information and availability
- **VerificationRequest**: Manual verification workflow
- **Post**: Future social media features

### Roles

- `DONOR`: Standard blood donor
- `MODERATOR`: Can verify donors
- `ADMIN`: Full system access

### Blood Groups

`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

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

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note:** This application is specifically designed for university blood donation management and requires valid university credentials (`@student.sust.edu`) for auto-verification. 
