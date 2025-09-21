package services

import (
	"context"
	"fmt"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"
	"filevault/internal/websocket"

	"github.com/google/uuid"
)

// AdminStats represents system-wide statistics
type AdminStats struct {
	TotalUsers         int64              `json:"totalUsers"`
	TotalFiles         int64              `json:"totalFiles"`
	TotalStorage       int64              `json:"totalStorage"`
	UniqueFiles        int64              `json:"uniqueFiles"`
	DuplicateFiles     int64              `json:"duplicateFiles"`
	StorageEfficiency  float64            `json:"storageEfficiency"`
	ActiveUsers        int64              `json:"activeUsers"`
	NewUsersToday      int64              `json:"newUsersToday"`
	DeduplicationStats DeduplicationStats `json:"deduplicationStats"`
}

// DeduplicationStats represents deduplication savings metrics
type DeduplicationStats struct {
	TotalFileRecords    int64   `json:"totalFileRecords"`
	UniqueFileHashes    int64   `json:"uniqueFileHashes"`
	DuplicateRecords    int64   `json:"duplicateRecords"`
	StorageSaved        int64   `json:"storageSaved"`
	StorageSavedPercent float64 `json:"storageSavedPercent"`
	CostSavingsUSD      float64 `json:"costSavingsUSD"`
}

// UserStats represents statistics for a specific user
type UserStats struct {
	UserID      uuid.UUID  `json:"userId"`
	Username    string     `json:"username"`
	Email       string     `json:"email"`
	TotalFiles  int64      `json:"totalFiles"`
	StorageUsed int64      `json:"storageUsed"`
	LastLogin   *time.Time `json:"lastLogin"`
	CreatedAt   time.Time  `json:"createdAt"`
	IsActive    bool       `json:"isActive"`
}

// SystemHealth represents system health metrics
type SystemHealth struct {
	DatabaseStatus string     `json:"databaseStatus"`
	StorageStatus  string     `json:"storageStatus"`
	Uptime         string     `json:"uptime"`
	MemoryUsage    float64    `json:"memoryUsage"`
	DiskUsage      float64    `json:"diskUsage"`
	LastBackup     *time.Time `json:"lastBackup"`
}

// AdminService handles admin-specific operations
type AdminService struct {
	userRepo         *repositories.UserRepository
	fileRepo         *repositories.FileRepository
	fileHashRepo     *repositories.FileHashRepository
	s3Service        *S3Service
	websocketService *WebSocketService
}

// NewAdminService creates a new admin service
func NewAdminService(userRepo *repositories.UserRepository, fileRepo *repositories.FileRepository, fileHashRepo *repositories.FileHashRepository, s3Service *S3Service, websocketService *WebSocketService) *AdminService {
	return &AdminService{
		userRepo:         userRepo,
		fileRepo:         fileRepo,
		fileHashRepo:     fileHashRepo,
		s3Service:        s3Service,
		websocketService: websocketService,
	}
}

