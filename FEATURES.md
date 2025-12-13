# 📖 Blood Donation App - Features Documentation

This document provides a comprehensive overview of all features implemented in the Blood Donation App.

## 🎯 Core Features Overview

### ✅ Implemented Features

1. ✅ Donor Registration & Verification
2. ✅ Role-Based Access Control
3. ✅ Donor Profile Management
4. ✅ Moderator Dashboard
5. ✅ Admin Dashboard
6. ✅ Donor Search & Filtering
7. ✅ Email-Based Authentication
8. ✅ Responsive UI/UX

---

## 🔐 Authentication System

### Email-Based Registration
- **Location:** `/auth/signup`
- **Features:**
  - Secure password hashing with bcrypt
  - Email validation
  - Name and email required
  - Password confirmation
  - Success feedback with auto-redirect

### Auto-Verification
- **Trigger:** Email ends with `@student.sust.edu`
- **Process:**
  - Immediate verification upon registration
  - No manual approval needed
  - VerificationType set to `AUTO`
  - Instant access to all donor features

### Manual Verification
- **Trigger:** Email does NOT end with `@student.sust.edu`
- **Process:**
  1. User registers normally
  2. Account created but `isVerified = false`
  3. User submits verification request with:
     - Student ID number
     - Student ID card image URL
  4. Moderator reviews and approves/rejects
  5. Upon approval, `isVerified = true`

### Sign In
- **Location:** `/auth/signin`
- **Method:** Email + Password
- **Features:**
  - Session-based authentication using NextAuth
  - JWT tokens with role and verification status
  - Automatic redirection based on user role

---

## 👤 Role-Based Access System

### Roles

#### 1. DONOR (Default)
**Access:**
- ✅ Create and manage donor profile
- ✅ Update blood group information
- ✅ Set last donation date
- ✅ Toggle availability status
- ✅ View other verified donors
- ✅ Search for donors by blood group

**Dashboard:** `/dashboard`

**Permissions:**
- Read own profile
- Update own profile
- View all verified donors
- Cannot access moderator/admin features

#### 2. MODERATOR
**Access:**
- ✅ All DONOR permissions
- ✅ View pending verification requests
- ✅ Approve/reject verification requests
- ✅ View student ID cards
- ✅ Add rejection reasons

**Dashboard:** `/moderator`

**Permissions:**
- Approve verification requests
- Reject verification requests
- View all pending verifications
- Cannot change user roles

#### 3. ADMIN (System Administrator)
**Access:**
- ✅ All MODERATOR permissions
- ✅ View all users
- ✅ Change user roles
- ✅ Promote users to moderator
- ✅ System-wide statistics
- ✅ Full system oversight

**Dashboard:** `/admin`

**Permissions:**
- All moderator permissions
- View all users in system
- Change any user's role
- System administration

---

## 🩸 Donor Features

### Profile Creation
**Location:** `/dashboard`

**Required Information:**
- Blood Group (8 options)
  - A+, A-, B+, B-, AB+, AB-, O+, O-

**Optional Information:**
- Phone Number
- Address
- Student ID
- Last Donation Date

**Initial State:**
- Availability: Available (by default)

### Profile Management

#### Update Blood Group
- Select from dropdown
- Instant update
- Reflects in search results

#### Last Donation Date
- Date picker interface
- Tracks donation history
- Helps donors maintain safe donation intervals

#### Availability Toggle
- One-click toggle
- Available ⟷ Unavailable
- Real-time visibility in search
- Checkbox interface

#### Contact Information
- Update phone number
- Update address
- Update student ID
- All optional fields

### Verification Status Display
**Location:** Dashboard header

**Verified Users:**
- ✅ Green badge with checkmark
- "Verified Account" status
- Access to all features

**Unverified Users:**
- ⚠️ Yellow warning badge
- "Unverified Account" status
- Button to submit verification
- Limited visibility in donor search

---

## 🔍 Donor Search & Discovery

### Search Page
**Location:** `/donors`
**Access:** Public (no authentication required)

### Search Filters

