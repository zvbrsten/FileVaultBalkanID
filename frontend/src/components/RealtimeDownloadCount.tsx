import React, { useState, useEffect } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import websocketDispatcher from '../utils/websocketDispatcher';

interface RealtimeDownloadCountProps {
  shareId: string;
  initialCount: number;
  className?: string;
}

interface DownloadCountUpdate {
  fileId: string;
  shareId: string;
  downloadCount: number;
  timestamp: string;
}

const RealtimeDownloadCount: React.FC<RealtimeDownloadCountProps> = ({
  shareId,
  initialCount,
  className = ''
}) => {
  const [downloadCount, setDownloadCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Listen for download count updates
    const handleDownloadCountUpdate = (data: DownloadCountUpdate) => {
      if (data.shareId === shareId) {
        // Update the count
        setDownloadCount(data.downloadCount);
        setLastUpdate(new Date(data.timestamp));
        
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    };

    // Add event listener for WebSocket messages
    websocketDispatcher.addEventListener('download_count_update', handleDownloadCountUpdate);

    return () => {
      websocketDispatcher.removeEventListener('download_count_update', handleDownloadCountUpdate);
    };
  }, [shareId]);

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <Download className={`w-4 h-4 text-muted-foreground ${isAnimating ? 'animate-pulse' : ''}`} />
        <span className={`text-sm font-medium ${isAnimating ? 'text-primary animate-pulse' : 'text-foreground'}`}>
          {downloadCount}
        </span>
      </div>
      
      {lastUpdate && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>{formatLastUpdate()}</span>
        </div>
      )}
    </div>
  );
};

export default RealtimeDownloadCount;
