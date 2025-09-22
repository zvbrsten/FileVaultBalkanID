package repositories

import (
	"database/sql"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// UserFileShareRepository handles database operations for user file shares
type UserFileShareRepository struct {
	db *sql.DB
}

// NewUserFileShareRepository creates a new user file share repository
func NewUserFileShareRepository(db *sql.DB) *UserFileShareRepository {
	return &UserFileShareRepository{db: db}
}

// Create creates a new user file share
func (r *UserFileShareRepository) Create(share *models.UserFileShare) error {
	query := `
		INSERT INTO user_file_shares (id, file_id, from_user_id, to_user_id, message, is_read, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(query,
		share.ID,
		share.FileID,
		share.FromUserID,
		share.ToUserID,
		share.Message,
		share.IsRead,
		share.CreatedAt,
		share.UpdatedAt,
	)

	return err
}

// GetByID retrieves a user file share by ID
func (r *UserFileShareRepository) GetByID(id uuid.UUID) (*models.UserFileShare, error) {
	query := `
		SELECT id, file_id, from_user_id, to_user_id, message, is_read, created_at, updated_at
		FROM user_file_shares
		WHERE id = $1
	`

	share := &models.UserFileShare{}
	err := r.db.QueryRow(query, id).Scan(
		&share.ID,
		&share.FileID,
		&share.FromUserID,
		&share.ToUserID,
		&share.Message,
		&share.IsRead,
		&share.CreatedAt,
		&share.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return share, nil
}

// GetByIDWithDetails retrieves a user file share by ID with file and user details
func (r *UserFileShareRepository) GetByIDWithDetails(id uuid.UUID) (*models.UserFileShare, error) {
	query := `
		SELECT 
			ufs.id, ufs.file_id, ufs.from_user_id, ufs.to_user_id, ufs.message, ufs.is_read, ufs.created_at, ufs.updated_at,
			f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
			from_user.id, from_user.email, from_user.username, from_user.role, from_user.created_at, from_user.updated_at,
			to_user.id, to_user.email, to_user.username, to_user.role, to_user.created_at, to_user.updated_at
		FROM user_file_shares ufs
		JOIN files f ON ufs.file_id = f.id
		JOIN users from_user ON ufs.from_user_id = from_user.id
		JOIN users to_user ON ufs.to_user_id = to_user.id
		WHERE ufs.id = $1
	`

	share := &models.UserFileShare{}
	file := &models.File{}
	fromUser := &models.User{}
	toUser := &models.User{}

	err := r.db.QueryRow(query, id).Scan(
		&share.ID, &share.FileID, &share.FromUserID, &share.ToUserID, &share.Message, &share.IsRead, &share.CreatedAt, &share.UpdatedAt,
		&file.ID, &file.Filename, &file.OriginalName, &file.MimeType, &file.Size, &file.Hash, &file.S3Key, &file.UploaderID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt,
		&fromUser.ID, &fromUser.Email, &fromUser.Username, &fromUser.Role, &fromUser.CreatedAt, &fromUser.UpdatedAt,
		&toUser.ID, &toUser.Email, &toUser.Username, &toUser.Role, &toUser.CreatedAt, &toUser.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	share.File = file
	share.FromUser = fromUser
	share.ToUser = toUser

	return share, nil
}

// GetIncomingShares retrieves all files shared with a user
func (r *UserFileShareRepository) GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShare, error) {
	query := `
		SELECT 
			ufs.id, ufs.file_id, ufs.from_user_id, ufs.to_user_id, ufs.message, ufs.is_read, ufs.created_at, ufs.updated_at,
			f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
			from_user.id, from_user.email, from_user.username, from_user.role, from_user.created_at, from_user.updated_at
		FROM user_file_shares ufs
		JOIN files f ON ufs.file_id = f.id
		JOIN users from_user ON ufs.from_user_id = from_user.id
		WHERE ufs.to_user_id = $1
		ORDER BY ufs.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shares []*models.UserFileShare
	for rows.Next() {
		share := &models.UserFileShare{}
		file := &models.File{}
		fromUser := &models.User{}

		err := rows.Scan(
			&share.ID, &share.FileID, &share.FromUserID, &share.ToUserID, &share.Message, &share.IsRead, &share.CreatedAt, &share.UpdatedAt,
			&file.ID, &file.Filename, &file.OriginalName, &file.MimeType, &file.Size, &file.Hash, &file.S3Key, &file.UploaderID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt,
			&fromUser.ID, &fromUser.Email, &fromUser.Username, &fromUser.Role, &fromUser.CreatedAt, &fromUser.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		share.File = file
		share.FromUser = fromUser
		shares = append(shares, share)
	}

	return shares, nil
}

// GetOutgoingShares retrieves all files shared by a user
func (r *UserFileShareRepository) GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShare, error) {
	query := `
		SELECT 
			ufs.id, ufs.file_id, ufs.from_user_id, ufs.to_user_id, ufs.message, ufs.is_read, ufs.created_at, ufs.updated_at,
			f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
			to_user.id, to_user.email, to_user.username, to_user.role, to_user.created_at, to_user.updated_at
		FROM user_file_shares ufs
		JOIN files f ON ufs.file_id = f.id
		JOIN users to_user ON ufs.to_user_id = to_user.id
		WHERE ufs.from_user_id = $1
		ORDER BY ufs.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shares []*models.UserFileShare
	for rows.Next() {
		share := &models.UserFileShare{}
		file := &models.File{}
		toUser := &models.User{}

		err := rows.Scan(
			&share.ID, &share.FileID, &share.FromUserID, &share.ToUserID, &share.Message, &share.IsRead, &share.CreatedAt, &share.UpdatedAt,
			&file.ID, &file.Filename, &file.OriginalName, &file.MimeType, &file.Size, &file.Hash, &file.S3Key, &file.UploaderID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt,
			&toUser.ID, &toUser.Email, &toUser.Username, &toUser.Role, &toUser.CreatedAt, &toUser.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		share.File = file
		share.ToUser = toUser
		shares = append(shares, share)
	}

	return shares, nil
}

// MarkAsRead marks a user file share as read
func (r *UserFileShareRepository) MarkAsRead(id uuid.UUID) error {
	query := `
		UPDATE user_file_shares 
		SET is_read = true, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(query, id)
	return err
}

// GetUnreadCount returns the number of unread shares for a user
func (r *UserFileShareRepository) GetUnreadCount(userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM user_file_shares
		WHERE to_user_id = $1 AND is_read = false
	`

	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

// Delete deletes a user file share
func (r *UserFileShareRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM user_file_shares WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// CheckIfAlreadyShared checks if a file is already shared with a user
func (r *UserFileShareRepository) CheckIfAlreadyShared(fileID, toUserID uuid.UUID) (bool, error) {
	query := `
		SELECT COUNT(*)
		FROM user_file_shares
		WHERE file_id = $1 AND to_user_id = $2
	`

	var count int
	err := r.db.QueryRow(query, fileID, toUserID).Scan(&count)
	return count > 0, err
}
