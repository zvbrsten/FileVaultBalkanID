package services

import (
	"fmt"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/google/uuid"
)

// StatisticsService handles file statistics operations
type StatisticsService struct {
	fileRepo     repositories.FileRepositoryInterface
	fileHashRepo repositories.FileHashRepositoryInterface
	userRepo     repositories.UserRepositoryInterface
}

// NewStatisticsService creates a new statistics service
func NewStatisticsService(fileRepo repositories.FileRepositoryInterface, fileHashRepo repositories.FileHashRepositoryInterface, userRepo repositories.UserRepositoryInterface) *StatisticsService {
	return &StatisticsService{
		fileRepo:     fileRepo,
		fileHashRepo: fileHashRepo,
		userRepo:     userRepo,
	}
}

// UserFileStats contains comprehensive file statistics for a user
type UserFileStats struct {
	TotalFiles       int                     `json:"totalFiles"`
	UniqueFiles      int                     `json:"uniqueFiles"`
	DuplicateFiles   int                     `json:"duplicateFiles"`
	TotalSize        int64                   `json:"totalSize"`
	UniqueSize       int64                   `json:"uniqueSize"`
	SavedSpace       int64                   `json:"savedSpace"`
	FilesByMimeType  []*models.MimeTypeCount `json:"filesByMimeType"`
	SizeDistribution map[string]int          `json:"sizeDistribution"`
	UploadTrends     map[string]int          `json:"uploadTrends"`
	RecentFiles      []*models.File          `json:"recentFiles"`
}

// SystemStats contains system-wide statistics
type SystemStats struct {
	TotalUsers        int                     `json:"totalUsers"`
	TotalFiles        int                     `json:"totalFiles"`
	TotalStorage      int64                   `json:"totalStorage"`
	UniqueFiles       int                     `json:"uniqueFiles"`
	DuplicateFiles    int                     `json:"duplicateFiles"`
	StorageEfficiency float64                 `json:"storageEfficiency"`
	ActiveUsers       int                     `json:"activeUsers"`
	NewUsersToday     int                     `json:"newUsersToday"`
	TopMimeTypes      []*models.MimeTypeCount `json:"topMimeTypes"`
}

// GetUserFileStats returns comprehensive statistics for a user
func (s *StatisticsService) GetUserFileStats(userID uuid.UUID) (*UserFileStats, error) {
	// Get all files for the user
	files, err := s.fileRepo.GetFilesByUserID(userID, 10000, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to get user files: %w", err)
	}

	stats := &UserFileStats{
		TotalFiles:       len(files),
		UniqueFiles:      0,
		DuplicateFiles:   0,
		TotalSize:        0,
		UniqueSize:       0,
		SavedSpace:       0,
		FilesByMimeType:  make([]*models.MimeTypeCount, 0),
		SizeDistribution: make(map[string]int),
		UploadTrends:     make(map[string]int),
		RecentFiles:      make([]*models.File, 0),
	}

	// Calculate basic statistics
	mimeTypeCounts := make(map[string]int)
	uniqueHashes := make(map[string]bool)
	uniqueSizes := make(map[string]int64)

	for _, file := range files {
		// Size calculations
		stats.TotalSize += file.Size
		mimeTypeCounts[file.MimeType]++

		// Duplicate tracking
		if file.IsDuplicate {
			stats.DuplicateFiles++
		} else {
			stats.UniqueFiles++
			uniqueHashes[file.Hash] = true
			uniqueSizes[file.Hash] = file.Size
		}

		// Size distribution
		sizeCategory := s.getSizeCategory(file.Size)
		stats.SizeDistribution[sizeCategory]++

		// Upload trends (last 30 days)
		if file.CreatedAt.After(time.Now().AddDate(0, 0, -30)) {
			date := file.CreatedAt.Format("2006-01-02")
			stats.UploadTrends[date]++
		}
	}

	// Calculate unique size and saved space
	for _, size := range uniqueSizes {
		stats.UniqueSize += size
	}
	stats.SavedSpace = stats.TotalSize - stats.UniqueSize

	// Convert MIME type counts to slice
	for mimeType, count := range mimeTypeCounts {
		stats.FilesByMimeType = append(stats.FilesByMimeType, &models.MimeTypeCount{
			MimeType: mimeType,
			Count:    count,
		})
	}

	// Get recent files (last 10)
	recentFiles, err := s.fileRepo.GetFilesByUserID(userID, 10, 0)
	if err == nil {
		stats.RecentFiles = recentFiles
	}

	return stats, nil
}

// GetSystemStats returns system-wide statistics
func (s *StatisticsService) GetSystemStats() (*SystemStats, error) {
	// For now, return basic stats with placeholder values
	// TODO: Implement proper repository methods for system-wide statistics
	
	return &SystemStats{
		TotalUsers:        0,
		TotalFiles:        0,
		TotalStorage:      0,
		UniqueFiles:       0,
		DuplicateFiles:    0,
		StorageEfficiency: 0.0,
		ActiveUsers:       0,
		NewUsersToday:     0,
		TopMimeTypes:      make([]*models.MimeTypeCount, 0),
	}, nil
}

// getSizeCategory returns the size category for a file
func (s *StatisticsService) getSizeCategory(size int64) string {
	switch {
	case size < 1024: // < 1KB
		return "< 1KB"
	case size < 1024*1024: // < 1MB
		return "1KB - 1MB"
	case size < 10*1024*1024: // < 10MB
		return "1MB - 10MB"
	case size < 100*1024*1024: // < 100MB
		return "10MB - 100MB"
	case size < 1024*1024*1024: // < 1GB
		return "100MB - 1GB"
	default: // >= 1GB
		return "> 1GB"
	}
}

// GetStorageTrends returns storage usage trends over time
func (s *StatisticsService) GetStorageTrends(days int) (map[string]int64, error) {
	// For now, return empty trends
	// TODO: Implement GetFilesByDateRange method in repository
	trends := make(map[string]int64)
	return trends, nil
}

// GetUserActivityStats returns user activity statistics
func (s *StatisticsService) GetUserActivityStats(userID uuid.UUID, days int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// For now, return basic stats with placeholder values
	// TODO: Implement GetFilesByUserIDAndDateRange method in repository
	
	stats["filesUploaded"] = 0
	stats["totalSizeUploaded"] = int64(0)
	stats["averageFileSize"] = int64(0)
	stats["mostActiveDay"] = ""
	stats["uploadFrequency"] = make(map[string]int)

	return stats, nil
}



