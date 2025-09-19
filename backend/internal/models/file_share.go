package models

import (
	"time"

	"github.com/google/uuid"
)

// FileShare represents a shared file with public access
type FileShare struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	FileID        uuid.UUID  `json:"fileId" db:"file_id"`
	ShareToken    string     `json:"shareToken" db:"share_token"`
	IsActive      bool       `json:"isActive" db:"is_active"`
	ExpiresAt     *time.Time `json:"expiresAt" db:"expires_at"`
	DownloadCount int        `json:"downloadCount" db:"download_count"`
	MaxDownloads  *int       `json:"maxDownloads" db:"max_downloads"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time  `json:"updatedAt" db:"updated_at"`

	// Related data (populated by joins)
	File *File `json:"file,omitempty" db:"-"`
}

// DownloadLog represents a download event for a shared file
type DownloadLog struct {
	ID           uuid.UUID `json:"id" db:"id"`
	ShareID      uuid.UUID `json:"shareId" db:"share_id"`
	IPAddress    *string   `json:"ipAddress" db:"ip_address"`
	UserAgent    *string   `json:"userAgent" db:"user_agent"`
	DownloadedAt time.Time `json:"downloadedAt" db:"downloaded_at"`
}

// CreateFileShareRequest represents the request to create a file share
type CreateFileShareRequest struct {
	FileID       uuid.UUID  `json:"fileId" validate:"required"`
	ExpiresAt    *time.Time `json:"expiresAt"`
	MaxDownloads *int       `json:"maxDownloads"`
}

// FileShareResponse represents the response for a file share
type FileShareResponse struct {
	ID            uuid.UUID  `json:"id"`
	FileID        uuid.UUID  `json:"fileId"`
	ShareToken    string     `json:"shareToken"`
	ShareURL      string     `json:"shareUrl"`
	IsActive      bool       `json:"isActive"`
	ExpiresAt     *time.Time `json:"expiresAt"`
	DownloadCount int        `json:"downloadCount"`
	MaxDownloads  *int       `json:"maxDownloads"`
	CreatedAt     time.Time  `json:"createdAt"`
	File          *File      `json:"file"`
}

// IsExpired checks if the file share has expired
func (fs *FileShare) IsExpired() bool {
	if fs.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*fs.ExpiresAt)
}

// IsDownloadLimitReached checks if the download limit has been reached
func (fs *FileShare) IsDownloadLimitReached() bool {
	if fs.MaxDownloads == nil {
		return false
	}
	return fs.DownloadCount >= *fs.MaxDownloads
}

// CanBeDownloaded checks if the file share can be downloaded
func (fs *FileShare) CanBeDownloaded() bool {
	return fs.IsActive && !fs.IsExpired() && !fs.IsDownloadLimitReached()
}
