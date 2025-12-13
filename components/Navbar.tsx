'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Droplet, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Droplet className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">BloodConnect</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/donors"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Find Donors
            </Link>

            {session ? (
              <>
                {session.user.role === 'DONOR' && (
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                )}

                {(session.user.role === 'MODERATOR' || session.user.role === 'ADMIN') && (
                  <Link
                    href="/moderator"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Moderator
                  </Link>
                )}

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">{session.user.name}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="btn-secondary text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin" className="btn-secondary text-sm">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-red-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/donors"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Donors
            </Link>

            {session ? (
              <>
                {session.user.role === 'DONOR' && (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                {(session.user.role === 'MODERATOR' || session.user.role === 'ADMIN') && (
                  <Link
                    href="/moderator"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Moderator
                  </Link>
                )}

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}

                <div className="px-3 py-2">
                  <p className="text-sm text-gray-700 mb-2">{session.user.name}</p>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileMenuOpen(false);
                    }}
                    className="btn-secondary text-sm w-full"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <Link
                  href="/auth/signin"
                  className="btn-secondary text-sm block text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm block text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
