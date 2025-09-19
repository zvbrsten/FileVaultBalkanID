import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FileText, HardDrive, Copy, BarChart3, Loader2 } from 'lucide-react';

interface FileStatsData {
  totalFiles: number;
  uniqueFiles: number;
  totalSize: number;
  filesByMimeType: Array<{
    mimeType: string;
    count: number;
  }>;
}

const FileStats: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<FileStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query {
              fileStats {
                totalFiles
                uniqueFiles
                totalSize
                filesByMimeType {
                  mimeType
                  count
                }
              }
            }
          `,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (data.data && data.data.fileStats) {
        setStats(data.data.fileStats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load file statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchStats();
    }
  }, [user, authLoading, fetchStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMimeTypeCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDFs';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'Documents';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheets';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentations';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'Archives';
    if (mimeType.includes('javascript') || mimeType.includes('python') || mimeType.includes('code')) return 'Code';
    return 'Other';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Images': return <FileText className="w-4 h-4 text-green-500" />;
      case 'Videos': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'Audio': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'PDFs': return <FileText className="w-4 h-4 text-red-500" />;
      case 'Documents': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'Spreadsheets': return <FileText className="w-4 h-4 text-green-600" />;
      case 'Presentations': return <FileText className="w-4 h-4 text-pink-500" />;
      case 'Archives': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'Code': return <FileText className="w-4 h-4 text-indigo-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg shadow-sm">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const duplicateCount = stats.totalFiles - stats.uniqueFiles;
  const duplicatePercentage = stats.totalFiles > 0 ? (duplicateCount / stats.totalFiles) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">File Statistics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Files</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalFiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <HardDrive className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Unique Files</p>
                <p className="text-2xl font-bold text-green-900">{stats.uniqueFiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Copy className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Duplicates</p>
                <p className="text-2xl font-bold text-yellow-900">{duplicateCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <HardDrive className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Total Size</p>
                <p className="text-2xl font-bold text-purple-900">{formatBytes(stats.totalSize)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Percentage */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Storage Efficiency</span>
            <span className="text-sm text-gray-600">{duplicatePercentage.toFixed(1)}% duplicates</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: `${Math.min(duplicatePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {duplicateCount} duplicate files saved {formatBytes(stats.totalSize * (duplicatePercentage / 100))} of storage space
          </p>
        </div>
      </div>

      {/* Files by Type */}
      {stats.filesByMimeType && stats.filesByMimeType.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Files by Type</h3>
          <div className="space-y-3">
            {stats.filesByMimeType.slice(0, 10).map((item, index) => {
              const category = getMimeTypeCategory(item.mimeType);
              const percentage = stats.totalFiles > 0 ? (item.count / stats.totalFiles) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{category}</p>
                      <p className="text-xs text-gray-500">{item.mimeType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileStats;
