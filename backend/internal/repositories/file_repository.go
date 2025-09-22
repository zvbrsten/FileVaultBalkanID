package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"

	"github.com/google/uuid"
)

type FileRepository struct {
	db *sql.DB
}

func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{db: db}
}

// Create creates a new file record
func (r *FileRepository) Create(file *models.File) error {
	query := `
	INSERT INTO files (id, filename, original_name, mime_type, size, hash, s3_key, uploader_id, folder_id)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		file.ID,
		file.Filename,
		file.OriginalName,
		file.MimeType,
		file.Size,
		file.Hash,
		file.S3Key,
		file.UploaderID,
		file.FolderID,
	).Scan(&file.CreatedAt, &file.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}

	return nil
}

// GetByID retrieves a file by ID
func (r *FileRepository) GetByID(id uuid.UUID) (*models.File, error) {
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.id = $1
	`

	file := &models.File{}
	uploader := &models.User{}

	err := r.db.QueryRow(query, id).Scan(
		&file.ID,
		&file.Filename,
		&file.OriginalName,
		&file.MimeType,
		&file.Size,
		&file.Hash,
		&file.S3Key,
		&file.UploaderID,
		&file.FolderID,
		&file.CreatedAt,
		&file.UpdatedAt,
		&uploader.ID,
		&uploader.Email,
		&uploader.Username,
		&uploader.Role,
		&uploader.CreatedAt,
		&uploader.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	file.Uploader = uploader
	return file, nil
}

// GetByUserID retrieves files for a specific user
func (r *FileRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.File, error) {
	fmt.Printf("DEBUG: FileRepository.GetByUserID called - User: %s, Limit: %d, Offset: %d\n", userID, limit, offset)
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.uploader_id = $1
		ORDER BY f.created_at DESC
		LIMIT $2 OFFSET $3
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)
	fmt.Printf("DEBUG: Query parameters: userID=%s, limit=%d, offset=%d\n", userID, limit, offset)

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		fmt.Printf("ERROR: FileRepository.GetByUserID query failed: %v\n", err)
		return nil, fmt.Errorf("failed to get files: %w", err)
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		file := &models.File{}
		uploader := &models.User{}

		err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.S3Key,
			&file.UploaderID,
			&file.FolderID,
			&file.CreatedAt,
			&file.UpdatedAt,
			&uploader.ID,
			&uploader.Email,
			&uploader.Username,
			&uploader.Role,
			&uploader.CreatedAt,
			&uploader.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}

		file.Uploader = uploader
		files = append(files, file)
	}

	return files, nil
}

// SearchByUserID searches files for a specific user
func (r *FileRepository) SearchByUserID(userID uuid.UUID, searchTerm string, limit, offset int) ([]*models.File, error) {
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.uploader_id = $1 AND (f.original_name ILIKE $2 OR f.filename ILIKE $2)
		ORDER BY f.created_at DESC
		LIMIT $3 OFFSET $4
	`

	searchPattern := "%" + searchTerm + "%"
	rows, err := r.db.Query(query, userID, searchPattern, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search files: %w", err)
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		file := &models.File{}
		uploader := &models.User{}

		err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.S3Key,
			&file.UploaderID,
			&file.FolderID,
			&file.CreatedAt,
			&file.UpdatedAt,
			&uploader.ID,
			&uploader.Email,
			&uploader.Username,
			&uploader.Role,
			&uploader.CreatedAt,
			&uploader.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}

		file.Uploader = uploader
		files = append(files, file)
	}

	return files, nil
}

// GetByHash retrieves files by hash
func (r *FileRepository) GetByHash(hash string) ([]*models.File, error) {
	query := `
		SELECT id, filename, original_name, mime_type, size, hash, s3_key, uploader_id, folder_id, created_at, updated_at
		FROM files
		WHERE hash = $1
	`

	rows, err := r.db.Query(query, hash)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by hash: %w", err)
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		file := &models.File{}
		err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.S3Key,
			&file.UploaderID,
			&file.FolderID,
			&file.CreatedAt,
			&file.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}
		files = append(files, file)
	}

	return files, nil
}

// Delete deletes a file by ID
func (r *FileRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM files WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

// GetByUserIDAndFolderID retrieves files for a specific user in a specific folder
func (r *FileRepository) GetByUserIDAndFolderID(userID uuid.UUID, folderID uuid.UUID, limit, offset int) ([]*models.File, error) {
	fmt.Printf("DEBUG: FileRepository.GetByUserIDAndFolderID called - User: %s, Folder: %s\n", userID, folderID)
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.s3_key, f.uploader_id, f.folder_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.uploader_id = $1 AND f.folder_id = $2
		ORDER BY f.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.Query(query, userID, folderID, limit, offset)
	if err != nil {
		fmt.Printf("ERROR: FileRepository.GetByUserIDAndFolderID failed: %v\n", err)
		return nil, fmt.Errorf("failed to get files by folder: %w", err)
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		file := &models.File{}
		uploader := &models.User{}

		err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.OriginalName,
			&file.MimeType,
			&file.Size,
			&file.Hash,
			&file.S3Key,
			&file.UploaderID,
			&file.FolderID,
			&file.CreatedAt,
			&file.UpdatedAt,
			&uploader.ID,
			&uploader.Email,
			&uploader.Username,
			&uploader.Role,
			&uploader.CreatedAt,
			&uploader.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("ERROR: FileRepository.GetByUserIDAndFolderID - failed to scan row: %v\n", err)
			return nil, fmt.Errorf("failed to scan file row: %w", err)
		}

		file.Uploader = uploader
		files = append(files, file)
	}
	fmt.Printf("DEBUG: FileRepository.GetByUserIDAndFolderID successful, retrieved %d files\n", len(files))
	return files, nil
}

// GetDB returns the database connection
func (r *FileRepository) GetDB() *sql.DB {
	return r.db
}
