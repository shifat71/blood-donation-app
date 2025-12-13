# 🚀 Blood Donation App - Setup Guide

This guide will help you set up and run the Blood Donation App on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** database - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager
- **Git** (optional, for cloning)

## 🛠️ Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and other dependencies.

### 2. Set Up Environment Variables

✅ **Good News:** Your `.env` file is already configured with Supabase database credentials!

The app is pre-configured to use your Supabase PostgreSQL database from Vercel.

**Verify your `.env` file contains:**

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgres://postgres.wvaegbjnsimtczsaptgq:PszZsHjXAntEgyZq@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct URL for migrations
DIRECT_URL="postgres://postgres.wvaegbjnsimtczsaptgq:PszZsHjXAntEgyZq@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rN9GSgZbIIaJ7S0FXCFXTsWKKWuVOe8rZ4HaHKvHk29GTcncIvQ3Nv7nFzYqr3oA9r22z+tM86rEAeLz260jMg=="

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://wvaegbjnsimtczsaptgq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

📖 **For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)**

### 3. Set Up Supabase Database

✅ **Your Supabase database is already configured!**

**Your database details:**
- **Host:** aws-0-us-east-1.pooler.supabase.com
- **Database:** postgres
- **Project:** wvaegbjnsimtczsaptgq
- **Dashboard:** https://wvaegbjnsimtczsaptgq.supabase.co

**Important:** If you experience connection issues, please refer to [DATABASE_SETUP.md](./DATABASE_SETUP.md) for:
- Alternative setup methods using Supabase SQL Editor
- Troubleshooting network/firewall issues
- Manual schema creation steps

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

This command will:
- Create all necessary tables (User, DonorProfile, VerificationRequest)
- Set up the database schema
- Generate the Prisma Client

When prompted, enter a migration name (e.g., "initial_migration")

### 5. Seed the Database (Optional)

Populate the database with initial data including an admin account:

```bash
npm run prisma:seed
```

This creates:
- **Admin Account**
  - Email: `admin@student.sust.edu`
  - Password: `admin123`
  - Role: ADMIN
  
- **Sample Donor Accounts** (for testing)
  - John Doe (`john.doe@student.sust.edu`) - Password: `password123`
  - Jane Smith (`jane.smith@student.sust.edu`) - Password: `password123`

**⚠️ Security Note:** Change the admin password after first login!

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🎯 Quick Setup (All-in-One)

If you want to set everything up in one go:

```bash
# Install dependencies
npm install

# Set up environment variables (edit .env after this)
cp .env.example .env

# Run migrations and seed
npm run db:setup

# Start the server
npm run dev
```

## 🔑 Default Accounts

After seeding, you can use these accounts:

### Admin Account
- **Email:** admin@student.sust.edu
- **Password:** admin123
- **Access:** Full admin dashboard, moderator features, and user management

### Sample Donors
- **Email:** john.doe@student.sust.edu / jane.smith@student.sust.edu
- **Password:** password123
- **Access:** Donor dashboard and profile management

## 📱 Using the Application

### For New Users (Donors)

1. **Sign Up**
   - Go to http://localhost:3000/auth/signup
   - Register with your university email
   - If using `@student.sust.edu`, you'll be auto-verified
   - Otherwise, submit a verification request with your student ID

2. **Create Donor Profile**
   - After signing in, go to Dashboard
   - Fill in your blood group, contact info, and availability
   - Toggle availability status as needed

3. **Find Donors**
   - Navigate to "Find Donors"
   - Filter by blood group and availability
   - View verified donor information

### For Moderators

1. **Sign in** with moderator credentials
2. **Access Moderator Dashboard**
   - Review pending verification requests
   - View student ID cards
   - Approve or reject verification requests

### For Admins

1. **Sign in** with admin credentials
2. **Access Admin Dashboard**
   - View all users and statistics
   - Promote users to moderator role
   - Access moderator features
   - Manage the entire system

## 🗄️ Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 to view and edit your database.

### Reset Database (Fresh Start)

```bash
# Delete all data and recreate
npx prisma migrate reset

# This will automatically run seed script
```

### Create New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** `Can't reach database server`

**Solution:**
- Ensure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify database exists
- Check firewall settings

### Port Already in Use

**Problem:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on a different port
PORT=3001 npm run dev
```

### Prisma Client Issues

**Problem:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
```

### Authentication Issues

**Problem:** `NextAuth configuration error`

**Solution:**
- Ensure NEXTAUTH_SECRET is set in `.env`
- Verify NEXTAUTH_URL matches your app URL
- Clear browser cookies and try again

## 📦 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set:
- Use a production PostgreSQL database
- Set secure NEXTAUTH_SECRET
- Update NEXTAUTH_URL to your production domain

### Recommended Hosting Platforms

- **Vercel** (recommended for Next.js)
- **Railway** (for full-stack apps)
- **Heroku**
- **DigitalOcean**

## 🛡️ Security Considerations

1. **Change default admin password** immediately after deployment
2. **Use strong NEXTAUTH_SECRET** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Regularly update dependencies**
5. **Implement rate limiting** for API routes
6. **Set up database backups**

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Need Help?

If you encounter any issues during setup:

1. Check the troubleshooting section above
2. Review error messages in the terminal
3. Ensure all prerequisites are installed
4. Verify environment variables are correct

## ✅ Verification Checklist

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Database created
- [ ] Migrations run successfully
- [ ] Database seeded (optional)
- [ ] Development server running
- [ ] Can access http://localhost:3000
- [ ] Can sign in with admin account
- [ ] All features working correctly

---

**🎉 Congratulations!** Your Blood Donation App is now set up and ready to use!
