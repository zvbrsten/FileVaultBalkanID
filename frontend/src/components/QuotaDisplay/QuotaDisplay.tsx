import React from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_QUOTA } from '../../api/queries';

// interface FileStats {
//   totalFiles: number;
//   uniqueFiles: number;
//   totalSize: number;
//   filesByMimeType: Array<{
//     mimeType: string;
//     count: number;
//   }>;
// }

const QuotaDisplay: React.FC = () => {
  const { data, loading, error } = useQuery(GET_QUOTA, {
    errorPolicy: 'all',
  });

  const quotaInfo = data?.fileStats;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Loading storage info...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!quotaInfo) {
    return null;
  }

  // Calculate usage percentage (assuming 10MB quota from env.example)
  const quotaBytes = 10 * 1024 * 1024; // 10MB in bytes
  const usagePercentage = (quotaInfo.totalSize / quotaBytes) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage >= 100;

  return (
    <div className={`border rounded-lg p-4 ${
      isOverLimit ? 'bg-red-50 border-red-200' : 
      isNearLimit ? 'bg-yellow-50 border-yellow-200' : 
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HardDrive className={`w-5 h-5 ${
            isOverLimit ? 'text-red-500' : 
            isNearLimit ? 'text-yellow-500' : 
            'text-gray-500'
          }`} />
          <span className="text-sm font-medium text-gray-900">Storage Usage</span>
        </div>
        <span className={`text-sm font-medium ${
          isOverLimit ? 'text-red-700' : 
          isNearLimit ? 'text-yellow-700' : 
          'text-gray-700'
        }`}>
          {usagePercentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isOverLimit ? 'bg-red-500' : 
            isNearLimit ? 'bg-yellow-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      {/* Usage Details */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Used:</span>
          <span>{formatBytes(quotaInfo.totalSize)}</span>
        </div>
        <div className="flex justify-between">
          <span>Available:</span>
          <span>{formatBytes(quotaBytes - quotaInfo.totalSize)}</span>
        </div>
        <div className="flex justify-between">
          <span>Files:</span>
          <span>{quotaInfo.totalFiles} ({quotaInfo.uniqueFiles} unique)</span>
        </div>
      </div>

      {/* Warning Messages */}
      {isOverLimit && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Storage quota exceeded! Please delete some files.</span>
          </div>
        </div>
      )}
      
      {isNearLimit && !isOverLimit && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Storage quota almost full. Consider deleting old files.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;

