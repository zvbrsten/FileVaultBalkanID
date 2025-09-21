import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { Folder, File, Plus, Upload, HardDrive, BarChart3, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RotatingText from '../components/RotatingText';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Query for folders
  const { data: foldersData, loading: foldersLoading } = useQuery(gql`
    query {
      folders {
        id
        name
        path
        fileCount
        createdAt
        updatedAt
      }
    }
  `);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const folders = foldersData?.folders || [];
  const loading = foldersLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center animate-fade-in">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4 animate-bounce-in">
                <Sparkles className="w-4 h-4" />
                Welcome back, {user?.username}
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              <RotatingText
                texts={['FileVault', 'Secure', 'Organized', 'Powerful']}
                mainClassName="text-foreground"
                staggerFrom="center"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                staggerDuration={0.05}
                rotationInterval={3000}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Your files, organized and secure. Experience the future of file management with intelligent organization and enterprise-grade security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/upload')}
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 flex items-center gap-3"
              >
                <Upload className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Upload Files
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => navigate('/files')}
                className="px-8 py-4 bg-background border-2 border-border text-foreground rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-primary/5 flex items-center gap-3"
              >
                <File className="w-5 h-5" />
                View Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="group glass rounded-3xl p-8 hover-lift animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Storage</h3>
                <p className="text-muted-foreground">Intelligent Management</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Advanced deduplication technology saves space while maintaining perfect file integrity.
            </p>
          </div>
          
          <div className="group glass rounded-3xl p-8 hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Security</h3>
                <p className="text-muted-foreground">Enterprise Grade</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              End-to-end encryption and secure sharing with granular access controls.
            </p>
          </div>
          
          <div className="group glass rounded-3xl p-8 hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Performance</h3>
                <p className="text-muted-foreground">Lightning Fast</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Optimized for speed with real-time search and instant file access.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate('/upload')}
              className="group glass rounded-2xl p-6 hover-lift transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Files</h3>
              <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            </button>
            
            <button
              onClick={() => navigate('/files')}
              className="group glass rounded-2xl p-6 hover-lift transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <File className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Browse Files</h3>
              <p className="text-sm text-muted-foreground">View and manage your files</p>
            </button>
            
            <button
              onClick={() => navigate('/search')}
              className="group glass rounded-2xl p-6 hover-lift transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Search</h3>
              <p className="text-sm text-muted-foreground">Find files with powerful filters</p>
            </button>
            
            <button
              onClick={() => navigate('/admin')}
              className="group glass rounded-2xl p-6 hover-lift transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Admin Panel</h3>
              <p className="text-sm text-muted-foreground">System management & analytics</p>
            </button>
          </div>
        </div>

        {/* Folders Section */}
        <div className="glass rounded-3xl p-8 hover-lift">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Your Folders</h2>
              <p className="text-muted-foreground">Organize your files with intelligent folders</p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Folder
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder: any, index: number) => (
                <div
                  key={folder.id}
                  onClick={() => navigate(`/files`)}
                  className="group glass rounded-2xl p-6 hover-lift transition-all duration-300 hover:scale-105 cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.fileCount} files
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDate(folder.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Folder className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No folders yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first folder to organize your files and start building your digital workspace.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create Your First Folder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;