import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface SimpleUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
}

const SimpleUploadZone: React.FC<SimpleUploadZoneProps> = ({
  onFilesSelected,
  maxFiles = 20,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['*/*']
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('=== SIMPLE UPLOAD ZONE DEBUG ===');
    console.log('Files dropped:', acceptedFiles.length);
    acceptedFiles.forEach((file, index) => {
      console.log(`Dropped file ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
    });
    console.log('Calling onFilesSelected with:', acceptedFiles);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          className={`relative p-12 text-center transition-all duration-150 cursor-pointer ${
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
              className="w-16 h-16 bg-forest-green rounded-lg flex items-center justify-center mx-auto mb-4"
            >
              <i className="pi pi-cloud-upload text-cream-50" style={{ fontSize: '2rem' }}></i>
            </motion.div>

            <h3 className="text-xl font-medium text-cream-800 mb-2">
              {isDragActive ? 'Drop files here' : 'Upload your files'}
            </h3>
            
            <p className="text-cream-700 mb-6 max-w-md mx-auto">
              {isDragActive 
                ? 'Release to upload your files' 
                : 'Drag and drop files here, or click to browse'
              }
            </p>

            <div className="flex items-center justify-center space-x-8 text-sm text-cream-700 mb-6">
              <div className="flex items-center space-x-2">
                <i className="pi pi-shield text-orange" style={{ fontSize: '1.25rem' }}></i>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="pi pi-bolt text-orange" style={{ fontSize: '1.25rem' }}></i>
                <span>Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="pi pi-cloud text-orange" style={{ fontSize: '1.25rem' }}></i>
                <span>Cloud</span>
              </div>
            </div>

            <Button variant="default" size="lg" className="mb-4">
              <i className="pi pi-plus mr-2" style={{ fontSize: '1rem' }}></i>
              Choose Files
            </Button>

            
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleUploadZone;
