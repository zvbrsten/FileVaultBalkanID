package repositories

import (
	"database/sql"
	"filevault/internal/models"

	"github.com/google/uuid"
)

// FileRepositoryInterface defines the interface for file repository operations
type FileRepositoryInterface interface {
	Create(file *models.File) error
	GetByID(id uuid.UUID) (*models.File, error)
	GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.File, error)
	GetByUserIDAndFolderID(userID uuid.UUID, folderID uuid.UUID, limit, offset int) ([]*models.File, error)
	SearchByUserID(userID uuid.UUID, searchTerm string, limit, offset int) ([]*models.File, error)
	GetByHash(hash string) ([]*models.File, error)
	Delete(id uuid.UUID) error
	GetDB() *sql.DB
}

// FileHashRepositoryInterface defines the interface for file hash repository operations
type FileHashRepositoryInterface interface {
	Create(fileHash *models.FileHash) error
	GetByHash(hash string) (*models.FileHash, error)
	Delete(hash string) error
}

// ShareRepositoryInterface defines the interface for share repository operations
type ShareRepositoryInterface interface {
	Create(share *models.Share) error
	GetByID(id uuid.UUID) (*models.Share, error)
	GetByFileID(fileID uuid.UUID) ([]*models.Share, error)
	Delete(id uuid.UUID) error
}

// DownloadRepositoryInterface defines the interface for download repository operations
type DownloadRepositoryInterface interface {
	Create(download *models.Download) error
	GetByFileID(fileID uuid.UUID, limit, offset int) ([]*models.Download, error)
	GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.Download, error)
}
