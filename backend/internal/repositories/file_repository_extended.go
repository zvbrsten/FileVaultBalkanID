package repositories

import (
	"fmt"
	"time"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// SearchFiles performs advanced file search based on criteria
func (r *FileRepository) SearchFiles(criteria map[string]interface{}) ([]*models.File, error) {
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.is_duplicate, f.uploader_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.uploader_id = $1
	`

	args := []interface{}{criteria["user_id"]}
	argIndex := 2

	// Add search term filter
	if searchTerm, ok := criteria["search_term"].(string); ok && searchTerm != "" {
		query += fmt.Sprintf(" AND (f.original_name ILIKE $%d OR f.mime_type ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+searchTerm+"%")
		argIndex++
	}

	// Add MIME type filter
	if mimeTypes, ok := criteria["mime_types"].([]string); ok && len(mimeTypes) > 0 {
		query += fmt.Sprintf(" AND f.mime_type = ANY($%d)", argIndex)
		args = append(args, mimeTypes)
		argIndex++
	}

	// Add size filters
	if minSize, ok := criteria["min_size"].(int64); ok {
		query += fmt.Sprintf(" AND f.size >= $%d", argIndex)
		args = append(args, minSize)
		argIndex++
	}
	if maxSize, ok := criteria["max_size"].(int64); ok {
		query += fmt.Sprintf(" AND f.size <= $%d", argIndex)
		args = append(args, maxSize)
		argIndex++
	}

	// Add date filters
	if dateFrom, ok := criteria["date_from"].(time.Time); ok {
		query += fmt.Sprintf(" AND f.created_at >= $%d", argIndex)
		args = append(args, dateFrom)
		argIndex++
	}
	if dateTo, ok := criteria["date_to"].(time.Time); ok {
		query += fmt.Sprintf(" AND f.created_at <= $%d", argIndex)
		args = append(args, dateTo)
		argIndex++
	}

	// Add duplicate filter
	if isDuplicate, ok := criteria["is_duplicate"].(bool); ok {
		query += fmt.Sprintf(" AND f.is_duplicate = $%d", argIndex)
		args = append(args, isDuplicate)
		argIndex++
	}

	// Add sorting
	sortBy := "created_at"
	if sb, ok := criteria["sort_by"].(string); ok && sb != "" {
		sortBy = sb
	}
	sortOrder := "DESC"
	if so, ok := criteria["sort_order"].(string); ok && so != "" {
		sortOrder = so
	}
	query += fmt.Sprintf(" ORDER BY f.%s %s", sortBy, sortOrder)

	// Add pagination
	if limit, ok := criteria["limit"].(int); ok {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, limit)
		argIndex++
	}
	if offset, ok := criteria["offset"].(int); ok {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, offset)
	}

	rows, err := r.db.Query(query, args...)
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
			&file.IsDuplicate,
			&file.UploaderID,
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

// CountFiles counts files based on search criteria
func (r *FileRepository) CountFiles(criteria map[string]interface{}) (int, error) {
	query := `SELECT COUNT(*) FROM files f WHERE f.uploader_id = $1`
	args := []interface{}{criteria["user_id"]}
	argIndex := 2

	// Add search term filter
	if searchTerm, ok := criteria["search_term"].(string); ok && searchTerm != "" {
		query += fmt.Sprintf(" AND (f.original_name ILIKE $%d OR f.mime_type ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+searchTerm+"%")
		argIndex++
	}

	// Add MIME type filter
	if mimeTypes, ok := criteria["mime_types"].([]string); ok && len(mimeTypes) > 0 {
		query += fmt.Sprintf(" AND f.mime_type = ANY($%d)", argIndex)
		args = append(args, mimeTypes)
		argIndex++
	}

	// Add size filters
	if minSize, ok := criteria["min_size"].(int64); ok {
		query += fmt.Sprintf(" AND f.size >= $%d", argIndex)
		args = append(args, minSize)
		argIndex++
	}
	if maxSize, ok := criteria["max_size"].(int64); ok {
		query += fmt.Sprintf(" AND f.size <= $%d", argIndex)
		args = append(args, maxSize)
		argIndex++
	}

	// Add date filters
	if dateFrom, ok := criteria["date_from"].(time.Time); ok {
		query += fmt.Sprintf(" AND f.created_at >= $%d", argIndex)
		args = append(args, dateFrom)
		argIndex++
	}
	if dateTo, ok := criteria["date_to"].(time.Time); ok {
		query += fmt.Sprintf(" AND f.created_at <= $%d", argIndex)
		args = append(args, dateTo)
		argIndex++
	}

	// Add duplicate filter
	if isDuplicate, ok := criteria["is_duplicate"].(bool); ok {
		query += fmt.Sprintf(" AND f.is_duplicate = $%d", argIndex)
		args = append(args, isDuplicate)
		argIndex++
	}

	var count int
	err := r.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count files: %w", err)
	}

	return count, nil
}

// GetMimeTypeCounts returns MIME type counts for a user
func (r *FileRepository) GetMimeTypeCounts(userID uuid.UUID, limit int) ([]*models.MimeTypeCount, error) {
	query := `
		SELECT mime_type, COUNT(*) as count
		FROM files
		WHERE uploader_id = $1
		GROUP BY mime_type
		ORDER BY count DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get MIME type counts: %w", err)
	}
	defer rows.Close()

	var counts []*models.MimeTypeCount
	for rows.Next() {
		count := &models.MimeTypeCount{}
		err := rows.Scan(&count.MimeType, &count.Count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan MIME type count: %w", err)
		}
		counts = append(counts, count)
	}

	return counts, nil
}

