import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdvancedSearch from '../components/AdvancedSearch/AdvancedSearch';
import SearchResults from '../components/SearchResults/SearchResults';
import FileStats from '../components/FileStats/FileStats';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';

interface SearchFilters {
  searchTerm: string;
  mimeTypes: string[];
  minSize: number | null;
  maxSize: number | null;
  dateFrom: string;
  dateTo: string;
  isDuplicate: boolean | null;
  sortBy: string;
  sortOrder: string;
}

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  isDuplicate: boolean;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  files: File[];
  totalCount: number;
  hasMore: boolean;
}

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showStats, setShowStats] = useState(false);

  const performSearch = async (filters: SearchFilters, offset: number = 0) => {
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
          $isDuplicate: Boolean
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
            isDuplicate: $isDuplicate
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
              isDuplicate
              uploaderId
              createdAt
              updatedAt
            }
            totalCount
            hasMore
          }
        }
      `;

      const variables: any = {
        limit: 20,
        offset: offset,
      };

      // Only include non-empty values
      if (filters.searchTerm) variables.searchTerm = filters.searchTerm;
      if (filters.mimeTypes.length > 0) variables.mimeTypes = filters.mimeTypes;
      if (filters.minSize !== null) variables.minSize = filters.minSize;
      if (filters.maxSize !== null) variables.maxSize = filters.maxSize;
      if (filters.dateFrom) variables.dateFrom = filters.dateFrom;
      if (filters.dateTo) variables.dateTo = filters.dateTo;
      if (filters.isDuplicate !== null) variables.isDuplicate = filters.isDuplicate;
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

      const result = data.data.advancedSearch;
      
      if (offset === 0) {
        // New search
        setSearchResults(result);
      } else {
        // Load more
        setSearchResults(prev => prev ? {
          ...result,
          files: [...(prev.files || []), ...(result.files || [])],
        } : result);
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    performSearch(filters, 0);
  };

  const handleClear = () => {
    setSearchResults(null);
    setCurrentFilters(null);
    setError(null);
  };

  const handleLoadMore = () => {
    if (currentFilters && searchResults?.hasMore && searchResults?.files) {
      performSearch(currentFilters, searchResults.files.length);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileDelete = async (fileId: string) => {
    if (!user) return;

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
      if (searchResults && searchResults.files) {
        setSearchResults({
          ...searchResults,
          files: searchResults.files.filter(f => f.id !== fileId),
          totalCount: (searchResults.totalCount || 0) - 1,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
                  <p className="mt-2 text-gray-600">
                    Find your files with powerful search and filtering options
                  </p>
                </div>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
              </div>
            </div>

            {/* File Statistics */}
            {showStats && (
              <div className="mb-6">
                <FileStats />
              </div>
            )}

            {/* Advanced Search Component */}
            <div className="mb-6">
              <AdvancedSearch
                onSearch={handleSearch}
                onClear={handleClear}
                isSearching={loading}
              />
            </div>

            {/* Search Results */}
            <SearchResults
              results={searchResults}
              loading={loading}
              error={error}
              onLoadMore={handleLoadMore}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />

            {/* File Details Modal */}
            {selectedFile && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">File Details</h3>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-sm text-gray-900">{selectedFile.originalName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <p className="text-sm text-gray-900">{selectedFile.mimeType}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Size</label>
                        <p className="text-sm text-gray-900">
                          {selectedFile.size.toLocaleString()} bytes
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <p className="text-sm text-gray-900">
                          {selectedFile.isDuplicate ? 'Duplicate' : 'Unique'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Uploaded</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedFile.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SearchPage;