#### 1. Name Search
- Text input field
- Case-insensitive search
- Searches donor names
- Real-time filtering

#### 2. Blood Group Filter
- Dropdown selection
- All 8 blood groups
- "All Blood Groups" option
- Instant filtering

#### 3. Availability Filter
- Checkbox: "Available only"
- Shows only available donors
- Combined with other filters

### Search Results Display

**Donor Card Information:**
- Name
- Blood Group (prominent display)
- Availability status badge
- Email address
- Phone number (if provided)
- Address (if provided)
- Last donation date (if recorded)

**Card Features:**
- Clean, card-based layout
- Color-coded availability badges
- Responsive grid (1-3 columns)
- Hover effects
- Contact information visible

**Only Verified Donors Appear**
- Unverified users not shown in search
- Ensures authenticity
- Maintains trust in system

---

## 🛡️ Moderator Dashboard

### Access Requirements
- Role: MODERATOR or ADMIN
- Protected route
- Automatic redirect if unauthorized

### Features

#### Verification Requests List
**Display:**
- All pending requests
- Ordered by submission date (oldest first)
- Request count display
- Requestor information

**Request Information:**
- Full name
- Email address
- Student ID number
- Submission date
- Account creation date

#### Review Process

**View Details Modal:**
- User information
- Student ID number
- ID card image display
- Image error handling (fallback)

**Actions:**
1. **Approve**
   - Updates request status to APPROVED
   - Sets user.isVerified = true
   - Sets verificationType = MANUAL
   - Records moderator ID
   - Timestamps review

2. **Reject**
   - Updates request status to REJECTED
   - Optional reason field
   - Records moderator ID
   - Timestamps review
   - User can resubmit

**Statistics:**
- Pending requests count
- Visual indicators
- Empty state messaging

---

## 👑 Admin Dashboard

### Access Requirements
- Role: ADMIN only
- Highest level access
- Protected route

### Features

#### System Statistics
**Dashboard Cards:**
1. **Total Users**
   - Count of all registered users
   - All roles included

2. **Donors**
   - Users with DONOR role
   - Red icon indicator

3. **Moderators**
   - Users with MODERATOR role
   - Blue icon indicator

4. **Verified Users**
   - Count of verified accounts
   - Both auto and manual verification

#### User Management

**User Table Display:**
- Name
- Email address
- Current role (badge)
- Verification status (badge)
- Join date
- Actions column

**Role Badge Colors:**
- ADMIN: Purple
- MODERATOR: Blue
- DONOR: Gray

**Status Badge Colors:**
- Verified: Green
- Unverified: Yellow

#### Change User Role

**Process:**
1. Click "Change Role" button
2. Modal opens with:
   - Current user info
   - Current role display
   - Role dropdown selector
3. Select new role:
   - DONOR
   - MODERATOR
   - ADMIN
4. Confirm changes

**Effects:**
- Immediate role update
- Access permissions change
- Dashboard access adjusted

#### Quick Actions
- View Moderator Dashboard
- View All Donors
- Direct navigation links

---

## 🎨 UI/UX Features

### Design Principles
- Clean and minimal interface
- Modern, professional look
- Social media-inspired navigation
- Mobile-responsive design
- Consistent color scheme (Red primary)

### Navigation Bar

**Features:**
- Sticky top navigation
- Logo and brand name
- Dynamic menu items based on role
- Mobile hamburger menu
- User info display when logged in

**Menu Items (Authenticated):**
- Find Donors (all users)
- Dashboard (donors)
- Moderator (moderators/admins)
- Admin (admins only)
- User name display
- Sign Out button

**Mobile Navigation:**
- Hamburger menu icon
- Slide-out menu
- Full-screen overlay
- Touch-friendly buttons

### Home Page

**Hero Section:**
- Bold headline
- Call-to-action buttons
- Gradient background
- Compelling copy

**Features Section:**
- 4 key features
- Icon-based design
- Grid layout
- Clear value propositions

**Call-to-Action Section:**
- Encouragement message
- Sign-up button
- Gray background contrast

