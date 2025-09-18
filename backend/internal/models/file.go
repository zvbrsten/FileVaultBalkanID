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
	UploaderID   uuid.UUID `json:"uploaderId" db:"uploader_id"`
	Uploader     *User     `json:"uploader,omitempty"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}
