'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Droplet, Phone, MapPin, Calendar, Mail, ArrowLeft, User, History, Plus, Grid3x3, X, Edit, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchDonor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    // Redirect to dashboard if viewing own profile
    if (donor && session?.user?.id === donor.userId) {
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
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Error uploading photo');
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
        alert('Error: ' + (data.error || 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
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

            <div className="border-t pt-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{donor.user.email}</p>
                </div>
              </div>

              {donor.phoneNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{donor.phoneNumber}</p>
                  </div>
                </div>
              )}

              {donor.address && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{donor.address}</p>
                  </div>
                </div>
              )}

              {donor.studentId && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium text-gray-900">{donor.studentId}</p>
                  </div>
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

          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
              </div>
              <div className="flex gap-2">
                {session?.user.id === donor?.userId && (
                  <button onClick={() => setShowUpload(true)} className="btn-primary text-sm flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add Photo
                  </button>
                )}
                {isModeratorOrAdmin && (
                  <button onClick={openEditModal} className="btn-secondary text-sm flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div key={post.id} className="aspect-square relative">
                    <Image src={post.imageUrl} alt={post.caption || 'Post'} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid3x3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Upload Photo</h3>
              <button onClick={() => setShowUpload(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              className="input-field mb-4"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => setImageFile(reader.result as string);
                }
              }}
            />
            {imageFile && <div className="relative w-full h-48 mb-4"><Image src={imageFile} alt="Preview" fill className="object-cover rounded" unoptimized /></div>}
            <textarea
              className="input-field mb-4"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
            <button onClick={handleUploadPost} disabled={!imageFile} className="btn-primary w-full">
              Upload
            </button>
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

      <Footer />
    </div>
  );
}