// GetSystemStats returns system-wide statistics
func (s *AdminService) GetSystemStats() (*AdminStats, error) {
	stats := &AdminStats{}

	// Get total users
	totalUsers, err := s.userRepo.GetTotalUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get total users: %w", err)
	}
	stats.TotalUsers = totalUsers

	// Get total files
	totalFiles, err := s.fileRepo.GetTotalFiles()
	if err != nil {
		return nil, fmt.Errorf("failed to get total files: %w", err)
	}
	stats.TotalFiles = totalFiles

	// Get unique files
	uniqueFiles, err := s.fileRepo.GetUniqueFiles()
	if err != nil {
		return nil, fmt.Errorf("failed to get unique files: %w", err)
	}
	stats.UniqueFiles = uniqueFiles
	stats.DuplicateFiles = totalFiles - uniqueFiles

	// Get total storage
	totalStorage, err := s.fileRepo.GetTotalStorage()
	if err != nil {
		return nil, fmt.Errorf("failed to get total storage: %w", err)
	}
	stats.TotalStorage = totalStorage

	// Calculate storage efficiency
	if totalFiles > 0 {
		stats.StorageEfficiency = float64(uniqueFiles) / float64(totalFiles) * 100
	}

	// Get active users (users who logged in within last 30 days)
	activeUsers, err := s.userRepo.GetActiveUsers(30)
	if err != nil {
		return nil, fmt.Errorf("failed to get active users: %w", err)
	}
	stats.ActiveUsers = activeUsers

	// Get new users today
	newUsersToday, err := s.userRepo.GetNewUsersToday()
	if err != nil {
		return nil, fmt.Errorf("failed to get new users today: %w", err)
	}
	stats.NewUsersToday = newUsersToday

	// Calculate deduplication metrics
	dedupStats, err := s.calculateDeduplicationStats()
	if err != nil {
		return nil, fmt.Errorf("failed to calculate deduplication stats: %w", err)
	}
	stats.DeduplicationStats = *dedupStats

	// Broadcast system stats update to admins
	if s.websocketService != nil {
		s.websocketService.BroadcastSystemStatsUpdate(websocket.SystemStatsUpdateData{
			TotalUsers:        int(stats.TotalUsers),
			TotalFiles:        int(stats.TotalFiles),
			TotalStorage:      stats.TotalStorage,
			UniqueFiles:       int(stats.UniqueFiles),
			DuplicateFiles:    int(stats.DuplicateFiles),
			StorageEfficiency: stats.StorageEfficiency,
			ActiveUsers:       int(stats.ActiveUsers),
			NewUsersToday:     int(stats.NewUsersToday),
		})
	}

	return stats, nil
}

// GetAllUsers returns all users with their statistics
func (s *AdminService) GetAllUsers(limit, offset int) ([]*UserStats, error) {
	users, err := s.userRepo.GetAllUsers(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	var userStats []*UserStats
	for _, user := range users {
		// Get user's file count
		fileCount, err := s.fileRepo.GetFileCountByUser(user.ID)
		if err != nil {
			// Log error but continue
			fileCount = 0
		}

		// Get user's storage usage
		storageUsed, err := s.fileRepo.GetStorageUsedByUser(user.ID)
		if err != nil {
			// Log error but continue
			storageUsed = 0
		}

		userStat := &UserStats{
			UserID:      user.ID,
			Username:    user.Username,
			Email:       user.Email,
			TotalFiles:  fileCount,
			StorageUsed: storageUsed,
			CreatedAt:   user.CreatedAt,
			IsActive:    true, // TODO: Implement last login tracking
		}

		userStats = append(userStats, userStat)
	}

	return userStats, nil
}

// GetUserDetails returns detailed information about a specific user
func (s *AdminService) GetUserDetails(userID uuid.UUID) (*UserStats, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Get user's file count
	fileCount, err := s.fileRepo.GetFileCountByUser(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user file count: %w", err)
	}

	// Get user's storage usage
	storageUsed, err := s.fileRepo.GetStorageUsedByUser(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user storage usage: %w", err)
	}

	// Note: We could get user's files here if needed for detailed analysis
	// files, err := s.fileRepo.GetByUserID(user.ID, 100, 0)

	userStat := &UserStats{
		UserID:      user.ID,
		Username:    user.Username,
		Email:       user.Email,
		TotalFiles:  fileCount,
		StorageUsed: storageUsed,
		CreatedAt:   user.CreatedAt,
		IsActive:    true, // TODO: Implement last login tracking
	}

	return userStat, nil
}

// DeleteUser deletes a user and all their files
func (s *AdminService) DeleteUser(userID uuid.UUID) error {
	// First, delete all user's files
	err := s.fileRepo.DeleteByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to delete user files: %w", err)
	}

	// Then delete the user
	err = s.userRepo.Delete(userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// UpdateUserRole updates a user's role
func (s *AdminService) UpdateUserRole(userID uuid.UUID, role string) error {
	if role != models.RoleUser && role != models.RoleAdmin {
		return fmt.Errorf("invalid role: %s", role)
	}

	err := s.userRepo.UpdateRole(userID, role)
	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}

	return nil
}

// GetSystemHealth returns system health metrics
func (s *AdminService) GetSystemHealth() (*SystemHealth, error) {
	health := &SystemHealth{}

	// Check database health
	if err := s.checkDatabaseHealth(); err != nil {
		health.DatabaseStatus = "unhealthy"
		fmt.Printf("Database health check failed: %v\n", err)
	} else {
		health.DatabaseStatus = "healthy"
	}

	// Check AWS S3 storage health
	if err := s.checkStorageHealth(); err != nil {
		health.StorageStatus = "unhealthy"
		fmt.Printf("Storage health check failed: %v\n", err)
	} else {
		health.StorageStatus = "healthy"
	}

	// Get system uptime (simplified)
	health.Uptime = "24h 15m" // TODO: Implement actual uptime tracking

	// Get memory usage (simplified)
	health.MemoryUsage = 45.2 // TODO: Implement actual memory monitoring

	// Get disk usage (simplified)
	health.DiskUsage = 67.8 // TODO: Implement actual disk monitoring

	return health, nil
}

// checkDatabaseHealth verifies database connectivity
func (s *AdminService) checkDatabaseHealth() error {
	// Try to get total users count as a simple health check
	_, err := s.userRepo.GetTotalUsers()
	return err
}

// checkStorageHealth verifies AWS S3 connectivity
func (s *AdminService) checkStorageHealth() error {
	if s.s3Service == nil {
		return fmt.Errorf("S3 service not initialized")
	}

	// Try to check if a non-existent file exists as a health check
	// This is a lightweight operation that verifies connectivity
	_, err := s.s3Service.FileExists(context.Background(), "health-check-test-file-that-does-not-exist")
	// We expect this to return false with no error, which means S3 is accessible
	return err
}

// IsAdmin checks if a user is an admin
func (s *AdminService) IsAdmin(userID uuid.UUID) (bool, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false, fmt.Errorf("failed to get user: %w", err)
	}

	return user.Role == models.RoleAdmin, nil
}

