import React, { useState } from 'react';
import { X, Share2, Copy, ExternalLink, Calendar, Download } from 'lucide-react';
import RealtimeDownloadCount from '../RealtimeDownloadCount';

interface FileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
}

interface FileShare {
  id: string;
  shareToken: string;
  shareUrl: string;
  isActive: boolean;
  expiresAt?: string;
  downloadCount: number;
  maxDownloads?: number;
  createdAt: string;
}

const FileShareModal: React.FC<FileShareModalProps> = ({ isOpen, onClose, file }) => {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createShare = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const variables: any = {
        fileId: file.id
      };

      if (expiresAt) {
        variables.expiresAt = new Date(expiresAt).toISOString();
      }

      if (maxDownloads && maxDownloads > 0) {
        variables.maxDownloads = maxDownloads;
      }

      const response = await fetch(process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8080/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation CreateFileShare($fileId: ID!, $expiresAt: String, $maxDownloads: Int) {
              createFileShare(fileId: $fileId, expiresAt: $expiresAt, maxDownloads: $maxDownloads) {
                id
                shareToken
                shareUrl
                isActive
                expiresAt
                downloadCount
                maxDownloads
                createdAt
              }
            }
          `,
          variables
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const newShare = result.data.createFileShare;
      if (!newShare) {
        throw new Error('Failed to create file share - no data returned');
      }
      
      setShares(prev => [newShare, ...prev]);
      
      // Reset form
      setExpiresAt('');
      setMaxDownloads(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8080/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation DeleteFileShare($shareId: ID!) {
              deleteFileShare(shareId: $shareId)
            }
          `,
          variables: { shareId }
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setShares(prev => prev.filter(share => share.id !== shareId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Share File</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* File Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {file.originalName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.mimeType}
              </p>
            </div>
          </div>
        </div>

        {/* Create Share Form */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium mb-4">Create New Share</h3>
          
          <div className="space-y-4">
            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Downloads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Download className="h-4 w-4 inline mr-2" />
                Maximum Downloads (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={maxDownloads || ''}
                onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={createShare}
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>
        </div>

        {/* Existing Shares */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Existing Shares</h3>
          
          {shares.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shares created yet</p>
              <p className="text-sm">Create a share link above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.filter(share => share && share.id).map((share) => (
                <div key={share.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${share.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">
                        {share.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteShare(share.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Share URL */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Share URL
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={share.shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(share.shareUrl)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Share Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Downloads:</span>
                        <RealtimeDownloadCount
                          shareId={share.id}
                          initialCount={share.downloadCount}
                          className="ml-2"
                        />
                        {share.maxDownloads && (
                          <span className="text-gray-500">/ {share.maxDownloads}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(share.createdAt)}</span>
                      </div>
                      {share.expiresAt && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Expires:</span>
                          <span className="ml-2 font-medium">{formatDate(share.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileShareModal;
