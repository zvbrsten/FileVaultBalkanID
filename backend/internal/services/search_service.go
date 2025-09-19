package services

import (
	"fmt"
	"strings"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/google/uuid"
)

// SearchFilters represents advanced search filters
type SearchFilters struct {
	SearchTerm  string     `json:"searchTerm"`
	MimeTypes   []string   `json:"mimeTypes"`
	MinSize     *int64     `json:"minSize"`
	MaxSize     *int64     `json:"maxSize"`
	DateFrom    *time.Time `json:"dateFrom"`
	DateTo      *time.Time `json:"dateTo"`
	IsDuplicate *bool      `json:"isDuplicate"`
	SortBy      string     `json:"sortBy"`    // "name", "size", "date", "type"
	SortOrder   string     `json:"sortOrder"` // "asc", "desc"
	Limit       int        `json:"limit"`
	Offset      int        `json:"offset"`
}

// SearchResult represents the result of an advanced search
type SearchResult struct {
	Files      []*models.File `json:"files"`
	TotalCount int            `json:"totalCount"`
	HasMore    bool           `json:"hasMore"`
}

// SearchService handles advanced file search operations
type SearchService struct {
	fileRepo *repositories.FileRepository
}

// NewSearchService creates a new search service
func NewSearchService(fileRepo *repositories.FileRepository) *SearchService {
	return &SearchService{
		fileRepo: fileRepo,
	}
}

// AdvancedSearch performs an advanced search with multiple filters
func (s *SearchService) AdvancedSearch(userID uuid.UUID, filters SearchFilters) (*SearchResult, error) {
	// Build the WHERE clause dynamically
	whereClause, args := s.buildWhereClause(userID, filters)

	// Build the ORDER BY clause
	orderClause := s.buildOrderClause(filters.SortBy, filters.SortOrder)

	// Get total count for pagination
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		%s
	`, whereClause)

	var totalCount int
	err := s.fileRepo.GetDB().QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}

	// Get the actual files
	filesQuery := fmt.Sprintf(`
		SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.hash, f.is_duplicate, f.uploader_id, f.created_at, f.updated_at,
		       u.id, u.email, u.username, u.role, u.created_at, u.updated_at
		FROM files f
		LEFT JOIN users u ON f.uploader_id = u.id
		%s
		%s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderClause, len(args)+1, len(args)+2)

	// Add limit and offset to args
	args = append(args, filters.Limit, filters.Offset)

	rows, err := s.fileRepo.GetDB().Query(filesQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute search query: %w", err)
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

	hasMore := (filters.Offset + len(files)) < totalCount

	return &SearchResult{
		Files:      files,
		TotalCount: totalCount,
		HasMore:    hasMore,
	}, nil
}

// buildWhereClause constructs the WHERE clause based on filters
func (s *SearchService) buildWhereClause(userID uuid.UUID, filters SearchFilters) (string, []interface{}) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	// Always filter by user
	conditions = append(conditions, fmt.Sprintf("f.uploader_id = $%d", argIndex))
	args = append(args, userID)
	argIndex++

	// Search term (searches in filename and original name)
	if filters.SearchTerm != "" {
		searchPattern := "%" + strings.ToLower(filters.SearchTerm) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(f.original_name) LIKE $%d OR LOWER(f.filename) LIKE $%d)", argIndex, argIndex))
		args = append(args, searchPattern)
		argIndex++
	}

	// MIME type filter
	if len(filters.MimeTypes) > 0 {
		var mimeConditions []string
		for _, mimeType := range filters.MimeTypes {
			mimeConditions = append(mimeConditions, fmt.Sprintf("f.mime_type = $%d", argIndex))
			args = append(args, mimeType)
			argIndex++
		}
		conditions = append(conditions, "("+strings.Join(mimeConditions, " OR ")+")")
	}

	// Size filters
	if filters.MinSize != nil {
		conditions = append(conditions, fmt.Sprintf("f.size >= $%d", argIndex))
		args = append(args, *filters.MinSize)
		argIndex++
	}

	if filters.MaxSize != nil {
		conditions = append(conditions, fmt.Sprintf("f.size <= $%d", argIndex))
		args = append(args, *filters.MaxSize)
		argIndex++
	}

	// Date filters
	if filters.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("f.created_at >= $%d", argIndex))
		args = append(args, *filters.DateFrom)
		argIndex++
	}

	if filters.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("f.created_at <= $%d", argIndex))
		args = append(args, *filters.DateTo)
		argIndex++
	}

	// Duplicate filter
	if filters.IsDuplicate != nil {
		conditions = append(conditions, fmt.Sprintf("f.is_duplicate = $%d", argIndex))
		args = append(args, *filters.IsDuplicate)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	return whereClause, args
}

