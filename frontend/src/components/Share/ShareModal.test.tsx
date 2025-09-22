import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareModal from './ShareModal';
import { useNotification } from '../../hooks/useNotification';

// Mock the notification hook
jest.mock('../../hooks/useNotification');
const mockAddNotification = jest.fn();
(useNotification as jest.Mock).mockReturnValue({
  addNotification: mockAddNotification,
});

// Mock fetch
global.fetch = jest.fn();

const mockFile = {
  id: 'test-file-id',
  filename: 'test-file.pdf',
  originalName: 'Test Document.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  hash: 'test-hash',
  uploaderId: 'test-uploader-id',
  folderId: undefined,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  s3Key: 'test/s3-key.pdf',
};

const mockUsers = [
  {
    id: 'user-1',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'user',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

describe('ShareModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders the modal with file information', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
      />
    );

    expect(screen.getByText('Share File')).toBeInTheDocument();
    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.00 KB')).toBeInTheDocument();
  });

  it('closes the modal when close button is clicked', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows public link tab by default', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
      />
    );

    expect(screen.getByText('Public Link')).toBeInTheDocument();
    expect(screen.getByText('Share with User')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
      />
    );

    const shareWithUserTab = screen.getByText('Share with User');
    fireEvent.click(shareWithUserTab);

    expect(screen.getByText('Select User')).toBeInTheDocument();
  });

  describe('Public Link Tab', () => {
    it('generates public share link', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          share: {
            shareToken: 'test-token-123',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const generateButton = screen.getByText('Generate Public Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/shares/'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Bearer'),
            },
            body: expect.stringContaining('test-file-id'),
          })
        );
      });

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'success',
          title: 'Public Link Generated',
          message: 'Public share link has been generated successfully.',
          duration: 3000,
        });
      });
    });

    it('handles public share generation error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const generateButton = screen.getByText('Generate Public Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Failed to Generate Link',
          message: 'Failed to create public share: Error: Failed to create public share',
          duration: 4000,
        });
      });
    });

    it('copies link to clipboard', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          share: {
            shareToken: 'test-token-123',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const generateButton = screen.getByText('Generate Public Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Link');
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('test-token-123')
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Link Copied',
        message: 'Public share link has been copied to clipboard.',
        duration: 2000,
      });
    });
  });

  describe('Share with User Tab', () => {
    beforeEach(() => {
      const mockUsersResponse = {
        ok: true,
        json: () => Promise.resolve({
          users: mockUsers,
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockUsersResponse);
    });

    it('loads users when tab is opened', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const shareWithUserTab = screen.getByText('Share with User');
      fireEvent.click(shareWithUserTab);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
          expect.objectContaining({
            headers: {
              'Authorization': expect.stringContaining('Bearer'),
            },
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
      });
    });

    it('filters users by search query', async () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const shareWithUserTab = screen.getByText('Share with User');
      fireEvent.click(shareWithUserTab);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.queryByText('jane_smith')).not.toBeInTheDocument();
    });

    it('shares file with selected user', async () => {
      const mockShareResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'File shared successfully',
        }),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        })
        .mockResolvedValueOnce(mockShareResponse);

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const shareWithUserTab = screen.getByText('Share with User');
      fireEvent.click(shareWithUserTab);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      const userOption = screen.getByText('john_doe');
      fireEvent.click(userOption);

      const messageInput = screen.getByPlaceholderText('Optional message...');
      fireEvent.change(messageInput, { target: { value: 'Please review this file' } });

      const shareButton = screen.getByText('Share File');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/files/test-file-id/share/user'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Bearer'),
            },
            body: expect.stringContaining('user-1'),
          })
        );
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'File Shared',
        message: 'File has been shared with john_doe successfully.',
        duration: 3000,
      });
    });

    it('handles share error', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'User not found',
        }),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        })
        .mockResolvedValueOnce(mockErrorResponse);

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          file={mockFile}
        />
      );

      const shareWithUserTab = screen.getByText('Share with User');
      fireEvent.click(shareWithUserTab);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      const userOption = screen.getByText('john_doe');
      fireEvent.click(userOption);

      const shareButton = screen.getByText('Share File');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Failed to Share File',
          message: 'Failed to share file: User not found',
          duration: 4000,
        });
      });
    });
  });

  it('formats file size correctly', () => {
    const largeFile = {
      ...mockFile,
      size: 1024 * 1024 * 5, // 5 MB
    };

    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={largeFile}
      />
    );

    expect(screen.getByText('5.00 MB')).toBeInTheDocument();
  });

  it('handles missing s3Key gracefully', () => {
    const fileWithoutS3Key = {
      ...mockFile,
      s3Key: undefined,
    };

    render(
      <ShareModal
        isOpen={true}
        onClose={mockOnClose}
        file={fileWithoutS3Key}
      />
    );

    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
  });
});