// CountAllFiles returns total file count
func (r *FileRepository) CountAllFiles() (int, error) {
	query := `SELECT COUNT(*) FROM files`
	var count int
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count all files: %w", err)
	}
	return count, nil
}

// CountUniqueFiles returns count of unique files
func (r *FileRepository) CountUniqueFiles() (int, error) {
	query := `SELECT COUNT(DISTINCT hash) FROM files`
	var count int
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count unique files: %w", err)
	}
	return count, nil
}


// GetUniqueStorage returns storage used by unique files only
func (r *FileRepository) GetUniqueStorage() (int64, error) {
	query := `
		SELECT COALESCE(SUM(size), 0) 
		FROM (
			SELECT DISTINCT ON (hash) size 
			FROM files 
			ORDER BY hash, created_at
		) unique_files
	`
	var total int64
	err := r.db.QueryRow(query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to get unique storage: %w", err)
	}
	return total, nil
}

// GetTopMimeTypes returns top MIME types across all files
func (r *FileRepository) GetTopMimeTypes(limit int) ([]*models.MimeTypeCount, error) {
	query := `
		SELECT mime_type, COUNT(*) as count
		FROM files
		GROUP BY mime_type
		ORDER BY count DESC
		LIMIT $1
	`

	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get top MIME types: %w", err)
	}
	defer rows.Close()

	var counts []*models.MimeTypeCount
	for rows.Next() {
		count := &models.MimeTypeCount{}
		err := rows.Scan(&count.MimeType, &count.Count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan MIME type count: %w", err)
		}
		counts = append(counts, count)
	}

	return counts, nil
}

// GetFilesByDateRange returns files within a date range
func (r *FileRepository) GetFilesByDateRange(startDate, endDate time.Time) ([]*models.File, error) {
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.is_duplicate, f.uploader_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.created_at >= $1 AND f.created_at <= $2
		ORDER BY f.created_at DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by date range: %w", err)
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
			&file.IsDuplicate,
			&file.UploaderID,
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

// GetFilesByUserIDAndDateRange returns files for a user within a date range
func (r *FileRepository) GetFilesByUserIDAndDateRange(userID uuid.UUID, startDate, endDate time.Time) ([]*models.File, error) {
	query := `
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.is_duplicate, f.uploader_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		WHERE f.uploader_id = $1 AND f.created_at >= $2 AND f.created_at <= $3
		ORDER BY f.created_at DESC
	`

	rows, err := r.db.Query(query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by user and date range: %w", err)
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
			&file.IsDuplicate,
			&file.UploaderID,
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


