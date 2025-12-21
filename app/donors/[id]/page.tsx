'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Droplet, Phone, MapPin, Calendar, Mail, ArrowLeft, User, History, Plus, Grid3x3, X, Edit, CheckCircle, Building2, XCircle } from 'lucide-react';
import { BloodGroup } from '@prisma/client';

type Post = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
};

type DonorProfile = {
  id: string;
  userId: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string | null;
  isAvailable: boolean;
  phoneNumber: string | null;
  address: string | null;
  studentId: string | null;
  profilePicture: string | null;
  createdAt: string;
  currentDistrict: string | null;
  department: string | null;
  session: string | null;
  user: {
    name: string;
    email: string;
  };
};

export default function DonorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copiedText, setCopiedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editForm, setEditForm] = useState({
    userName: '',
    bloodGroup: '',
    phoneNumber: '',
    address: '',
    studentId: '',
    lastDonationDate: '',
    isAvailable: true,
    currentDistrict: '',
    department: '',
    session: '',
  });

  const bloodGroups = Object.values(BloodGroup);
  const isModeratorOrAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 4000);
  };

  useEffect(() => {
    fetchDonor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPost) setSelectedPost(null);
        else if (showUpload) setShowUpload(false);
        else if (showEditModal) setShowEditModal(false);
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedPost, showUpload, showEditModal]);

  useEffect(() => {
    // Redirect to dashboard if viewing own profile (only for donors)
    if (donor && session?.user?.id === donor.userId && session?.user?.role === 'DONOR') {
      router.push('/dashboard');
    }
  }, [donor, session, router]);

  useEffect(() => {
    if (donor) fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor]);

  const fetchDonor = async () => {
    try {
      const response = await fetch(`/api/donors/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDonor(data);
      }
    } catch (error) {
      console.error('Error fetching donor:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${donor?.userId}`);
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
      console.log('Uploading post...');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageFile, caption }),
      });
      const data = await response.json();
      console.log('Upload response:', response.status, data);
      if (response.ok) {
        setShowUpload(false);
        setImageFile(null);
        setCaption('');
        fetchPosts();
      } else {
        showError('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading post:', error);
      showError('Error uploading photo');
    }
  };

  const openEditModal = () => {
    if (donor) {
      setEditForm({
        userName: donor.user.name,
        bloodGroup: donor.bloodGroup,
        phoneNumber: donor.phoneNumber || '',
        address: donor.address || '',
        studentId: donor.studentId || '',
        lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.split('T')[0] : '',
        isAvailable: donor.isAvailable,
        currentDistrict: donor.currentDistrict || '',
        department: donor.department || '',
        session: donor.session || '',
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor) return;

    setEditLoading(true);
    try {
      const response = await fetch(`/api/donors/${donor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchDonor();
        setShowEditModal(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error updating profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Donor not found</h2>
            <button onClick={() => router.push('/donors')} className="btn-primary mt-4">
              Back to Donors
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.push('/donors')} className="btn-secondary mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Donors
          </button>

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="card mb-6">
            <div className="flex flex-col items-center text-center mb-6">
              {donor.profilePicture ? (
                <Image 
                  src={donor.profilePicture} 
                  alt={donor.user.name}
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 mb-4"
                  unoptimized
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-red-100 flex items-center justify-center border-4 border-gray-200 mb-4">
                  <span className="text-red-600 font-bold text-5xl">
                    {donor.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{donor.user.name}</h1>
              <div className="flex items-center justify-center mt-2 gap-4">
                <div className="flex items-center">
                  <Droplet className="h-5 w-5 text-red-600 mr-1" />
                  <span className="text-lg font-semibold text-red-600">
                    {donor.bloodGroup.replace('_', ' ')}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  donor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {donor.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              {/* Combined Contact & Academic Info Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Academic Info - Top Section */}
                {(donor.studentId || donor.department || donor.session) && (
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {donor.studentId && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                          <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-900 truncate">{donor.studentId}</span>
                        </div>
                      )}
                      {donor.department && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                          <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-900 truncate">{donor.department}</span>
                        </div>
                      )}
                      {donor.session && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                          <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-900 truncate">{donor.session}</span>
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
                      navigator.clipboard.writeText(donor.user.email);
                      setCopiedText('Email copied!');
                      setTimeout(() => setCopiedText(''), 2000);
                    }}
                    className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                  >
                    <Mail className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-red-500" />
                    <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{donor.user.email}</p>
                  </button>

                  {/* Phone - Clickable */}
                  {donor.phoneNumber && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(donor.phoneNumber!);
                        setCopiedText('Phone copied!');
                        setTimeout(() => setCopiedText(''), 2000);
                      }}
                      className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                    >
                      <Phone className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-blue-500" />
                      <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{donor.phoneNumber}</p>
                    </button>
                  )}

                  {/* Location - Clickable */}
                  {donor.address && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(donor.address!);
                        setCopiedText('Address copied!');
                        setTimeout(() => setCopiedText(''), 2000);
                      }}
                      className="w-full flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left group"
                    >
                      <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 group-hover:text-green-500" />
                      <p className="text-sm font-medium text-slate-700 truncate flex-1 group-hover:text-slate-900">{donor.address}</p>
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
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Donation History</h2>
            </div>
            
            {donor.lastDonationDate ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">Last Donation</p>
                      <p className="text-sm text-gray-600">
                        {new Date(donor.lastDonationDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </span>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Member since {new Date(donor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No donation history available</p>
                <p className="text-sm text-gray-500 mt-1">This donor hasn&apos;t recorded any donations yet</p>
              </div>
            )}
          </div>

          {/* Modern Posts Section */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header with gradient accent */}
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-[2px]">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-md">
                      <Grid3x3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Posts</h2>
                      <p className="text-xs text-gray-500">{posts.length} {posts.length === 1 ? 'photo' : 'photos'} shared</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session?.user.id === donor?.userId && (
                      <button 
                        onClick={() => setShowUpload(true)} 
                        className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-red-200 transition-all duration-300 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Photo
                      </button>
                    )}
                    {isModeratorOrAdmin && (
                      <button 
                        onClick={openEditModal} 
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Posts Grid */}
            <div className="p-4">
              {posts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {posts.map((post, index) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="group aspect-square relative rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                        {post.caption && (
                          <p className="text-white text-xs line-clamp-2 font-medium">{post.caption}</p>
                        )}
                        <p className="text-white/70 text-[10px] mt-1">
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {/* Corner accent */}
                      <div className="absolute top-2 right-2 w-2 h-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <Grid3x3 className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No posts yet</p>
                  <p className="text-sm text-gray-400 mt-1">Photos will appear here once shared</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modern Upload Photo Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
          
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
                    <h3 className="text-lg font-bold text-gray-900">Upload Photo</h3>
                    <p className="text-xs text-gray-500">Share a moment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="photo-upload"
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
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all duration-300"
                  >
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                ) : (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                    <Image src={imageFile} alt="Preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label 
                        htmlFor="photo-upload"
                        className="px-4 py-2 bg-white rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Change Photo
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-sm"
                  placeholder="Write a caption... (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadPost} 
                  disabled={!imageFile} 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal for Moderators/Admins */}
      {showEditModal && isModeratorOrAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Donor Profile</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.userName}
                    onChange={(e) => setEditForm({...editForm, userName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    className="input-field"
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({...editForm, bloodGroup: e.target.value})}
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.studentId}
                    onChange={(e) => setEditForm({...editForm, studentId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.session}
                    onChange={(e) => setEditForm({...editForm, session: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current District</label>
                  <select
                    className="input-field"
                    value={editForm.currentDistrict}
                    onChange={(e) => setEditForm({...editForm, currentDistrict: e.target.value})}
                  >
                    <option value="">Select District</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editForm.lastDonationDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditForm({...editForm, lastDonationDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      checked={editForm.isAvailable}
                      onChange={(e) => setEditForm({...editForm, isAvailable: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Available for Donation</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={editLoading} className="btn-primary flex-1">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Post Viewer Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          onClick={() => setSelectedPost(null)}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          
          {/* Close button */}
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-300 group"
          >
            <X className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
          
          {/* Content Container */}
          <div 
            className="relative z-10 w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col lg:flex-row gap-0 lg:gap-0 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Section */}
            <div className="flex-1 relative bg-black/40 backdrop-blur-sm rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <Image
                  src={selectedPost.imageUrl}
                  alt={selectedPost.caption || 'Post'}
                  width={900}
                  height={900}
                  className="max-h-[50vh] lg:max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
                  unoptimized
                />
              </div>
              
              {/* Image gradient overlay at bottom for mobile */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
            </div>
            
            {/* Details Panel */}
            <div className="lg:w-96 bg-white rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none flex flex-col max-h-[40vh] lg:max-h-none overflow-hidden">
              {/* User Header */}
              <div className="p-5 border-b border-gray-100 flex items-center gap-4">
                {donor?.profilePicture ? (
                  <div className="relative">
                    <Image
                      src={donor.profilePicture}
                      alt={donor.user.name}
                      width={52}
                      height={52}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-red-100"
                      unoptimized
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Droplet className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {donor?.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                      <Droplet className="h-3 w-3 text-red-500" />
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{donor?.user.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {donor?.bloodGroup.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Caption Section */}
              <div className="flex-1 overflow-y-auto p-5">
                {selectedPost.caption ? (
                  <div className="space-y-4">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedPost.caption}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    <p>No caption</p>
                  </div>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(selectedPost.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
