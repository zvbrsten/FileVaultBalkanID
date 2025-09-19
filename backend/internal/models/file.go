package models

import (
	"time"

	"github.com/google/uuid"
)

// File represents a file in the system
type File struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Filename     string    `json:"filename" db:"filename"`
	OriginalName string    `json:"originalName" db:"original_name"`
	MimeType     string    `json:"mimeType" db:"mime_type"`
	Size         int64     `json:"size" db:"size"`
	Hash         string    `json:"hash" db:"hash"`
	S3Key        string    `json:"s3Key" db:"s3_key"`
	IsDuplicate  bool      `json:"isDuplicate" db:"is_duplicate"`
	UploaderID   uuid.UUID `json:"uploaderId" db:"uploader_id"`
	Uploader     *User     `json:"uploader,omitempty"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

// FileHash represents a unique file hash for deduplication
type FileHash struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Hash      string    `json:"hash" db:"hash"`
	FilePath  string    `json:"filePath" db:"file_path"` // Legacy field for local files
	S3Key     string    `json:"s3Key" db:"s3_key"`       // S3 key for cloud storage
	S3URL     string    `json:"s3Url" db:"s3_url"`       // S3 URL for cloud storage
	Size      int64     `json:"size" db:"size"`
	MimeType  string    `json:"mimeType" db:"mime_type"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// Share represents a file share
type Share struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	FileID        uuid.UUID  `json:"fileId" db:"file_id"`
	File          *File      `json:"file,omitempty"`
	ShareToken    string     `json:"shareToken" db:"share_token"`
	IsPublic      bool       `json:"isPublic" db:"is_public"`
	DownloadCount int        `json:"downloadCount" db:"download_count"`
	ExpiresAt     *time.Time `json:"expiresAt,omitempty" db:"expires_at"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time  `json:"updatedAt" db:"updated_at"`
}

// Download represents a download record for analytics
type Download struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	FileID    uuid.UUID  `json:"fileId" db:"file_id"`
	File      *File      `json:"file,omitempty"`
	UserID    *uuid.UUID `json:"userId,omitempty" db:"user_id"` // null for anonymous downloads
	IPAddress string     `json:"ipAddress" db:"ip_address"`
	UserAgent string     `json:"userAgent" db:"user_agent"`
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
}

// FileStats represents file statistics for a user
type FileStats struct {
	TotalFiles      int             `json:"totalFiles"`
	UniqueFiles     int             `json:"uniqueFiles"`
	TotalSize       int64           `json:"totalSize"`
	FilesByMimeType []MimeTypeCount `json:"filesByMimeType"`
}

// MimeTypeCount represents a count of files by MIME type
type MimeTypeCount struct {
	MimeType string `json:"mimeType"`
	Count    int    `json:"count"`
}
