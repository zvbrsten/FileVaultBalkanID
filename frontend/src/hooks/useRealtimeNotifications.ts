import { useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useNotification } from './useNotification';
import websocketDispatcher from '../utils/websocketDispatcher';

export interface DownloadCountUpdate {
  fileId: string;
  shareId: string;
  downloadCount: number;
  timestamp: string;
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  bytesTotal: number;
  bytesSent: number;
  timestamp: string;
}

export interface FileUploadComplete {
  fileId: string;
  fileName: string;
  fileSize: number;
  isDuplicate: boolean;
  timestamp: string;
}

export interface FileUploadError {
  fileId: string;
  fileName: string;
  error: string;
  timestamp: string;
}

export interface FileDeleted {
  fileId: string;
  fileName: string;
  timestamp: string;
}

export interface FileShared {
  fileId: string;
  fileName: string;
  shareId: string;
  shareUrl: string;
  expiresAt?: string;
  timestamp: string;
}

export interface ShareDeleted {
  shareId: string;
  fileId: string;
  fileName: string;
  timestamp: string;
}

export interface SystemStatsUpdate {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  uniqueFiles: number;
  duplicateFiles: number;
  storageEfficiency: number;
  activeUsers: number;
  newUsersToday: number;
  timestamp: string;
}

export interface UserStatsUpdate {
  userId: string;
  totalFiles: number;
  storageUsed: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: string;
}

export const useRealtimeNotifications = () => {
  const { addNotification } = useNotification();
  const API_URL = process.env.REACT_APP_GRAPHQL_URL?.replace('/query', '') || 'http://localhost:8080';
  
  // Convert WebSocket URL from HTTP to WS
  const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/ws';
  
  const { isConnected, connectionStatus, lastMessage, error } = useWebSocket(wsUrl);

  const handleDownloadCountUpdate = useCallback((data: DownloadCountUpdate) => {
    addNotification({
      type: 'info',
      title: 'Download Update',
      message: `Your shared file has been downloaded ${data.downloadCount} times`,
      duration: 4000
    });
  }, [addNotification]);

  const handleFileUploadComplete = useCallback((data: FileUploadComplete) => {
    const message = data.isDuplicate 
      ? `File "${data.fileName}" uploaded successfully (duplicate detected - storage saved!)`
      : `File "${data.fileName}" uploaded successfully`;
    
    addNotification({
      type: 'success',
      title: 'Upload Complete',
      message,
      duration: 5000
    });
  }, [addNotification]);

  const handleFileUploadError = useCallback((data: FileUploadError) => {
    addNotification({
      type: 'error',
      title: 'Upload Failed',
      message: `Failed to upload "${data.fileName}": ${data.error}`,
      duration: 6000
    });
  }, [addNotification]);

  const handleFileDeleted = useCallback((data: FileDeleted) => {
    addNotification({
      type: 'info',
      title: 'File Deleted',
      message: `File "${data.fileName}" has been deleted`,
      duration: 3000
    });
  }, [addNotification]);

  const handleFileShared = useCallback((data: FileShared) => {
    addNotification({
      type: 'success',
      title: 'File Shared',
      message: `File "${data.fileName}" has been shared successfully`,
      duration: 4000
    });
  }, [addNotification]);

  const handleShareDeleted = useCallback((data: ShareDeleted) => {
    addNotification({
      type: 'info',
      title: 'Share Deleted',
      message: `Share for "${data.fileName}" has been deleted`,
      duration: 3000
    });
  }, [addNotification]);

  const handleSystemStatsUpdate = useCallback((data: SystemStatsUpdate) => {
    // Only show system stats updates to admins
    // This could be enhanced to check user role
    console.log('System stats updated:', data);
  }, []);

  const handleUserStatsUpdate = useCallback((data: UserStatsUpdate) => {
    console.log('User stats updated:', data);
  }, []);

  const handleNotification = useCallback((data: Notification) => {
    addNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      duration: data.duration || 5000
    });
  }, [addNotification]);

  const handleConnectionStatus = useCallback((data: ConnectionStatus) => {
    if (data.status === 'connected') {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are now active',
        duration: 3000
      });
    } else if (data.status === 'disconnected') {
      addNotification({
        type: 'warning',
        title: 'Disconnected',
        message: 'Real-time updates are unavailable',
        duration: 5000
      });
    }
  }, [addNotification]);

  // Handle incoming WebSocket messages using dispatcher
  useEffect(() => {
    // Add event listeners for all message types
    websocketDispatcher.addEventListener('download_count_update', handleDownloadCountUpdate);
    websocketDispatcher.addEventListener('file_upload_progress', (data) => {
      console.log('Upload progress:', data);
    });
    websocketDispatcher.addEventListener('file_upload_complete', handleFileUploadComplete);
    websocketDispatcher.addEventListener('file_upload_error', handleFileUploadError);
    websocketDispatcher.addEventListener('file_deleted', handleFileDeleted);
    websocketDispatcher.addEventListener('file_shared', handleFileShared);
    websocketDispatcher.addEventListener('share_deleted', handleShareDeleted);
    websocketDispatcher.addEventListener('system_stats_update', handleSystemStatsUpdate);
    websocketDispatcher.addEventListener('user_stats_update', handleUserStatsUpdate);
    websocketDispatcher.addEventListener('notification', handleNotification);
    websocketDispatcher.addEventListener('connection_status', handleConnectionStatus);

    return () => {
      // Remove event listeners
      websocketDispatcher.removeEventListener('download_count_update', handleDownloadCountUpdate);
      websocketDispatcher.removeEventListener('file_upload_progress', (data) => {
        console.log('Upload progress:', data);
      });
      websocketDispatcher.removeEventListener('file_upload_complete', handleFileUploadComplete);
      websocketDispatcher.removeEventListener('file_upload_error', handleFileUploadError);
      websocketDispatcher.removeEventListener('file_deleted', handleFileDeleted);
      websocketDispatcher.removeEventListener('file_shared', handleFileShared);
      websocketDispatcher.removeEventListener('share_deleted', handleShareDeleted);
      websocketDispatcher.removeEventListener('system_stats_update', handleSystemStatsUpdate);
      websocketDispatcher.removeEventListener('user_stats_update', handleUserStatsUpdate);
      websocketDispatcher.removeEventListener('notification', handleNotification);
      websocketDispatcher.removeEventListener('connection_status', handleConnectionStatus);
    };
  }, [
    handleDownloadCountUpdate,
    handleFileUploadComplete,
    handleFileUploadError,
    handleFileDeleted,
    handleFileShared,
    handleShareDeleted,
    handleSystemStatsUpdate,
    handleUserStatsUpdate,
    handleNotification,
    handleConnectionStatus
  ]);

  // Show connection status notifications
  useEffect(() => {
    if (connectionStatus === 'connected') {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are now active',
        duration: 3000
      });
    } else if (connectionStatus === 'error' && error) {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: `Failed to connect to real-time updates: ${error}`,
        duration: 6000
      });
    }
  }, [connectionStatus, error, addNotification]);

  return {
    isConnected,
    connectionStatus,
    error
  };
};
