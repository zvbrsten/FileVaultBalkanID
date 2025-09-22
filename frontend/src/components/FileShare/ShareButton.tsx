import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from '../Share/ShareModal';

interface ShareButtonProps {
  file: {
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
  };
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ file, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
        title="Share file"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={file}
      />
    </>
  );
};

export default ShareButton;
