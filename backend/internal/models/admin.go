package models

import (
	"time"

	"github.com/google/uuid"
)

// AdminLog represents an admin action log
type AdminLog struct {
	ID        uuid.UUID `json:"id" db:"id"`
	AdminID   uuid.UUID `json:"adminId" db:"admin_id"`
	AdminName string    `json:"adminName" db:"admin_name"`
	Action    string    `json:"action" db:"action"`
	Target    string    `json:"target" db:"target"`
	Details   string    `json:"details" db:"details"`
	IPAddress string    `json:"ipAddress" db:"ip_address"`
	UserAgent string    `json:"userAgent" db:"user_agent"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// UserStats represents statistics for a user
type UserStats struct {
	User           *UserManagement `json:"user"`
	TotalFiles     int             `json:"totalFiles"`
	UniqueFiles    int             `json:"uniqueFiles"`
	DuplicateFiles int             `json:"duplicateFiles"`
	TotalSize      int64           `json:"totalSize"`
	ShareCount     int             `json:"shareCount"`
	MimeTypeCounts []MimeTypeCount `json:"mimeTypeCounts"`
}

// UserManagement represents a user for admin management
type UserManagement struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Email       string     `json:"email" db:"email"`
	Username    string     `json:"username" db:"username"`
	Role        string     `json:"role" db:"role"`
	IsActive    bool       `json:"isActive" db:"is_active"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	LastLogin   *time.Time `json:"lastLogin" db:"last_login"`
	FileCount   int        `json:"fileCount" db:"file_count"`
	StorageUsed int64      `json:"storageUsed" db:"storage_used"`
}

// AdminStats represents system-wide statistics
type AdminStats struct {
	TotalUsers        int              `json:"totalUsers"`
	ActiveUsers       int              `json:"activeUsers"`
	TotalFiles        int              `json:"totalFiles"`
	UniqueFiles       int              `json:"uniqueFiles"`
	TotalStorage      int64            `json:"totalStorage"`
	StorageEfficiency float64          `json:"storageEfficiency"`
	TotalShares       int              `json:"totalShares"`
	ActiveShares      int              `json:"activeShares"`
	TotalDownloads    int              `json:"totalDownloads"`
	RecentActivity    []*AdminActivity `json:"recentActivity"`
}

// AdminActivity represents a system activity log
type AdminActivity struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	Type      string     `json:"type" db:"type"`
	UserID    *uuid.UUID `json:"userId" db:"user_id"`
	Username  *string    `json:"username" db:"username"`
	Details   string     `json:"details" db:"details"`
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
}

// StorageBreakdown represents storage usage by user
type StorageBreakdown struct {
	Username    string `json:"username" db:"username"`
	Email       string `json:"email" db:"email"`
	FileCount   int    `json:"fileCount" db:"file_count"`
	StorageUsed int64  `json:"storageUsed" db:"storage_used"`
	UniqueFiles int    `json:"uniqueFiles" db:"unique_files"`
}

// TopFile represents a frequently accessed file
type TopFile struct {
	ID           uuid.UUID `json:"id" db:"id"`
	OriginalName string    `json:"originalName" db:"original_name"`
	MimeType     string    `json:"mimeType" db:"mime_type"`
	Size         int64     `json:"size" db:"size"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
}

// SystemHealth represents system health metrics
type SystemHealth struct {
	DatabaseStatus string  `json:"databaseStatus"`
	StorageStatus  string  `json:"storageStatus"`
	Uptime         string  `json:"uptime"`
	MemoryUsage    float64 `json:"memoryUsage"`
	CPUUsage       float64 `json:"cpuUsage"`
	DiskUsage      float64 `json:"diskUsage"`
	LastChecked    string  `json:"lastChecked"`
}
