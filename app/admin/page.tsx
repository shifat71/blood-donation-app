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
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users and moderators</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-12 w-12 text-gray-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Donors</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.donors}</p>
                </div>
                <Users className="h-12 w-12 text-red-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Moderators</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.moderators}</p>
                </div>
                <UserCog className="h-12 w-12 text-blue-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.verified}</p>
                </div>
                <Shield className="h-12 w-12 text-green-600" />
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/moderator')}
                  className="w-full btn-secondary text-left"
                >
                  View Moderator Dashboard
                </button>
                <button
                  onClick={() => router.push('/donors')}
                  className="w-full btn-secondary text-left"
                >
                  View All Donors
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Change Role
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Change User Role</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">User: <span className="font-medium text-gray-900">{selectedUser.name}</span></p>
              <p className="text-sm text-gray-600 mb-4">Current Role: <span className="font-medium text-gray-900">{selectedUser.role}</span></p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                className="input-field"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
              >
                <option value={Role.DONOR}>DONOR</option>
                <option value={Role.MODERATOR}>MODERATOR</option>
                <option value={Role.ADMIN}>ADMIN</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRoleUpdate}
                className="btn-primary flex-1"
              >
                Update Role
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn-secondary"
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
