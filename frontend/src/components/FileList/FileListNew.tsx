import React, { useState } from 'react';
import { Download, Trash2, File, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { FILES_QUERY, DELETE_FILE } from '../../api/queries';
import FilePreview from '../FilePreview/FilePreview';
import ShareModal from '../Share/ShareModal';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useNotification } from '../../hooks/useNotification';

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
  s3Key?: string;
  createdAt: string;
  updatedAt: string;
}

interface FileListProps {
  onFileSelect?: (file: FileItem) => void;
  showBulkOperations?: boolean;
  onBulkDelete?: (fileIds: string[]) => void;
  onBulkMove?: (fileIds: string[], folderId: string) => void;
  refetchFiles?: () => void;
}

const FileList: React.FC<FileListProps> = ({ 
  onFileSelect, 
  showBulkOperations = true,
  onBulkDelete,
  onBulkMove,
  refetchFiles
}) => {
  const { addNotification } = useNotification();
  const { data, loading, error, refetch } = useQuery(FILES_QUERY, {
    variables: { limit: 100, offset: 0 },
    errorPolicy: 'all',
  });

  const [deleteFileMutation] = useMutation(DELETE_FILE);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Filter out files that have a folderId and get unique files based on hash
  const files = React.useMemo(() => {
    const allFiles = data?.files || [];
    const filesWithoutFolders = allFiles.filter((file: FileItem) => !file.folderId);
    const seen = new Set();
    return filesWithoutFolders.filter((file: FileItem) => {
      if (seen.has(file.hash)) {
        return false; // Skip duplicates
      }
      seen.add(file.hash);
      return true;
    });
  }, [data?.files]);

  const deleteFile = async (fileId: string) => {
    try {
      await deleteFileMutation({
        variables: { id: fileId },
      });
      addNotification({
        type: 'success',
        title: 'File Deleted!',
        message: 'File has been deleted successfully.',
        duration: 3000
      });
      refetch();
      if (refetchFiles) {
        refetchFiles();
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to Delete File',
        message: `Could not delete file: ${err instanceof Error ? err.message : 'Unknown error'}`,
        duration: 5000
      });
      console.error('Delete error:', err);
    }
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
      const baseUrl = process.env.REACT_APP_GRAPHQL_URL?.replace('/query', '') || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/files/${fileId}/download`, {
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-green-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-4 h-4 text-yellow-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleShare = (file: FileItem) => {
    setShareFile(file);
    setIsShareOpen(true);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="text-destructive mb-2">{error.message}</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <File className="mx-auto h-12 w-12 text-cream-500 mb-4" />
          <h3 className="text-lg font-medium mb-2 text-cream-800">No files in root</h3>
          <p className="text-cream-600">All your files are organized in folders, or you haven't uploaded any files yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <File className="w-5 h-5" />
              <span>Root ({files.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file: FileItem) => (
              <div
                key={file.id}
                className="group relative bg-cream-50 border border-cream-200 rounded-lg p-4 hover:bg-cream-100 hover:border-forest-green transition-all duration-200 cursor-pointer"
                onClick={() => handlePreview(file)}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 flex items-center justify-center bg-forest-green/10 rounded-lg">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-cream-600 truncate w-full" title={file.originalName}>
                      {file.originalName.length > 15 
                        ? file.originalName.substring(0, 15) + '...' 
                        : file.originalName}
                    </div>
                    <div className="text-xs text-cream-500 mt-1">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                
                {/* Quick action buttons on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.id, file.originalName);
                      }}
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-white/80 hover:bg-white text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          onShare={handleShare}
          onDelete={(fileId) => {
            deleteFile(fileId);
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

      {/* Share Modal */}
      {shareFile && (
        <ShareModal
          file={shareFile}
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setShareFile(null);
          }}
        />
      )}
    </div>
  );
};

export default FileList;
