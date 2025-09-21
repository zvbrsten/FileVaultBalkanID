package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// FileShareRepository handles file share database operations
type FileShareRepository struct {
	db *sql.DB
}

// NewFileShareRepository creates a new file share repository
func NewFileShareRepository(db *sql.DB) *FileShareRepository {
	return &FileShareRepository{db: db}
}

// Create creates a new file share
func (r *FileShareRepository) Create(share *models.FileShare) error {
	fmt.Printf("DEBUG: FileShareRepository.Create called with share: %+v\n", share)

	query := `
		INSERT INTO file_shares (id, file_id, share_token, is_active, expires_at, max_downloads)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING share_token, created_at, updated_at, download_count
	`

	fmt.Printf("DEBUG: Executing SQL query with params: ID=%s, FileID=%s, ShareToken='%s', IsActive=%t, ExpiresAt=%v, MaxDownloads=%v\n",
		share.ID, share.FileID, share.ShareToken, share.IsActive, share.ExpiresAt, share.MaxDownloads)

	err := r.db.QueryRow(
		query,
		share.ID,
		share.FileID,
		share.ShareToken,
		share.IsActive,
		share.ExpiresAt,
		share.MaxDownloads,
	).Scan(&share.ShareToken, &share.CreatedAt, &share.UpdatedAt, &share.DownloadCount)

	if err != nil {
		fmt.Printf("DEBUG: Database error creating file share: %v\n", err)
		return fmt.Errorf("failed to create file share: %w", err)
	}

	fmt.Printf("DEBUG: File share created successfully in database. Token: %s, CreatedAt: %v, DownloadCount: %d\n",
		share.ShareToken, share.CreatedAt, share.DownloadCount)
	return nil
}

// GetByToken retrieves a file share by its token
func (r *FileShareRepository) GetByToken(token string) (*models.FileShare, error) {
	query := `
		SELECT fs.id, fs.file_id, fs.share_token, fs.is_active, fs.expires_at, 
		       fs.download_count, fs.max_downloads, fs.created_at, fs.updated_at
		FROM file_shares fs
		WHERE fs.share_token = $1
	`

	share := &models.FileShare{}
	err := r.db.QueryRow(query, token).Scan(
		&share.ID,
		&share.FileID,
		&share.ShareToken,
		&share.IsActive,
		&share.ExpiresAt,
		&share.DownloadCount,
		&share.MaxDownloads,
		&share.CreatedAt,
		&share.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file share not found")
		}
		return nil, fmt.Errorf("failed to get file share: %w", err)
	}

	return share, nil
}

// GetByID retrieves a file share by its ID
func (r *FileShareRepository) GetByID(id uuid.UUID) (*models.FileShare, error) {
	query := `
		SELECT id, file_id, share_token, is_active, expires_at, 
		       download_count, max_downloads, created_at, updated_at
		FROM file_shares
		WHERE id = $1
	`

	share := &models.FileShare{}
	err := r.db.QueryRow(query, id).Scan(
		&share.ID,
		&share.FileID,
		&share.ShareToken,
		&share.IsActive,
		&share.ExpiresAt,
		&share.DownloadCount,
		&share.MaxDownloads,
		&share.CreatedAt,
		&share.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file share not found")
		}
		return nil, fmt.Errorf("failed to get file share: %w", err)
	}

	return share, nil
}

// GetByTokenWithFile retrieves a file share with its associated file
func (r *FileShareRepository) GetByTokenWithFile(token string) (*models.FileShare, error) {
	query := `
		SELECT fs.id, fs.file_id, fs.share_token, fs.is_active, fs.expires_at, 
		       fs.download_count, fs.max_downloads, fs.created_at, fs.updated_at,
		       f.id, f.original_name, f.filename, f.size, f.mime_type, 
		       f.hash, f.s3_key, f.uploader_id, f.is_duplicate, f.created_at, f.updated_at
		FROM file_shares fs
		JOIN files f ON fs.file_id = f.id
		WHERE fs.share_token = $1
	`

	share := &models.FileShare{}
	file := &models.File{}

	var s3Key sql.NullString
	err := r.db.QueryRow(query, token).Scan(
		&share.ID,
		&share.FileID,
		&share.ShareToken,
		&share.IsActive,
		&share.ExpiresAt,
		&share.DownloadCount,
		&share.MaxDownloads,
		&share.CreatedAt,
		&share.UpdatedAt,
		&file.ID,
		&file.OriginalName,
		&file.Filename,
		&file.Size,
		&file.MimeType,
		&file.Hash,
		&s3Key,
		&file.UploaderID,
		&file.IsDuplicate,
		&file.CreatedAt,
		&file.UpdatedAt,
	)

	if err == nil {
		if s3Key.Valid {
			file.S3Key = s3Key.String
		} else {
			file.S3Key = ""
		}
	}

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file share not found")
		}
		return nil, fmt.Errorf("failed to get file share: %w", err)
	}

	share.File = file
	return share, nil
}

