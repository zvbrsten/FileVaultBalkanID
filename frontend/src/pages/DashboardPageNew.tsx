import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@apollo/client';
import { FILES_QUERY } from '../api/queries';
import StatsCard from '../components/Dashboard/StatsCard';
import RotatingText from '../components/Dashboard/RotatingText';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentFiles from '../components/Dashboard/RecentFiles';
import { 
  FileText, 
  HardDrive, 
  Users
} from 'lucide-react';

const DashboardPageNew: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    sharedFiles: 0,
    recentActivity: 0
  });

  const { data: filesData, loading } = useQuery(FILES_QUERY, {
    variables: { limit: 100, offset: 0 },
    errorPolicy: 'all'
  });

  useEffect(() => {
    if (filesData?.files) {
      const files = filesData.files;
      const totalSize = files.reduce((sum: number, file: any) => sum + file.size, 0);
      const sharedFiles = files.filter((file: any) => file.isShared).length;
      
      setStats({
        totalFiles: files.length,
        totalSize,
        sharedFiles,
        recentActivity: files.filter((file: any) => {
          const fileDate = new Date(file.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return fileDate > weekAgo;
        }).length
      });
    }
  }, [filesData]);

  const rotatingTexts = [
    "Welcome to your digital vault",
    "Your files, secured and organized",
    "Smart storage, smarter sharing",
    "Real-time sync, real-time peace",
    "Advanced search, instant results"
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'upload':
        navigate('/upload');
        break;
      case 'folder':
        // TODO: Implement create folder
        break;
      case 'share':
        navigate('/files');
        break;
      case 'search':
        navigate('/search');
        break;
      case 'download':
        navigate('/files');
        break;
      case 'settings':
        // TODO: Navigate to settings
        break;
      case 'users':
        navigate('/admin');
        break;
      case 'analytics':
        navigate('/admin');
        break;
    }
  };

  const handleFileClick = (file: any) => {
    // TODO: Implement file preview
    console.log('File clicked:', file);
  };

  const handleDownload = (file: any) => {
    // TODO: Implement download
    console.log('Download:', file);
  };

  const handleShare = (file: any) => {
    // TODO: Implement share
    console.log('Share:', file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3"
        >
          <h1 className="text-2xl font-medium text-cream-800">
            Welcome back, {user?.username}
          </h1>
          <p className="text-cream-600">
            Manage your files and folders
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Files"
            value={stats.totalFiles}
            description="Total files"
            icon={<FileText className="w-5 h-5" />}
            delay={0.1}
          />
          
          <StatsCard
            title="Storage"
            value={`${(stats.totalSize / (1024 * 1024 * 1024)).toFixed(1)} GB`}
            description="Used space"
            icon={<HardDrive className="w-5 h-5" />}
            delay={0.2}
          />
          
          <StatsCard
            title="Shared"
            value={stats.sharedFiles}
            description="Shared files"
            icon={<Users className="w-5 h-5" />}
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <QuickActions
            onUpload={() => handleQuickAction('upload')}
            onCreateFolder={() => handleQuickAction('folder')}
            onSearch={() => handleQuickAction('search')}
            isAdmin={user?.role === 'admin'}
          />
        </motion.div>

        {/* Recent Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <RecentFiles
            files={filesData?.files || []}
            onFileClick={handleFileClick}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageNew;
