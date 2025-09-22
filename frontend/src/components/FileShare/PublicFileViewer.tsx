import React, { useState, useEffect, useCallback } from 'react';
import { Download, File, Calendar, HardDrive, AlertCircle, ExternalLink } from 'lucide-react';

interface PublicFileViewerProps {
  shareToken: string;
}

interface FileInfo {
  file: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
  share: {
    id: string;
    downloadCount: number;
    maxDownloads?: number;
    expiresAt?: string;
    isActive: boolean;
  };
}

const PublicFileViewer: React.FC<PublicFileViewerProps> = ({ shareToken }) => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchFileInfo = useCallback(async () => {
    try {
      const baseUrl = process.env.REACT_APP_GRAPHQL_URL?.replace('/query', '') || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/files/share/${shareToken}/info`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found or share link is invalid');
        }
        throw new Error('Failed to fetch file information');
      }

      const data = await response.json();
      setFileInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file information');
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchFileInfo();
  }, [shareToken, fetchFileInfo]);

  const handleDownload = async () => {
    if (!fileInfo) return;

    setDownloading(true);
    try {
      // Redirect to the download endpoint
      const baseUrl = process.env.REACT_APP_GRAPHQL_URL?.replace('/query', '') || 'http://localhost:8080';
      window.location.href = `${baseUrl}/api/files/share/${shareToken}`;
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file information...</p>
        </div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">File Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { file, share } = fileInfo;
  const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
  const isDownloadLimitReached = share.maxDownloads && share.downloadCount >= share.maxDownloads;
  const canDownload = share.isActive && !isExpired && !isDownloadLimitReached;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <ExternalLink className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Shared File</h1>
              <p className="text-blue-100">Download the file below</p>
            </div>
          </div>
        </div>

        {/* File Information */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="text-6xl">{getFileIcon(file.mimeType)}</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {file.originalName}
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(file.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4" />
                  <span>{file.mimeType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Uploaded {formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Share Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Share Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Downloads:</span>
                <span className="ml-2 font-medium">{share.downloadCount}</span>
                {share.maxDownloads && (
                  <span className="text-gray-500">/ {share.maxDownloads}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 font-medium ${canDownload ? 'text-green-600' : 'text-red-600'}`}>
                  {!share.isActive ? 'Inactive' : 
                   isExpired ? 'Expired' : 
                   isDownloadLimitReached ? 'Download Limit Reached' : 'Active'}
                </span>
              </div>
              {share.expiresAt && (
                <div className="col-span-2">
                  <span className="text-gray-500">Expires:</span>
                  <span className="ml-2 font-medium">{formatDate(share.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="text-center">
            {canDownload ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>{downloading ? 'Downloading...' : 'Download File'}</span>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">
                  {!share.isActive ? 'This share link is no longer active' :
                   isExpired ? 'This share link has expired' :
                   isDownloadLimitReached ? 'Download limit has been reached' :
                   'This file is no longer available'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-center text-sm text-gray-500">
            Powered by <span className="font-medium text-blue-600">FileVault</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicFileViewer;
