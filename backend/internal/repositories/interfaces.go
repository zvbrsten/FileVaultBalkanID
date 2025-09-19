package repositories

import (
	"database/sql"
	"time"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// UserRepositoryInterface defines the interface for user repository operations
type UserRepositoryInterface interface {
	Create(user *models.User) error
	GetByID(id uuid.UUID) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
	Update(user *models.User) error
	Delete(id uuid.UUID) error
	GetAll(limit, offset int) ([]*models.User, error)
	CountUsers() (int, error)
	CountActiveUsers(days int) (int, error)
	CountNewUsersToday() (int, error)
	GetDB() *sql.DB
}

// FileRepositoryInterface defines the interface for file repository operations
type FileRepositoryInterface interface {
	Create(file *models.File) error
	GetByID(id uuid.UUID) (*models.File, error)
	GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.File, error)
	GetFilesByUserID(userID uuid.UUID, limit, offset int) ([]*models.File, error)
	SearchByUserID(userID uuid.UUID, searchTerm string, limit, offset int) ([]*models.File, error)
	GetByHash(hash string) ([]*models.File, error)
	Delete(id uuid.UUID) error
	CountAllFiles() (int, error)
	CountUniqueFiles() (int, error)
	GetTotalStorage() (int64, error)
	GetUniqueStorage() (int64, error)
	GetTopMimeTypes(limit int) ([]*models.MimeTypeCount, error)
	GetFilesByDateRange(startDate, endDate time.Time) ([]*models.File, error)
	GetFilesByUserIDAndDateRange(userID uuid.UUID, startDate, endDate time.Time) ([]*models.File, error)
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
