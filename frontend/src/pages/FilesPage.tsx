import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import FileList from '../components/FileList/FileList';
import QuotaDisplay from '../components/QuotaDisplay/QuotaDisplay';

const FilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<any>(null);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">FileVault</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Storage Quota Display */}
          <div className="mb-6">
            <QuotaDisplay />
          </div>
          
          <FileList onFileSelect={handleFileSelect} />
        </div>
      </div>

      {/* File Details Modal (placeholder) */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">File Details</h3>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedFile.originalName}</p>
              <p><strong>Size:</strong> {selectedFile.size} bytes</p>
              <p><strong>Type:</strong> {selectedFile.mimeType}</p>
              <p><strong>Uploaded:</strong> {new Date(selectedFile.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
