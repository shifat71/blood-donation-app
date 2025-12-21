'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, X, Droplet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type ToastType = 'success' | 'error' | null;

export default function RequestBloodPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterPhone: '',
    bloodGroup: 'A_POSITIVE',
    urgency: 'MODERATE',
    location: '',
    hospitalName: '',
    patientName: '',
    unitsNeeded: '1',
    additionalInfo: '',
  });

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    if (type === 'success') {
      setTimeout(() => {
        setToast(null);
        router.push('/requester');
      }, 2000);
    } else {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      showToast('error', 'Please sign in with Google to submit a request');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast('success', 'Request submitted successfully! Waiting for moderator approval.');
      } else {
        showToast('error', 'Failed to submit request. Please try again.');
      }
    } catch (_error) {
      showToast('error', 'Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50 px-3 sm:px-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Sign In Required</h1>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">Please sign in with Google to submit a blood donation request</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/requester' })}
              className="w-full bg-red-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-red-700 transition text-sm sm:text-base font-medium"
            >
              Sign in with Google
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
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-50 animate-in slide-in-from-top-2 duration-300 max-w-[calc(100vw-1rem)] sm:max-w-md">
          <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            )}
            <span className="font-medium text-sm sm:text-base">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-1 sm:ml-2 hover:opacity-70 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow bg-gray-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-600 flex items-center gap-2">
            <Droplet className="w-6 h-6 sm:w-8 sm:h-8" />
            Request Blood
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.requesterPhone}
                  onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Blood Group *</label>
                <select
                  required
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                >
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Urgency *</label>
                <select
                  required
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                placeholder="City, District"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Patient Name</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Units Needed *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.unitsNeeded}
                onChange={(e) => setFormData({ ...formData, unitsNeeded: e.target.value })}
                className="w-full sm:w-32 border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
