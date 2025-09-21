import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  CheckCircle,
  AlertCircle,
  Cloud,
  Zap,
  Shield
} from 'lucide-react';
import { formatBytes } from '../../lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  isDuplicate?: boolean;
}

interface ModernUploadZoneProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

const ModernUploadZone: React.FC<ModernUploadZoneProps> = ({
  onUpload,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['*/*'],
  className = ""
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDropRejected: (fileRejections) => {
      console.log('Files rejected:', fileRejections);
    }
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFileTypeColor = (file: File) => {
    if (file.type.startsWith('image/')) return 'from-green-500 to-emerald-500';
    if (file.type.startsWith('video/')) return 'from-purple-500 to-pink-500';
    if (file.type.startsWith('audio/')) return 'from-blue-500 to-cyan-500';
    if (file.type.includes('pdf')) return 'from-red-500 to-orange-500';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-slate-500';
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-white/30 rounded-full" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-cream-50 border border-cream-200 overflow-hidden">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`relative p-8 text-center transition-all duration-150 cursor-pointer ${
                isDragActive
                  ? 'bg-cream-100 scale-[1.02]'
                  : 'hover:bg-cream-100'
              } ${isDragReject ? 'bg-red-50 border-red-200' : ''}`}
            >
              <input {...getInputProps()} />
              

              <div className="relative z-10">
                <motion.div
                  animate={{ 
                    y: isDragActive ? [-2, 2, -2] : 0,
                    rotate: isDragActive ? [-1, 1, -1] : 0
                  }}
                  transition={{ duration: 1, repeat: isDragActive ? Infinity : 0 }}
                  className="w-12 h-12 bg-forest-green rounded flex items-center justify-center mx-auto mb-3"
                >
                  <i className="pi pi-upload text-cream-50" style={{ fontSize: '1.5rem' }}></i>
                </motion.div>

                <h3 className="text-lg font-medium text-cream-800 mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload your files'}
                </h3>
                
                <p className="text-cream-600 mb-4 max-w-md mx-auto">
                  {isDragActive 
                    ? 'Release to upload your files' 
                    : 'Drag and drop files here, or click to browse'
                  }
                </p>

                <div className="flex items-center justify-center space-x-6 text-sm text-cream-600">
                  <div className="flex items-center space-x-2">
                    <i className="pi pi-shield text-orange" style={{ fontSize: '1rem' }}></i>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="pi pi-bolt text-orange" style={{ fontSize: '1rem' }}></i>
                    <span>Fast</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="pi pi-cloud text-orange" style={{ fontSize: '1rem' }}></i>
                    <span>Cloud</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Button variant="default" size="lg">
                    Choose Files
                  </Button>
                </div>

                <p className="text-xs text-cream-500 mt-3">
                  Max {maxFiles} files, {formatBytes(maxSize)} each
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-cream-800">
                    Uploading Files ({uploadFiles.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadFiles([])}
                    className="text-cream-600 hover:text-cream-800"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2">
                  {uploadFiles.map((uploadFile, index) => (
                    <motion.div
                      key={uploadFile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center space-x-3 p-3 rounded bg-cream-100"
                    >
                      <div className="w-8 h-8 rounded bg-cream-200 flex items-center justify-center text-cream-600">
                        {getFileIcon(uploadFile.file)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-cream-800 font-medium truncate">
                            {uploadFile.file.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(uploadFile.status)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
                              onClick={() => removeFile(uploadFile.id)}
                            >
                              <i className="pi pi-times" style={{ fontSize: '0.75rem' }}></i>
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-sm text-cream-600">
                          <span>{formatBytes(uploadFile.file.size)}</span>
                          {uploadFile.isDuplicate && (
                            <Badge variant="secondary" className="text-xs bg-orange/20 text-orange">
                              Duplicate
                            </Badge>
                          )}
                        </div>

                        {uploadFile.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={uploadFile.progress} className="h-1.5" />
                            <p className="text-xs text-cream-600 mt-1">
                              {uploadFile.progress}% uploaded
                            </p>
                          </div>
                        )}

                        {uploadFile.status === 'error' && uploadFile.error && (
                          <p className="text-xs text-red-500 mt-1">
                            {uploadFile.error}
                          </p>
                        )}

                        {uploadFile.status === 'completed' && (
                          <p className="text-xs text-forest-green mt-1">
                            Upload completed successfully
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernUploadZone;
