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

// UserFileShare represents a file shared directly with a specific user
type UserFileShare struct {
	ID         uuid.UUID `json:"id" db:"id"`
	FileID     uuid.UUID `json:"fileId" db:"file_id"`
	FromUserID uuid.UUID `json:"fromUserId" db:"from_user_id"`
	ToUserID   uuid.UUID `json:"toUserId" db:"to_user_id"`
	Message    *string   `json:"message" db:"message"`
	IsRead     bool      `json:"isRead" db:"is_read"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time `json:"updatedAt" db:"updated_at"`

	// Related data (populated by joins)
	File     *File `json:"file,omitempty" db:"-"`
	FromUser *User `json:"fromUser,omitempty" db:"-"`
	ToUser   *User `json:"toUser,omitempty" db:"-"`
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

// CreateUserFileShareRequest represents the request to share a file with a user
type CreateUserFileShareRequest struct {
	FileID   uuid.UUID `json:"fileId" validate:"required"`
	ToUserID uuid.UUID `json:"toUserId" validate:"required"`
	Message  *string   `json:"message"`
}

// UserFileShareResponse represents the response for a user file share
type UserFileShareResponse struct {
	ID         uuid.UUID `json:"id"`
	FileID     uuid.UUID `json:"fileId"`
	FromUserID uuid.UUID `json:"fromUserId"`
	ToUserID   uuid.UUID `json:"toUserId"`
	Message    *string   `json:"message"`
	IsRead     bool      `json:"isRead"`
	CreatedAt  time.Time `json:"createdAt"`
	File       *File     `json:"file"`
	FromUser   *User     `json:"fromUser"`
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
