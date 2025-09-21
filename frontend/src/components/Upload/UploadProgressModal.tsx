import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/modal';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { formatBytes } from '../../lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadFiles: UploadFile[];
  onCancelUpload: (fileId: string) => void;
  onClearAll: () => void;
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  onClose,
  uploadFiles,
  onCancelUpload,
  onClearAll
}) => {
  console.log('=== UPLOAD PROGRESS MODAL DEBUG ===');
  console.log('Modal isOpen:', isOpen);
  console.log('Upload files:', uploadFiles);
  console.log('Number of files:', uploadFiles.length);
  const getFileIcon = (file: File) => {
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) return <i className="pi pi-image text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('video/')) return <i className="pi pi-video text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('audio/')) return <i className="pi pi-volume-up text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('pdf')) return <i className="pi pi-file-pdf text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <i className="pi pi-file-archive text-orange" style={{ fontSize: '1rem' }}></i>;
    return <i className="pi pi-file text-orange" style={{ fontSize: '1rem' }}></i>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <i className="pi pi-spin pi-spinner text-forest-green" style={{ fontSize: '1rem' }}></i>;
      case 'completed':
        return <i className="pi pi-check-circle text-forest-green" style={{ fontSize: '1rem' }}></i>;
      case 'error':
        return <i className="pi pi-times-circle text-red-500" style={{ fontSize: '1rem' }}></i>;
      default:
        return null;
    }
  };

  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading').length;

  const allCompleted = completedFiles === totalFiles;
  const hasErrors = errorFiles > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Progress"
      size="lg"
      showCloseButton={allCompleted || hasErrors}
      closeOnBackdropClick={false}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-cream-100 rounded-lg">
            <div className="text-lg font-medium text-cream-800">{totalFiles}</div>
            <div className="text-sm text-cream-600">Total Files</div>
          </div>
          <div className="text-center p-3 bg-forest-green/10 rounded-lg">
            <div className="text-lg font-medium text-forest-green">{completedFiles}</div>
            <div className="text-sm text-cream-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-orange/10 rounded-lg">
            <div className="text-lg font-medium text-orange">{uploadingFiles}</div>
            <div className="text-sm text-cream-600">Uploading</div>
          </div>
          <div className="text-center p-3 bg-red-100 rounded-lg">
            <div className="text-lg font-medium text-red-600">{errorFiles}</div>
            <div className="text-sm text-cream-600">Errors</div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {uploadFiles.map((uploadFile, index) => (
            <motion.div
              key={uploadFile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center space-x-3 p-3 rounded bg-cream-100 border border-cream-200"
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
                    {uploadFile.status === 'uploading' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
                        onClick={() => onCancelUpload(uploadFile.id)}
                      >
                        <i className="pi pi-times" style={{ fontSize: '0.75rem' }}></i>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-sm text-cream-600 mb-2">
                  <span>{formatBytes(uploadFile.file.size)}</span>
                </div>

                {uploadFile.status === 'uploading' && (
                  <div>
                    <Progress value={uploadFile.progress} className="h-2" />
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

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-cream-200">
          <Button
            variant="outline"
            onClick={onClearAll}
            disabled={uploadingFiles > 0}
          >
            Clear All
          </Button>
          
          {(allCompleted || hasErrors) && (
            <Button onClick={onClose}>
              {hasErrors ? 'Close' : 'Done'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadProgressModal;
