'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Droplet, CheckCircle, Upload } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
  });
  const [verificationType, setVerificationType] = useState<'auto' | 'manual'>('auto');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsManualVerification, setNeedsManualVerification] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setIdCardFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const isUniversityEmail = formData.email.endsWith('@student.sust.edu');
    
    // Validation based on verification type
    if (verificationType === 'auto') {
      if (!isUniversityEmail) {
        setError('Auto-verification requires a @student.sust.edu email address');
        setLoading(false);
        return;
      }
    } else {
      // Manual verification requires ID card and student ID
      if (!idCardFile) {
        setError('Please upload your student ID card for manual verification');
        setLoading(false);
        return;
      }
      if (!formData.studentId.trim()) {
        setError('Student ID is required for manual verification');
        setLoading(false);
        return;
      }
    }

    try {
      // Register user with verification type
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          studentId: formData.studentId,
          verificationType: verificationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      console.log('[Signup] User created:', data.user?.id);

      // If manual verification, submit verification request with ID card
      if (verificationType === 'manual' && idCardFile && data.user?.id) {
        console.log('[Signup] Submitting verification request...');
        
        const formDataObj = new FormData();
        formDataObj.append('idCard', idCardFile);
        formDataObj.append('studentId', formData.studentId);
        formDataObj.append('userId', data.user.id);

        try {
          const verificationResponse = await fetch('/api/verification/request', {
            method: 'POST',
            body: formDataObj,
          });

          const verificationData = await verificationResponse.json();
          console.log('[Signup] Verification response:', verificationData);

          if (!verificationResponse.ok) {
            console.error('Failed to submit verification request:', verificationData);
            // Don't fail the whole signup, just notify the user
            setNeedsManualVerification(true);
            setError(`Account created! Note: ${verificationData.error || 'Verification request had an issue'}. You can resubmit from your dashboard.`);
          } else {
            setNeedsManualVerification(true);
            console.log('[Signup] Verification request submitted successfully');
          }
        } catch (verificationError) {
          console.error('Error submitting verification:', verificationError);
          setNeedsManualVerification(true);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      }, 2000);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-3 sm:px-4 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex justify-center">
              <Droplet className="h-10 sm:h-12 w-10 sm:w-12 text-red-600" />
            </div>
            <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-red-600 hover:text-red-500">
                Sign in
              </Link>
            </p>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4 sm:p-6 text-center">
              <CheckCircle className="h-10 sm:h-12 w-10 sm:w-12 text-green-600 mx-auto mb-4" />
              <p className="text-base sm:text-lg font-medium text-green-800 mb-2">Account created successfully!</p>
              {needsManualVerification ? (
                <p className="text-xs sm:text-sm text-green-700">Your verification request has been submitted. A moderator will review it shortly.</p>
              ) : (
                <p className="text-xs sm:text-sm text-green-700">Redirecting to sign in...</p>
              )}
            </div>
          ) : (
            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field"
                    placeholder="your.email@student.sust.edu"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use @student.sust.edu for automatic verification
                  </p>
                </div>

                {/* Verification Type Toggle */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Verification Method
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationType('auto');
                        setIdCardFile(null);
                        setError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        verificationType === 'auto'
                          ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <CheckCircle className={`h-5 w-5 mr-2 ${verificationType === 'auto' ? 'text-red-600' : 'text-gray-400'}`} />
                        <span>Auto Verify</span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">University email</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationType('manual');
                        setError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        verificationType === 'manual'
                          ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <Upload className={`h-5 w-5 mr-2 ${verificationType === 'manual' ? 'text-red-600' : 'text-gray-400'}`} />
                        <span>Manual Verify</span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">Upload ID card</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {verificationType === 'auto' 
                      ? 'Instant verification with @student.sust.edu email'
                      : 'Requires moderator approval with student ID card'}
                  </p>
                  
                  {/* Warning when selection doesn't match email */}
                  {formData.email && verificationType === 'auto' && !formData.email.endsWith('@student.sust.edu') && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Your email doesn&apos;t end with @student.sust.edu. Please switch to Manual Verify or use a university email.
                      </p>
                    </div>
                  )}
                  
                  {formData.email && verificationType === 'manual' && formData.email.endsWith('@student.sust.edu') && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        💡 You can use Auto Verify for instant verification with your university email!
                      </p>
                    </div>
                  )}
                </div>

                {verificationType === 'manual' && (
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID *
                    </label>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      className="input-field"
                      placeholder="2021XXXXXXX"
                      value={formData.studentId}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {verificationType === 'manual' && (
                  <div>
                    <label htmlFor="idCard" className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID Card *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-red-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="idCard"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="idCard"
                              name="idCard"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                        {idCardFile && (
                          <p className="text-sm text-green-600 font-medium mt-2">
                            ✓ {idCardFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Required for manual verification - moderator will review
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-lg"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
