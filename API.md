# 🔌 Blood Donation App - API Documentation

Complete API reference for the Blood Donation App.

## 📋 Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## 🔐 Authentication

The API uses **NextAuth.js** with **JWT tokens** for authentication.

### Headers

```
Content-Type: application/json
```

For authenticated requests, a session cookie is automatically included.

---

## 📍 Endpoints

### 🟢 Public Endpoints

#### 1. Register User

```http
POST /api/auth/register
```

**Description:** Create a new user account. Auto-verifies users with `@student.sust.edu` email.

**Request Body:**
```json
{
  "email": "john.doe@student.sust.edu",
  "password": "password123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "message": "Account created and verified successfully",
  "user": {
    "id": "cm1234567890",
    "email": "john.doe@student.sust.edu",
    "name": "John Doe",
    "isVerified": true
  }
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "error": "All fields are required"
}
```

400 - Duplicate Email:
```json
{
  "error": "Email already registered"
}
```

---

#### 2. Sign In

```http
POST /api/auth/signin
```

**Description:** Authenticate user and create session (handled by NextAuth).

**Request Body:**
```json
{
  "email": "john.doe@student.sust.edu",
  "password": "password123"
}
```

**Success:** Creates session cookie and returns user data.

**Error:** Returns error message.

---

#### 3. Search Donors

```http
GET /api/donors
```

**Description:** Search for verified blood donors with optional filters.

**Query Parameters:**
- `bloodGroup` (optional): Filter by blood group (e.g., "A_POSITIVE")
- `availableOnly` (optional): Boolean, "true" to show only available donors
- `search` (optional): Search by donor name

**Examples:**
```
GET /api/donors
GET /api/donors?bloodGroup=O_POSITIVE
GET /api/donors?availableOnly=true
GET /api/donors?bloodGroup=A_POSITIVE&availableOnly=true&search=John
```

**Success Response (200):**
```json
[
  {
    "id": "profile123",
    "bloodGroup": "O_POSITIVE",
    "lastDonationDate": "2024-10-15T00:00:00Z",
    "isAvailable": true,
    "phoneNumber": "+880123456789",
    "address": "Sylhet, Bangladesh",
    "studentId": "2020123456",
    "user": {
      "name": "John Doe",
      "email": "john.doe@student.sust.edu",
      "isVerified": true
    }
  }
]
```

---

### 🔒 Authenticated Endpoints

All endpoints below require authentication (valid session).

#### 4. Get Donor Profile

```http
GET /api/donor/profile
```

**Description:** Get the current user's donor profile.

**Authorization:** Required (any authenticated user)

**Success Response (200):**
```json
{
  "id": "profile123",
  "userId": "user123",
  "bloodGroup": "O_POSITIVE",
  "lastDonationDate": "2024-10-15T00:00:00Z",
  "isAvailable": true,
  "phoneNumber": "+880123456789",
  "address": "Sylhet, Bangladesh",
  "studentId": "2020123456",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z",
  "user": {
    "email": "john.doe@student.sust.edu",
    "name": "John Doe",
    "isVerified": true
  }
}
```

**Error Response (404):**
```json
{
  "error": "Donor profile not found"
}
```

---

#### 5. Create Donor Profile

```http
POST /api/donor/profile
```

**Description:** Create a new donor profile for the authenticated user.

**Authorization:** Required

**Request Body:**
```json
{
  "bloodGroup": "O_POSITIVE",
  "phoneNumber": "+880123456789",
  "address": "Sylhet, Bangladesh",
  "studentId": "2020123456",
  "lastDonationDate": "2024-10-15"
}
```

**Required Fields:**
- `bloodGroup`: One of [A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE]

**Optional Fields:**
- `phoneNumber`: String
- `address`: String
- `studentId`: String
- `lastDonationDate`: ISO date string

**Success Response (201):**
```json
{
  "id": "profile123",
  "userId": "user123",
  "bloodGroup": "O_POSITIVE",
  "lastDonationDate": "2024-10-15T00:00:00Z",
  "isAvailable": true,
  "phoneNumber": "+880123456789",
  "address": "Sylhet, Bangladesh",
  "studentId": "2020123456",
  "createdAt": "2024-12-13T00:00:00Z",
  "updatedAt": "2024-12-13T00:00:00Z"
}
```

