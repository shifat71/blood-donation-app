'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import VerificationUpload from '@/components/VerificationUpload';
import { User, Droplet, Calendar, Phone, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BloodGroup } from '@prisma/client';

type DonorProfile = {
  id: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string | null;
  isAvailable: boolean;
  phoneNumber: string | null;
  address: string | null;
  studentId: string | null;
  user: {
    name: string;
    email: string;
    isVerified: boolean;
  };
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [hasVerificationRequest, setHasVerificationRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    bloodGroup: '',
    phoneNumber: '',
    address: '',
    studentId: '',
    lastDonationDate: '',
    isAvailable: true,
    profilePicture: '',
    currentDistrict: 'Sylhet',
    department: '',
    session: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProfile();
      checkVerificationRequest();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/donor/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('donorProfileId', data.id);
        }
        setFormData({
          bloodGroup: data.bloodGroup,
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          studentId: data.studentId || '',
          lastDonationDate: data.lastDonationDate ? data.lastDonationDate.split('T')[0] : '',
          isAvailable: data.isAvailable,
          profilePicture: data.profilePicture || '',
          currentDistrict: data.currentDistrict || 'Sylhet',
          department: data.department || '',
          session: data.session || '',
        });
      } else if (response.status === 404 && session?.user.isVerified && session?.user.role === 'DONOR') {
        // Auto-prompt to create profile for verified donors
        setEditing(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationRequest = async () => {
    try {
      const response = await fetch('/api/verification/request');
      if (response.ok) {
        const data = await response.json();
        setHasVerificationRequest(!!data);
      }
    } catch (error) {
      console.error('Error checking verification request:', error);
    }
  };

  const handleCreateOrUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = profile ? 'PUT' : 'POST';
      console.log('Saving profile:', formData);
      const response = await fetch('/api/donor/profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response:', response.status, data);

      if (response.ok) {
        await fetchProfile();
        setEditing(false);
        setSuccessMessage('Profile saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Error: ' + (data.error || 'Failed to save profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Check console.');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const bloodGroups = Object.values(BloodGroup);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your donor profile and availability</p>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Verification Status */}
          {session?.user && (
            <div className={`card mb-6 ${session.user.isVerified ? 'border-green-500' : 'border-yellow-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {session.user.isVerified ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : hasVerificationRequest ? (
                    <Clock className="h-6 w-6 text-blue-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-yellow-600" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {session.user.isVerified 
                        ? 'Verified Account' 
                        : hasVerificationRequest 
                        ? 'Verification Pending' 
                        : 'Unverified Account'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.user.isVerified 
                        ? 'Your account is verified and active' 
                        : hasVerificationRequest
                        ? 'Your verification request is being reviewed by a moderator'
                        : 'Please verify your account to appear in donor search'}
                    </p>
                  </div>
                </div>
                {!session.user.isVerified && !hasVerificationRequest && (
                  <button
                    onClick={() => setShowVerificationForm(!showVerificationForm)}
                    className="btn-primary text-sm"
                  >
                    Submit Verification
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Verification Form */}
          {showVerificationForm && !session?.user.isVerified && (
            <div className="mb-6">
              <VerificationUpload onSuccess={() => {
                setShowVerificationForm(false);
                checkVerificationRequest();
              }} />
            </div>
          )}

          {/* Profile Section */}
          {!profile && !editing ? (
            <div className="card text-center">
              <Droplet className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Create Your Donor Profile</h3>
              <p className="text-gray-600 mb-6">
                Complete your profile to start helping others
              </p>
              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                Create Profile
              </button>
            </div>
          ) : editing ? (
            <div className="card">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h3>
              <form onSubmit={handleCreateOrUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => {
                          setFormData({...formData, profilePicture: reader.result as string});
                        };
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.lastDonationDate}
                    onChange={(e) => setFormData({...formData, lastDonationDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current District
                  </label>
                  <select
                    className="input-field"
                    value={formData.currentDistrict}
                    onChange={(e) => setFormData({...formData, currentDistrict: e.target.value})}
                  >
                    <option value="Sylhet">Sylhet</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., CSE, EEE, BBA"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., 2023-2024"
                    value={formData.session}
                    onChange={(e) => setFormData({...formData, session: e.target.value})}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                    Available for donation
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="btn-primary">
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Your Profile</h3>
                <button
                  onClick={() => {
                    if (profile) {
                      setFormData({
                        bloodGroup: profile.bloodGroup,
                        phoneNumber: profile.phoneNumber || '',
                        address: profile.address || '',
                        studentId: profile.studentId || '',
                        lastDonationDate: profile.lastDonationDate ? profile.lastDonationDate.split('T')[0] : '',
                        isAvailable: profile.isAvailable,
                        profilePicture: profile.profilePicture || '',
                        currentDistrict: profile.currentDistrict || 'Sylhet',
                        department: profile.department || '',
                        session: profile.session || '',
                      });
                    }
                    setEditing(true);
                  }}
                  className="btn-secondary text-sm"
                >
                  Edit Profile
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{profile?.user.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Droplet className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium text-gray-900">
                      {profile?.bloodGroup.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {profile?.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{profile.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {profile?.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{profile.address}</p>
                    </div>
                  </div>
                )}

                {profile?.lastDonationDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Donation</p>
                      <p className="font-medium text-gray-900">
                        {new Date(profile.lastDonationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Availability Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile?.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