### Form Design
- Labeled inputs
- Clear validation messages
- Error state handling
- Success feedback
- Loading states
- Disabled state styling

### Cards & Components
- Consistent card design
- Shadow effects
- Hover animations
- Badge components
- Icon integration (Lucide)
- Responsive grid layouts

### Color System
- Primary: Red (#DC2626)
- Success: Green
- Warning: Yellow
- Info: Blue
- Neutral: Gray scale
- White backgrounds

### Typography
- Clear hierarchy
- Readable font sizes
- Proper spacing
- Consistent weights

---

## 🔒 Security Features

### Authentication
- Password hashing (bcrypt)
- JWT tokens
- Secure sessions
- HTTP-only cookies

### Authorization
- Role-based access control
- Protected routes
- API endpoint protection
- Middleware validation

### Data Validation
- Input sanitization
- Email format validation
- Required field validation
- Type checking

### Database Security
- Parameterized queries (Prisma)
- No SQL injection vulnerability
- Proper indexing
- Cascade deletes

---

## 📊 Database Schema

### User Model
```
- id: String (UUID)
- email: String (unique)
- password: String (hashed)
- name: String
- role: Enum (DONOR/MODERATOR/ADMIN)
- isVerified: Boolean
- verificationType: Enum (AUTO/MANUAL)
- timestamps
```

### DonorProfile Model
```
- id: String (UUID)
- userId: String (foreign key)
- bloodGroup: Enum (8 types)
- lastDonationDate: DateTime (nullable)
- isAvailable: Boolean
- phoneNumber: String (nullable)
- address: String (nullable)
- studentId: String (nullable)
- timestamps
```

### VerificationRequest Model
```
- id: String (UUID)
- userId: String (foreign key)
- status: Enum (PENDING/APPROVED/REJECTED)
- idCardImageUrl: String
- studentId: String
- reason: String (nullable)
- moderatorId: String (foreign key, nullable)
- timestamps
- reviewedAt: DateTime (nullable)
```

---

## 🌐 API Routes

### Public Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - Authentication
- `GET /api/donors` - Search donors

### Protected Routes (Authenticated)
- `GET /api/donor/profile` - Get own profile
- `POST /api/donor/profile` - Create profile
- `PUT /api/donor/profile` - Update profile
- `POST /api/verification/request` - Submit verification
- `GET /api/verification/request` - Get verification status

### Moderator Routes
- `GET /api/moderator/verifications` - List pending requests
- `PUT /api/moderator/verifications` - Approve/reject request

### Admin Routes
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users` - Update user role

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Hamburger menu
- Stacked layouts
- Touch-friendly buttons
- Readable font sizes
- Proper spacing
- Swipe-friendly cards

### Tablet Optimizations
- 2-column grids
- Adaptive navigation
- Balanced layouts

### Desktop Optimizations
- 3-4 column grids
- Full navigation bar
- Hover effects
- Larger content areas

---

## ✨ Additional Features

### Loading States
- Spinner animations
- Loading text
- Skeleton screens (implicit)
- Disabled buttons during load

### Error Handling
- Form validation errors
- API error messages
- 404 redirects
- Unauthorized access redirects

### Empty States
- No donors found
- No verification requests
- Friendly messaging
- Clear CTAs

### Success Feedback
- Profile saved confirmation
- Verification submitted
- Account created
- Role updated

---

## 🎉 Feature Completeness

### ✅ All Core Features Implemented

1. ✅ User Registration (Auto & Manual Verification)
2. ✅ Email-Based Authentication
3. ✅ Donor Profile CRUD
4. ✅ Blood Group Management
5. ✅ Last Donation Date Tracking
6. ✅ Availability Status Toggle
7. ✅ Moderator Dashboard
8. ✅ Verification Request Management
9. ✅ Admin Dashboard
10. ✅ User Role Management
11. ✅ Donor Search & Filtering
12. ✅ Role-Based Access Control
13. ✅ Responsive Design
14. ✅ Modern UI/UX

### 🎯 Ready for Production

All features from the README are fully implemented and tested!

---

**🩸 Happy Donating! Save Lives with BloodConnect!**
