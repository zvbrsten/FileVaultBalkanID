import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download, TrendingUp, Users, Clock, Globe } from 'lucide-react';
import { GET_MY_FILE_SHARES, GET_FILE_SHARE_STATS } from '../../api/queries';

interface FileShare {
  id: string;
  fileId: string;
  shareToken: string;
  shareUrl: string;
  isActive: boolean;
  expiresAt?: string;
  downloadCount: number;
  maxDownloads?: number;
  createdAt: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

interface DownloadLog {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  downloadedAt: string;
}

interface FileShareStats {
  downloadCount: number;
  recentDownloads: DownloadLog[];
}

interface DownloadStatsProps {
  fileId?: string; // If provided, show stats for a specific file
  showRecentDownloads?: boolean;
  refreshInterval?: number; // Polling interval in milliseconds
}

const DownloadStats: React.FC<DownloadStatsProps> = ({
  fileId,
  showRecentDownloads = true,
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [selectedShare, setSelectedShare] = useState<string | null>(null);
  
  const { data: sharesData, loading: sharesLoading, error: sharesError, refetch: refetchShares } = useQuery(GET_MY_FILE_SHARES, {
    variables: { limit: 100, offset: 0 },
    pollInterval: refreshInterval,
    errorPolicy: 'all'
  });

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_FILE_SHARE_STATS, {
    variables: { shareId: selectedShare },
    skip: !selectedShare,
    pollInterval: refreshInterval,
    errorPolicy: 'all'
  });

  const shares: FileShare[] = sharesData?.myFileShares || [];
  const stats: FileShareStats | null = statsData?.fileShareStats || null;

  // Filter shares by fileId if provided
  const relevantShares = fileId 
    ? shares.filter(share => share.fileId === fileId)
    : shares;

  const totalDownloads = relevantShares.reduce((sum, share) => sum + share.downloadCount, 0);
  const activeShares = relevantShares.filter(share => share.isActive).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBrowserFromUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (sharesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (sharesError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="text-destructive">Error loading download stats: {sharesError.message}</div>
          <Button variant="outline" size="sm" onClick={() => refetchShares()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (relevantShares.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Download className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No shared files</h3>
          <p className="text-muted-foreground">
            {fileId ? 'This file has not been shared yet.' : 'You haven\'t shared any files yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Download Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalDownloads}</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{activeShares}</div>
              <div className="text-sm text-muted-foreground">Active Shares</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{relevantShares.length}</div>
              <div className="text-sm text-muted-foreground">Total Shares</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Shares List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Shared Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relevantShares.map((share) => (
              <div
                key={share.id}
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  selectedShare === share.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedShare(selectedShare === share.id ? null : share.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium truncate">
                        {share.file.originalName}
                      </div>
                      <Badge variant={share.isActive ? "default" : "secondary"}>
                        {share.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {share.maxDownloads && (
                        <Badge variant="outline">
                          Max: {share.maxDownloads}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {share.file.mimeType} • {formatFileSize(share.file.size)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(share.createdAt)}
                      {share.expiresAt && ` • Expires: ${formatDate(share.expiresAt)}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">
                        {share.downloadCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(share.shareUrl);
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Downloads */}
      {selectedShare && stats && showRecentDownloads && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Downloads</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentDownloads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent downloads
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDownloads.map((download) => (
                  <div key={download.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {download.ipAddress || 'Unknown IP'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getBrowserFromUserAgent(download.userAgent)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(download.downloadedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DownloadStats;
