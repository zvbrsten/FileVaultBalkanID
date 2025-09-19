package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"
)

// FileHashRepository handles file hash-related database operations
type FileHashRepository struct {
	db *sql.DB
}

// NewFileHashRepository creates a new file hash repository
func NewFileHashRepository(db *sql.DB) *FileHashRepository {
	return &FileHashRepository{db: db}
}

// Create creates a new file hash record
func (r *FileHashRepository) Create(fileHash *models.FileHash) error {
	query := `
		INSERT INTO file_hashes (id, hash, file_path, s3_key, s3_url, size, mime_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at
	`

	err := r.db.QueryRow(
		query,
		fileHash.ID,
		fileHash.Hash,
		fileHash.FilePath,
		fileHash.S3Key,
		fileHash.S3URL,
		fileHash.Size,
		fileHash.MimeType,
	).Scan(&fileHash.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create file hash: %w", err)
	}

	return nil
}

// GetByHash retrieves a file hash by hash
func (r *FileHashRepository) GetByHash(hash string) (*models.FileHash, error) {
	query := `
		SELECT id, hash, file_path, s3_key, s3_url, size, mime_type, created_at
		FROM file_hashes
		WHERE hash = $1
	`

	fileHash := &models.FileHash{}
	err := r.db.QueryRow(query, hash).Scan(
		&fileHash.ID,
		&fileHash.Hash,
		&fileHash.FilePath,
		&fileHash.S3Key,
		&fileHash.S3URL,
		&fileHash.Size,
		&fileHash.MimeType,
		&fileHash.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file hash not found")
		}
		return nil, fmt.Errorf("failed to get file hash: %w", err)
	}

	return fileHash, nil
}

// Delete deletes a file hash
func (r *FileHashRepository) Delete(hash string) error {
	query := `DELETE FROM file_hashes WHERE hash = $1`
	_, err := r.db.Exec(query, hash)
	if err != nil {
		return fmt.Errorf("failed to delete file hash: %w", err)
	}

	return nil
}

// Exists checks if a file hash exists
func (r *FileHashRepository) Exists(hash string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM file_hashes WHERE hash = $1)`
	var exists bool
	err := r.db.QueryRow(query, hash).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check file hash existence: %w", err)
	}
	return exists, nil
}
