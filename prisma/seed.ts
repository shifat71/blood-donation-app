import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@student.sust.edu' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@student.sust.edu',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      isVerified: true,
      verificationType: 'AUTO',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create some sample donors (optional)
  const sampleDonors = [
    {
      email: 'john.doe@student.sust.edu',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      bloodGroup: 'A_POSITIVE',
      phoneNumber: '+880123456789',
    },
    {
      email: 'jane.smith@student.sust.edu',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Smith',
      bloodGroup: 'O_POSITIVE',
      phoneNumber: '+880123456788',
    },
  ];

  for (const donor of sampleDonors) {
    const user = await prisma.user.create({
      data: {
        email: donor.email,
        password: donor.password,
        name: donor.name,
        role: 'DONOR',
        isVerified: true,
        verificationType: 'AUTO',
      },
    });

    await prisma.donorProfile.create({
      data: {
        userId: user.id,
        bloodGroup: donor.bloodGroup as any,
        phoneNumber: donor.phoneNumber,
        isAvailable: true,
      },
    });

    console.log('✅ Sample donor created:', donor.name);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
