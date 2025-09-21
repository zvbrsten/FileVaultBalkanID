import React, { useState, useEffect } from 'react';
import { Users, FileText, HardDrive, TrendingUp, Activity, Wifi, WifiOff } from 'lucide-react';
import websocketDispatcher from '../utils/websocketDispatcher';

interface RealtimeAdminStatsProps {
  initialStats?: {
    totalUsers: number;
    totalFiles: number;
    totalStorage: number;
    uniqueFiles: number;
    duplicateFiles: number;
    storageEfficiency: number;
    activeUsers: number;
    newUsersToday: number;
    deduplicationStats: DeduplicationStats;
  };
  className?: string;
}

interface DeduplicationStats {
  totalFileRecords: number;
  uniqueFileHashes: number;
  duplicateRecords: number;
  storageSaved: number;
  storageSavedPercent: number;
  costSavingsUSD: number;
}

interface SystemStatsUpdate {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  uniqueFiles: number;
  duplicateFiles: number;
  storageEfficiency: number;
  activeUsers: number;
  newUsersToday: number;
  deduplicationStats: DeduplicationStats;
  timestamp: string;
}

const RealtimeAdminStats: React.FC<RealtimeAdminStatsProps> = ({
  initialStats,
  className = ''
}) => {
  const [stats, setStats] = useState(initialStats || {
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    uniqueFiles: 0,
    duplicateFiles: 0,
    storageEfficiency: 0,
    activeUsers: 0,
    newUsersToday: 0,
    deduplicationStats: {
      totalFileRecords: 0,
      uniqueFileHashes: 0,
      duplicateRecords: 0,
      storageSaved: 0,
      storageSavedPercent: 0,
      costSavingsUSD: 0
    }
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Listen for system stats updates
    const handleSystemStatsUpdate = (data: SystemStatsUpdate) => {
      setStats(data);
      setLastUpdate(new Date(data.timestamp));
    };

    // Listen for connection status updates
    const handleConnectionStatus = (data: { status: string }) => {
      setIsConnected(data.status === 'connected');
    };

    // Add event listeners
    websocketDispatcher.addEventListener('system_stats_update', handleSystemStatsUpdate);
    websocketDispatcher.addEventListener('connection_status', handleConnectionStatus);

    return () => {
      websocketDispatcher.removeEventListener('system_stats_update', handleSystemStatsUpdate);
      websocketDispatcher.removeEventListener('connection_status', handleConnectionStatus);
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Real-time System Stats</h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {formatLastUpdate()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <HardDrive className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.totalStorage)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{stats.storageEfficiency.toFixed(1)}%</p>
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
              <p className="text-xl font-bold text-gray-900">{stats.uniqueFiles}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duplicate Files</p>
              <p className="text-xl font-bold text-gray-900">{stats.duplicateFiles}</p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Deduplication Metrics */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow-sm border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          Storage Deduplication Savings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-500" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Duplicate Records</p>
                <p className="text-lg font-bold text-gray-900">{stats.deduplicationStats.duplicateRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <HardDrive className="w-6 h-6 text-green-500" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Storage Saved</p>
                <p className="text-lg font-bold text-gray-900">{formatBytes(stats.deduplicationStats.storageSaved)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Efficiency</p>
                <p className="text-lg font-bold text-gray-900">{stats.deduplicationStats.storageSavedPercent.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-orange-500" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Cost Savings</p>
                <p className="text-lg font-bold text-gray-900">${stats.deduplicationStats.costSavingsUSD.toFixed(2)}/mo</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>{stats.deduplicationStats.duplicateRecords}</strong> duplicate file records detected across 
            <strong> {stats.deduplicationStats.totalFileRecords}</strong> total files, saving 
            <strong> {formatBytes(stats.deduplicationStats.storageSaved)}</strong> in storage costs.
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              <strong>{stats.newUsersToday}</strong> new users registered today
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              <strong>{stats.activeUsers}</strong> active users in the last 30 days
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Storage efficiency at <strong>{stats.storageEfficiency.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAdminStats;
