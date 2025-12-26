'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { Clock, CheckCircle, XCircle, Droplet, Lock, Bell, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

type BloodRequest = {
  id: string;
  requesterName: string;
  requesterPhone: string;
  bloodGroup: string;
  urgency: string;
  location: string;
  hospitalName?: string;
  patientName?: string;
  unitsNeeded: number;
  status: string;
  createdAt: string;
  approvedAt?: string;
  acceptedAt?: string;
  acceptedDonor?: {
    name: string;
    email: string;
  };
};

type RequesterNotification = {
  id: string;
  status: string;
  createdAt: string;
  readAt?: string;
  bloodRequest: {
    id: string;
    bloodGroup: string;
    urgency: string;
    location: string;
    hospitalName?: string;
    patientName?: string;
    unitsNeeded: number;
    status: string;
    acceptedAt?: string;
  };
  donor: {
    id: string;
    name: string;
    email: string;
    donorProfile?: {
      phoneNumber?: string;
      bloodGroup: string;
      currentDistrict?: string;
      profilePicture?: string;
    };
  };
};

export default function RequesterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [notifications, setNotifications] = useState<RequesterNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications'>('requests');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session && session.user.role !== 'REQUESTER') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && session.user.role === 'REQUESTER') {
      fetchRequests();
      fetchNotifications();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/blood-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/requester/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/requester/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/requester/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatBloodGroup = (bg: string) => bg.replace('_', ' ');

  if (loading || status === 'loading') {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
      case 'FULFILLED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Donor Found</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow bg-gray-50 py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">My Blood Requests</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track your blood donation requests</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 sm:py-3"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Change Password</span>
              </button>
              <button
                onClick={() => router.push('/request-blood')}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
              >
                <Droplet className="h-4 sm:h-5 w-4 sm:w-5" />
                New Request
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-colors ${activeTab === 'requests'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Droplet className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">My Requests</span>
                  {requests.length > 0 && (
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-colors ${activeTab === 'notifications'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 sm:p-8 md:p-12 text-center">
                  <Droplet className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Submit your first blood donation request</p>
                  <button
                    onClick={() => router.push('/request-blood')}
                    className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 text-sm sm:text-base"
                  >
                    Create Request
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {requests.map((req) => (
                    <div key={req.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-red-600">
                            {req.bloodGroup.replace('_', ' ')} Blood Needed
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Submitted: {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                          {getStatusBadge(req.status)}
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${req.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                            req.urgency === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {req.urgency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600">Location</p>
                          <p className="font-medium break-words">{req.location}</p>
                        </div>
                        {req.hospitalName && (
                          <div>
                            <p className="text-gray-600">Hospital</p>
                            <p className="font-medium break-words">{req.hospitalName}</p>
                          </div>
                        )}
                        {req.patientName && (
                          <div>
                            <p className="text-gray-600">Patient</p>
                            <p className="font-medium break-words">{req.patientName}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Units Needed</p>
                          <p className="font-medium">{req.unitsNeeded}</p>
                        </div>
                      </div>

                      {req.status === 'APPROVED' && req.approvedAt && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-green-800">
                            ✓ Approved on {new Date(req.approvedAt).toLocaleString()} - Donors have been notified!
                          </p>
                        </div>
                      )}

                      {req.status === 'FULFILLED' && req.acceptedDonor && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-blue-800 font-semibold mb-1">
                            🎉 A donor has accepted your request!
                          </p>
                          <p className="text-xs sm:text-sm text-blue-700">
                            <strong>Donor:</strong> {req.acceptedDonor.name}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-700">
                            <strong>Email:</strong> {req.acceptedDonor.email}
                          </p>
                          {req.acceptedAt && (
                            <p className="text-xs text-blue-600 mt-1">
                              Accepted on {new Date(req.acceptedAt).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-2">
                            💡 Check the Notifications tab for more donor details!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <>
              {notifications.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 sm:p-8 md:p-12 text-center">
                  <Bell className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No notifications yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    You&apos;ll receive notifications here when donors accept your blood requests
                  </p>
                </div>
              ) : (
                <>
                  {/* Mark All as Read Button */}
                  {unreadCount > 0 && (
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark all as read
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 transition-all ${notification.status === 'UNREAD'
                          ? 'border-red-500 bg-red-50/30'
                          : 'border-gray-200'
                          }`}
                        onClick={() => notification.status === 'UNREAD' && markAsRead(notification.id)}
                      >
                        {/* Notification Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                🎉 Donor Found!
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.status === 'UNREAD' && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                New
                              </span>
                            )}
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                              {formatBloodGroup(notification.bloodRequest.bloodGroup)}
                            </span>
                          </div>
                        </div>

                        {/* Donor Details Card */}
                        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 sm:p-5 border border-green-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Donor Information
                          </h4>

                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Donor Avatar */}
                            <div className="flex-shrink-0">
                              {notification.donor.donorProfile?.profilePicture ? (
                                <Image
                                  src={notification.donor.donorProfile.profilePicture}
                                  alt={notification.donor.name}
                                  width={80}
                                  height={80}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-white shadow-md"
                                />
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md">
                                  {notification.donor.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Donor Details */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Name</p>
                                  <p className="font-semibold text-gray-900">{notification.donor.name}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <a
                                    href={`mailto:${notification.donor.email}`}
                                    className="font-medium text-blue-600 hover:underline text-sm break-all"
                                  >
                                    {notification.donor.email}
                                  </a>
                                </div>
                              </div>

                              {notification.donor.donorProfile?.phoneNumber && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <a
                                      href={`tel:${notification.donor.donorProfile.phoneNumber}`}
                                      className="font-semibold text-green-600 hover:underline"
                                    >
                                      {notification.donor.donorProfile.phoneNumber}
                                    </a>
                                  </div>
                                </div>
                              )}

                              {notification.donor.donorProfile?.currentDistrict && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">District</p>
                                    <p className="font-medium text-gray-900">
                                      {notification.donor.donorProfile.currentDistrict}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact Actions */}
                          <div className="mt-4 pt-4 border-t border-green-200 flex flex-wrap gap-2">
                            <a
                              href={`mailto:${notification.donor.email}`}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Mail className="h-4 w-4" />
                              Send Email
                            </a>
                            {notification.donor.donorProfile?.phoneNumber && (
                              <a
                                href={`tel:${notification.donor.donorProfile.phoneNumber}`}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <Phone className="h-4 w-4" />
                                Call Now
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Request Details
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium">{notification.bloodRequest.location}</p>
                            </div>
                            {notification.bloodRequest.hospitalName && (
                              <div>
                                <p className="text-gray-500">Hospital</p>
                                <p className="font-medium">{notification.bloodRequest.hospitalName}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-500">Units</p>
                              <p className="font-medium">{notification.bloodRequest.unitsNeeded}</p>
                            </div>
                            {notification.bloodRequest.acceptedAt && (
                              <div>
                                <p className="text-gray-500">Accepted At</p>
                                <p className="font-medium">
                                  {new Date(notification.bloodRequest.acceptedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <Footer />
    </div>
  );
}
