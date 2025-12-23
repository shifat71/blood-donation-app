import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth({
  ...authOptions,
  // Ensure we use a valid URL
  pages: {
    signIn: '/auth/signin',
  },
});

export const dynamic = 'force-dynamic';

export { handler as GET, handler as POST };
