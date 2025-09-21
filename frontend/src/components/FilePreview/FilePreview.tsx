import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
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
  X
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.mimeType)}
            <div>
              <DialogTitle className="text-lg font-semibold truncate max-w-xs">
                {file.originalName}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
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
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Open full preview in new tab
                const previewUrl = `http://localhost:8080/files/${file.id}/preview`;
                window.open(previewUrl, '_blank');
              }} 
              className="flex items-center space-x-2 border-orange text-orange hover:bg-orange hover:text-cream-50"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </Button>
            
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;