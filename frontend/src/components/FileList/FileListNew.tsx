import React, { useState } from 'react';
import { Download, Trash2, File, FileText, Image, Video, Music, Archive, Calendar, Hash, Eye } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { FILES_QUERY, DELETE_FILE } from '../../api/queries';
import ShareButton from '../FileShare/ShareButton';
import FilePreview from '../FilePreview/FilePreview';
import BulkOperations from '../BulkOperations/BulkOperations';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
// import { cn } from '../../lib/utils';
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
  createdAt: string;
  updatedAt: string;
}

interface FileListProps {
  onFileSelect?: (file: FileItem) => void;
  showBulkOperations?: boolean;
  onBulkDelete?: (fileIds: string[]) => void;
  onBulkMove?: (fileIds: string[], folderId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ 
  onFileSelect, 
  showBulkOperations = true,
  onBulkDelete,
  onBulkMove 
}) => {
  const { addNotification } = useNotification();
  const { data, loading, error, refetch } = useQuery(FILES_QUERY, {
    variables: { limit: 100, offset: 0 },
    errorPolicy: 'all',
  });

  const [deleteFileMutation] = useMutation(DELETE_FILE);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter out files that have a folderId (they should be shown in FolderList instead)
  const allFiles = data?.files || [];
  const files = allFiles.filter((file: FileItem) => !file.folderId);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const handleFileSelect = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map((file: FileItem) => file.id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleBulkDelete = (deletedFileIds: string[]) => {
    // Remove deleted files from the current list
    setSelectedFiles(new Set());
    refetch(); // Refresh the file list
  };

  const handleBulkMove = (movedFileIds: string[], targetFolderId: string) => {
    // Handle bulk move (this would require backend implementation)
    setSelectedFiles(new Set());
    refetch(); // Refresh the file list
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
          <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No files without folders</h3>
          <p className="text-muted-foreground">All your files are organized in folders, or you haven't uploaded any files yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Operations */}
      <BulkOperations
        selectedFiles={selectedFiles}
        files={files}
        onSelectionChange={setSelectedFiles}
        onFilesDeleted={handleBulkDelete}
        onFilesMoved={handleBulkMove}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <File className="w-5 h-5" />
              <span>Files Without Folders ({files.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  {showBulkOperations && (
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {files.map((file: FileItem) => (
                  <tr key={file.id} className="hover:bg-muted/50 transition-colors">
                    {showBulkOperations && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.mimeType)}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {file.originalName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {file.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={file.isDuplicate ? "secondary" : "default"}>
                        {file.isDuplicate ? (
                          <div className="flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span>Duplicate</span>
                          </div>
                        ) : (
                          "Original"
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(file)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(file.id, file.originalName)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <ShareButton 
                          file={file}
                          className="!px-2 !py-1 !text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFile(file.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          onShare={(file) => {
            // Handle share functionality
          }}
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
    </div>
  );
};

export default FileList;