**Error Response (400):**
```json
{
  "error": "Donor profile already exists"
}
```

---

#### 6. Update Donor Profile

```http
PUT /api/donor/profile
```

**Description:** Update the authenticated user's donor profile.

**Authorization:** Required

**Request Body:**
```json
{
  "bloodGroup": "A_POSITIVE",
  "phoneNumber": "+880987654321",
  "address": "Dhaka, Bangladesh",
  "studentId": "2020987654",
  "lastDonationDate": "2024-11-01",
  "isAvailable": false
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Success Response (200):**
```json
{
  "id": "profile123",
  "userId": "user123",
  "bloodGroup": "A_POSITIVE",
  "lastDonationDate": "2024-11-01T00:00:00Z",
  "isAvailable": false,
  "phoneNumber": "+880987654321",
  "address": "Dhaka, Bangladesh",
  "studentId": "2020987654",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-12-13T00:00:00Z"
}
```

---

#### 7. Submit Verification Request

```http
POST /api/verification/request
```

**Description:** Submit a verification request with student ID card for manual verification.

**Authorization:** Required (unverified users only)

**Request Body:**
```json
{
  "studentId": "2020123456",
  "idCardImageUrl": "https://example.com/id-card-image.jpg"
}
```

**Success Response (201):**
```json
{
  "id": "verify123",
  "userId": "user123",
  "studentId": "2020123456",
  "idCardImageUrl": "https://example.com/id-card-image.jpg",
  "status": "PENDING",
  "createdAt": "2024-12-13T00:00:00Z"
}
```

**Error Response (400):**
```json
{
  "error": "You already have a pending verification request"
}
```

---

#### 8. Get Verification Status

```http
GET /api/verification/request
```

**Description:** Get all verification requests for the authenticated user.

**Authorization:** Required

**Success Response (200):**
```json
[
  {
    "id": "verify123",
    "userId": "user123",
    "studentId": "2020123456",
    "idCardImageUrl": "https://example.com/id-card-image.jpg",
    "status": "PENDING",
    "reason": null,
    "moderatorId": null,
    "createdAt": "2024-12-13T00:00:00Z",
    "updatedAt": "2024-12-13T00:00:00Z",
    "reviewedAt": null
  }
]
```

---

### 🛡️ Moderator Endpoints

Require MODERATOR or ADMIN role.

#### 9. Get Pending Verifications

```http
GET /api/moderator/verifications
```

**Description:** Get all pending verification requests for review.

**Authorization:** Required (MODERATOR or ADMIN role)

**Success Response (200):**
```json
[
  {
    "id": "verify123",
    "userId": "user123",
    "studentId": "2020123456",
    "idCardImageUrl": "https://example.com/id-card-image.jpg",
    "status": "PENDING",
    "createdAt": "2024-12-13T00:00:00Z",
    "updatedAt": "2024-12-13T00:00:00Z",
    "reviewedAt": null,
    "user": {
      "id": "user123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "createdAt": "2024-12-10T00:00:00Z"
    }
  }
]
```

**Error Response (403):**
```json
{
  "error": "Unauthorized"
}
```

---

#### 10. Review Verification Request

```http
PUT /api/moderator/verifications
```

**Description:** Approve or reject a verification request.

**Authorization:** Required (MODERATOR or ADMIN role)

**Request Body:**
```json
{
  "requestId": "verify123",
  "status": "APPROVED",
  "reason": "Optional rejection reason"
}
```

**Parameters:**
- `requestId` (required): ID of the verification request
- `status` (required): "APPROVED" or "REJECTED"
- `reason` (optional): Rejection reason (recommended for REJECTED status)

**Success Response (200):**
```json
{
  "id": "verify123",
  "userId": "user123",
  "studentId": "2020123456",
  "idCardImageUrl": "https://example.com/id-card-image.jpg",
  "status": "APPROVED",
  "reason": null,
  "moderatorId": "mod123",
  "createdAt": "2024-12-13T00:00:00Z",
  "updatedAt": "2024-12-13T10:30:00Z",
  "reviewedAt": "2024-12-13T10:30:00Z"
}
```

**Side Effects:**
- For APPROVED: Sets user.isVerified = true, verificationType = MANUAL
- Records moderator ID and review timestamp

---

### 👑 Admin Endpoints

Require ADMIN role only.

#### 11. Get All Users

```http
GET /api/admin/users
```

**Description:** Get a list of all users in the system.

**Authorization:** Required (ADMIN role only)

**Success Response (200):**
```json
[
  {
    "id": "user123",
    "email": "john.doe@student.sust.edu",
    "name": "John Doe",
    "role": "DONOR",
    "isVerified": true,
    "createdAt": "2024-12-01T00:00:00Z"
  },
  {
    "id": "user456",
    "email": "admin@student.sust.edu",
    "name": "System Admin",
    "role": "ADMIN",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Response (403):**
```json
{
  "error": "Unauthorized"
}
```

---

#### 12. Update User Role

```http
PUT /api/admin/users
```

**Description:** Change a user's role.

**Authorization:** Required (ADMIN role only)

**Request Body:**
```json
{
  "userId": "user123",
  "role": "MODERATOR"
}
```

**Parameters:**
- `userId` (required): ID of the user to update
- `role` (required): New role - "DONOR", "MODERATOR", or "ADMIN"

**Success Response (200):**
```json
{
  "id": "user123",
  "email": "john.doe@student.sust.edu",
  "name": "John Doe",
  "role": "MODERATOR"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid role"
}
```

---

## 📊 Data Models

### Blood Group Enum
```
A_POSITIVE
A_NEGATIVE
B_POSITIVE
B_NEGATIVE
AB_POSITIVE
AB_NEGATIVE
O_POSITIVE
O_NEGATIVE
```

### Role Enum
```
DONOR
MODERATOR
ADMIN
```

### Verification Status Enum
```
PENDING
APPROVED
REJECTED
```

### Verification Type Enum
```
AUTO    - Email domain verification
MANUAL  - ID card verification
```

---

## 🚨 Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔒 Authorization Levels

| Endpoint | Public | Donor | Moderator | Admin |
|----------|--------|-------|-----------|-------|
| Register | ✅ | ✅ | ✅ | ✅ |
| Sign In | ✅ | ✅ | ✅ | ✅ |
| Search Donors | ✅ | ✅ | ✅ | ✅ |
| Get Profile | ❌ | ✅ | ✅ | ✅ |
| Create Profile | ❌ | ✅ | ✅ | ✅ |
| Update Profile | ❌ | ✅ | ✅ | ✅ |
| Submit Verification | ❌ | ✅ | ✅ | ✅ |
| Get Verifications (own) | ❌ | ✅ | ✅ | ✅ |
| Get Pending Verifications | ❌ | ❌ | ✅ | ✅ |
| Review Verification | ❌ | ❌ | ✅ | ✅ |
| Get All Users | ❌ | ❌ | ❌ | ✅ |
| Update User Role | ❌ | ❌ | ❌ | ✅ |

---

## 📝 Example Usage

### JavaScript/Fetch Examples

#### Register a New User
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@student.sust.edu',
    password: 'securePassword123',
    name: 'John Doe'
  })
});

