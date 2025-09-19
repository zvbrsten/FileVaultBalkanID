package repositories

import (
	"github.com/google/uuid"
)

// AdminRepository handles admin-specific database operations
type AdminRepository struct {
	fileRepo *FileRepository
	userRepo *UserRepository
}

// NewAdminRepository creates a new admin repository
func NewAdminRepository(fileRepo *FileRepository, userRepo *UserRepository) *AdminRepository {
	return &AdminRepository{
		fileRepo: fileRepo,
		userRepo: userRepo,
	}
}

// GetTotalFiles returns the total number of files
func (r *AdminRepository) GetTotalFiles() (int64, error) {
	return r.fileRepo.GetTotalFiles()
}

// GetUniqueFiles returns the number of unique files (non-duplicates)
func (r *AdminRepository) GetUniqueFiles() (int64, error) {
	return r.fileRepo.GetUniqueFiles()
}

// GetTotalStorage returns the total storage used by all files
func (r *AdminRepository) GetTotalStorage() (int64, error) {
	return r.fileRepo.GetTotalStorage()
}

// GetFileCountByUser returns the number of files for a specific user
func (r *AdminRepository) GetFileCountByUser(userID uuid.UUID) (int64, error) {
	return r.fileRepo.GetFileCountByUser(userID)
}

// GetStorageUsedByUser returns the storage used by a specific user
func (r *AdminRepository) GetStorageUsedByUser(userID uuid.UUID) (int64, error) {
	return r.fileRepo.GetStorageUsedByUser(userID)
}

// DeleteByUserID deletes all files for a specific user
func (r *AdminRepository) DeleteByUserID(userID uuid.UUID) error {
	return r.fileRepo.DeleteByUserID(userID)
}
