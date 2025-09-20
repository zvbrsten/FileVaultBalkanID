import React, { useState, useEffect } from 'react';
import { Search, Filter, X, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import { cn } from '../../lib/utils';

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

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  isSearching?: boolean;
  resultCount?: number;
}

const MIME_TYPE_CATEGORIES = {
  'Images': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  'Videos': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
  'Audio': ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'],
  'Documents': ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'Archives': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  'Other': []
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  isSearching = false,
  resultCount = 0
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    mimeTypes: [],
    sizeRange: [0, 100],
    dateRange: {
      start: '',
      end: ''
    },
    showDuplicates: true,
    showOriginals: true,
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    const activeFiltersList: string[] = [];
    if (filters.query) activeFiltersList.push(`Query: "${filters.query}"`);
    if (filters.mimeTypes.length > 0) activeFiltersList.push(`Types: ${filters.mimeTypes.length}`);
    if (filters.sizeRange[0] > 0 || filters.sizeRange[1] < 100) activeFiltersList.push(`Size: ${filters.sizeRange[0]}-${filters.sizeRange[1]}MB`);
    if (filters.dateRange.start || filters.dateRange.end) activeFiltersList.push('Date range');
    if (!filters.showDuplicates || !filters.showOriginals) activeFiltersList.push('Status filter');
    
    setActiveFilters(activeFiltersList);
  }, [filters]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      mimeTypes: [],
      sizeRange: [0, 100],
      dateRange: {
        start: '',
        end: ''
      },
      showDuplicates: true,
      showOriginals: true,
      sortBy: 'date',
      sortOrder: 'desc'
    });
    onClear();
  };

  // const toggleMimeType = (mimeType: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     mimeTypes: prev.mimeTypes.includes(mimeType)
  //       ? prev.mimeTypes.filter(type => type !== mimeType)
  //       : [...prev.mimeTypes, mimeType]
  //   }));
  // };

  const toggleMimeCategory = (category: string) => {
    const categoryTypes: string[] = MIME_TYPE_CATEGORIES[category as keyof typeof MIME_TYPE_CATEGORIES];
    const hasAllTypes = categoryTypes.every((type: string) => filters.mimeTypes.includes(type));
    
    setFilters(prev => ({
      ...prev,
      mimeTypes: hasAllTypes
        ? prev.mimeTypes.filter((type: string) => !categoryTypes.includes(type))
        : Array.from(new Set([...prev.mimeTypes, ...categoryTypes]))
    }));
  };

  const formatFileSize = (mb: number) => {
    if (mb === 0) return '0 MB';
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const getFileTypeIcon = (category: string) => {
    switch (category) {
      case 'Images': return <Image className="w-4 h-4" />;
      case 'Videos': return <Video className="w-4 h-4" />;
      case 'Audio': return <Music className="w-4 h-4" />;
      case 'Documents': return <FileText className="w-4 h-4" />;
      case 'Archives': return <Archive className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Advanced Search</span>
            {resultCount > 0 && (
              <Badge variant="secondary">
                {resultCount} results
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {filter}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search files by name, type, or content..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="sort">Sort & Order</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4">
              {/* File Type Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">File Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(MIME_TYPE_CATEGORIES).map(([category, types]) => {
                    const hasAllTypes = types.length > 0 && types.every(type => filters.mimeTypes.includes(type));
                    const hasSomeTypes = types.some(type => filters.mimeTypes.includes(type));
                    
                    return (
                      <Button
                        key={category}
                        variant={hasAllTypes ? "default" : hasSomeTypes ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleMimeCategory(category)}
                        className="justify-start"
                      >
                        {getFileTypeIcon(category)}
                        <span className="ml-2">{category}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Size Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  File Size: {formatFileSize(filters.sizeRange[0])} - {formatFileSize(filters.sizeRange[1])}
                </Label>
                <Slider
                  value={filters.sizeRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sizeRange: value as [number, number] }))}
                  max={1000}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 KB</span>
                  <span>1 GB</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm font-medium">From Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm font-medium">To Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sort" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: 'name' | 'size' | 'date' | 'type') => 
                      setFilters(prev => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => 
                      setFilters(prev => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Show Original Files</Label>
                    <p className="text-xs text-muted-foreground">
                      Include files that are not duplicates
                    </p>
                  </div>
                  <Switch
                    checked={filters.showOriginals}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showOriginals: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Show Duplicate Files</Label>
                    <p className="text-xs text-muted-foreground">
                      Include files that are duplicates of others
                    </p>
                  </div>
                  <Switch
                    checked={filters.showDuplicates}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showDuplicates: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;
