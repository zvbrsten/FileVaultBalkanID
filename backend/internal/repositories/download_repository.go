package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// DownloadRepository handles download-related database operations
type DownloadRepository struct {
	db *sql.DB
}

// NewDownloadRepository creates a new download repository
func NewDownloadRepository(db *sql.DB) *DownloadRepository {
	return &DownloadRepository{db: db}
}

// Create creates a new download record
func (r *DownloadRepository) Create(download *models.Download) error {
	query := `
		INSERT INTO downloads (id, file_id, user_id, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at
	`

	err := r.db.QueryRow(
		query,
		download.ID,
		download.FileID,
		download.UserID,
		download.IPAddress,
		download.UserAgent,
	).Scan(&download.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create download: %w", err)
	}

	return nil
}

// GetByID retrieves a download by ID
func (r *DownloadRepository) GetByID(id uuid.UUID) (*models.Download, error) {
	query := `
		SELECT d.id, d.file_id, d.user_id, d.ip_address, d.user_agent, d.created_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM downloads d
		LEFT JOIN files f ON d.file_id = f.id
		WHERE d.id = $1
	`

	download := &models.Download{}
	file := &models.File{}

	err := r.db.QueryRow(query, id).Scan(
		&download.ID,
		&download.FileID,
		&download.UserID,
		&download.IPAddress,
		&download.UserAgent,
		&download.CreatedAt,
		&file.ID,
		&file.Filename,
		&file.OriginalName,
		&file.MimeType,
		&file.Size,
		&file.Hash,
		&file.UploaderID,
		&file.CreatedAt,
		&file.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("download not found")
		}
		return nil, fmt.Errorf("failed to get download: %w", err)
	}

	download.File = file
	return download, nil
}

// GetByFileID retrieves all downloads for a specific file
func (r *DownloadRepository) GetByFileID(fileID uuid.UUID, limit, offset int) ([]*models.Download, error) {
	query := `
		SELECT d.id, d.file_id, d.user_id, d.ip_address, d.user_agent, d.created_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM downloads d
		LEFT JOIN files f ON d.file_id = f.id
		WHERE d.file_id = $1
		ORDER BY d.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, fileID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get downloads: %w", err)
	}
	defer rows.Close()

	var downloads []*models.Download
	for rows.Next() {
		download := &models.Download{}
		file := &models.File{}

		err := rows.Scan(
			&download.ID,
			&download.FileID,
			&download.UserID,
			&download.IPAddress,
			&download.UserAgent,
			&download.CreatedAt,
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.UploaderID,
			&file.CreatedAt,
			&file.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan download: %w", err)
		}

		download.File = file
		downloads = append(downloads, download)
	}

	return downloads, nil
}

// GetByUserID retrieves all downloads for a specific user
func (r *DownloadRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.Download, error) {
	query := `
		SELECT d.id, d.file_id, d.user_id, d.ip_address, d.user_agent, d.created_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM downloads d
		LEFT JOIN files f ON d.file_id = f.id
		WHERE d.user_id = $1
		ORDER BY d.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get user downloads: %w", err)
	}
	defer rows.Close()

	var downloads []*models.Download
	for rows.Next() {
		download := &models.Download{}
		file := &models.File{}

		err := rows.Scan(
			&download.ID,
			&download.FileID,
			&download.UserID,
			&download.IPAddress,
			&download.UserAgent,
			&download.CreatedAt,
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.UploaderID,
			&file.CreatedAt,
			&file.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan download: %w", err)
		}

		download.File = file
		downloads = append(downloads, download)
	}

	return downloads, nil
}

// Delete deletes a download record
func (r *DownloadRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM downloads WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete download: %w", err)
	}

	return nil
}

