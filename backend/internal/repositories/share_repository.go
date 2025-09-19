package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// ShareRepository handles share-related database operations
type ShareRepository struct {
	db *sql.DB
}

// NewShareRepository creates a new share repository
func NewShareRepository(db *sql.DB) *ShareRepository {
	return &ShareRepository{db: db}
}

// Create creates a new share record
func (r *ShareRepository) Create(share *models.Share) error {
	query := `
		INSERT INTO shares (id, file_id, share_token, is_public, download_count, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		share.ID,
		share.FileID,
		share.ShareToken,
		share.IsPublic,
		share.DownloadCount,
		share.ExpiresAt,
		share.CreatedAt,
		share.UpdatedAt,
	).Scan(&share.CreatedAt, &share.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create share: %w", err)
	}

	return nil
}

// GetByID retrieves a share by ID
func (r *ShareRepository) GetByID(id uuid.UUID) (*models.Share, error) {
	query := `
		SELECT s.id, s.file_id, s.share_token, s.is_public, s.download_count, s.expires_at, s.created_at, s.updated_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM shares s
		LEFT JOIN files f ON s.file_id = f.id
		WHERE s.id = $1
	`

	share := &models.Share{}
	file := &models.File{}

	err := r.db.QueryRow(query, id).Scan(
		&share.ID,
		&share.FileID,
		&share.ShareToken,
		&share.IsPublic,
		&share.DownloadCount,
		&share.ExpiresAt,
		&share.CreatedAt,
		&share.UpdatedAt,
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
			return nil, fmt.Errorf("share not found")
		}
		return nil, fmt.Errorf("failed to get share: %w", err)
	}

	share.File = file
	return share, nil
}

// GetByShareToken retrieves a share by share token
func (r *ShareRepository) GetByShareToken(shareToken string) (*models.Share, error) {
	query := `
		SELECT s.id, s.file_id, s.share_token, s.is_public, s.download_count, s.expires_at, s.created_at, s.updated_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM shares s
		LEFT JOIN files f ON s.file_id = f.id
		WHERE s.share_token = $1
	`

	share := &models.Share{}
	file := &models.File{}

	err := r.db.QueryRow(query, shareToken).Scan(
		&share.ID,
		&share.FileID,
		&share.ShareToken,
		&share.IsPublic,
		&share.DownloadCount,
		&share.ExpiresAt,
		&share.CreatedAt,
		&share.UpdatedAt,
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
			return nil, fmt.Errorf("share not found")
		}
		return nil, fmt.Errorf("failed to get share: %w", err)
	}

	share.File = file
	return share, nil
}

// GetByFileID retrieves all shares for a specific file
func (r *ShareRepository) GetByFileID(fileID uuid.UUID) ([]*models.Share, error) {
	query := `
		SELECT s.id, s.file_id, s.share_token, s.is_public, s.download_count, s.expires_at, s.created_at, s.updated_at,
		       f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.uploader_id, f.created_at, f.updated_at
		FROM shares s
		LEFT JOIN files f ON s.file_id = f.id
		WHERE s.file_id = $1
		ORDER BY s.created_at DESC
	`

	rows, err := r.db.Query(query, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shares: %w", err)
	}
	defer rows.Close()

	var shares []*models.Share
	for rows.Next() {
		share := &models.Share{}
		file := &models.File{}

		err := rows.Scan(
			&share.ID,
			&share.FileID,
			&share.ShareToken,
			&share.IsPublic,
			&share.DownloadCount,
			&share.ExpiresAt,
			&share.CreatedAt,
			&share.UpdatedAt,
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
			return nil, fmt.Errorf("failed to scan share: %w", err)
		}

		share.File = file
		shares = append(shares, share)
	}

	return shares, nil
}

// Update updates a share
func (r *ShareRepository) Update(share *models.Share) error {
	query := `
		UPDATE shares
		SET is_public = $2, download_count = $3, expires_at = $4, updated_at = $5
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.QueryRow(query, share.ID, share.IsPublic, share.DownloadCount, share.ExpiresAt, share.UpdatedAt).Scan(&share.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update share: %w", err)
	}

	return nil
}

// IncrementDownloadCount increments the download count for a share
func (r *ShareRepository) IncrementDownloadCount(shareID uuid.UUID) error {
	query := `
		UPDATE shares
		SET download_count = download_count + 1, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(query, shareID)
	if err != nil {
		return fmt.Errorf("failed to increment download count: %w", err)
	}

	return nil
}

// DeleteByFileID deletes all shares for a specific file
func (r *ShareRepository) DeleteByFileID(fileID string) error {
	query := `DELETE FROM shares WHERE file_id = $1`
	_, err := r.db.Exec(query, fileID)
	if err != nil {
		return fmt.Errorf("failed to delete shares by file ID: %w", err)
	}

	return nil
}

// Delete deletes a share
func (r *ShareRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM shares WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete share: %w", err)
	}

	return nil
}
