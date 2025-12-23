'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { Clock, CheckCircle, XCircle, Droplet, Lock } from 'lucide-react';

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
};

export default function RequesterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

          {/* Requests List */}
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
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        req.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
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
                </div>
              ))}
            </div>
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
