import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  Trash2, 
  FolderOpen, 
  Download, 
  X, 
  CheckSquare, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { useMutation, useQuery } from '@apollo/client';
import { DELETE_FILE, GET_FOLDERS } from '../../api/queries';

interface File {
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

interface BulkOperationsProps {
  selectedFiles: Set<string>;
  files: File[];
  onSelectionChange: (selectedFiles: Set<string>) => void;
  onFilesDeleted?: (deletedFileIds: string[]) => void;
  onFilesMoved?: (movedFileIds: string[], targetFolderId: string) => void;
  className?: string;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedFiles,
  files,
  onSelectionChange,
  onFilesDeleted,
  onFilesMoved,
  className
}) => {
  const { addNotification } = useNotification();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [deleteFileMutation] = useMutation(DELETE_FILE);
  const { data: foldersData } = useQuery(GET_FOLDERS, {
    errorPolicy: 'all'
  });

  const selectedFilesList = files.filter(file => selectedFiles.has(file.id));
  const selectedCount = selectedFiles.size;
  const totalSize = selectedFilesList.reduce((sum, file) => sum + file.size, 0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectAll = () => {
    if (selectedCount === files.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(files.map(file => file.id)));
    }
  };

  const handleSelectNone = () => {
    onSelectionChange(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    const deletedIds: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const fileId of Array.from(selectedFiles)) {
        try {
          await deleteFileMutation({
            variables: { id: fileId }
          });
          deletedIds.push(fileId);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete file ${fileId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        addNotification({
          type: 'success',
          title: 'Files Deleted',
          message: `Successfully deleted ${successCount} file(s)`,
          duration: 4000
        });
        
        if (onFilesDeleted) {
          onFilesDeleted(deletedIds);
        }
      }

      if (errorCount > 0) {
        addNotification({
          type: 'error',
          title: 'Some Deletions Failed',
          message: `Failed to delete ${errorCount} file(s)`,
          duration: 5000
        });
      }

      // Clear selection after successful deletions
      if (successCount > 0) {
        onSelectionChange(new Set());
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: 'An error occurred during bulk deletion',
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkMove = async () => {
    if (selectedCount === 0 || !selectedFolderId) return;

    setIsProcessing(true);
    // let successCount = 0;
    // let errorCount = 0;

    try {
      // Note: This would require a bulk move mutation in the backend
      // For now, we'll show a notification that this feature needs backend support
      addNotification({
        type: 'info',
        title: 'Bulk Move',
        message: 'Bulk move functionality requires backend implementation',
        duration: 4000
      });

      // TODO: Implement actual bulk move when backend supports it
      // for (const fileId of Array.from(selectedFiles)) {
      //   try {
      //     await moveFileMutation({
      //       variables: { id: fileId, folderId: selectedFolderId }
      //     });
      //     successCount++;
      //   } catch (error) {
      //     errorCount++;
      //   }
      // }

      if (onFilesMoved) {
        onFilesMoved(Array.from(selectedFiles), selectedFolderId);
      }

      onSelectionChange(new Set());
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Bulk Move Failed',
        message: 'An error occurred during bulk move',
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
      setMoveDialogOpen(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCount === 0) return;

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

    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFilesList) {
      try {
        const response = await fetch(`http://localhost:8080/files/${file.id}/download`, {
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
        link.download = file.originalName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        successCount++;
      } catch (error) {
        console.error(`Failed to download file ${file.originalName}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      addNotification({
        type: 'success',
        title: 'Downloads Started',
        message: `Started downloading ${successCount} file(s)`,
        duration: 4000
      });
    }

    if (errorCount > 0) {
      addNotification({
        type: 'error',
        title: 'Some Downloads Failed',
        message: `Failed to download ${errorCount} file(s)`,
        duration: 5000
      });
    }
  };

  if (selectedCount === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={false}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select files to perform bulk operations
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select All
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Bulk Operations</span>
            <Badge variant="secondary">{selectedCount} selected</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectNone}
          >
            <X className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selection Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{selectedCount}</div>
              <div className="text-xs text-muted-foreground">Files Selected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{formatFileSize(totalSize)}</div>
              <div className="text-xs text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {selectedFilesList.filter(f => f.isDuplicate).length}
              </div>
              <div className="text-xs text-muted-foreground">Duplicates</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDownload}
              disabled={isProcessing}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>

            <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Move to Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Move Files to Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Folder</label>
                    <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Root (No Folder)</SelectItem>
                        {foldersData?.folders?.map((folder: any) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setMoveDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkMove}
                      disabled={!selectedFolderId || isProcessing}
                    >
                      {isProcessing ? 'Moving...' : 'Move Files'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span>Confirm Bulk Delete</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      Are you sure you want to delete <strong>{selectedCount} file(s)</strong>? 
                      This action cannot be undone.
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Total size: {formatFileSize(totalSize)}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Deleting...' : 'Delete Files'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Selected Files List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedFilesList.map((file) => (
                <div key={file.id} className="flex items-center space-x-2 p-2 bg-muted/30 rounded text-xs">
                  <FileText className="w-3 h-3" />
                  <span className="truncate flex-1">{file.originalName}</span>
                  <Badge variant={file.isDuplicate ? "secondary" : "outline"} className="text-xs">
                    {file.isDuplicate ? "Duplicate" : "Original"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkOperations;
