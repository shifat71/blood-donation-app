'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Droplet, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
              <Droplet className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
              <span className="text-base sm:text-xl font-bold text-gray-900">BloodConnect</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <Link
              href="/donors"
              className="text-gray-700 hover:text-red-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium"
            >
              Find Donors
            </Link>
            {(!session || session.user.role === 'REQUESTER') && (
              <Link
                href="/request-blood"
                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Request Blood
              </Link>
            )}

            {session ? (
              <>
                {session.user.role === 'DONOR' && (
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-red-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                )}

                {session.user.role === 'REQUESTER' && (
                  <Link
                    href="/requester"
                    className="text-gray-700 hover:text-red-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Requests
                  </Link>
                )}

                {(session.user.role === 'MODERATOR' || session.user.role === 'ADMIN') && (
                  <Link
                    href="/moderator"
                    className="text-gray-700 hover:text-red-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Moderator
                  </Link>
                )}

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-red-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex items-center space-x-2 lg:space-x-3 border-l border-gray-200 pl-3 lg:pl-4">
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{session.user.name}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="btn-secondary text-xs sm:text-sm px-2 py-1.5"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-3 border-l border-gray-200 pl-3 lg:pl-4">
                <Link href="/auth/signin" className="btn-secondary text-xs sm:text-sm px-2 py-1.5">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary text-xs sm:text-sm px-2 py-1.5">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-red-600 p-2.5 -mr-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
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
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Donors
            </Link>
            {(!session || session.user.role === 'REQUESTER') && (
              <Link
                href="/request-blood"
                className="block px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Request Blood
              </Link>
            )}

            {session ? (
              <>
                {session.user.role === 'DONOR' && (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                {session.user.role === 'REQUESTER' && (
                  <Link
                    href="/requester"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Requests
                  </Link>
                )}

                {(session.user.role === 'MODERATOR' || session.user.role === 'ADMIN') && (
                  <Link
                    href="/moderator"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Moderator
                  </Link>
                )}

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}

                <div className="px-3 py-2 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-700 font-medium mb-2 truncate">{session.user.name}</p>
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
              <div className="px-3 py-2 border-t border-gray-200 space-y-2">
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