// GetByFileID retrieves all shares for a specific file
func (r *FileShareRepository) GetByFileID(fileID uuid.UUID) ([]*models.FileShare, error) {
	query := `
		SELECT id, file_id, share_token, is_active, expires_at, 
		       download_count, max_downloads, created_at, updated_at
		FROM file_shares
		WHERE file_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to get file shares: %w", err)
	}
	defer rows.Close()

	var shares []*models.FileShare
	for rows.Next() {
		share := &models.FileShare{}
		err := rows.Scan(
			&share.ID,
			&share.FileID,
			&share.ShareToken,
			&share.IsActive,
			&share.ExpiresAt,
			&share.DownloadCount,
			&share.MaxDownloads,
			&share.CreatedAt,
			&share.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file share: %w", err)
		}
		shares = append(shares, share)
	}

	return shares, nil
}

// Update updates a file share
func (r *FileShareRepository) Update(share *models.FileShare) error {
	query := `
		UPDATE file_shares
		SET is_active = $2, expires_at = $3, max_downloads = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.QueryRow(query, share.ID, share.IsActive, share.ExpiresAt, share.MaxDownloads).Scan(&share.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update file share: %w", err)
	}

	return nil
}

// IncrementDownloadCount increments the download count for a file share
func (r *FileShareRepository) IncrementDownloadCount(shareID uuid.UUID) error {
	query := `
		UPDATE file_shares
		SET download_count = download_count + 1, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(query, shareID)
	if err != nil {
		return fmt.Errorf("failed to increment download count: %w", err)
	}

	return nil
}

// Delete deletes a file share
func (r *FileShareRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM file_shares WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete file share: %w", err)
	}

	return nil
}

// DeleteByFileID deletes all shares for a specific file
func (r *FileShareRepository) DeleteByFileID(fileID uuid.UUID) error {
	query := `DELETE FROM file_shares WHERE file_id = $1`
	_, err := r.db.Exec(query, fileID)
	if err != nil {
		return fmt.Errorf("failed to delete file shares: %w", err)
	}

	return nil
}

// LogDownload logs a download event
func (r *FileShareRepository) LogDownload(log *models.DownloadLog) error {
	query := `
		INSERT INTO download_logs (id, share_id, ip_address, user_agent)
		VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.Exec(query, log.ID, log.ShareID, log.IPAddress, log.UserAgent)
	if err != nil {
		return fmt.Errorf("failed to log download: %w", err)
	}

	return nil
}

// GetDownloadStats retrieves download statistics for a file share
func (r *FileShareRepository) GetDownloadStats(shareID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM download_logs WHERE share_id = $1`
	var count int
	err := r.db.QueryRow(query, shareID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get download stats: %w", err)
	}
	return count, nil
}

// GetRecentDownloads retrieves recent download logs for a file share
func (r *FileShareRepository) GetRecentDownloads(shareID uuid.UUID, limit int) ([]*models.DownloadLog, error) {
	query := `
		SELECT id, share_id, ip_address, user_agent, downloaded_at
		FROM download_logs
		WHERE share_id = $1
		ORDER BY downloaded_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, shareID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent downloads: %w", err)
	}
	defer rows.Close()

	var logs []*models.DownloadLog
	for rows.Next() {
		log := &models.DownloadLog{}
		err := rows.Scan(
			&log.ID,
			&log.ShareID,
			&log.IPAddress,
			&log.UserAgent,
			&log.DownloadedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan download log: %w", err)
		}
		logs = append(logs, log)
	}

	return logs, nil
}



