import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@apollo/client';
import { FILES_QUERY } from '../api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatBytes, formatDate } from '../lib/utils';
import IncomingShares from '../components/SharedFiles/IncomingShares';

const DashboardPageNew: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: filesData, loading } = useQuery(FILES_QUERY, {
    variables: { limit: 100, offset: 0 },
    errorPolicy: 'all'
  });

  // Get unique files based on hash to avoid showing duplicates
  const uniqueFiles = React.useMemo(() => {
    if (!filesData?.files) return [];
    
    const seen = new Set();
    return filesData.files.filter((file: any) => {
      if (seen.has(file.hash)) {
        return false;
      }
      seen.add(file.hash);
      return true;
    }).slice(0, 5); // Show only 5 most recent unique files
  }, [filesData]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <i className="pi pi-image text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('video/')) return <i className="pi pi-video text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.startsWith('audio/')) return <i className="pi pi-volume-up text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('pdf')) return <i className="pi pi-file-pdf text-orange" style={{ fontSize: '1rem' }}></i>;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <i className="pi pi-file-archive text-orange" style={{ fontSize: '1rem' }}></i>;
    return <i className="pi pi-file text-orange" style={{ fontSize: '1rem' }}></i>;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-4xl mx-auto px-4">
        <div className="p-6 space-y-8">
          
          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Welcome back, {user?.username}
            </h1>
          </motion.div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Files Widget */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="h-full"
            >
              <Card className="bg-white border border-cream-200 shadow-sm h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-cream-800 text-lg font-semibold">
                    Recent Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {uniqueFiles.map((file: any, index: number) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center space-x-3 p-2 hover:bg-cream-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => navigate('/files')}
                      >
                        <div className="flex-shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-cream-800 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-cream-700">
                            {formatBytes(file.size)} • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {uniqueFiles.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-center text-cream-700 py-4">
                          No files yet. Upload your first file!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shared with You Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="h-full"
            >
              <IncomingShares className="h-full" />
            </motion.div>

            {/* Options Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="h-full"
            >
              <Card className="bg-white border border-cream-200 shadow-sm h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-cream-800 text-lg font-semibold">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate('/upload')}
                      className="w-full h-12 bg-forest-green hover:bg-forest-green-hover text-white font-medium"
                    >
                      <i className="pi pi-upload mr-2"></i>
                      Upload Files
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/files')}
                      variant="outline"
                      className="w-full h-12 border-cream-300 text-cream-800 hover:bg-cream-50 font-medium"
                    >
                      <i className="pi pi-folder-open mr-2"></i>
                      Browse Files
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/search')}
                      variant="outline"
                      className="w-full h-12 border-cream-300 text-cream-800 hover:bg-cream-50 font-medium"
                    >
                      <i className="pi pi-search mr-2"></i>
                      Search Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageNew;
