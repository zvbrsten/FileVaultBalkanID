import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@apollo/client';
import { CREATE_FOLDER } from '../api/mutations';
import SimpleUploadZone from '../components/Upload/SimpleUploadZone';
import FolderSelector from '../components/Upload/FolderSelector';
import UploadProgressModal from '../components/Upload/UploadProgressModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const UploadPageNew: React.FC = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const [createFolder] = useMutation(CREATE_FOLDER);

  const handleFilesSelected = (files: File[]) => {
    const uploadFiles: UploadFile[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadFiles(uploadFiles);
    setShowProgressModal(true);
  };

  const handleCancelUpload = () => {
    setUploadFiles([]);
    setShowProgressModal(false);
  };

  const handleClearAll = () => {
    setUploadFiles([]);
    setShowProgressModal(false);
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder({
        variables: {
          name: folderName,
          parentId: selectedFolderId
        }
      });
      console.log('Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-4xl mx-auto px-4">
        <div className="p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-3"
          >
            <h1 className="text-2xl font-medium text-cream-800">
              Upload Files
            </h1>
            <p className="text-cream-600">
              Upload your files to FileVault
            </p>
          </motion.div>

          {/* Folder Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="theme-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium text-cream-800">
                  Select or Create Folder
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-cream-600 hover:text-cream-800">
                  <i className="pi pi-folder-plus mr-2" /> New Folder
                </Button>
              </CardHeader>
              <CardContent>
                <FolderSelector
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                  onCreateFolder={handleCreateFolder}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SimpleUploadZone
              onFilesSelected={handleFilesSelected}
            />
          </motion.div>

          {/* Upload Progress Modal */}
          <UploadProgressModal
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            uploadFiles={uploadFiles}
            onCancelUpload={handleCancelUpload}
            onClearAll={handleClearAll}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadPageNew;