'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Users, Shield, UserCog } from 'lucide-react';
import { Role } from '@prisma/client';

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role>(Role.DONOR);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && session.user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
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

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case Role.MODERATOR:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalUsers: users.length,
    donors: users.filter(u => u.role === Role.DONOR).length,
    moderators: users.filter(u => u.role === Role.MODERATOR).length,
    admins: users.filter(u => u.role === Role.ADMIN).length,
    verified: users.filter(u => u.isVerified).length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Manage users and moderators</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500 truncate">Total Users</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 text-gray-400 flex-shrink-0" />
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500 truncate">Donors</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.donors}</p>
                </div>
                <Users className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 text-red-600 flex-shrink-0" />
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500 truncate">Moderators</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.moderators}</p>
                </div>
                <UserCog className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 text-blue-600 flex-shrink-0" />
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500 truncate">Verified</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.verified}</p>
                </div>
                <Shield className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 text-green-600 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="card p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Quick Actions</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <button
                  onClick={() => router.push('/moderator')}
                  className="w-full btn-secondary text-left text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 truncate"
                >
                  View Moderator Dashboard
                </button>
                <button
                  onClick={() => router.push('/donors')}
                  className="w-full btn-secondary text-left text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 truncate"
                >
                  View All Donors
                </button>
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                <UserCog className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="truncate">Moderator Management</span>
              </h3>
              <p className="text-xs text-gray-600 mb-1 sm:mb-2">
                Moderators: <span className="font-semibold text-gray-900">{stats.moderators}</span>
              </p>
              <p className="text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2">
                Promote verified donors to review verification requests.
              </p>
              <button
                onClick={() => {
                  const verifiedDonors = users.filter(u => u.role === Role.DONOR && u.isVerified);
                  if (verifiedDonors.length > 0) {
                    setSelectedUser(verifiedDonors[0]);
                    setNewRole(Role.MODERATOR);
                  } else {
                    alert('No verified donors available to promote');
                  }
                }}
                className="w-full btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
              >
                Add New Moderator
              </button>
            </div>
          </div>

          {/* Eligible for Moderator Section */}
          {users.filter(u => u.role === Role.DONOR && u.isVerified).length > 0 && (
            <div className="card mb-6 sm:mb-8 p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
                <UserCog className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">Eligible Moderators</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Verified donors ready for promotion
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {users
                  .filter(u => u.role === Role.DONOR && u.isVerified)
                  .slice(0, 6)
                  .map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Shield className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 flex-shrink-0 ml-1" />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(Role.MODERATOR);
                        }}
                        className="w-full mt-2 px-2 sm:px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Promote
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">All Users</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Joined
                    </th>
                    <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 sm:leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 sm:leading-5 font-semibold rounded-full ${
                          user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap hidden lg:table-cell text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                          }}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-900 font-medium"
                        >
                          Change
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Role Update Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-3 sm:p-4 lg:p-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              {newRole === Role.MODERATOR && selectedUser.role === Role.DONOR ? 'Promote to Moderator' : 'Change User Role'}
            </h2>
            
            <div className="mb-4 sm:mb-6">
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 lg:p-4 mb-3">
                <p className="text-xs text-gray-600 mb-0.5">User</p>
                <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{selectedUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
              </div>

              <div className="mb-3 sm:mb-4">
                <p className="text-xs text-gray-600 mb-1">Current Role</p>
                <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  New Role
                </label>
                <select
                  className="input-field text-xs sm:text-sm"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                >
                  <option value={Role.DONOR}>DONOR</option>
                  <option value={Role.MODERATOR}>MODERATOR</option>
                  <option value={Role.ADMIN}>ADMIN</option>
                </select>
              </div>

              {newRole === Role.MODERATOR && selectedUser.role === Role.DONOR && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Moderators can review verification requests.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleRoleUpdate}
                className="btn-primary flex-1 text-xs sm:text-sm py-2 sm:py-2.5"
              >
                {newRole === Role.MODERATOR && selectedUser.role === Role.DONOR ? 'Promote' : 'Update'}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
