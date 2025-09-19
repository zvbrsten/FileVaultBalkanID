import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  HardDrive, 
  FileText, 
  Activity, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  uniqueFiles: number;
  duplicateFiles: number;
  storageEfficiency: number;
  activeUsers: number;
  newUsersToday: number;
}

interface UserStats {
  userId: string;
  username: string;
  email: string;
  totalFiles: number;
  storageUsed: number;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
}

interface SystemHealth {
  databaseStatus: string;
  storageStatus: string;
  uptime: string;
  memoryUsage: number;
  diskUsage: number;
  lastBackup?: string;
}

const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>('overview');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Access denied: Admin privileges required');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'admin' && !authLoading) {
      fetchAdminData();
    }
  }, [user, authLoading]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch admin stats
      const statsResponse = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query {
              adminStats {
                totalUsers
                totalFiles
                totalStorage
                uniqueFiles
                duplicateFiles
                storageEfficiency
                activeUsers
                newUsersToday
              }
            }
          `
        })
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.data?.adminStats) {
          setAdminStats(statsData.data.adminStats);
        }
      }

      // Fetch users
      const usersResponse = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query {
              adminUsers(limit: 50) {
                userId
                username
                email
                totalFiles
                storageUsed
                createdAt
                isActive
              }
            }
          `
        })
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.data?.adminUsers) {
          setUsers(usersData.data.adminUsers);
        }
      }

      // Fetch system health
      const healthResponse = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query {
              adminSystemHealth {
                databaseStatus
                storageStatus
                uptime
                memoryUsage
                diskUsage
                lastBackup
              }
            }
          `
        })
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.data?.adminSystemHealth) {
          setSystemHealth(healthData.data.adminSystemHealth);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">System administration and monitoring</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'system', label: 'System', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && adminStats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Files</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.totalFiles}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <HardDrive className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold text-gray-900">{formatBytes(adminStats.totalStorage)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.storageEfficiency.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Files</p>
                    <p className="text-xl font-bold text-gray-900">{adminStats.uniqueFiles}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duplicate Files</p>
                    <p className="text-xl font-bold text-gray-900">{adminStats.duplicateFiles}</p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-xl font-bold text-gray-900">{adminStats.activeUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    <strong>{adminStats.newUsersToday}</strong> new users registered today
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    <strong>{adminStats.activeUsers}</strong> active users in the last 30 days
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Storage efficiency at <strong>{adminStats.storageEfficiency.toFixed(1)}%</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage users and their permissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalFiles}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBytes(user.storageUsed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && systemHealth && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
                  <Database className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex items-center space-x-2">
                  {systemHealth.databaseStatus === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    systemHealth.databaseStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {systemHealth.databaseStatus}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Storage Status</h3>
                  <HardDrive className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex items-center space-x-2">
                  {systemHealth.storageStatus === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    systemHealth.storageStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {systemHealth.storageStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Uptime</h3>
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{systemHealth.uptime}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{systemHealth.memoryUsage}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${systemHealth.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Disk Usage</h3>
                  <HardDrive className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{systemHealth.diskUsage}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${systemHealth.diskUsage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
