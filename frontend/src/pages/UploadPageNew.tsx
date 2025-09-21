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
    console.log('=== UPLOAD DEBUG: Files selected ===');
    console.log('Number of files:', files.length);
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });

    const uploadFiles: UploadFile[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    console.log('Upload files array created:', uploadFiles);
    setUploadFiles(uploadFiles);
    setShowProgressModal(true);
    console.log('Progress modal should be shown now');
    
    // Start uploading files
    uploadFiles.forEach((uploadFile) => {
      uploadFileToServer(uploadFile);
    });
  };

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    console.log('=== UPLOAD DEBUG: Starting upload ===');
    console.log('Uploading file:', uploadFile.file.name);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        updateUploadFileStatus(uploadFile.id, 'error', 0, 'No authentication token');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      if (selectedFolderId) {
        formData.append('folderId', selectedFolderId);
      }

      console.log('FormData created, sending request to:', 'http://localhost:8080/api/upload');
      console.log('Folder ID:', selectedFolderId);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          console.log(`Upload progress for ${uploadFile.file.name}: ${progress}%`);
          updateUploadFileStatus(uploadFile.id, 'uploading', progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log(`Upload completed for ${uploadFile.file.name}`);
          updateUploadFileStatus(uploadFile.id, 'completed', 100);
        } else {
          console.error(`Upload failed for ${uploadFile.file.name}:`, xhr.status, xhr.responseText);
          updateUploadFileStatus(uploadFile.id, 'error', 0, `Upload failed: ${xhr.statusText}`);
        }
      });

      xhr.addEventListener('error', () => {
        console.error(`Upload error for ${uploadFile.file.name}:`, xhr.statusText);
        updateUploadFileStatus(uploadFile.id, 'error', 0, `Upload error: ${xhr.statusText}`);
      });

      xhr.open('POST', 'http://localhost:8080/api/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      updateUploadFileStatus(uploadFile.id, 'error', 0, `Upload error: ${error}`);
    }
  };

  const updateUploadFileStatus = (fileId: string, status: 'uploading' | 'completed' | 'error', progress: number, error?: string) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, error }
        : file
    ));
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
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Upload Files
            </h1>
            <p className="text-cream-700">
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
                <Button variant="ghost" size="sm" className="text-cream-700 hover:text-cream-800">
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