# 🗄️ Database Setup Guide - Supabase

Your Blood Donation App is configured to use **Supabase PostgreSQL** database from Vercel.

## ✅ Database Configuration

Your `.env` file has been configured with your Supabase credentials:

```env
DATABASE_URL="postgres://postgres.wvaegbjnsimtczsaptgq:PszZsHjXAntEgyZq@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.wvaegbjnsimtczsaptgq:PszZsHjXAntEgyZq@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## 🚀 Setup Instructions

### Option 1: Run Migrations (Recommended)

If you're experiencing connection issues, try these steps:

1. **Ensure your network allows outbound connections** to Supabase servers
2. **Run the migration command:**

```bash
npx prisma migrate dev --name initial_migration
```

3. **If successful, seed the database:**

```bash
npm run prisma:seed
```

### Option 2: Use Supabase Dashboard (Alternative)

If migrations fail due to network restrictions, you can set up the schema directly in Supabase:

1. **Go to your Supabase Dashboard:**
   - Visit: https://wvaegbjnsimtczsaptgq.supabase.co
   - Navigate to SQL Editor

2. **Run the following SQL to create tables:**

```sql
-- Create enums
CREATE TYPE "Role" AS ENUM ('DONOR', 'MODERATOR', 'ADMIN');
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "VerificationType" AS ENUM ('AUTO', 'MANUAL');

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DONOR',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationType" "VerificationType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create DonorProfile table
CREATE TABLE "DonorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "bloodGroup" "BloodGroup" NOT NULL,
    "lastDonationDate" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "address" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create VerificationRequest table
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "idCardImageUrl" TEXT,
    "studentId" TEXT,
    "reason" TEXT,
    "moderatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "VerificationRequest_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id")
);

-- Create indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "DonorProfile_bloodGroup_idx" ON "DonorProfile"("bloodGroup");
CREATE INDEX "DonorProfile_isAvailable_idx" ON "DonorProfile"("isAvailable");
CREATE INDEX "VerificationRequest_userId_idx" ON "VerificationRequest"("userId");
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");
CREATE INDEX "VerificationRequest_moderatorId_idx" ON "VerificationRequest"("moderatorId");
```

3. **Create the admin user and sample data:**

```sql
-- Insert admin user (password is 'admin123' hashed with bcrypt)
INSERT INTO "User" ("id", "email", "password", "name", "role", "isVerified", "verificationType")
VALUES (
    gen_random_uuid()::text,
    'admin@student.sust.edu',
    '$2a$10$YourHashedPasswordHere',
    'System Admin',
    'ADMIN',
    true,
    'AUTO'
);

-- Note: You'll need to generate a bcrypt hash for the password
-- You can use an online bcrypt generator or run the seed script after fixing connection
```

### Option 3: Troubleshooting Connection Issues

**Common Issues:**

1. **Firewall/Network Restrictions:**
   - Ensure your firewall allows connections to `aws-0-us-east-1.pooler.supabase.com`
   - Try disabling VPN if you're using one
   - Check if your network/ISP blocks certain ports (5432, 6543)

2. **Database Not Active:**
   - Verify your Supabase project is active in the dashboard
   - Check if the database is paused (free tier projects pause after inactivity)

3. **Incorrect Credentials:**
   - Double-check the connection strings in `.env`
   - Ensure password doesn't have special characters causing issues

4. **Try Direct Connection Test:**

```bash
# Test database connectivity
npx prisma db pull
```

## 🔄 After Successful Migration

Once migrations work, run:

```bash
# Seed the database with initial data
npm run prisma:seed

# Start the development server
npm run dev
```

## 📊 Verify Setup

After running migrations and seed:

1. **Check tables in Supabase Dashboard:**
   - Go to Table Editor
   - You should see: User, DonorProfile, VerificationRequest

2. **Login with admin credentials:**
   - Email: `admin@student.sust.edu`
   - Password: `admin123`

## 🌐 For Production Deployment

When deploying to Vercel or other platforms:

1. **Set environment variables** in your deployment platform
2. **Run migrations** in your CI/CD pipeline or manually:
   ```bash
   npx prisma migrate deploy
   ```
3. **Seed the database** (if needed)

## 📝 Alternative: Using Prisma Studio

You can also manage your database using Prisma Studio:

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can:
- View and edit data
- Create records manually
- Test database structure

## ⚠️ Important Notes

1. **Connection Pooling:** The `DATABASE_URL` uses port 6543 with pgbouncer for connection pooling (required for Prisma with Supabase)
2. **Direct Connection:** The `DIRECT_URL` uses port 5432 for migrations (non-pooled connection)
3. **Security:** Never commit your `.env` file to version control (already in `.gitignore`)

## 🆘 Need Help?

If you continue to have issues:

1. Check Supabase status: https://status.supabase.com
2. Review Supabase logs in your project dashboard
3. Ensure you're using the correct connection strings from Vercel/Supabase
4. Try connecting from a different network

---

**Database Host:** `aws-0-us-east-1.pooler.supabase.com`  
**Database Name:** `postgres`  
**Supabase Project:** `wvaegbjnsimtczsaptgq`
