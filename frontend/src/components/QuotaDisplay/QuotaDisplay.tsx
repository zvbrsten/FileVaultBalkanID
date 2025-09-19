import React, { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface QuotaInfo {
  used_bytes: number;
  quota_bytes: number;
  remaining_bytes: number;
  usage_percentage: number;
  quota_mb: number;
}

const QuotaDisplay: React.FC = () => {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotaInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in first');
        return;
      }

      const response = await fetch('http://localhost:8080/quota', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quota info: ${response.status}`);
      }

      const data = await response.json();
      setQuotaInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaInfo();
  }, []);

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
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!quotaInfo) {
    return null;
  }

  const isNearLimit = quotaInfo.usage_percentage > 80;
  const isOverLimit = quotaInfo.usage_percentage >= 100;

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
          {quotaInfo.usage_percentage.toFixed(1)}%
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
          style={{ width: `${Math.min(quotaInfo.usage_percentage, 100)}%` }}
        />
      </div>

      {/* Usage Details */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Used:</span>
          <span>{formatBytes(quotaInfo.used_bytes)}</span>
        </div>
        <div className="flex justify-between">
          <span>Available:</span>
          <span>{formatBytes(quotaInfo.remaining_bytes)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total:</span>
          <span>{quotaInfo.quota_mb} MB</span>
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

