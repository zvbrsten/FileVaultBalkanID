import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IncomingShares from './IncomingShares';
import { useNotification } from '../../hooks/useNotification';

// Mock the notification hook
jest.mock('../../hooks/useNotification');
const mockAddNotification = jest.fn();
(useNotification as jest.Mock).mockReturnValue({
  addNotification: mockAddNotification,
});

// Mock fetch
global.fetch = jest.fn();

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
      folderId: undefined,
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
    fromUserId: 'user-1',
    toUserId: 'user-2',
    message: null,
    isRead: true,
    createdAt: '2023-01-01T11:00:00Z',
    file: {
      id: 'file-2',
      filename: 'another-document.pdf',
      originalName: 'Another Document.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      hash: 'test-hash-2',
      s3Key: 'test/s3-key-2.pdf',
      uploaderId: 'user-1',
      folderId: undefined,
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z',
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
];

describe('IncomingShares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<IncomingShares />);

    expect(screen.getByText('Shared with You')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  it('renders empty state when no shares', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: [],
        unreadCount: 0,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('No shared files')).toBeInTheDocument();
      expect(screen.getByText('Files shared with you will appear here')).toBeInTheDocument();
    });
  });

  it('renders shares grouped by sender', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('Shared with You')).toBeInTheDocument();
      expect(screen.getByText('1 sender')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.getByText('2 files')).toBeInTheDocument();
    });
  });

  it('opens popup when sender is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      expect(screen.getByText('2 files from john_doe')).toBeInTheDocument();
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
      expect(screen.getByText('Another Document.pdf')).toBeInTheDocument();
    });
  });

  it('shows unread indicator for unread shares', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      // Check for unread indicator (green dot)
      const unreadIndicators = screen.getAllByRole('presentation');
      expect(unreadIndicators.length).toBeGreaterThan(0);
    });
  });

  it('downloads file when download button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Mock document.createElement and appendChild/removeChild
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

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);
    });

    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'Test Document.pdf');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
  });

  it('marks share as read when mark read button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
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

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      const markReadButtons = screen.getAllByText('Mark Read');
      fireEvent.click(markReadButtons[0]);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user-shares/share-1/read'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
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
  });

  it('handles API errors gracefully', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({
        error: 'Server error',
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('No shared files')).toBeInTheDocument();
    });

    // Should not show error notification for initial load failure
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('handles mark as read error', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    const mockErrorResponse = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Share not found',
      }),
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockErrorResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      const markReadButtons = screen.getAllByText('Mark Read');
      fireEvent.click(markReadButtons[0]);
    });

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to Mark Read',
        message: 'Failed to mark share as read: Share not found',
        duration: 4000,
      });
    });
  });

  it('formats file sizes correctly', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      expect(screen.getByText('1.00 KB')).toBeInTheDocument();
      expect(screen.getByText('2.00 KB')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      // Check that dates are formatted (should contain month abbreviations)
      const dateElements = screen.getAllByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('closes popup when close button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        shares: mockShares,
        unreadCount: 1,
      }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<IncomingShares />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    const senderCard = screen.getByText('john_doe').closest('div');
    fireEvent.click(senderCard!);

    await waitFor(() => {
      expect(screen.getByText('2 files from john_doe')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('2 files from john_doe')).not.toBeInTheDocument();
    });
  });
});