const data = await response.json();
console.log(data);
```

#### Search for Donors
```javascript
const bloodGroup = 'O_POSITIVE';
const response = await fetch(`/api/donors?bloodGroup=${bloodGroup}&availableOnly=true`);
const donors = await response.json();
console.log(donors);
```

#### Create Donor Profile
```javascript
const response = await fetch('/api/donor/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bloodGroup: 'O_POSITIVE',
    phoneNumber: '+880123456789',
    address: 'Sylhet, Bangladesh',
    isAvailable: true
  })
});

const profile = await response.json();
console.log(profile);
```

#### Update Availability
```javascript
const response = await fetch('/api/donor/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    isAvailable: false
  })
});

const updatedProfile = await response.json();
console.log(updatedProfile);
```

---

## 🧪 Testing

### Test Credentials

After running `npm run prisma:seed`:

**Admin:**
```
Email: admin@student.sust.edu
Password: admin123
```

**Sample Donor 1:**
```
Email: john.doe@student.sust.edu
Password: password123
```

**Sample Donor 2:**
```
Email: jane.smith@student.sust.edu
Password: password123
```

---

## 📚 Related Documentation

- [Setup Guide](./SETUP.md)
- [Features Documentation](./FEATURES.md)
- [README](./README.md)

---

**🩸 API Ready for Integration!**
