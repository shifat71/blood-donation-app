'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | null;

type BloodRequest = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  bloodGroup: string;
  urgency: string;
  location: string;
  hospitalName?: string;
  patientName?: string;
  unitsNeeded: number;
  additionalInfo?: string;
  status: string;
  createdAt: string;
};

export default function BloodRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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
      const res = await fetch('/api/blood-requests?status=PENDING');
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

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/blood-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (action === 'approve') {
          const emailInfo = data.emailsSent > 0 
            ? `Request approved! ${data.emailsSent} email(s) sent to matching donors.`
            : 'Request approved! No matching available donors found.';
          showToast('success', emailInfo);
        } else {
          showToast('success', 'Request rejected.');
        }
        fetchRequests();
      } else {
        showToast('error', data.error || 'Failed to process request');
      }
    } catch (_error) {
      showToast('error', 'Error processing request');
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Blood Donation Requests</h1>

          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-red-600">
                        {req.bloodGroup.replace('_', ' ')} Blood Needed
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      req.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                      req.urgency === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {req.urgency}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Requester</p>
                      <p className="font-medium">{req.requesterName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{req.requesterPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{req.requesterEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{req.location}</p>
                    </div>
                    {req.hospitalName && (
                      <div>
                        <p className="text-sm text-gray-600">Hospital</p>
                        <p className="font-medium">{req.hospitalName}</p>
                      </div>
                    )}
                    {req.patientName && (
                      <div>
                        <p className="text-sm text-gray-600">Patient</p>
                        <p className="font-medium">{req.patientName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Units Needed</p>
                      <p className="font-medium">{req.unitsNeeded}</p>
                    </div>
                  </div>

                  {req.additionalInfo && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Additional Info</p>
                      <p className="text-gray-800">{req.additionalInfo}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Approve & Notify Donors
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-5 w-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
