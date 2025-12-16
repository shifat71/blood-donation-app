'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import VerificationUpload from '@/components/VerificationUpload';
import { User, Droplet, Calendar, Phone, MapPin, CheckCircle, XCircle, Clock, Camera } from 'lucide-react';
import { BloodGroup } from '@prisma/client';

type DonorProfile = {
  id: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string | null;
  isAvailable: boolean;
  phoneNumber: string | null;
  address: string | null;
  studentId: string | null;
  profilePicture: string | null;
  currentDistrict: string | null;
  department: string | null;
  session: string | null;
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
  const [showDonationDateUpdate, setShowDonationDateUpdate] = useState(false);
  const [newDonationDate, setNewDonationDate] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleUpdateDonationDate = async () => {
    if (!newDonationDate) return;
    
    try {
      const response = await fetch('/api/donor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastDonationDate: newDonationDate }),
      });

      if (response.ok) {
        await fetchProfile();
        setShowDonationDateUpdate(false);
        setNewDonationDate('');
        setSuccessMessage('Donation date updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to update donation date'));
      }
    } catch (error) {
      console.error('Error updating donation date:', error);
      alert('Error updating donation date. Check console.');
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    
    try {
      const response = await fetch('/api/donor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });

      if (response.ok) {
        await fetchProfile();
        setSuccessMessage(`Availability updated to ${!profile.isAvailable ? 'Available' : 'Unavailable'}!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to update availability'));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability. Check console.');
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingPhoto(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        console.log('Uploading profile picture...');
        const response = await fetch('/api/donor/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profilePicture: base64 }),
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('Profile picture updated:', data.profilePicture);
          // Force refresh the profile to get the new image URL
          await fetchProfile();
          setSuccessMessage('Profile picture updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          console.error('Upload failed:', data);
          alert('Error: ' + (data.error || 'Failed to upload profile picture'));
        }
        setUploadingPhoto(false);
        
        // Reset the file input
        e.target.value = '';
      };
      reader.onerror = () => {
        alert('Error reading file');
        setUploadingPhoto(false);
        e.target.value = '';
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture');
      setUploadingPhoto(false);
      e.target.value = '';
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
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-pulse">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-green-800 font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Verification Status */}
          {session?.user && (
            <div className={`card mb-6 border-l-4 ${session.user.isVerified ? 'border-l-green-500' : hasVerificationRequest ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${session.user.isVerified ? 'bg-green-100' : hasVerificationRequest ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                    {session.user.isVerified ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : hasVerificationRequest ? (
                      <Clock className="h-6 w-6 text-blue-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
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
              <form onSubmit={handleCreateOrUpdateProfile} className="space-y-5">
                {/* Modern Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-3 border-gray-200 flex items-center justify-center shadow-md">
                        {formData.profilePicture ? (
                          <Image
                            src={formData.profilePicture}
                            alt="Profile preview"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture-edit"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </label>
                      <input
                        id="profile-picture-edit"
                        type="file"
                        accept="image/*"
                        className="hidden"
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
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a clear photo of yourself
                      </p>
                      <label
                        htmlFor="profile-picture-edit"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Choose Photo
                      </label>
                    </div>
                  </div>
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

              {/* Profile Picture Section */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-red-200 border-4 border-white shadow-xl flex items-center justify-center">
                    {profile?.profilePicture ? (
                      <Image
                        key={profile.profilePicture}
                        src={profile.profilePicture}
                        alt={profile.user.name || 'Profile'}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-16 h-16 text-red-400" />
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300"
                  >
                    {uploadingPhoto ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent mx-auto"></div>
                        <span className="text-xs text-white mt-2 block font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-white mx-auto" />
                        <span className="text-xs text-white mt-1 block font-medium">Change Photo</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={handleProfilePictureUpload}
                  />
                  {/* Upload status indicator */}
                  {uploadingPhoto && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                      Uploading...
                    </div>
                  )}
                </div>
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

                {/* Update Last Donation Date Section */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Record New Donation</span>
                    <button
                      onClick={() => {
                        setShowDonationDateUpdate(!showDonationDateUpdate);
                        setNewDonationDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      {showDonationDateUpdate ? 'Cancel' : '+ Update Date'}
                    </button>
                  </div>
                  {showDonationDateUpdate && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          When did you donate?
                        </label>
                        <input
                          type="date"
                          className="input-field"
                          value={newDonationDate}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setNewDonationDate(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleUpdateDonationDate}
                        disabled={!newDonationDate}
                        className="btn-primary w-full text-sm"
                      >
                        Save Donation Date
                      </button>
                      <p className="text-xs text-gray-500 text-center">
                        Your availability will be auto-updated based on the 90-day donation cycle
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Availability Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile?.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      profile?.isAvailable
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    {profile?.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Update your status if you&apos;re temporarily unavailable (e.g., left the city, health issues)
                  </p>
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
