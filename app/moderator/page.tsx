'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { VerificationStatus } from '@prisma/client';

type VerificationRequest = {
  id: string;
  studentId: string;
  idCardImageUrl: string;
  status: VerificationStatus;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
};

export default function ModeratorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session && session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && (session.user.role === 'MODERATOR' || session.user.role === 'ADMIN')) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      console.log('[Moderator] Fetching verification requests...');
      const response = await fetch('/api/moderator/verifications');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Moderator] Received requests:', data.length);
        setRequests(data);
      } else {
        const errorData = await response.json();
        console.error('[Moderator] Error response:', errorData);
      }
    } catch (error) {
      console.error('[Moderator] Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (requestId: string, status: VerificationStatus) => {
    try {
      console.log('[Moderator] Updating verification:', requestId, status);
      const response = await fetch('/api/moderator/verifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          reason: status === VerificationStatus.REJECTED ? reason : undefined,
        }),
      });

      if (response.ok) {
        console.log('[Moderator] Verification updated successfully');
        await fetchRequests();
        setSelectedRequest(null);
        setReason('');
      } else {
        const errorData = await response.json();
        console.error('[Moderator] Update failed:', errorData);
      }
    } catch (error) {
      console.error('[Moderator] Error updating verification:', error);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
              <p className="text-gray-600 mt-2">Review and approve verification requests</p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchRequests();
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No pending verification requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">{request.user.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Email: {request.user.email}</p>
                        <p>Student ID: {request.studentId}</p>
                        <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="btn-secondary text-sm"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal for request details */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Request</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedRequest.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedRequest.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Student ID</label>
                  <p className="text-gray-900">{selectedRequest.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Card Image</label>
                  <div className="mt-2 relative w-full" style={{ minHeight: '300px' }}>
                    <Image
                      src={selectedRequest.idCardImageUrl}
                      alt="Student ID Card"
                      fill
                      className="object-contain rounded-lg border border-gray-300"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (for rejection)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional: Provide a reason if rejecting..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerification(selectedRequest.id, VerificationStatus.APPROVED)}
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => handleVerification(selectedRequest.id, VerificationStatus.REJECTED)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1"
                >
                  <XCircle className="h-4 w-4 inline mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReason('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