// buildOrderClause constructs the ORDER BY clause
func (s *SearchService) buildOrderClause(sortBy, sortOrder string) string {
	if sortBy == "" {
		sortBy = "date"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}

	var orderBy string
	switch strings.ToLower(sortBy) {
	case "name":
		orderBy = "f.original_name"
	case "size":
		orderBy = "f.size"
	case "type":
		orderBy = "f.mime_type"
	case "date":
		orderBy = "f.created_at"
	default:
		orderBy = "f.created_at"
	}

	if strings.ToLower(sortOrder) == "asc" {
		return fmt.Sprintf("ORDER BY %s ASC", orderBy)
	}
	return fmt.Sprintf("ORDER BY %s DESC", orderBy)
}

// GetMimeTypeCategories returns categorized MIME types for filtering
func (s *SearchService) GetMimeTypeCategories() map[string][]string {
	return map[string][]string{
		"Documents": {
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"text/plain",
			"text/csv",
		},
		"Images": {
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",
			"image/bmp",
			"image/tiff",
		},
		"Videos": {
			"video/mp4",
			"video/avi",
			"video/mov",
			"video/wmv",
			"video/flv",
			"video/webm",
			"video/mkv",
		},
		"Audio": {
			"audio/mp3",
			"audio/wav",
			"audio/flac",
			"audio/aac",
			"audio/ogg",
			"audio/m4a",
		},
		"Archives": {
			"application/zip",
			"application/x-rar-compressed",
			"application/x-7z-compressed",
			"application/gzip",
			"application/x-tar",
		},
		"Code": {
			"text/javascript",
			"text/typescript",
			"text/html",
			"text/css",
			"application/json",
			"text/x-python",
			"text/x-java-source",
			"text/x-c",
			"text/x-c++",
		},
	}
}

// GetFileStats returns statistics about user's files
func (s *SearchService) GetFileStats(userID uuid.UUID) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total files count
	var totalFiles int
	err := s.fileRepo.GetDB().QueryRow(`
		SELECT COUNT(*) FROM files WHERE uploader_id = $1
	`, userID).Scan(&totalFiles)
	if err != nil {
		return nil, fmt.Errorf("failed to get total files count: %w", err)
	}
	stats["totalFiles"] = totalFiles

	// Total unique files count
	var uniqueFiles int
	err = s.fileRepo.GetDB().QueryRow(`
		SELECT COUNT(DISTINCT hash) FROM files WHERE uploader_id = $1
	`, userID).Scan(&uniqueFiles)
	if err != nil {
		return nil, fmt.Errorf("failed to get unique files count: %w", err)
	}
	stats["uniqueFiles"] = uniqueFiles

	// Total size
	var totalSize int64
	err = s.fileRepo.GetDB().QueryRow(`
		SELECT COALESCE(SUM(size), 0) FROM files WHERE uploader_id = $1 AND is_duplicate = false
	`, userID).Scan(&totalSize)
	if err != nil {
		return nil, fmt.Errorf("failed to get total size: %w", err)
	}
	stats["totalSize"] = totalSize

	// Files by MIME type
	rows, err := s.fileRepo.GetDB().Query(`
		SELECT mime_type, COUNT(*) as count
		FROM files 
		WHERE uploader_id = $1
		GROUP BY mime_type
		ORDER BY count DESC
		LIMIT 10
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by MIME type: %w", err)
	}
	defer rows.Close()

	var mimeTypeStats []map[string]interface{}
	for rows.Next() {
		var mimeType string
		var count int
		err := rows.Scan(&mimeType, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan MIME type stats: %w", err)
		}
		mimeTypeStats = append(mimeTypeStats, map[string]interface{}{
			"mimeType": mimeType,
			"count":    count,
		})
	}
	stats["filesByMimeType"] = mimeTypeStats

	return stats, nil
}
