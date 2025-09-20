import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Download, 
  Share2, 
  Trash2, 
  Eye, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  HardDrive
} from 'lucide-react';
// import { cn } from '../../lib/utils';

interface FilePreviewProps {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    hash: string;
    isDuplicate: boolean;
    uploaderId: string;
    folderId?: string;
    createdAt: string;
    updatedAt: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (fileId: string, filename: string) => void;
  onShare?: (file: any) => void;
  onDelete?: (fileId: string) => void;
  files?: any[]; // For navigation between files
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onDelete,
  files = [],
  currentIndex = 0,
  onNavigate
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      generatePreview();
    }
  }, [isOpen, file]);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8080/files/${file.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file.id, file.originalName);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(file);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this file?')) {
      onDelete(file.id);
      onClose();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-8 h-8 text-yellow-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const canPreview = () => {
    return file.mimeType.startsWith('image/') || 
           file.mimeType === 'application/pdf' ||
           file.mimeType.startsWith('text/');
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <Eye className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (!canPreview()) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          {getFileIcon(file.mimeType)}
          <p className="text-lg font-medium mt-4">Preview not supported</p>
          <p className="text-sm">This file type cannot be previewed</p>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg overflow-hidden">
          <img 
            src={previewUrl} 
            alt={file.originalName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="h-96 bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 rounded-lg"
            title={file.originalName}
          />
        </div>
      );
    }

    if (file.mimeType.startsWith('text/')) {
      return (
        <div className="h-96 bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 rounded-lg"
            title={file.originalName}
          />
        </div>
      );
    }

    return null;
  };

  const hasNavigation = files.length > 1 && onNavigate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.mimeType)}
            <div>
              <DialogTitle className="text-lg font-semibold truncate max-w-md">
                {file.originalName}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {file.mimeType}
                </Badge>
                {file.isDuplicate && (
                  <Badge variant="outline" className="text-xs">
                    Duplicate
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasNavigation && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {files.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(currentIndex + 1)}
                  disabled={currentIndex === files.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardContent className="p-6">
              {renderPreview()}
            </CardContent>
          </Card>

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  File Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{file.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hash:</span>
                    <span className="font-mono text-xs truncate max-w-32">
                      {file.hash.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Upload Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modified:</span>
                    <span>{formatDate(file.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={file.isDuplicate ? "secondary" : "default"}>
                      {file.isDuplicate ? "Duplicate" : "Original"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
              {onShare && (
                <Button variant="outline" onClick={handleShare} className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              )}
            </div>
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete} className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;
