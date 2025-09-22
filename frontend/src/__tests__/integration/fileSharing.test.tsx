import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { createMockClient } from '@apollo/client/testing';
import ShareModal from '../../components/Share/ShareModal';
import IncomingShares from '../../components/SharedFiles/IncomingShares';
import { useNotification } from '../../hooks/useNotification';

// Mock the notification hook
jest.mock('../../hooks/useNotification');
const mockAddNotification = jest.fn();
(useNotification as jest.Mock).mockReturnValue({
  addNotification: mockAddNotification,
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Apollo Client
const mockClient = createMockClient([], {
  addTypename: false,
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApolloProvider client={mockClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ApolloProvider>
);

describe('File Sharing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('ShareModal Integration', () => {
    const mockFile = {
      id: 'test-file-id',
      filename: 'test-file.pdf',
      originalName: 'Test Document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      hash: 'test-hash',
      uploaderId: 'test-uploader-id',
      folderId: null,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      s3Key: 'test/s3-key.pdf',
    };

    it('completes full public sharing flow', async () => {
      const mockShareResponse = {
        ok: true,
        json: () => Promise.resolve({
          share: {
            shareToken: 'test-token-123',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockShareResponse);

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <TestWrapper>
          <ShareModal
            isOpen={true}
            onClose={jest.fn()}
            file={mockFile}
          />
        </TestWrapper>
      );

      // Generate public link
      const generateButton = screen.getByText('Generate Public Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/shares/'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-jwt-token',
            },
            body: expect.stringContaining('test-file-id'),
          })
        );
      });

      // Copy link
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

    it('completes full user sharing flow', async () => {
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

      const mockUsersResponse = {
        ok: true,
        json: () => Promise.resolve({ users: mockUsers }),
      };

      const mockShareResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'File shared successfully',
        }),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockUsersResponse)
        .mockResolvedValueOnce(mockShareResponse);

      render(
        <TestWrapper>
          <ShareModal
            isOpen={true}
            onClose={jest.fn()}
            file={mockFile}
          />
        </TestWrapper>
      );

      // Switch to user sharing tab
      const shareWithUserTab = screen.getByText('Share with User');
      fireEvent.click(shareWithUserTab);

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
      });

      // Search for a user
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.queryByText('jane_smith')).not.toBeInTheDocument();

      // Select user
      const userOption = screen.getByText('john_doe');
      fireEvent.click(userOption);

      // Add message
      const messageInput = screen.getByPlaceholderText('Optional message...');
      fireEvent.change(messageInput, { target: { value: 'Please review this file' } });

      // Share file
      const shareButton = screen.getByText('Share File');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/files/test-file-id/share/user'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-jwt-token',
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
  });

  describe('IncomingShares Integration', () => {
    const mockShares = [
      {
        id: 'share-1',
        fileId: 'file-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        message: 'Please review this document',
        isRead: false,
        createdAt: '2023-01-01T10:00:00Z',
        file: {
          id: 'file-1',
          filename: 'test-document.pdf',
          originalName: 'Test Document.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          hash: 'test-hash',
          s3Key: 'test/s3-key.pdf',
          uploaderId: 'user-1',
          folderId: null,
          createdAt: '2023-01-01T09:00:00Z',
          updatedAt: '2023-01-01T09:00:00Z',
        },
        fromUser: {
          id: 'user-1',
          username: 'john_doe',
          email: 'john@example.com',
          role: 'user',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      },
      {
        id: 'share-2',
        fileId: 'file-2',
        fromUserId: 'user-3',
        toUserId: 'user-2',
        message: 'Here is another file',
        isRead: false,
        createdAt: '2023-01-01T11:00:00Z',
        file: {
          id: 'file-2',
          filename: 'another-document.pdf',
          originalName: 'Another Document.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          hash: 'test-hash-2',
          s3Key: 'test/s3-key-2.pdf',
          uploaderId: 'user-3',
          folderId: null,
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
        },
        fromUser: {
          id: 'user-3',
          username: 'jane_smith',
          email: 'jane@example.com',
          role: 'user',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      },
    ];

    it('completes full incoming shares workflow', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          shares: mockShares,
          unreadCount: 2,
        }),
      };

      const mockMarkReadResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'Share marked as read',
        }),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockMarkReadResponse);

      render(
        <TestWrapper>
          <IncomingShares />
        </TestWrapper>
      );

      // Wait for shares to load
      await waitFor(() => {
        expect(screen.getByText('Shared with You')).toBeInTheDocument();
        expect(screen.getByText('2 senders')).toBeInTheDocument();
        expect(screen.getByText('2 new')).toBeInTheDocument();
      });

      // Check that both senders are displayed
      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.getByText('jane_smith')).toBeInTheDocument();

      // Click on first sender
      const johnCard = screen.getByText('john_doe').closest('div');
      fireEvent.click(johnCard!);

      await waitFor(() => {
        expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
        expect(screen.getByText('Please review this document')).toBeInTheDocument();
      });

      // Mark as read
      const markReadButton = screen.getByText('Mark Read');
      fireEvent.click(markReadButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user-shares/share-1/read'),
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer mock-jwt-token',
            },
          })
        );
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Share Marked as Read',
        message: 'This shared file has been marked as read.',
        duration: 3000,
      });

      // Close popup
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Document.pdf')).not.toBeInTheDocument();
      });

      // Click on second sender
      const janeCard = screen.getByText('jane_smith').closest('div');
      fireEvent.click(janeCard!);

      await waitFor(() => {
        expect(screen.getByText('Another Document.pdf')).toBeInTheDocument();
        expect(screen.getByText('Here is another file')).toBeInTheDocument();
      });

      // Download file
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      // Mock document.createElement and related methods
      const mockLink = {
        href: '',
        setAttribute: jest.fn(),
        click: jest.fn(),
      };
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => mockLink),
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
      });

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'Another Document.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles multiple shares from same sender', async () => {
      const multipleSharesFromSameSender = [
        mockShares[0],
        {
          ...mockShares[1],
          fromUserId: 'user-1', // Same sender as first share
          fromUser: mockShares[0].fromUser,
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          shares: multipleSharesFromSameSender,
          unreadCount: 2,
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <IncomingShares />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 sender')).toBeInTheDocument();
        expect(screen.getByText('2 new')).toBeInTheDocument();
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('2 files')).toBeInTheDocument();
      });

      // Click on sender
      const senderCard = screen.getByText('john_doe').closest('div');
      fireEvent.click(senderCard!);

      await waitFor(() => {
        expect(screen.getByText('2 files from john_doe')).toBeInTheDocument();
        expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
        expect(screen.getByText('Another Document.pdf')).toBeInTheDocument();
      });
    });

    it('handles empty shares gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          shares: [],
          unreadCount: 0,
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <IncomingShares />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No shared files')).toBeInTheDocument();
        expect(screen.getByText('Files shared with you will appear here')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <IncomingShares />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No shared files')).toBeInTheDocument();
      });

      // Should not crash the application
      expect(screen.getByText('Shared with You')).toBeInTheDocument();
    });

    it('handles authentication errors', async () => {
      localStorageMock.getItem.mockReturnValue(null); // No token

      const mockFile = {
        id: 'test-file-id',
        filename: 'test-file.pdf',
        originalName: 'Test Document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        hash: 'test-hash',
        uploaderId: 'test-uploader-id',
        folderId: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        s3Key: 'test/s3-key.pdf',
      };

      render(
        <TestWrapper>
          <ShareModal
            isOpen={true}
            onClose={jest.fn()}
            file={mockFile}
          />
        </TestWrapper>
      );

      const generateButton = screen.getByText('Generate Public Link');
      fireEvent.click(generateButton);

      // Should still make the request (backend will handle auth)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });
});
