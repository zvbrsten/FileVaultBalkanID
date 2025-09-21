import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Share2,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  Copy,
  Star,
  Calendar,
  HardDrive,
  Users
} from 'lucide-react';
import { formatBytes, formatDate, getFileIcon } from '../../lib/utils';

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  downloadCount?: number;
  isDuplicate?: boolean;
}

interface ModernFileListProps {
  files: File[];
  onFileClick: (file: File) => void;
  onDownload: (file: File) => void;
  onShare: (file: File) => void;
  onDelete: (file: File) => void;
  onEdit?: (file: File) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const ModernFileList: React.FC<ModernFileListProps> = ({
  files,
  onFileClick,
  onDownload,
  onShare,
  onDelete,
  onEdit,
  viewMode = 'grid',
  onViewModeChange
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'from-green-500 to-emerald-500';
    if (mimeType.startsWith('video/')) return 'from-purple-500 to-pink-500';
    if (mimeType.startsWith('audio/')) return 'from-blue-500 to-cyan-500';
    if (mimeType.includes('pdf')) return 'from-red-500 to-orange-500';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-slate-500';
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(files.map(file => file.id));
  };

  const handleDeselectAll = () => {
    setSelectedFiles([]);
  };

  const FileCard: React.FC<{ file: File; index: number }> = ({ file, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl hover:from-white/20 hover:to-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getFileTypeColor(file.mimeType)} flex items-center justify-center text-white shadow-lg`}>
                {getFileTypeIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-semibold truncate group-hover:text-blue-600 transition-colors">
                  {file.originalName}
                </h3>
                <p className="text-gray-600 text-sm">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onFileClick(file)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(file)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(file)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(file)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(file)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(file.createdAt)}</span>
              </div>
              {file.isShared && (
                <Badge variant="info" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Shared
                </Badge>
              )}
            </div>

            {file.isDuplicate && (
              <Badge variant="warning" className="text-xs">
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Badge>
            )}

            {file.downloadCount && file.downloadCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <Download className="w-4 h-4" />
                <span>{file.downloadCount} downloads</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const FileListItem: React.FC<{ file: File; index: number }> = ({ file, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-r from-white/5 to-white/5 backdrop-blur-xl">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getFileTypeColor(file.mimeType)} flex items-center justify-center text-white shadow-lg`}>
          {getFileTypeIcon(file.mimeType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-medium truncate group-hover:text-blue-600 transition-colors">
            {file.originalName}
          </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.createdAt)}</span>
            {file.isShared && (
              <>
                <span>•</span>
                <Badge variant="info" className="text-xs">
                  Shared
                </Badge>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => onDownload(file)}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => onShare(file)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onFileClick(file)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(file)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(file)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(file)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(file)} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Files ({files.length})
          </h2>
          {selectedFiles.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selectedFiles.length} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedFiles.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="text-gray-600 hover:text-gray-900"
              >
                Deselect All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-gray-600 hover:text-gray-900"
              >
                Select All
              </Button>
            </>
          )}
          
          {onViewModeChange && (
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="text-gray-900"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="text-gray-900"
              >
                List
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Files */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {files.map((file, index) => (
              <FileCard key={file.id} file={file} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <FileListItem key={file.id} file={file} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-600 mb-6">Upload your first file to get started</p>
          <Button variant="gradient" size="lg">
            Upload Files
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ModernFileList;
