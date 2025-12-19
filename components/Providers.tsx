'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Use relative URL for session requests to avoid URL mismatch errors
  return (
    <SessionProvider basePath="/api/auth" refetchInterval={24 * 60 * 60}>
      {children}
    </SessionProvider>
  );
}