// calculateDeduplicationStats calculates deduplication savings metrics
func (s *AdminService) calculateDeduplicationStats() (*DeduplicationStats, error) {
	stats := &DeduplicationStats{}

	// Get total file records
	totalFileRecords, err := s.fileRepo.GetTotalFiles()
	if err != nil {
		return nil, fmt.Errorf("failed to get total file records: %w", err)
	}
	stats.TotalFileRecords = totalFileRecords

	// Get unique file hashes
	uniqueFileHashes, err := s.fileHashRepo.GetTotalHashes()
	if err != nil {
		return nil, fmt.Errorf("failed to get unique file hashes: %w", err)
	}
	stats.UniqueFileHashes = uniqueFileHashes

	// Calculate duplicate records
	stats.DuplicateRecords = totalFileRecords - uniqueFileHashes

	// Calculate storage saved (duplicate records * average file size)
	if stats.DuplicateRecords > 0 {
		// Get total storage from unique files only
		uniqueStorage, err := s.fileHashRepo.GetTotalStorage()
		if err != nil {
			return nil, fmt.Errorf("failed to get unique storage: %w", err)
		}

		// Get total storage from all file records
		totalStorage, err := s.fileRepo.GetTotalStorage()
		if err != nil {
			return nil, fmt.Errorf("failed to get total storage: %w", err)
		}

		// Storage saved is the difference
		stats.StorageSaved = totalStorage - uniqueStorage

		// Calculate percentage saved
		if totalStorage > 0 {
			stats.StorageSavedPercent = float64(stats.StorageSaved) / float64(totalStorage) * 100
		}

		// Calculate cost savings (assuming $0.023 per GB per month for S3)
		storageSavedGB := float64(stats.StorageSaved) / (1024 * 1024 * 1024)
		stats.CostSavingsUSD = storageSavedGB * 0.023 // $0.023 per GB per month
	}

	return stats, nil
}
