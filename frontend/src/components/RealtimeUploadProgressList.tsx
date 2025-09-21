import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, File } from 'lucide-react';
import websocketDispatcher from '../utils/websocketDispatcher';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  bytesTotal: number;
  bytesSent: number;
  timestamp: string;
}

interface UploadComplete {
  fileId: string;
  fileName: string;
  fileSize: number;
  isDuplicate: boolean;
  timestamp: string;
}

interface UploadError {
  fileId: string;
  fileName: string;
  error: string;
  timestamp: string;
}

interface UploadItem {
  fileId: string;
  fileName: string;
  progress: number;
  bytesTotal: number;
  bytesSent: number;
  status: 'uploading' | 'completed' | 'error' | 'idle';
  error?: string;
  isDuplicate?: boolean;
}

const RealtimeUploadProgressList: React.FC = () => {
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map());

  useEffect(() => {
    // Listen for upload progress updates
    const handleUploadProgress = (data: UploadProgress) => {
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.set(data.fileId, {
          fileId: data.fileId,
          fileName: data.fileName,
          progress: data.progress,
          bytesTotal: data.bytesTotal,
          bytesSent: data.bytesSent,
          status: 'uploading'
        });
        return newUploads;
      });
    };

    // Listen for upload completion
    const handleUploadComplete = (data: UploadComplete) => {
      setUploads(prev => {
        const newUploads = new Map(prev);
        const existing = newUploads.get(data.fileId);
        if (existing) {
          newUploads.set(data.fileId, {
            ...existing,
            progress: 100,
            status: 'completed',
            isDuplicate: data.isDuplicate
          });
        }
        return newUploads;
      });

      // Remove completed uploads after 5 seconds
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = new Map(prev);
          newUploads.delete(data.fileId);
          return newUploads;
        });
      }, 5000);
    };

    // Listen for upload errors
    const handleUploadError = (data: UploadError) => {
      setUploads(prev => {
        const newUploads = new Map(prev);
        const existing = newUploads.get(data.fileId);
        if (existing) {
          newUploads.set(data.fileId, {
            ...existing,
            status: 'error',
            error: data.error
          });
        }
        return newUploads;
      });

      // Remove error uploads after 10 seconds
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = new Map(prev);
          newUploads.delete(data.fileId);
          return newUploads;
        });
      }, 10000);
    };

    // Add event listeners
    websocketDispatcher.addEventListener('file_upload_progress', handleUploadProgress);
    websocketDispatcher.addEventListener('file_upload_complete', handleUploadComplete);
    websocketDispatcher.addEventListener('file_upload_error', handleUploadError);

    return () => {
      websocketDispatcher.removeEventListener('file_upload_progress', handleUploadProgress);
      websocketDispatcher.removeEventListener('file_upload_complete', handleUploadComplete);
      websocketDispatcher.removeEventListener('file_upload_error', handleUploadError);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (upload: UploadItem) => {
    switch (upload.status) {
      case 'uploading':
        return 'Uploading...';
      case 'completed':
        return upload.isDuplicate ? 'Uploaded (Duplicate)' : 'Uploaded';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (uploads.size === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Upload Progress</h3>
      {Array.from(uploads.values()).map((upload) => (
        <div key={upload.fileId} className="p-4 border rounded-lg bg-background">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(upload.status)}
              <span className="text-sm font-medium truncate max-w-xs">
                {upload.fileName}
              </span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(upload.status)}`}>
              {getStatusText(upload)}
            </span>
          </div>

          {upload.status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(upload.bytesSent)}</span>
                <span>{formatBytes(upload.bytesTotal)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {upload.progress.toFixed(1)}%
              </div>
            </div>
          )}

          {upload.status === 'completed' && (
            <div className="text-xs text-muted-foreground">
              {upload.isDuplicate ? (
                <span className="text-green-600">
                  ✓ Duplicate detected - storage space saved!
                </span>
              ) : (
                <span>✓ Upload completed successfully</span>
              )}
            </div>
          )}

          {upload.status === 'error' && upload.error && (
            <div className="text-xs text-red-600">
              ✗ {upload.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RealtimeUploadProgressList;




