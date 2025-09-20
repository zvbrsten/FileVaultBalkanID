import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_FOLDERS, FILES_QUERY } from '../api/queries';
import FileList from '../components/FileList/FileList';
import FolderList from '../components/FolderList/FolderList';
import QuotaDisplay from '../components/QuotaDisplay/QuotaDisplay';
import GlareHover from '../components/GlareHover';

const FilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Set up queries with polling for real-time updates
  const { data: foldersData, refetch: refetchFolders } = useQuery(GET_FOLDERS, {
    pollInterval: 5000, // Poll every 5 seconds
    errorPolicy: 'all'
  });
  
  const { data: filesData, refetch: refetchFiles } = useQuery(FILES_QUERY, {
    variables: { limit: 100, offset: 0 },
    pollInterval: 5000, // Poll every 5 seconds
    errorPolicy: 'all'
  });

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    // You can implement file preview or details modal here
  };

  // File operations are handled by FileList component
  // These handlers are placeholders for future enhancements
  // const handleFileDelete = (fileId: string) => {
  //   // File deletion is handled by FileList component
  // };

  // const handleFileDownload = (fileId: string) => {
  //   // File download is handled by FileList component
  // };

  // const handleFileShare = (fileId: string) => {
  //   // File sharing is handled by FileList component
  // };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground animate-fade-in">FileVault</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-all duration-300 hover-lift hover-glow shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Storage Quota Display */}
          <GlareHover
            className="animate-fade-in"
            background="rgba(255, 255, 255, 0.05)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="0.5rem"
            glareColor="#ffffff"
            glareOpacity={0.1}
            glareAngle={-30}
            glareSize={300}
            transitionDuration={800}
          >
            <div className="p-6">
              <QuotaDisplay />
            </div>
          </GlareHover>
          
          {/* Folders Section */}
          <GlareHover
            className="animate-slide-up"
            background="rgba(255, 255, 255, 0.05)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="0.5rem"
            glareColor="#ffffff"
            glareOpacity={0.1}
            glareAngle={-30}
            glareSize={300}
            transitionDuration={800}
          >
            <div className="p-6">
              <FolderList onFileSelect={handleFileSelect} refetchFiles={refetchFiles} />
            </div>
          </GlareHover>

          {/* Files Without Folders Section */}
          <GlareHover
            className="animate-slide-up"
            background="rgba(255, 255, 255, 0.05)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="0.5rem"
            glareColor="#ffffff"
            glareOpacity={0.1}
            glareAngle={-30}
            glareSize={300}
            transitionDuration={800}
          >
            <div className="p-6">
              <FileList onFileSelect={handleFileSelect} />
            </div>
          </GlareHover>
        </div>
      </div>

      {/* File Details Modal (placeholder) */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
              <h3 className="text-lg font-semibold mb-4 text-foreground">File Details</h3>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Name:</strong> {selectedFile.originalName}</p>
                <p><strong>Size:</strong> {selectedFile.size} bytes</p>
                <p><strong>Type:</strong> {selectedFile.mimeType}</p>
                <p><strong>Uploaded:</strong> {new Date(selectedFile.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg transition-all duration-300 hover-lift"
                >
                  Close
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
