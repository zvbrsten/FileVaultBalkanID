import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { FILES_QUERY, GET_FOLDERS } from '../api/queries';
import QuotaDisplay from '../components/QuotaDisplay/QuotaDisplay';
import FolderList from '../components/FolderList/FolderList';
import FileList from '../components/FileList/FileList';
import Modal from '../components/ui/modal';
import { Button } from '../components/ui/button';

const FilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const { refetch: refetchFiles } = useQuery(FILES_QUERY, {
    pollInterval: 5000, // Auto-refresh every 5 seconds
    errorPolicy: 'all'
  });
  const { refetch: refetchFolders } = useQuery(GET_FOLDERS, {
    pollInterval: 5000, // Auto-refresh every 5 seconds
    errorPolicy: 'all'
  });
  
  // Suppress unused variable warning - refetchFolders is used for future functionality
  void refetchFolders;

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
  };

  // const handleFileShare = (fileId: string) => {
  //   // File sharing is handled by FileList component
  // };

  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between py-4 border-b border-cream-200/20">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>My Drive</h1>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center space-x-2 bg-forest-green hover:bg-forest-green-hover text-cream-50 px-4 py-2 rounded transition-colors"
            >
              <i className="pi pi-plus"></i>
              <span>New</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="py-6 space-y-6">
            {/* Storage Quota Display */}
            <div className="bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
              <div className="p-4">
                <QuotaDisplay />
              </div>
            </div>

            {/* Folders Section */}
            <div className="bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
              <div className="p-4">
                <FolderList onFileSelect={handleFileSelect} refetchFiles={refetchFiles} />
              </div>
            </div>

            {/* Root Section */}
            <div className="bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
              <div className="p-4">
                <FileList onFileSelect={handleFileSelect} refetchFiles={refetchFiles} />
              </div>
            </div>
          </div>

          {/* File Details Modal */}
          <Modal
            isOpen={!!selectedFile}
            onClose={() => setSelectedFile(null)}
            title="File Details"
            size="md"
          >
            {selectedFile && (
              <div className="space-y-4">
                <div className="space-y-2 text-cream-700">
                  <p><strong>Name:</strong> {selectedFile.originalName}</p>
                  <p><strong>Size:</strong> {selectedFile.size} bytes</p>
                  <p><strong>Type:</strong> {selectedFile.mimeType}</p>
                  <p><strong>Uploaded:</strong> {new Date(selectedFile.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;