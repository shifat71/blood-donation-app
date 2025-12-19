'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Droplet, AlertCircle, Loader2 } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Get the session to check user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        // Redirect based on role
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin');
        } else if (session?.user?.role === 'MODERATOR') {
          router.push('/moderator');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-3 sm:px-4 lg:px-8">
        <div className="w-full max-w-md">
          <div className="card p-4 sm:p-6">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center">
                <div className="bg-red-100 p-2.5 sm:p-3 rounded-full">
                  <Droplet className="h-8 sm:h-10 w-8 sm:w-10 text-red-600" />
                </div>
              </div>
              <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">
                Sign in to your account to continue
              </p>
            </div>
            
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field text-sm"
                  placeholder="your.email@student.sust.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="font-semibold text-red-600 hover:text-red-500 transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
