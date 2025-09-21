import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@apollo/client';
import { 
  Users, 
  HardDrive, 
  FileText, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Database,
  Server,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { GET_ADMIN_STATS, GET_ADMIN_USERS, GET_SYSTEM_HEALTH } from '../api/queries';

interface User {
  userId: string;
  username: string;
  email: string;
  totalFiles: number;
  storageUsed: number;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
}


const AdminPageNew: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);

  // GraphQL queries
  const { data: statsData, loading: statsLoading, refetch: refetchStats, error: statsError } = useQuery(GET_ADMIN_STATS, {
    errorPolicy: 'all',
    skip: !user || user.role !== 'admin'
  });

  const { data: usersData, loading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery(GET_ADMIN_USERS, {
    variables: { limit: 50, offset: 0 },
    errorPolicy: 'all',
    skip: !user || user.role !== 'admin'
  });

  const { data: healthData, loading: healthLoading, refetch: refetchHealth, error: healthError } = useQuery(GET_SYSTEM_HEALTH, {
    errorPolicy: 'all',
    skip: !user || user.role !== 'admin'
  });

  const performHealthCheck = async () => {
    setHealthCheckLoading(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchUsers(),
        refetchHealth()
      ]);
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setHealthCheckLoading(false);
    }
  };

  const loading = statsLoading || usersLoading || healthLoading;
  const systemStats = statsData?.adminStats;
  const users = usersData?.adminUsers || [];
  const systemHealth = healthData?.adminSystemHealth;

  // Debug logging
  useEffect(() => {
    console.log('Admin Page Debug:');
    console.log('User:', user);
    console.log('Stats Data:', statsData);
    console.log('Users Data:', usersData);
    console.log('Health Data:', healthData);
    console.log('Stats Error:', statsError);
    console.log('Users Error:', usersError);
    console.log('Health Error:', healthError);
  }, [user, statsData, usersData, healthData, statsError, usersError, healthError]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-cream-700">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check for GraphQL errors
  const hasError = statsData?.error || usersData?.error || healthData?.error;
  if (hasError) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-cream-700 mb-4">Failed to fetch admin data</p>
          <Button onClick={performHealthCheck}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-cream-700">System overview and management</p>
        </div>

        {/* Health Check Button */}
        <div className="mb-6">
          <Button 
            onClick={performHealthCheck}
            disabled={healthCheckLoading}
            className="bg-forest-green hover:bg-forest-green-hover text-cream-50"
          >
            {healthCheckLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Health Check
              </>
            )}
          </Button>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="bg-cream-50 border-cream-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cream-800">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cream-900">{systemStats?.totalUsers || 0}</div>
              <p className="text-xs text-cream-700">
                {systemStats?.newUsersToday || 0} new today
              </p>
            </CardContent>
          </Card>

          {/* Total Files */}
          <Card className="bg-cream-50 border-cream-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cream-800">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cream-900">{systemStats?.totalFiles || 0}</div>
              <p className="text-xs text-cream-700">
                {systemStats?.uniqueFiles || 0} unique files
              </p>
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card className="bg-cream-50 border-cream-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cream-800">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cream-900">
                {formatBytes(systemStats?.totalStorage || 0)}
              </div>
              <p className="text-xs text-cream-700">
                {systemStats?.storageEfficiency?.toFixed(1) || 0}% efficiency
              </p>
            </CardContent>
          </Card>

          {/* Storage Saved */}
          <Card className="bg-cream-50 border-cream-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cream-800">Storage Saved</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cream-900">
                {formatBytes(systemStats?.deduplicationStats?.storageSaved || 0)}
              </div>
              <p className="text-xs text-cream-700">
                ${systemStats?.deduplicationStats?.costSavingsUSD?.toFixed(2) || 0}/mo saved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deduplication Metrics */}
        {systemStats?.deduplicationStats && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-cream-800">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                Storage Deduplication Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {systemStats.deduplicationStats.duplicateRecords}
                  </div>
                  <div className="text-sm text-gray-700">Duplicate Records</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatBytes(systemStats.deduplicationStats.storageSaved)}
                  </div>
                  <div className="text-sm text-gray-700">Storage Saved</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemStats.deduplicationStats.storageSavedPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-700">Efficiency</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange">
                    ${systemStats.deduplicationStats.costSavingsUSD.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-700">Monthly Savings</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{systemStats.deduplicationStats.duplicateRecords}</strong> duplicate file records detected across
                  <strong> {systemStats.deduplicationStats.totalFileRecords}</strong> total files, saving
                  <strong> {formatBytes(systemStats.deduplicationStats.storageSaved)}</strong> in storage costs.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="bg-cream-50 border-cream-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-cream-800">
              <Users className="w-5 h-5 mr-2" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-cream-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cream-700">Files</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cream-700">Storage</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cream-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cream-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.userId} className="border-b border-cream-100 hover:bg-cream-100/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-cream-900">{user.username}</div>
                          <div className="text-sm text-cream-700">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cream-800">{user.totalFiles}</td>
                      <td className="py-3 px-4 text-cream-800">{formatBytes(user.storageUsed)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cream-700 text-sm">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        {systemHealth && (
          <Card className="bg-cream-50 border-cream-200">
            <CardHeader>
              <CardTitle className="flex items-center text-cream-800">
                <Server className="w-5 h-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-cream-800">Database</div>
                    <div className={`text-sm ${
                      systemHealth.databaseStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {systemHealth.databaseStatus}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-cream-800">Storage</div>
                    <div className={`text-sm ${
                      systemHealth.storageStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {systemHealth.storageStatus}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-orange" />
                  <div>
                    <div className="text-sm font-medium text-cream-800">Uptime</div>
                    <div className="text-sm text-cream-700">{systemHealth.uptime}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-cream-800">Memory</div>
                    <div className="text-sm text-cream-700">{systemHealth.memoryUsage?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPageNew;
