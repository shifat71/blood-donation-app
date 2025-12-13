import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    isVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      isVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    isVerified: boolean;
  }
}
