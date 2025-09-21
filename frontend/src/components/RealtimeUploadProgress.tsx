import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, File } from 'lucide-react';

interface RealtimeUploadProgressProps {
  fileId: string;
  fileName: string;
  className?: string;
}

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

const RealtimeUploadProgress: React.FC<RealtimeUploadProgressProps> = ({
  fileId,
  fileName,
  className = ''
}) => {
  const [progress, setProgress] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(0);
  const [bytesSent, setBytesSent] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'completed' | 'error' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    // Listen for WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'file_upload_progress' && 
            message.data.fileId === fileId) {
          const data: UploadProgress = message.data;
          setProgress(data.progress);
          setBytesTotal(data.bytesTotal);
          setBytesSent(data.bytesSent);
          setStatus('uploading');
        } else if (message.type === 'file_upload_complete' && 
                   message.data.fileId === fileId) {
          const data: UploadComplete = message.data;
          setProgress(100);
          setStatus('completed');
          setIsDuplicate(data.isDuplicate);
        } else if (message.type === 'file_upload_error' && 
                   message.data.fileId === fileId) {
          const data: UploadError = message.data;
          setStatus('error');
          setError(data.error);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    // Add event listener for WebSocket messages
    window.addEventListener('websocket-message', handleMessage as EventListener);

    return () => {
      window.removeEventListener('websocket-message', handleMessage as EventListener);
    };
  }, [fileId]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
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

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'completed':
        return isDuplicate ? 'Uploaded (Duplicate)' : 'Uploaded';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
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

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium truncate max-w-xs">
            {fileName}
          </span>
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatBytes(bytesSent)}</span>
            <span>{formatBytes(bytesTotal)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground">
            {progress.toFixed(1)}%
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="text-xs text-muted-foreground">
          {isDuplicate ? (
            <span className="text-green-600">
              ✓ Duplicate detected - storage space saved!
            </span>
          ) : (
            <span>✓ Upload completed successfully</span>
          )}
        </div>
      )}

      {status === 'error' && error && (
        <div className="text-xs text-red-600">
          ✗ {error}
        </div>
      )}
    </div>
  );
};

export default RealtimeUploadProgress;




