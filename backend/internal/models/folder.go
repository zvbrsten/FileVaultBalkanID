package models

import (
	"time"

	"github.com/google/uuid"
)

// Folder represents a folder in the system
type Folder struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	Name      string     `json:"name" db:"name"`
	Path      string     `json:"path" db:"path"`
	ParentID  *uuid.UUID `json:"parentId,omitempty" db:"parent_id"`
	OwnerID   uuid.UUID  `json:"ownerId" db:"owner_id"`
	FileCount int        `json:"fileCount" db:"file_count"`
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time  `json:"updatedAt" db:"updated_at"`

	// Related data (populated by joins)
	Owner      *User     `json:"owner,omitempty" db:"-"`
	Parent     *Folder   `json:"parent,omitempty" db:"-"`
	Subfolders []*Folder `json:"subfolders,omitempty" db:"-"`
}

// CreateFolderRequest represents the request to create a folder
type CreateFolderRequest struct {
	Name     string     `json:"name" validate:"required,min=1,max=255"`
	ParentID *uuid.UUID `json:"parentId,omitempty"`
}

// UpdateFolderRequest represents the request to update a folder
type UpdateFolderRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255"`
}

// FolderResponse represents the response for folder operations
type FolderResponse struct {
	ID         uuid.UUID         `json:"id"`
	Name       string            `json:"name"`
	Path       string            `json:"path"`
	ParentID   *uuid.UUID        `json:"parentId,omitempty"`
	OwnerID    uuid.UUID         `json:"ownerId"`
	FileCount  int               `json:"fileCount"`
	CreatedAt  time.Time         `json:"createdAt"`
	UpdatedAt  time.Time         `json:"updatedAt"`
	Subfolders []*FolderResponse `json:"subfolders,omitempty"`
}






