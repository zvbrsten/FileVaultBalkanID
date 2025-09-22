import React, { useState, useEffect } from 'react';
import { Search, Filter, X, FileText, Image, Video, Music, Archive, Code, HardDrive } from 'lucide-react';

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

interface MimeTypeCategories {
  documents: string[];
  images: string[];
  videos: string[];
  audio: string[];
  archives: string[];
  code: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  isSearching: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch, onClear, isSearching }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    mimeTypes: [],
    minSize: null,
    maxSize: null,
    dateFrom: '',
    dateTo: '',
    isDuplicate: null,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [mimeTypeCategories, setMimeTypeCategories] = useState<MimeTypeCategories>({
    documents: [],
    images: [],
    videos: [],
    audio: [],
    archives: [],
    code: [],
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load MIME type categories on component mount
  useEffect(() => {
    const loadMimeTypeCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8080/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `
              query {
                mimeTypeCategories {
                  documents
                  images
                  videos
                  audio
                  archives
                  code
                }
              }
            `,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.mimeTypeCategories) {
            setMimeTypeCategories(data.data.mimeTypeCategories);
          }
        }
      } catch (error) {
        console.error('Failed to load MIME type categories:', error);
      }
    };

    loadMimeTypeCategories();
  }, []);

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMimeTypeToggle = (mimeType: string) => {
    setFilters(prev => ({
      ...prev,
      mimeTypes: prev.mimeTypes.includes(mimeType)
        ? prev.mimeTypes.filter(mt => mt !== mimeType)
        : [...prev.mimeTypes, mimeType],
    }));
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const categoryMimeTypes = mimeTypeCategories[category as keyof MimeTypeCategories] || [];
    setFilters(prev => ({
      ...prev,
      mimeTypes: categoryMimeTypes,
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      searchTerm: '',
      mimeTypes: [],
      minSize: null,
      maxSize: null,
      dateFrom: '',
      dateTo: '',
      isDuplicate: null,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setSelectedCategory('');
    onClear();
  };

  // Helper function for formatting file sizes (currently unused but kept for future use)
  // const formatBytes = (bytes: number): string => {
  //   if (bytes === 0) return '0 B';
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  // };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'images': return <Image className="w-4 h-4" />;
      case 'videos': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'archives': return <Archive className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </span>
        </button>
      </div>

      {/* Basic Search */}
      <div className="flex space-x-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search files by name..."
            value={filters.searchTerm}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* File Type Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(mimeTypeCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Individual MIME Types */}
          {filters.mimeTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected File Types
              </label>
              <div className="flex flex-wrap gap-2">
                {filters.mimeTypes.map((mimeType) => (
                  <span
                    key={mimeType}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    <span>{mimeType}</span>
                    <button
                      onClick={() => handleMimeTypeToggle(mimeType)}
                      className="hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Size Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Size
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minSize || ''}
                onChange={(e) => handleInputChange('minSize', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Size
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.maxSize || ''}
                onChange={(e) => handleInputChange('maxSize', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duplicate Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Status
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duplicate"
                  checked={filters.isDuplicate === null}
                  onChange={() => handleInputChange('isDuplicate', null)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">All Files</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duplicate"
                  checked={filters.isDuplicate === false}
                  onChange={() => handleInputChange('isDuplicate', false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Unique Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duplicate"
                  checked={filters.isDuplicate === true}
                  onChange={() => handleInputChange('isDuplicate', true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Duplicates Only</span>
              </label>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
