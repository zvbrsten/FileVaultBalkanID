import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_FOLDERS, GET_FILES_BY_FOLDER, DELETE_FILE } from '../../api/queries';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Download, Trash2, Eye, Calendar, Hash, Image, Video, Music, Archive, FileText } from 'lucide-react';
import ShareButton from '../FileShare/ShareButton';
import FilePreview from '../FilePreview/FilePreview';
import { Button } from '../ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useNotification } from '../../hooks/useNotification';

interface FolderItem {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  isDuplicate: boolean;
  uploaderId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface FolderListProps {
  onFileSelect?: (file: FileItem) => void;
  refetchFiles: () => void;
}

const FolderList: React.FC<FolderListProps> = ({ onFileSelect, refetchFiles }) => {
  const { addNotification } = useNotification();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [deleteFileMutation] = useMutation(DELETE_FILE);
  
  const { data: foldersData, loading: foldersLoading, error: foldersError, refetch: refetchFolders } = useQuery(GET_FOLDERS, {
    pollInterval: 5000,
    errorPolicy: 'all'
  });
  const { data: filesData, loading: filesLoading, error: filesError } = useQuery(GET_FILES_BY_FOLDER, {
    variables: { folderId: selectedFolder, limit: 100, offset: 0 },
    skip: !selectedFolder,
    errorPolicy: 'all',
  });

  const folders = foldersData?.folders || [];
  const files = filesData?.filesByFolder || [];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-green-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-4 h-4 text-yellow-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const downloadFile = async (fileId: string, originalName: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to download files.',
        duration: 4000
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      addNotification({
        type: 'success',
        title: 'Download Started',
        message: `Downloading "${originalName}"...`,
        duration: 3000
      });
    } catch (error) {
      console.error('Download error:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: `Failed to download "${originalName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    }
  };

  const deleteFile = async (fileId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete the file "${filename}"?`)) {
      return;
    }

    try {
      await deleteFileMutation({
        variables: { id: fileId },
      });
      addNotification({
        type: 'success',
        title: 'File Deleted!',
        message: `File "${filename}" has been deleted.`,
        duration: 3000
      });
      refetchFolders();
      refetchFiles();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to Delete File',
        message: `Could not delete file "${filename}": ${err instanceof Error ? err.message : 'Unknown error'}`,
        duration: 5000
      });
      console.error('Delete error:', err);
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
    } else {
      newExpanded.add(folderId);
      setSelectedFolder(folderId);
    }
    setExpandedFolders(newExpanded);
  };



  if (foldersLoading) {
    return (
      <div className="flex justify-center items-center h-64 animate-fade-in">
        <div className="text-muted-foreground">Loading folders...</div>
      </div>
    );
  }

  if (foldersError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 animate-fade-in">
        <div className="text-destructive">Error loading folders: {foldersError.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">
          Folders ({folders.length})
        </h2>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No folders created</h3>
          <p className="text-muted-foreground">Create your first folder to organize your files!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {folders.map((folder: FolderItem, index: number) => (
            <div 
              key={folder.id} 
              className="border border-border rounded-lg bg-card hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200"
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="flex items-center space-x-3">
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                  )}
                  {expandedFolders.has(folder.id) ? (
                    <FolderOpen className="w-5 h-5 text-primary transition-colors duration-200" />
                  ) : (
                    <Folder className="w-5 h-5 text-primary transition-colors duration-200" />
                  )}
                  <div>
                    <div className="font-medium text-foreground">{folder.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(folder.createdAt)}
                </div>
              </div>

              {expandedFolders.has(folder.id) && (
                <div className="border-t border-border bg-muted/30 animate-fade-in">
                  {filesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading files...</div>
                  ) : filesError ? (
                    <div className="p-4 text-center text-destructive">Error loading files: {filesError.message}</div>
                  ) : files.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No files in this folder</div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-2">
                        {files.map((file: FileItem, fileIndex: number) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-card rounded border border-border hover:bg-accent/50 transition-all duration-200 hover-lift animate-scale-in"
                            style={{ animationDelay: `${fileIndex * 0.05}s` }}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {getFileIcon(file.mimeType)}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-foreground truncate">{file.originalName}</div>
                                <div className="text-sm text-muted-foreground">{file.mimeType}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={file.isDuplicate ? "secondary" : "default"} className="text-xs">
                                    {file.isDuplicate ? (
                                      <div className="flex items-center space-x-1">
                                        <Hash className="w-3 h-3" />
                                        <span>Duplicate</span>
                                      </div>
                                    ) : (
                                      "Original"
                                    )}
                                  </Badge>
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(file.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-muted-foreground mr-2">
                                {formatFileSize(file.size)}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreview(file)}
                                  title="Preview"
                                  className="hover-scale"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile(file.id, file.originalName)}
                                  title="Download"
                                  className="hover-scale"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <ShareButton 
                                  file={file}
                                  className="!px-2 !py-1 !text-xs hover-scale"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFile(file.id, file.originalName)}
                                  title="Delete"
                                  className="text-destructive hover:text-destructive hover-scale"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewFile(null);
          }}
          onDownload={downloadFile}
          onShare={(file) => {
            // Handle share functionality
          }}
          onDelete={(fileId) => {
            deleteFile(fileId, previewFile.originalName);
            setIsPreviewOpen(false);
            setPreviewFile(null);
          }}
          files={files}
          currentIndex={files.findIndex((f: FileItem) => f.id === previewFile.id)}
          onNavigate={(index) => {
            if (files[index]) {
              setPreviewFile(files[index]);
            }
          }}
        />
      )}
    </div>
  );
};

export default FolderList;
