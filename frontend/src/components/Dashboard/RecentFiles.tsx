import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatBytes, formatDate, getFileIcon } from '../../lib/utils';

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  isShared?: boolean;
  downloadCount?: number;
}

interface RecentFilesProps {
  files: File[];
  onFileClick: (file: File) => void;
  onDownload: (file: File) => void;
  onShare: (file: File) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({
  files,
  onFileClick,
  onDownload,
  onShare
}) => {
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <i className="pi pi-image text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('video/')) return <i className="pi pi-video text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('audio/')) return <i className="pi pi-volume-up text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('pdf')) return <i className="pi pi-file-pdf text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <i className="pi pi-file-archive text-orange" style={{ fontSize: '1rem' }}></i>;
    return <i className="pi pi-file text-orange" style={{ fontSize: '1rem' }}></i>;
  };

  return (
        <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-cream-800 flex items-center justify-between">
          Recent Files
          <Button variant="ghost" size="sm" className="text-cream-600 hover:text-cream-800">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {files.slice(0, 5).map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="group file-item flex items-center space-x-3 p-3 cursor-pointer"
              onClick={() => onFileClick(file)}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-cream-600 group-hover:text-forest-green transition-colors">
                {getFileTypeIcon(file.mimeType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream-800 truncate group-hover:text-forest-green transition-colors">
                  {file.originalName}
                </p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-xs text-cream-600">
                    {formatBytes(file.size)}
                  </p>
                  <span className="text-xs text-cream-400">•</span>
                  <p className="text-xs text-cream-600">
                    {formatDate(file.createdAt)}
                  </p>
                  {file.isShared && (
                    <>
                      <span className="text-xs text-cream-400">•</span>
                      <Badge variant="secondary" className="text-xs bg-orange/20 text-orange">
                        Shared
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                >
                  <i className="pi pi-download" style={{ fontSize: '0.875rem' }}></i>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(file);
                  }}
                >
                  <i className="pi pi-share-alt" style={{ fontSize: '0.875rem' }}></i>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
                >
                  <i className="pi pi-ellipsis-h" style={{ fontSize: '0.875rem' }}></i>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentFiles;
