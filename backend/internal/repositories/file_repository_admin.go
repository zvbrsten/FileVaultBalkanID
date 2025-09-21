package repositories

import (
	"fmt"

	"github.com/google/uuid"
)

// Admin-specific methods for FileRepository

// GetTotalFiles returns the total number of files
func (r *FileRepository) GetTotalFiles() (int64, error) {
	query := `SELECT COUNT(*) FROM files`
	var count int64
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get total files: %w", err)
	}
	return count, nil
}

// GetUniqueFiles returns the number of unique files (by hash)
func (r *FileRepository) GetUniqueFiles() (int64, error) {
	query := `SELECT COUNT(DISTINCT hash) FROM files`
	var count int64
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get unique files: %w", err)
	}
	return count, nil
}

// GetTotalStorage returns the total storage used by all files
func (r *FileRepository) GetTotalStorage() (int64, error) {
	query := `SELECT COALESCE(SUM(size), 0) FROM files`
	var total int64
	err := r.db.QueryRow(query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to get total storage: %w", err)
	}
	return total, nil
}

// GetFileCountByUser returns the number of files for a specific user
func (r *FileRepository) GetFileCountByUser(userID uuid.UUID) (int64, error) {
	query := `SELECT COUNT(*) FROM files WHERE uploader_id = $1`
	var count int64
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get file count by user: %w", err)
	}
	return count, nil
}

// GetStorageUsedByUser returns the storage used by a specific user
func (r *FileRepository) GetStorageUsedByUser(userID uuid.UUID) (int64, error) {
	query := `SELECT COALESCE(SUM(size), 0) FROM files WHERE uploader_id = $1`
	var total int64
	err := r.db.QueryRow(query, userID).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to get storage used by user: %w", err)
	}
	return total, nil
}

// DeleteByUserID deletes all files for a specific user
func (r *FileRepository) DeleteByUserID(userID uuid.UUID) error {
	query := `DELETE FROM files WHERE uploader_id = $1`
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete files by user ID: %w", err)
	}
	return nil
}
