'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle, XCircle } from 'lucide-react';

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

      if (res.ok) {
        alert(action === 'approve' ? 'Request approved! Emails sent to donors.' : 'Request rejected.');
        fetchRequests();
      }
    } catch (error) {
      alert('Error processing request');
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
