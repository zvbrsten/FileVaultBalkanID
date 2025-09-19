package services

import (
	"fmt"
	"filevault/internal/repositories"
	"github.com/google/uuid"
)

// QuotaService handles storage quota management
type QuotaService struct {
	fileRepo *repositories.FileRepository
	quotaMB  int64
}

// NewQuotaService creates a new quota service
func NewQuotaService(fileRepo *repositories.FileRepository, quotaMB int64) *QuotaService {
	return &QuotaService{
		fileRepo: fileRepo,
		quotaMB:  quotaMB,
	}
}

// GetUserStorageUsage returns the current storage usage for a user in bytes
func (s *QuotaService) GetUserStorageUsage(userID uuid.UUID) (int64, error) {
	files, err := s.fileRepo.GetByUserID(userID, 1000, 0) // Get all files for user
	if err != nil {
		return 0, fmt.Errorf("failed to get user files: %w", err)
	}

	var totalSize int64
	seenHashes := make(map[string]bool)

	for _, file := range files {
		// Only count unique files (not duplicates) for storage calculation
		if !file.IsDuplicate && !seenHashes[file.Hash] {
			totalSize += file.Size
			seenHashes[file.Hash] = true
		}
	}

	return totalSize, nil
}

// CheckQuota checks if a user can upload a file of the given size
func (s *QuotaService) CheckQuota(userID uuid.UUID, fileSize int64) error {
	currentUsage, err := s.GetUserStorageUsage(userID)
	if err != nil {
		return fmt.Errorf("failed to get current usage: %w", err)
	}

	quotaBytes := s.quotaMB * 1024 * 1024 // Convert MB to bytes

	if currentUsage+fileSize > quotaBytes {
		return fmt.Errorf("storage quota exceeded: %d bytes used, %d bytes quota, %d bytes requested", 
			currentUsage, quotaBytes, fileSize)
	}

	return nil
}

// GetQuotaInfo returns quota information for a user
func (s *QuotaService) GetQuotaInfo(userID uuid.UUID) (map[string]interface{}, error) {
	currentUsage, err := s.GetUserStorageUsage(userID)
	if err != nil {
		return nil, err
	}

	quotaBytes := s.quotaMB * 1024 * 1024
	remainingBytes := quotaBytes - currentUsage
	usagePercentage := float64(currentUsage) / float64(quotaBytes) * 100

	return map[string]interface{}{
		"used_bytes":        currentUsage,
		"quota_bytes":       quotaBytes,
		"remaining_bytes":   remainingBytes,
		"usage_percentage":  usagePercentage,
		"quota_mb":         s.quotaMB,
	}, nil
}

