import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { 
  Download, 
  Share2, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    hash: string;
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
  onDelete
}) => {
  const [previewMode, setPreviewMode] = useState<'modal' | 'fullscreen'>('modal');
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
    if (onDelete) {
      onDelete(file.id);
    }
  };


  const toggleFullscreen = () => {
    setPreviewMode(previewMode === 'modal' ? 'fullscreen' : 'modal');
  };

  const handleImageZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setImageZoom(prev => Math.min(prev + 0.25, 3));
    } else {
      setImageZoom(prev => Math.max(prev - 0.25, 0.25));
    }
  };

  const handleImageRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const resetImageControls = () => {
    setImageZoom(1);
    setImageRotation(0);
  };

  // Reset controls when file changes
  useEffect(() => {
    resetImageControls();
    setPreviewError(null);
  }, [file.id]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-green-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-purple-500" />;
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

  const getPreviewContent = () => {
    const token = localStorage.getItem('token');
    const previewUrl = `http://localhost:8080/files/${file.id}/preview`;

    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={`${previewUrl}?token=${token}`}
            alt={file.originalName}
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            onError={() => setPreviewError('Failed to load image preview')}
          />
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{previewError}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <video
            src={`${previewUrl}?token=${token}`}
            controls
            className="w-full h-full"
            onError={() => setPreviewError('Failed to load video preview')}
          >
            Your browser does not support video preview.
          </video>
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{previewError}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <audio
            src={`${previewUrl}?token=${token}`}
            controls
            className="w-full max-w-md"
            onError={() => setPreviewError('Failed to load audio preview')}
          >
            Your browser does not support audio preview.
          </audio>
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{previewError}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={`${previewUrl}?token=${token}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={file.originalName}
            onError={() => setPreviewError('Failed to load PDF preview')}
          />
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{previewError}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For unsupported file types, show file info
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          {getFileIcon(file.mimeType)}
          <p className="text-sm text-gray-600 mt-2">Preview not available</p>
          <p className="text-xs text-gray-500">File type not supported for inline preview</p>
        </div>
      </div>
    );
  };

  const isPreviewable = () => {
    return file.mimeType.startsWith('image/') || 
           file.mimeType.startsWith('video/') || 
           file.mimeType.startsWith('audio/') || 
           file.mimeType === 'application/pdf';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${previewMode === 'fullscreen' ? 'max-w-6xl max-h-[90vh]' : 'max-w-2xl'}`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.mimeType)}
            <div>
              <DialogTitle className="text-lg font-semibold truncate max-w-xs">
                {file.originalName}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(file.size)} • {file.mimeType}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isPreviewable() && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                title={previewMode === 'modal' ? 'Fullscreen' : 'Minimize'}
              >
                {previewMode === 'modal' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Content */}
          {isPreviewable() && (
            <div className="space-y-3">
              {getPreviewContent()}
              
              {/* Image Controls */}
              {file.mimeType.startsWith('image/') && (
                <div className="flex items-center justify-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImageZoom('out')}
                    disabled={imageZoom <= 0.25}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImageZoom('in')}
                    disabled={imageZoom >= 3}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImageRotate}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImageControls}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleDownload} 
              className="flex items-center space-x-2 bg-forest-green hover:bg-forest-green-hover text-cream-50"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            
            {onShare && (
              <Button 
                variant="outline" 
                onClick={handleShare} 
                className="flex items-center space-x-2 border-forest-green text-forest-green hover:bg-forest-green hover:text-cream-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
            )}
            
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          {/* Error Message */}
          {previewError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{previewError}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;