'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Search, Droplet, Phone, MapPin, Calendar, Mail } from 'lucide-react';
import { BloodGroup } from '@prisma/client';

type Donor = {
  id: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string | null;
  isAvailable: boolean;
  phoneNumber: string | null;
  address: string | null;
  profilePicture: string | null;
  user: {
    name: string;
    email: string;
  };
};

export default function Donors() {
  const router = useRouter();
  const { data: session } = useSession();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);


  const bloodGroups = Object.values(BloodGroup);

  useEffect(() => {
    setPage(1);
    fetchDonors(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBloodGroup, availableOnly]);

  const fetchDonors = async (pageNum: number = page, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const params = new URLSearchParams();
      if (selectedBloodGroup) params.append('bloodGroup', selectedBloodGroup);
      if (availableOnly) params.append('availableOnly', 'true');
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', pageNum.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/donors?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDonors(reset ? data.donors : [...donors, ...data.donors]);
        setHasMore(data.hasMore);
        setTotal(data.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchDonors(1, true);
  };

  const handleLoadMore = () => {
    fetchDonors(page + 1, false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Find Blood Donors</h1>
            <p className="text-gray-600 mt-2">Search for verified blood donors in the SUST community</p>
          </div>

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Enter donor name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  className="input-field"
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                >
                  <option value="">All Blood Groups</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="availableOnly"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                  />
                  <label htmlFor="availableOnly" className="ml-2 block text-sm text-gray-700">
                    Available only
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button onClick={handleSearch} className="btn-primary">
                <Search className="h-4 w-4 inline mr-2" />
                Search
              </button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading donors...</p>
            </div>
          ) : donors.length === 0 ? (
            <div className="card text-center py-12">
              <Droplet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No donors found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donors.map((donor) => (
                <div 
                  key={donor.id} 
                  onClick={() => {
                    // If clicking on own profile and user is a donor, go to dashboard instead
                    if (donor.user.email === session?.user?.email && session?.user?.role === 'DONOR') {
                      router.push('/dashboard');
                    } else {
                      router.push(`/donors/${donor.id}`);
                    }
                  }}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {donor.profilePicture ? (
                      <Image 
                        src={donor.profilePicture} 
                        alt={donor.user.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-xl">
                          {donor.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">{donor.user.name}</h3>
                      <div className="flex items-center mt-1">
                        <Droplet className="h-4 w-4 text-red-600 mr-1" />
                        <span className="text-red-600 font-medium">
                          {donor.bloodGroup.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      donor.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {donor.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{donor.user.email}</span>
                    </div>

                    {donor.phoneNumber && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{donor.phoneNumber}</span>
                      </div>
                    )}

                    {donor.address && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{donor.address}</span>
                      </div>
                    )}

                    {donor.lastDonationDate && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Last donated: {new Date(donor.lastDonationDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More & Summary */}
          {!loading && donors.length > 0 && (
            <div className="mt-6 text-center">
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-primary mb-4"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
              <p className="text-sm text-gray-600">
                Showing {donors.length} of {total} donor{total !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
