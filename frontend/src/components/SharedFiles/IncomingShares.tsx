import React, { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { Download, User, Clock, File, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface IncomingShare {
  id: string;
  fileId: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    hash: string;
    s3Key?: string;
    uploaderId: string;
    folderId?: string;
    createdAt: string;
    updatedAt: string;
  };
  fromUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface IncomingSharesProps {
  className?: string;
}

const IncomingShares: React.FC<IncomingSharesProps> = ({ className = '' }) => {
  const { addNotification } = useNotification();
  const [shares, setShares] = useState<IncomingShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    loadIncomingShares();
  }, []);

  const loadIncomingShares = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/user-shares/incoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Failed to load incoming shares:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to load incoming shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (shareId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/user-shares/${shareId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShares(prev => prev.map(share => 
          share.id === shareId ? { ...share, isRead: true } : share
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const downloadFile = async (shareId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/user-shares/${shareId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Mark as read after download
        markAsRead(shareId);
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download the shared file.',
        duration: 4000
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group shares by sender
  const groupedShares = React.useMemo(() => {
    const groups: { [key: string]: IncomingShare[] } = {};
    shares.forEach(share => {
      const senderName = share.fromUser?.username || 'Unknown User';
      if (!groups[senderName]) {
        groups[senderName] = [];
      }
      groups[senderName].push(share);
    });
    return groups;
  }, [shares]);

  const handleSenderClick = (senderName: string) => {
    setSelectedSender(senderName);
    setIsPopupOpen(true);
  };

  const getSenderShares = () => {
    return selectedSender ? groupedShares[selectedSender] || [] : [];
  };

  if (loading) {
    return (
      <div className={`bg-white border border-cream-200 shadow-sm rounded-lg h-full flex flex-col ${className}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-cream-800 mb-1">Shared with You</h3>
              <p className="text-cream-600 text-sm">Loading...</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-forest-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className={`bg-white border border-cream-200 shadow-sm rounded-lg h-full flex flex-col ${className}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-cream-800 mb-1">Shared with You</h3>
              <p className="text-cream-600 text-sm">No shared files</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-forest-green/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <File className="w-6 h-6 text-forest-green" />
              </div>
              <h3 className="text-lg font-semibold text-cream-800 mb-2">No shared files</h3>
              <p className="text-cream-600 text-sm">
                Files shared with you will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white border border-cream-200 shadow-sm rounded-lg h-full flex flex-col ${className}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-cream-800 mb-1">Shared with You</h3>
              <p className="text-cream-600 text-sm">
                {Object.keys(groupedShares).length} sender{Object.keys(groupedShares).length !== 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-forest-green/10 text-forest-green rounded-full text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {Object.entries(groupedShares).map(([senderName, senderShares]) => {
              const unreadCount = senderShares.filter(share => !share.isRead).length;
              return (
                <div
                  key={senderName}
                  onClick={() => handleSenderClick(senderName)}
                  className={`group bg-cream-50 rounded-lg p-3 hover:bg-cream-100 transition-all duration-300 cursor-pointer ${
                    unreadCount > 0 ? 'border-l-4 border-l-forest-green' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-forest-green/10 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-forest-green" />
                      </div>
                      <div>
                        <h4 className="font-medium text-cream-800 text-sm">
                          {senderName}
                        </h4>
                        <p className="text-xs text-cream-600">
                          {senderShares.length} file{senderShares.length !== 1 ? 's' : ''}
                          {unreadCount > 0 && (
                            <span className="ml-2 text-forest-green font-medium">
                              ({unreadCount} new)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cream-500 group-hover:text-cream-700 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup Dialog */}
      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-forest-green" />
              <span>
                {getSenderShares().length === 1 
                  ? getSenderShares()[0]?.file.originalName || 'File'
                  : `${getSenderShares().length} files from ${selectedSender || 'Unknown User'}`
                }
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getSenderShares().map((share) => (
              <div
                key={share.id}
                className={`group bg-cream-50 rounded-lg p-4 hover:bg-cream-100 transition-all duration-300 ${
                  !share.isRead ? 'border-l-4 border-l-forest-green' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-forest-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5 text-forest-green" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-cream-800 truncate">
                        {share.file.originalName}
                      </h4>
                      {!share.isRead && (
                        <div className="w-2 h-2 bg-forest-green rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-cream-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(share.createdAt)}</span>
                      </div>
                      <span>{formatFileSize(share.file.size)}</span>
                    </div>
                    
                    {share.message && (
                      <p className="text-sm text-cream-600 mt-2 italic">
                        "{share.message}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(share.id, share.file.originalName)}
                      className="h-8"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    
                    {!share.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(share.id)}
                        className="h-8"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncomingShares;
