'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import VerificationUpload from '@/components/VerificationUpload';
import { User, Droplet, CheckCircle, XCircle, Clock, Camera, Phone, MapPin, Calendar, Mail, History, Plus, Grid3x3, X, Edit2, Activity, Award, Heart } from 'lucide-react';
import { BloodGroup } from '@prisma/client';

type Post = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
};

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [hasVerificationRequest, setHasVerificationRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDonationDateUpdate, setShowDonationDateUpdate] = useState(false);
  const [newDonationDate, setNewDonationDate] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'posts'>('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
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

  useEffect(() => {
    if (profile && session) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
        // Profile doesn't exist - form will show in create mode
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

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${session?.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleUploadPost = async () => {
    if (!imageFile) return;
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageFile, caption }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowUpload(false);
        setImageFile(null);
        setCaption('');
        fetchPosts();
        setSuccessMessage('Post uploaded successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Error uploading photo');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
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
        setSuccessMessage('Profile saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Error: ' + (data.error || 'Failed to save profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Check console.');
    } finally {
      setSaving(false);
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
        
        // Immediately update the form data to show preview
        setFormData({...formData, profilePicture: base64});
        
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
          // Update with the Cloudinary URL
          setFormData({...formData, profilePicture: data.profilePicture});
          // Refresh the full profile to ensure consistency
          await fetchProfile();
          setSuccessMessage('Profile picture updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          console.error('Upload failed:', data);
          alert('Error: ' + (data.error || 'Failed to upload profile picture'));
          // Revert to previous image on error
          if (profile?.profilePicture) {
            setFormData({...formData, profilePicture: profile.profilePicture});
          }
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

  const getDaysSinceLastDonation = () => {
    if (!profile?.lastDonationDate) return null;
    return Math.floor((Date.now() - new Date(profile.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const canDonateAgain = () => {
    const days = getDaysSinceLastDonation();
    return days === null || days >= 90;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header with Profile Card */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Profile Picture */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white shadow-xl ring-4 ring-red-300/50">
                    {profile?.profilePicture ? (
                      <Image
                        src={profile.profilePicture}
                        alt={session?.user.name || 'Profile'}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  {profile && activeTab === 'edit' && (
                    <label
                      htmlFor="hero-profile-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300"
                    >
                      <Camera className="w-8 h-8 text-white" />
                      <input
                        id="hero-profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={handleProfilePictureUpload}
                      />
                    </label>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold mb-2">{session?.user.name || 'Donor'}</h1>
                  <p className="text-red-100 text-lg mb-4">{session?.user.email}</p>
                  
                  {profile && (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-white/30">
                        <Droplet className="w-5 h-5" />
                        <span className="font-bold text-lg">{profile.bloodGroup.replace('_', ' ')}</span>
                      </div>
                      <div className={`backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border ${
                        profile.isAvailable 
                          ? 'bg-green-500/30 border-green-300/50' 
                          : 'bg-gray-500/30 border-gray-300/50'
                      }`}>
                        {profile.isAvailable ? (
                          <><CheckCircle className="w-5 h-5" /> Available</>
                        ) : (
                          <><XCircle className="w-5 h-5" /> Unavailable</>
                        )}
                      </div>
                      {profile.currentDistrict && (
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-white/30">
                          <MapPin className="w-5 h-5" />
                          <span>{profile.currentDistrict}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                {profile && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl text-center border border-white/30">
                      <Heart className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{posts.length}</div>
                      <div className="text-sm text-red-100">Posts</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl text-center border border-white/30">
                      <Activity className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {profile.lastDonationDate ? getDaysSinceLastDonation() : '-'}
                      </div>
                      <div className="text-sm text-red-100">Days Since</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4 shadow-lg animate-fade-in">
              <div className="bg-green-500 p-3 rounded-full shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-green-900 font-semibold text-lg">{successMessage}</p>
            </div>
          )}

          {/* Verification Status */}
          {session?.user && (
            <div className={`bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border-l-8 ${
              session.user.isVerified 
                ? 'border-l-green-500' 
                : hasVerificationRequest 
                ? 'border-l-blue-500' 
                : 'border-l-amber-500'
            }`}>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-2xl shadow-md ${
                    session.user.isVerified 
                      ? 'bg-gradient-to-br from-green-400 to-green-600' 
                      : hasVerificationRequest 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                      : 'bg-gradient-to-br from-amber-400 to-amber-600'
                  }`}>
                    {session.user.isVerified ? (
                      <CheckCircle className="h-8 w-8 text-white" />
                    ) : hasVerificationRequest ? (
                      <Clock className="h-8 w-8 text-white" />
                    ) : (
                      <XCircle className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {session.user.isVerified 
                        ? '✓ Verified Account' 
                        : hasVerificationRequest 
                        ? 'Verification Pending' 
                        : 'Unverified Account'}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {session.user.isVerified 
                        ? 'Your account is verified and active in our donor database' 
                        : hasVerificationRequest
                        ? 'Your verification request is being reviewed by our team'
                        : 'Please verify your account to appear in donor search results'}
                    </p>
                  </div>
                </div>
                {!session.user.isVerified && !hasVerificationRequest && (
                  <button
                    onClick={() => setShowVerificationForm(!showVerificationForm)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-5 h-5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'edit'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Edit2 className="w-5 h-5" />
                {profile ? 'Edit Profile' : 'Create Profile'}
              </button>
              {profile && (
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'posts'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                  Posts ({posts.length})
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Information Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <User className="h-7 w-7 text-red-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <Mail className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{profile.user.email}</p>
                      </div>
                    </div>
                    {profile.phoneNumber && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Phone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-semibold text-gray-900">{profile.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <MapPin className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-semibold text-gray-900">{profile.address}</p>
                        </div>
                      </div>
                    )}
                    {profile.studentId && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Student ID</p>
                          <p className="font-semibold text-gray-900">{profile.studentId}</p>
                        </div>
                      </div>
                    )}
                    {profile.department && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-semibold text-gray-900">{profile.department}</p>
                        </div>
                      </div>
                    )}
                    {profile.session && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Session</p>
                          <p className="font-semibold text-gray-900">{profile.session}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donation History & Actions Card */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <History className="h-6 w-6 text-red-600" />
                      Donation History
                    </h3>
                    {profile.lastDonationDate ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-100">
                          <p className="text-sm text-gray-600 mb-1">Last Donation</p>
                          <p className="text-lg font-bold text-gray-900">
                            {new Date(profile.lastDonationDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-red-600 font-semibold mt-2">
                            {getDaysSinceLastDonation()} days ago
                          </p>
                        </div>
                        <div className={`p-4 rounded-xl border-2 ${
                          canDonateAgain() 
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                        }`}>
                          <p className="text-sm font-semibold mb-1">
                            {canDonateAgain() ? '✓ Ready to Donate' : '⏳ Recovery Period'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {canDonateAgain() 
                              ? 'You can donate blood now!' 
                              : `Wait ${90 - (getDaysSinceLastDonation() || 0)} more days`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">No donation history</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowDonationDateUpdate(!showDonationDateUpdate);
                          setNewDonationDate(new Date().toISOString().split('T')[0]);
                          setActiveTab('edit');
                        }}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Droplet className="w-5 h-5" />
                        Record Donation
                      </button>
                      <button
                        onClick={handleToggleAvailability}
                        className={`w-full font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all border-2 flex items-center justify-center gap-2 ${
                          profile.isAvailable
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-300'
                        }`}
                      >
                        {profile.isAvailable ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        {profile.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && !profile && (
              <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-gray-100">
                <div className="bg-gradient-to-br from-red-100 to-red-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Droplet className="h-12 w-12 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Create Your Donor Profile</h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  Complete your profile to start helping others and saving lives
                </p>
                <button
                  onClick={() => setActiveTab('edit')}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Edit2 className="h-7 w-7 text-red-600" />
                      {profile ? 'Edit Profile' : 'Create Profile'}
                    </h3>
                    <p className="text-gray-500 mt-1">Update your information and preferences</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                {/* Modern Profile Picture Upload Section */}
                <div className="bg-gradient-to-br from-gray-50 to-red-50/30 rounded-2xl p-6 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-red-600" />
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-red-100 to-red-200 border-4 border-white flex items-center justify-center shadow-xl ring-4 ring-red-100">
                        {uploadingPhoto ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent mx-auto"></div>
                            <span className="text-xs text-red-600 mt-2 block font-medium">Uploading...</span>
                          </div>
                        ) : formData.profilePicture ? (
                          <Image
                            key={formData.profilePicture}
                            src={formData.profilePicture}
                            alt="Profile preview"
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
                        htmlFor="profile-picture-upload-main"
                        className={`absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 ${uploadingPhoto ? 'pointer-events-none' : ''}`}
                      >
                        <div className="text-center">
                          <Camera className="w-8 h-8 text-white mx-auto mb-1" />
                          <span className="text-xs text-white font-semibold">Change Photo</span>
                        </div>
                      </label>
                      <input
                        id="profile-picture-upload-main"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={handleProfilePictureUpload}
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-gray-700 mb-3 font-medium">
                        Upload a clear photo of yourself
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        JPG, PNG or GIF (max. 5MB)
                      </p>
                      <label
                        htmlFor="profile-picture-upload-main"
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border-2 border-red-200 rounded-xl text-sm font-semibold text-red-700 cursor-pointer transition-all shadow-sm hover:shadow-md ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Camera className="w-5 h-5" />
                        {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-red-600" />
                      Blood Group *
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 font-medium"
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
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="+880 1XX-XXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Your residential address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="2021XXXXXXX"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Last Donation Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.lastDonationDate}
                      onChange={(e) => setFormData({...formData, lastDonationDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Current District
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
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
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="e.g., CSE, EEE, BBA"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Session
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="e.g., 2023-2024"
                      value={formData.session}
                      onChange={(e) => setFormData({...formData, session: e.target.value})}
                    />
                  </div>
                </div>

                {profile && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 text-center border-2 border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Logged in as</p>
                    <p className="text-lg font-bold text-gray-900">{profile.user.name}</p>
                    <p className="text-sm text-gray-500">{profile.user.email}</p>
                  </div>
                )}

                {!profile && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                        Creating Profile...
                      </span>
                    ) : (
                      'Create Profile'
                    )}
                  </button>
                )}

                {/* Quick Actions for Existing Profile */}
                {profile && (
                  <>
                    {/* Update Last Donation Date Section */}
                    <div className="pt-6 border-t-2 border-gray-200 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Droplet className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="text-base font-bold text-gray-800">Record New Donation</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowDonationDateUpdate(!showDonationDateUpdate);
                            setNewDonationDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          {showDonationDateUpdate ? 'Cancel' : '+ Update Date'}
                        </button>
                      </div>
                      {showDonationDateUpdate && (
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 space-y-4 border-2 border-red-100 shadow-inner">
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              When did you donate?
                            </label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                              value={newDonationDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setNewDonationDate(e.target.value)}
                            />
                          </div>
                          <button
                            onClick={handleUpdateDonationDate}
                            disabled={!newDonationDate}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Donation Date
                          </button>
                          <p className="text-xs text-gray-600 text-center bg-white/70 p-3 rounded-lg">
                            ℹ️ Your availability will be auto-updated based on the 90-day donation cycle
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t-2 border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${profile?.isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {profile?.isAvailable ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <span className="text-base font-bold text-gray-800">Availability Status</span>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
                          profile?.isAvailable 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        }`}>
                          {profile?.isAvailable ? '✓ Available' : '✗ Unavailable'}
                        </span>
                      </div>
                      <button
                        onClick={handleToggleAvailability}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg border-2 ${
                          profile?.isAvailable
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-300'
                        }`}
                      >
                        {profile?.isAvailable ? '⊘ Mark as Unavailable' : '✓ Mark as Available'}
                      </button>
                      <p className="text-xs text-gray-600 mt-3 text-center bg-blue-50 p-3 rounded-lg">
                        💡 Update your status if you&apos;re temporarily unavailable (e.g., left the city, health issues)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
