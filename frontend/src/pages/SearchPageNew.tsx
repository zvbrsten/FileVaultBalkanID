import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdvancedSearch from '../components/Search/AdvancedSearch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Image, Video, Music, Archive, Download, Trash2, Eye, Calendar } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import FilePreview from '../components/FilePreview/FilePreview';

interface SearchFilters {
  query: string;
  mimeTypes: string[];
  sizeRange: [number, number];
  dateRange: {
    start: string;
    end: string;
  };
  showDuplicates: boolean;
  showOriginals: boolean;
  sortBy: 'name' | 'size' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
}

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploaderId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const performSearch = async (filters: SearchFilters) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Build the GraphQL query
      const query = `
        query AdvancedSearch(
          $searchTerm: String
          $mimeTypes: [String!]
          $minSize: Int
          $maxSize: Int
          $dateFrom: String
          $dateTo: String
          $sortBy: String
          $sortOrder: String
          $limit: Int
          $offset: Int
        ) {
          advancedSearch(
            searchTerm: $searchTerm
            mimeTypes: $mimeTypes
            minSize: $minSize
            maxSize: $maxSize
            dateFrom: $dateFrom
            dateTo: $dateTo
            sortBy: $sortBy
            sortOrder: $sortOrder
            limit: $limit
            offset: $offset
          ) {
            files {
              id
              filename
              originalName
              mimeType
              size
              hash
              uploaderId
              folderId
              createdAt
              updatedAt
            }
            totalCount
            hasMore
          }
        }
      `;

      const variables: any = {
        limit: 100,
        offset: 0,
      };

      // Convert filters to GraphQL variables
      if (filters.query) variables.searchTerm = filters.query;
      if (filters.mimeTypes.length > 0) variables.mimeTypes = filters.mimeTypes;
      if (filters.sizeRange[0] > 0) variables.minSize = filters.sizeRange[0] * 1024 * 1024; // Convert MB to bytes
      if (filters.sizeRange[1] < 100) variables.maxSize = filters.sizeRange[1] * 1024 * 1024; // Convert MB to bytes
      if (filters.dateRange.start) variables.dateFrom = filters.dateRange.start;
      if (filters.dateRange.end) variables.dateTo = filters.dateRange.end;
      // Handle duplicate filter logic
      if (!filters.showDuplicates && filters.showOriginals) {
        // Note: isDuplicate filter removed - all files are now treated equally
      }
      if (filters.sortBy) variables.sortBy = filters.sortBy;
      if (filters.sortOrder) variables.sortOrder = filters.sortOrder;

      const response = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setSearchResults(data.data.advancedSearch?.files || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      addNotification({
        type: 'error',
        title: 'Search Failed',
        message: err.message || 'An error occurred while searching',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    performSearch(filters);
  };

  const handleClear = () => {
    setSearchResults([]);
    setCurrentFilters(null);
    setError(null);
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

  const deleteFile = async (fileId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation DeleteFile($id: ID!) {
              deleteFile(id: $id)
            }
          `,
          variables: { id: fileId },
        }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      // Remove the file from current results
      setSearchResults(prev => prev.filter(f => f.id !== fileId));
      
      addNotification({
        type: 'success',
        title: 'File Deleted',
        message: 'File has been deleted successfully',
        duration: 3000
      });
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete file',
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

  const handlePreview = (file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  return (
    <div className="min-h-screen pt-28">
      {/* Header */}
      <div className="bg-cream-50/10 backdrop-blur-sm border-b border-cream-200/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Search Files</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Advanced Search Component */}
          <div className="mb-2">
            <AdvancedSearch
              onSearch={handleSearch}
              onClear={handleClear}
              isSearching={loading}
              resultCount={searchResults.length}
            />
          </div>

          {/* Search Results */}
          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="p-4">
                <div className="text-destructive">{error}</div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching files...</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Search Results ({searchResults.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(file.mimeType)}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {file.originalName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {file.mimeType} • {formatFileSize(file.size)}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(file.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && searchResults.length === 0 && currentFilters && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
          files={searchResults}
          currentIndex={searchResults.findIndex(f => f.id === previewFile.id)}
          onNavigate={(index) => {
            if (searchResults[index]) {
              setPreviewFile(searchResults[index]);
            }
          }}
        />
      )}
    </div>
  );
};

export default SearchPage;
