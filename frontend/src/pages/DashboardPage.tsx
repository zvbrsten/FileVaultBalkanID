import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { Folder, File, Plus, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.username}! Organize your files with folders.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Files
          </button>
          <button
            onClick={() => navigate('/folders')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Folder
          </button>
          <button
            onClick={() => navigate('/files')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <File className="w-5 h-5" />
            View All Files
          </button>
        </div>

        {/* Folders Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Folders</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading folders...</p>
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {folders.map((folder: any) => (
                <div
                  key={folder.id}
                  onClick={() => navigate(`/folders/${folder.id}`)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Folder className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {folder.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {folder.fileCount} files
                      </p>
                      <p className="text-xs text-gray-400">
                        Updated {formatDate(folder.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Folder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No folders yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first folder to organize your files.
              </p>
              <button
                onClick={() => navigate('/folders')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Folder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;