import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Share2, 
  Users, 
  Link, 
  Copy, 
  Check,
  Download,
  Eye,
  File
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface ShareModalProps {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    hash: string;
    uploaderId: string;
    folderId?: string;
    s3Key?: string;
    createdAt: string;
    updatedAt: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ file, isOpen, onClose }) => {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'public' | 'user'>('public');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicShareUrl, setPublicShareUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Load Users',
        message: 'Could not load user list for sharing.',
        duration: 4000
      });
    }
  }, [addNotification]);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const createPublicShare = async () => {
    setIsLoading(true);
    try {
      // Generate public share URL with proper filename headers
      // Use environment variable or fallback to current origin
      const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const publicUrl = `${baseUrl}/public/${file.id}`;
      
      setPublicShareUrl(publicUrl);
      addNotification({
        type: 'success',
        title: 'Public Link Created!',
        message: 'Public link generated with proper filename handling.',
        duration: 4000
      });
    } catch (error) {
      console.error('Failed to create public share:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Create Public Link',
        message: 'Could not generate a public link for this file.',
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareWithUser = async () => {
    if (!selectedUser) {
      addNotification({
        type: 'error',
        title: 'No User Selected',
        message: 'Please select a user to share the file with.',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/files/${file.id}/share/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: selectedUser,
          message: shareMessage || null
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'File Shared!',
          message: 'File has been shared with the selected user.',
          duration: 4000
        });
        setSelectedUser('');
        setShareMessage('');
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share file');
      }
    } catch (error) {
      console.error('Failed to share with user:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Share File',
        message: error instanceof Error ? error.message : 'Could not share file with user.',
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Link copied to clipboard.',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy link to clipboard.',
        duration: 3000
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share "{file.originalName}"</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-forest-green/10 rounded-lg flex items-center justify-center">
                <File className="w-6 h-6 text-forest-green" />
              </div>
              <div>
                <h3 className="font-medium text-cream-800">{file.originalName}</h3>
                <p className="text-sm text-cream-600">
                  {formatFileSize(file.size)} • {file.mimeType}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-cream-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'public'
                  ? 'bg-white text-forest-green shadow-sm'
                  : 'text-cream-600 hover:text-cream-800'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>Public Link</span>
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'user'
                  ? 'bg-white text-forest-green shadow-sm'
                  : 'text-cream-600 hover:text-cream-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Share with User</span>
            </button>
          </div>

          {/* Public Link Tab */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Link className="w-12 h-12 text-forest-green mx-auto mb-4" />
                <h3 className="text-lg font-medium text-cream-800 mb-2">Create Public Link</h3>
                <p className="text-cream-600 mb-6">
                  Generate a link that anyone can use to access this file
                </p>
                
                {publicShareUrl ? (
                  <div className="space-y-4">
                    <div className="bg-cream-50 border border-cream-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={publicShareUrl}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(publicShareUrl)}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm text-cream-600">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Anyone with link can view</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>Download enabled</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={createPublicShare}
                    disabled={isLoading}
                    className="bg-forest-green hover:bg-forest-green-hover text-cream-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Public Link'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* User Share Tab */}
          {activeTab === 'user' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <Input
                  id="user-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or email..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="user-select">Select User</Label>
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full mt-1 p-2 border border-cream-200 rounded-lg bg-white focus:ring-2 focus:ring-forest-green focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
                {filteredUsers.length === 0 && searchQuery.trim() !== '' && (
                  <p className="text-sm text-cream-600 mt-1">No users found matching your search.</p>
                )}
              </div>

              <div>
                <Label htmlFor="share-message">Message (Optional)</Label>
                <Input
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message for the recipient..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={shareWithUser}
                  disabled={isLoading || !selectedUser}
                  className="bg-forest-green hover:bg-forest-green-hover text-cream-50"
                >
                  {isLoading ? 'Sharing...' : 'Share File'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
