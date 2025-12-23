'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import VerificationUpload from '@/components/VerificationUpload';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { User, Droplet, CheckCircle, XCircle, Clock, Camera, Phone, MapPin, Calendar, Mail, History, Plus, Grid3x3, X, Edit2, Activity, Heart, Building2, MoreHorizontal, Trash2, Lock } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [showDonationDateUpdate, setShowDonationDateUpdate] = useState(false);
  const [newDonationDate, setNewDonationDate] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'posts'>('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 4000);
  };

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

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showActionSheet) setShowActionSheet(false);
        else if (selectedPost) setSelectedPost(null);
        else if (showUpload) { setShowUpload(false); setImageFile(null); setCaption(''); }
        else if (editingPost) { setEditingPost(null); setEditCaption(''); }
        else if (showSuccessModal) setShowSuccessModal(false);
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedPost, showUpload, editingPost, showSuccessModal, showActionSheet]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/donor/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
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
        showError('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading post:', error);
      showError('Error uploading photo');
    }
  };

  const handleEditPost = async () => {
    if (!editingPost) return;
    try {
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPost.id, caption: editCaption }),
      });
      if (response.ok) {
        setEditingPost(null);
        setEditCaption('');
        fetchPosts();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error('Error editing post:', error);
      showError('Error editing post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPosts();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Error deleting post');
    }
  };

  const handleSaveProfile = async () => {
    // Check if trying to mark as available within 90 days
    if (profile && !profile.isAvailable && formData.isAvailable && !canDonateAgain()) {
      showError(`Cannot mark as available. Must wait ${90 - (getDaysSinceLastDonation() || 0)} days after last donation.`);
      return;
    }

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
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          setActiveTab('overview');
        }, 2000);
      } else {
        showError(data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('Error saving profile');
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
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to update donation date');
      }
    } catch (error) {
      console.error('Error updating donation date:', error);
      showError('Error updating donation date');
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    
    // Prevent marking as available if within 90 days
    if (!profile.isAvailable && !canDonateAgain()) {
      showError(`You must wait ${90 - (getDaysSinceLastDonation() || 0)} more days after your last donation to become available.`);
      return;
    }
    
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
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      showError('Error updating availability');
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
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
          showError(data.error || 'Failed to upload profile picture');
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
        showError('Error reading file');
        setUploadingPhoto(false);
        e.target.value = '';
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Error uploading profile picture');
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
      
      <main className="flex-grow py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Hero Header - Modern Minimal Design */}
          <div className="mb-2 md:mb-6">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 relative">
              <div className="flex items-start gap-3 md:gap-4">
                {/* Profile Picture */}
                <div className="relative group flex-shrink-0 z-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {profile?.profilePicture ? (
                      <Image
                        src={profile.profilePicture}
                        alt={session?.user.name || 'Profile'}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <User className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
                      </div>
                    )}
                  </div>
                  {profile && activeTab === 'edit' && (
                    <label
                      htmlFor="hero-profile-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all z-20"
                    >
                      <Camera className="w-5 h-5 text-white" />
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
                <div className="flex-1 min-w-0 pr-10 md:pr-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{session?.user.name || 'Donor'}</h1>
                    {session?.user.isVerified && (
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" fill="#25D366"/>
                        <path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 truncate mb-1.5 md:mb-3">{session?.user.email}</p>
                  
                  {profile && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 relative z-0">
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 md:px-2.5 md:py-1 bg-red-50 text-red-700 rounded text-[10px] sm:text-xs md:text-sm font-medium border border-red-200">
                        <Droplet className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                        {profile.bloodGroup.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] sm:text-xs md:text-sm font-medium border ${
                        profile.isAvailable 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {profile.isAvailable ? (
                          <><CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" /> Available</>
                        ) : (
                          <><XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" /> Unavailable</>
                        )}
                      </span>
                      {profile.currentDistrict && (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 md:px-2.5 md:py-1 bg-blue-50 text-blue-700 rounded text-[10px] sm:text-xs md:text-sm font-medium border border-blue-200">
                          <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                          {profile.currentDistrict}
                        </span>
                      )}

                      <span className="inline-flex md:hidden items-center gap-0.5 px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded text-[10px] font-medium border border-gray-200">
                        <Heart className="w-2.5 h-2.5" />
                        {posts.length}
                      </span>
                      <span className="inline-flex md:hidden items-center gap-0.5 px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded text-[10px] font-medium border border-gray-200">
                        <Activity className="w-2.5 h-2.5" />
                        {profile.lastDonationDate ? getDaysSinceLastDonation() : '-'}d
                      </span>
                    </div>
                  )}
                </div>

                {/* Edit Button - Mobile */}
                {profile && (
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="md:hidden absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors bg-white rounded-full p-2 shadow-md hover:shadow-lg border border-gray-200 z-10"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {/* Stats - Desktop */}
                {profile && (
                  <div className="hidden md:flex flex-col items-end gap-2 flex-shrink-0 relative z-0">
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-gray-600 hover:text-gray-900 transition-colors bg-white rounded-full p-2 shadow-sm hover:shadow-md border border-gray-200"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{posts.length}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Posts</div>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {profile.lastDonationDate ? getDaysSinceLastDonation() : '-'}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Days</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 md:mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl md:rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-lg animate-fade-in">
              <div className="bg-green-500 p-2 md:p-3 rounded-full shadow-md">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <p className="text-green-900 font-semibold text-sm md:text-lg">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 md:mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl md:rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-lg animate-fade-in">
              <div className="bg-red-500 p-2 md:p-3 rounded-full shadow-md">
                <XCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <p className="text-red-900 font-semibold text-sm md:text-lg">{errorMessage}</p>
            </div>
          )}

          {/* Verification Status - Only show if not verified */}
          {session?.user && !session.user.isVerified && (
            <div className={`bg-white rounded-lg md:rounded-2xl shadow-lg mb-2 md:mb-8 overflow-hidden border-l-2 md:border-l-8 ${
              hasVerificationRequest 
                ? 'border-l-blue-500' 
                : 'border-l-amber-500'
            }`}>
              <div className="p-2 md:p-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0">
                  <div className={`p-1.5 md:p-4 rounded-lg md:rounded-2xl shadow-md flex-shrink-0 ${
                    hasVerificationRequest 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                      : 'bg-gradient-to-br from-amber-400 to-amber-600'
                  }`}>
                    {hasVerificationRequest ? (
                      <Clock className="h-4 w-4 md:h-8 md:w-8 text-white" />
                    ) : (
                      <XCircle className="h-4 w-4 md:h-8 md:w-8 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs md:text-xl font-bold text-gray-900">
                      {hasVerificationRequest 
                        ? 'Pending' 
                        : 'Unverified'}
                    </h3>
                    <p className="text-[10px] md:text-sm text-gray-600 truncate">
                      {hasVerificationRequest
                        ? 'Being reviewed'
                        : 'Verify to appear'}
                    </p>
                  </div>
                </div>
                {!hasVerificationRequest && (
                  <button
                    onClick={() => setShowVerificationForm(!showVerificationForm)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-2.5 py-1.5 md:px-6 md:py-3 rounded-md md:rounded-xl shadow-lg hover:shadow-xl transition-all text-[10px] md:text-base whitespace-nowrap flex-shrink-0"
                  >
                    Verify
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

          {/* Tabs Navigation - Instagram Style */}
          <div className="mb-2 md:mb-6 border-t border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1 md:gap-2 font-medium transition-all border-t-2 -mt-[1px] ${
                  activeTab === 'overview'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400'
                }`}
              >
                <Activity className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-wide font-semibold">Overview</span>
              </button>
              {profile && (
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1 md:gap-2 font-medium transition-all border-t-2 -mt-[1px] ${
                    activeTab === 'posts'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-wide font-semibold">Posts</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Contact & Academic Information Card */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* Academic Info - Top Section */}
                    {(profile.studentId || profile.department || profile.session) && (
                      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {profile.studentId && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                              <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-900 truncate">{profile.studentId}</span>
                            </div>
                          )}
                          {profile.department && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                              <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-900 truncate">{profile.department}</span>
                            </div>
                          )}
                          {profile.session && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                              <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-900 truncate">{profile.session}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Info - Bottom Section */}
                    <div className="p-2 space-y-1">
                      {/* Email - Clickable */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(profile.user.email);
                          setCopiedText('Email copied!');
                          setTimeout(() => setCopiedText(''), 2000);
                        }}
                        className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                      >
                        <Mail className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-red-500" />
                        <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{profile.user.email}</p>
                      </button>

                      {/* Phone - Clickable */}
                      {profile.phoneNumber && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(profile.phoneNumber!);
                            setCopiedText('Phone copied!');
                            setTimeout(() => setCopiedText(''), 2000);
                          }}
                          className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                        >
                          <Phone className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-blue-500" />
                          <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{profile.phoneNumber}</p>
                        </button>
                      )}

                      {/* Location - Clickable */}
                      {profile.address && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(profile.address!);
                            setCopiedText('Address copied!');
                            setTimeout(() => setCopiedText(''), 2000);
                          }}
                          className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                        >
                          <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-green-500" />
                          <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{profile.address}</p>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Copy Toast */}
                  {copiedText && (
                    <div className="mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium text-center animate-fade-in shadow-lg">
                      ✓ {copiedText}
                    </div>
                  )}
                </div>

                {/* Donation History & Actions Card */}
                <div className="space-y-4">
                  {/* Donation Status Card */}
                  <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-3 md:p-4 border border-red-100/50 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 pb-2 border-b border-red-100">
                      <History className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
                      <h3 className="text-xs md:text-sm font-bold text-gray-900">Donation History</h3>
                    </div>
                    {profile.lastDonationDate ? (
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="bg-red-500 p-1.5 md:p-2 rounded-lg">
                              <Droplet className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] md:text-xs text-gray-500">Last Donation</p>
                              <p className="text-xs md:text-sm font-bold text-gray-900">
                                {new Date(profile.lastDonationDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl md:text-2xl font-bold text-red-600">{getDaysSinceLastDonation()}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">days ago</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg ${
                          canDonateAgain() 
                            ? 'bg-green-500 text-white' 
                            : 'bg-amber-500 text-white'
                        }`}>
                          {canDonateAgain() ? (
                            <><CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="text-[10px] md:text-xs font-semibold">Ready to Donate Again!</span></>
                          ) : (
                            <><Clock className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="text-[10px] md:text-xs font-semibold">{90 - (getDaysSinceLastDonation() || 0)} days until eligible</span></>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 md:py-6">
                        <div className="bg-gray-100 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Calendar className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 font-medium">No donation yet</p>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-1">Record your first donation</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setShowDonationDateUpdate(!showDonationDateUpdate);
                        setNewDonationDate(new Date().toISOString().split('T')[0]);
                        setActiveTab('edit');
                      }}
                      className="group bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl shadow-md md:shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <Droplet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Record Donation
                    </button>
                    <button
                      onClick={handleToggleAvailability}
                      disabled={!profile.isAvailable && !canDonateAgain()}
                      className={`font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl shadow-md md:shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm ${
                        profile.isAvailable
                          ? 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      }`}
                    >
                      {profile.isAvailable ? <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      {profile.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                  </div>
                  
                  {!profile.isAvailable && !canDonateAgain() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <p className="text-[10px] md:text-xs text-amber-700 text-center font-medium">
                        ⚠️ Wait {90 - (getDaysSinceLastDonation() || 0)} more days
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overview' && !profile && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-10 text-center border border-gray-100">
                <div className="bg-gradient-to-br from-red-100 to-red-200 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                  <Droplet className="h-10 w-10 md:h-12 md:w-12 text-red-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900">Create Your Donor Profile</h3>
                <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6 max-w-md mx-auto">
                  Complete your profile to start helping others and saving lives
                </p>
                <button
                  onClick={() => setActiveTab('edit')}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200 gap-2">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                      <Edit2 className="h-6 w-6 md:h-7 md:w-7 text-red-600" />
                      {profile ? 'Edit Profile' : 'Create Profile'}
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Update your information and preferences</p>
                  </div>
                </div>
                
                <div className="space-y-4 md:space-y-6">
                {/* Modern Profile Picture Upload Section */}
                <div className="bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200">
                  <label className="text-xs md:text-sm font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                    <Camera className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                    <div className="relative group">
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-red-100 to-red-200 border-4 border-white flex items-center justify-center shadow-xl ring-4 ring-red-100">
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
                          <User className="w-12 h-12 md:w-16 md:h-16 text-red-400" />
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture-upload-main"
                        className={`absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 ${uploadingPhoto ? 'pointer-events-none' : ''}`}
                      >
                        <div className="text-center">
                          <Camera className="w-6 h-6 md:w-8 md:h-8 text-white mx-auto mb-1" />
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
                      <p className="text-sm md:text-base text-gray-700 mb-2 md:mb-3 font-medium">
                        Upload a clear photo of yourself
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                        JPG, PNG or GIF (max. 5MB)
                      </p>
                      <label
                        htmlFor="profile-picture-upload-main"
                        className={`inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white hover:bg-gray-50 border-2 border-red-200 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold text-red-700 cursor-pointer transition-all shadow-sm hover:shadow-md ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Camera className="w-4 h-4 md:w-5 md:h-5" />
                        {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-red-600" />
                      Blood Group *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 font-medium text-sm md:text-base"
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
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                      placeholder="+880 1XX-XXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                      placeholder="Your residential address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                      placeholder="2021XXXXXXX"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Current District
                    </label>
                    <select
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 text-sm md:text-base"
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
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                      placeholder="e.g., CSE, EEE, BBA"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                      Session
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                      placeholder="e.g., 2023-2024"
                      value={formData.session}
                      onChange={(e) => setFormData({...formData, session: e.target.value})}
                    />
                  </div>
                </div>

                {profile && (
                  <>
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl md:rounded-2xl p-4 md:p-6 text-center border-2 border-blue-100">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Logged in as</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{profile.user.name}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{profile.user.email}</p>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 md:py-4 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                          Saving Changes...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                )}

                {!profile && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 md:py-4 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg"
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
                    <div className="pt-4 md:pt-6 border-t-2 border-gray-200 mt-4 md:mt-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-100 p-1.5 md:p-2 rounded-lg">
                            <Droplet className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                          </div>
                          <span className="text-sm md:text-base font-bold text-gray-800">Record New Donation</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowDonationDateUpdate(!showDonationDateUpdate);
                            setNewDonationDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
                        >
                          {showDonationDateUpdate ? 'Cancel' : '+ Update Date'}
                        </button>
                      </div>
                      {showDonationDateUpdate && (
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg md:rounded-xl p-4 md:p-6 space-y-3 md:space-y-4 border-2 border-red-100 shadow-inner">
                          <div>
                            <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">
                              When did you donate?
                            </label>
                            <input
                              type="date"
                              className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-red-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm md:text-base"
                              value={newDonationDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setNewDonationDate(e.target.value)}
                            />
                          </div>
                          <button
                            onClick={handleUpdateDonationDate}
                            disabled={!newDonationDate}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                          >
                            Save Donation Date
                          </button>
                          <p className="text-xs text-gray-600 text-center bg-white/70 p-3 rounded-lg">
                            ℹ️ Your availability will be auto-updated based on the 90-day donation cycle
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 md:pt-6 border-t-2 border-gray-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 md:p-2 rounded-lg ${profile?.isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {profile?.isAvailable ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            )}
                          </div>
                          <span className="text-sm md:text-base font-bold text-gray-800">Availability Status</span>
                        </div>
                        <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md w-full sm:w-auto text-center ${
                          profile?.isAvailable 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        }`}>
                          {profile?.isAvailable ? '✓ Available' : '✗ Unavailable'}
                        </span>
                      </div>
                      <button
                        onClick={handleToggleAvailability}
                        disabled={!profile?.isAvailable && !canDonateAgain()}
                        className={`w-full py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all shadow-md hover:shadow-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          profile?.isAvailable
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-300'
                        }`}
                      >
                        {profile?.isAvailable ? '⊘ Mark as Unavailable' : '✓ Mark as Available'}
                      </button>
                      {!profile?.isAvailable && !canDonateAgain() ? (
                        <p className="text-xs text-amber-600 mt-2 md:mt-3 text-center bg-amber-50 p-2 md:p-3 rounded-lg">
                          ⚠️ Must wait {90 - (getDaysSinceLastDonation() || 0)} more days to become available
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-2 md:mt-3 text-center bg-blue-50 p-2 md:p-3 rounded-lg">
                          💡 Update your status if you&apos;re temporarily unavailable (e.g., left the city, health issues)
                        </p>
                      )}
                    </div>

                    {/* Security Section */}
                    <div className="pt-4 md:pt-6 border-t-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <div className="bg-gray-100 p-1.5 md:p-2 rounded-lg">
                          <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                        </div>
                        <span className="text-sm md:text-base font-bold text-gray-800">Security</span>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all shadow-md hover:shadow-lg border-2 bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                      >
                        🔐 Change Password
                      </button>
                      <p className="text-xs text-gray-600 mt-2 md:mt-3 text-center bg-gray-50 p-2 md:p-3 rounded-lg">
                        💡 Use a strong password to keep your account secure
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && profile && (
              <div className="space-y-3 md:space-y-4">
                {/* Upload Button */}
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  Add New Post
                </button>

                {posts.length > 0 ? (
                  <>
                    {/* Gallery Grid */}
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                      {posts.map((post, index) => (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="group aspect-square relative rounded-lg md:rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                          style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                        >
                          <Image 
                            src={post.imageUrl} 
                            alt={post.caption || 'Post'} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            unoptimized 
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2 md:p-3">
                            {post.caption && (
                              <p className="text-white text-[10px] md:text-xs line-clamp-2 font-medium">{post.caption}</p>
                            )}
                            <p className="text-white/70 text-[8px] md:text-[10px] mt-0.5 md:mt-1">
                              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Post Count */}
                    <div className="text-center text-xs md:text-sm text-gray-500">
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
                    <Camera className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mb-2 md:mb-3" />
                    <p className="text-gray-600 font-medium mb-1 text-sm md:text-base">No posts yet</p>
                    <p className="text-[10px] md:text-xs text-gray-500">Share photos from your donation journey</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setEditingPost(null); setEditCaption(''); }} />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Edit Caption</h3>
              <button 
                onClick={() => { setEditingPost(null); setEditCaption(''); }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-5">
              {/* Image Preview */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                <Image 
                  src={editingPost.imageUrl} 
                  alt="Post" 
                  fill 
                  className="object-cover" 
                  unoptimized 
                />
              </div>

              {/* Caption Input */}
              <div className="mb-4">
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none text-sm"
                  placeholder="Write a caption..."
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  maxLength={2200}
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">{editCaption.length}/2200</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditingPost(null); setEditCaption(''); }}
                  className="flex-1 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditPost}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Upload Post Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowUpload(false); setImageFile(null); setCaption(''); }} />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-[2px]">
              <div className="bg-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
                    <p className="text-xs text-gray-500">Share a moment</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowUpload(false); setImageFile(null); setCaption(''); }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="dashboard-image-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () => setImageFile(reader.result as string);
                    }
                  }}
                />
                {!imageFile ? (
                  <label 
                    htmlFor="dashboard-image-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all duration-300"
                  >
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                ) : (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                    <Image src={imageFile} alt="Preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label 
                        htmlFor="dashboard-image-upload"
                        className="px-4 py-2 bg-white rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Change Photo
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        setImageFile(null);
                        const input = document.getElementById('dashboard-image-upload') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Caption */}
              {imageFile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-sm"
                    placeholder="Write a caption... (optional)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
                    rows={4}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{caption.length}/2200</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowUpload(false); setImageFile(null); setCaption(''); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadPost}
                  disabled={!imageFile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Instagram-style Post Viewer Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black" 
          onClick={() => setSelectedPost(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-3 right-3 md:top-5 md:right-5 z-20 p-2 hover:opacity-60 transition-opacity"
          >
            <X className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </button>
          
          {/* Content Container */}
          <div 
            className="relative z-10 w-full h-full md:h-auto md:max-h-[calc(100vh-40px)] max-w-[935px] mx-auto flex flex-col md:flex-row bg-black md:bg-white overflow-hidden animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Section */}
            <div className="relative bg-black flex items-center justify-center flex-1 md:max-w-[600px] min-h-0">
              <Image
                src={selectedPost.imageUrl}
                alt={selectedPost.caption || 'Post'}
                width={600}
                height={750}
                className="w-full h-full object-contain"
                unoptimized
                priority
              />
            </div>
            
            {/* Details Panel */}
            <div className="w-full md:w-[335px] md:min-w-[335px] bg-white flex flex-col border-l border-gray-100">
              {/* User Header */}
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {profile?.profilePicture ? (
                      <Image
                        src={profile.profilePicture}
                        alt={session?.user.name || 'User'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-[1.5px] ring-gray-200"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full p-[1.5px]">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-900">
                            {session?.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-gray-900 leading-tight">{session?.user.name}</span>
                    {profile?.currentDistrict && (
                      <span className="text-xs text-gray-500">{profile.currentDistrict}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionSheet(true);
                  }}
                  className="p-2 -mr-2 hover:opacity-50 transition-opacity"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-900" />
                </button>
              </div>
              
              {/* Caption Section */}
              <div className="flex-1 overflow-y-auto">
                {selectedPost.caption ? (
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedPost.caption}
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      {(() => {
                        const diff = Date.now() - new Date(selectedPost.createdAt).getTime();
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const weeks = Math.floor(days / 7);
                        if (days === 0) return 'Today';
                        if (days === 1) return '1d';
                        if (days < 7) return `${days}d`;
                        return `${weeks}w`;
                      })()}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    No caption
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instagram-style Action Sheet */}
      {showActionSheet && selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowActionSheet(false)} 
          />
          
          {/* Action Sheet */}
          <div className="relative w-full max-w-md mx-4 mb-4 animate-slide-up">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              {/* Delete Option */}
              <button
                onClick={() => {
                  setShowActionSheet(false);
                  setSelectedPost(null);
                  handleDeletePost(selectedPost.id);
                }}
                className="w-full px-4 py-4 flex items-center justify-center gap-2 text-red-500 font-semibold text-[15px] hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
              
              {/* Edit Option */}
              <button
                onClick={() => {
                  setShowActionSheet(false);
                  setSelectedPost(null);
                  setEditingPost(selectedPost);
                  setEditCaption(selectedPost.caption || '');
                }}
                className="w-full px-4 py-4 flex items-center justify-center gap-2 text-gray-900 font-medium text-[15px] hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </button>
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={() => setShowActionSheet(false)}
              className="w-full mt-2 px-4 py-4 bg-white rounded-2xl text-gray-900 font-semibold text-[15px] hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl transform animate-scale-in">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">Your profile has been updated successfully</p>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
