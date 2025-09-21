import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useQuery, useMutation } from '@apollo/client';
import { GET_FOLDERS } from '../../api/queries';
import { CREATE_FOLDER } from '../../api/mutations';

interface Folder {
  id: string;
  name: string;
  path: string;
  fileCount: number;
}

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (folderName: string) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolderId,
  onFolderSelect,
  onCreateFolder
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: foldersData, loading } = useQuery(GET_FOLDERS);
  const [createFolder] = useMutation(CREATE_FOLDER);

  const folders = foldersData?.folders || [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        variables: { name: newFolderName.trim() },
        refetchQueries: [{ query: GET_FOLDERS }]
      });
      setNewFolderName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-cream-800 font-medium">Upload to Folder</Label>
        <p className="text-sm text-cream-700 mt-1">
          Select a folder to upload files to, or create a new one
        </p>
      </div>

      {/* Folder Selection */}
      <div className="space-y-2">
        <Button
          variant={selectedFolderId === null ? "default" : "outline"}
          size="sm"
          onClick={() => onFolderSelect(null)}
          className="w-full justify-start"
        >
          <i className="pi pi-folder text-orange mr-2" style={{ fontSize: '1rem' }}></i>
          Root Directory
        </Button>

        {loading ? (
          <div className="text-center py-4">
            <i className="pi pi-spin pi-spinner text-cream-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
        ) : (
          folders.map((folder: Folder) => (
            <Button
              key={folder.id}
              variant={selectedFolderId === folder.id ? "default" : "outline"}
              size="sm"
              onClick={() => onFolderSelect(folder.id)}
              className="w-full justify-start"
            >
              <i className="pi pi-folder text-orange mr-2" style={{ fontSize: '1rem' }}></i>
              {folder.name}
              <span className="ml-auto text-xs text-cream-700">
                {folder.fileCount} files
              </span>
            </Button>
          ))
        )}
      </div>

      {/* Create New Folder */}
      {showCreateForm ? (
        <div className="space-y-3 p-4 bg-cream-100 rounded-lg border border-cream-200">
          <div>
            <Label htmlFor="folderName" className="text-cream-800">
              New Folder Name
            </Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-1"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              size="sm"
            >
              Create Folder
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewFolderName('');
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(true)}
          className="w-full"
        >
          <i className="pi pi-plus text-orange mr-2" style={{ fontSize: '1rem' }}></i>
          Create New Folder
        </Button>
      )}
    </div>
  );
};

export default FolderSelector;
