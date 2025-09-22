import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { useQuery, useMutation } from '@apollo/client';
import { GET_FOLDERS, CREATE_FOLDER } from '../api/queries';
import RealtimeUploadProgressList from '../components/RealtimeUploadProgressList';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const UploadPage: React.FC = () => {
  useAuth();
  const { addNotification } = useNotification();
  const token = localStorage.getItem('token');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // GraphQL queries and mutations
  const { data: foldersData, refetch: refetchFolders } = useQuery(GET_FOLDERS);
  const [createFolder] = useMutation(CREATE_FOLDER);

  const API_URL = process.env.REACT_APP_GRAPHQL_URL?.replace('/query', '') || 'http://localhost:8080';
  
  // Folder management functions
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder({
        variables: {
          name: newFolderName.trim(),
          parentId: null // Root folder for now
        }
      });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Folder Created!',
        message: `Folder "${newFolderName.trim()}" has been created successfully`,
        duration: 3000
      });
      
      setNewFolderName('');
      setShowCreateFolder(false);
      refetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Failed to Create Folder',
        message: `Could not create folder "${newFolderName.trim()}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    }
  };
  
  const folders = foldersData?.folders || [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Add folder_id if selected
    if (selectedFolderId) {
      formData.append('folder_id', selectedFolderId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => 
            prev.map(item => 
              item.file === file 
                ? { ...item, progress }
                : item
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadProgress(prev => 
            prev.map(item => 
              item.file === file 
                ? { ...item, status: 'completed', progress: 100 }
                : item
            )
          );
          
          // Show success notification
          const folderName = foldersData?.folders?.find((f: any) => f.id === selectedFolderId)?.name || 'root';
          addNotification({
            type: 'success',
            title: 'File Uploaded Successfully!',
            message: `${file.name} has been uploaded to ${folderName}`,
            duration: 4000
          });
          
          resolve();
        } else {
          const error = `Upload failed: ${xhr.statusText}`;
          setUploadProgress(prev => 
            prev.map(item => 
              item.file === file 
                ? { ...item, status: 'error', error }
                : item
            )
          );
          
          // Show error notification
          addNotification({
            type: 'error',
            title: 'Upload Failed',
            message: `Failed to upload ${file.name}: ${xhr.statusText}`,
            duration: 6000
          });
          
          reject(new Error(error));
        }
      });

      xhr.addEventListener('error', () => {
        const error = 'Upload failed: Network error';
        setUploadProgress(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, status: 'error', error }
              : item
          )
        );
        reject(new Error(error));
      });

      xhr.open('POST', `${API_URL}/api/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    // Initialize upload progress
    const initialProgress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadProgress(initialProgress);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        await uploadFile(file);
      }
      
      // Clear files after successful upload
      setFiles([]);
      setUploadProgress([]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setUploadProgress(prev => prev.filter(item => item.status !== 'completed'));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (file.type.startsWith('audio/')) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else if (file.type.includes('pdf')) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Upload Files</h1>
          <p className="text-muted-foreground">Upload files to your vault</p>
        </div>

        {/* Folder Selection */}
        <div className="glass rounded-lg shadow-lg p-6 hover-lift animate-slide-up">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Select Destination Folder</h2>
            <p className="text-sm text-muted-foreground">Choose where to upload your files</p>
          </div>
          
          <div className="space-y-4">
            {/* Folder Dropdown */}
            <div>
              <label htmlFor="folder-select" className="block text-sm font-medium text-foreground mb-2">
                Upload to folder:
              </label>
              <div className="flex space-x-3">
                <select
                  id="folder-select"
                  value={selectedFolderId || ''}
                  onChange={(e) => setSelectedFolderId(e.target.value || null)}
                  className="flex-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground sm:text-sm transition-all duration-200"
                >
                  <option value="">Root folder (no folder)</option>
                  {folders.map((folder: any) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name} ({folder.fileCount} files)
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowCreateFolder(!showCreateFolder)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover-scale"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Folder
                </button>
              </div>
            </div>
            
            {/* Create New Folder Form */}
            {showCreateFolder && (
              <div className="border border-border rounded-lg p-4 bg-muted/30 animate-fade-in">
                <h3 className="text-sm font-medium text-foreground mb-3">Create New Folder</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    className="flex-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground sm:text-sm transition-all duration-200"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-scale"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateFolder(false);
                      setNewFolderName('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 hover-scale"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Selected Folder Display */}
            {selectedFolderId && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>
                  Files will be uploaded to: <strong>{folders.find((f: any) => f.id === selectedFolderId)?.name || 'Unknown folder'}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="glass rounded-lg shadow-lg p-6 hover-lift animate-slide-up">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-primary bg-primary/10 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-accent/20'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center transition-all duration-200 hover-scale">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {isDragOver ? 'Drop files here' : 'Upload files'}
                </h3>
                <p className="text-muted-foreground">
                  Drag and drop files here, or click to select files
                </p>
              </div>
              
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring cursor-pointer transition-all duration-200 hover-scale hover-glow"
                >
                  Select Files
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="glass rounded-lg shadow-lg p-6 hover-lift animate-slide-up">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Selected Files ({files.length})
              </h2>
            </div>
            
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-accent/50 transition-all duration-200 animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)} • {file.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive/80 transition-colors duration-200 hover-scale"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setFiles([])}
                className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 hover-scale"
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-scale hover-glow"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    Uploading...
                  </div>
                ) : (
                  'Upload Files'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Real-time Upload Progress */}
        <RealtimeUploadProgressList />

        {/* Legacy Upload Progress (fallback) */}
        {uploadProgress.length > 0 && (
          <div className="glass rounded-lg shadow-lg p-6 hover-lift animate-slide-up">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upload Progress</h2>
                <button
                  onClick={clearCompleted}
                  className="inline-flex items-center px-3 py-1 border border-border shadow-sm text-xs font-medium rounded text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 hover-scale"
                >
                  Clear Completed
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(item.file)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{item.progress}%</span>
                      {item.status === 'completed' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {item.status === 'error' && (
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.status === 'error' 
                          ? 'bg-destructive' 
                          : item.status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-primary'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  
                  {item.error && (
                    <p className="text-sm text-destructive">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
