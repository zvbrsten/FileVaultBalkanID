package websocket

import (
	"time"

	"github.com/google/uuid"
)

// Event types
const (
	EventTypeDownloadCountUpdate = "download_count_update"
	EventTypeFileUploadProgress  = "file_upload_progress"
	EventTypeFileUploadComplete  = "file_upload_complete"
	EventTypeFileUploadError     = "file_upload_error"
	EventTypeFileDeleted         = "file_deleted"
	EventTypeFileShared          = "file_shared"
	EventTypeShareDeleted        = "share_deleted"
	EventTypeSystemStatsUpdate   = "system_stats_update"
	EventTypeUserStatsUpdate     = "user_stats_update"
	EventTypeNotification        = "notification"
	EventTypeConnectionStatus    = "connection_status"
)

// DownloadCountUpdateData represents download count update data
type DownloadCountUpdateData struct {
	FileID        string `json:"fileId"`
	ShareID       string `json:"shareId"`
	DownloadCount int    `json:"downloadCount"`
	Timestamp     string `json:"timestamp"`
}

// FileUploadProgressData represents file upload progress data
type FileUploadProgressData struct {
	FileID     string  `json:"fileId"`
	FileName   string  `json:"fileName"`
	Progress   float64 `json:"progress"`
	BytesTotal int64   `json:"bytesTotal"`
	BytesSent  int64   `json:"bytesSent"`
	Timestamp  string  `json:"timestamp"`
}

// FileUploadCompleteData represents file upload completion data
type FileUploadCompleteData struct {
	FileID      string `json:"fileId"`
	FileName    string `json:"fileName"`
	FileSize    int64  `json:"fileSize"`
	IsDuplicate bool   `json:"isDuplicate"`
	Timestamp   string `json:"timestamp"`
}

// FileUploadErrorData represents file upload error data
type FileUploadErrorData struct {
	FileID    string `json:"fileId"`
	FileName  string `json:"fileName"`
	Error     string `json:"error"`
	Timestamp string `json:"timestamp"`
}

// FileDeletedData represents file deletion data
type FileDeletedData struct {
	FileID    string `json:"fileId"`
	FileName  string `json:"fileName"`
	Timestamp string `json:"timestamp"`
}

// FileSharedData represents file sharing data
type FileSharedData struct {
	FileID    string `json:"fileId"`
	FileName  string `json:"fileName"`
	ShareID   string `json:"shareId"`
	ShareURL  string `json:"shareUrl"`
	ExpiresAt string `json:"expiresAt,omitempty"`
	Timestamp string `json:"timestamp"`
}

// ShareDeletedData represents share deletion data
type ShareDeletedData struct {
	ShareID   string `json:"shareId"`
	FileID    string `json:"fileId"`
	FileName  string `json:"fileName"`
	Timestamp string `json:"timestamp"`
}

// SystemStatsUpdateData represents system statistics update data
type SystemStatsUpdateData struct {
	TotalUsers        int     `json:"totalUsers"`
	TotalFiles        int     `json:"totalFiles"`
	TotalStorage      int64   `json:"totalStorage"`
	UniqueFiles       int     `json:"uniqueFiles"`
	DuplicateFiles    int     `json:"duplicateFiles"`
	StorageEfficiency float64 `json:"storageEfficiency"`
	ActiveUsers       int     `json:"activeUsers"`
	NewUsersToday     int     `json:"newUsersToday"`
	Timestamp         string  `json:"timestamp"`
}

// UserStatsUpdateData represents user statistics update data
type UserStatsUpdateData struct {
	UserID      string `json:"userId"`
	TotalFiles  int    `json:"totalFiles"`
	StorageUsed int64  `json:"storageUsed"`
	Timestamp   string `json:"timestamp"`
}

// NotificationData represents notification data
type NotificationData struct {
	ID        string `json:"id"`
	Type      string `json:"type"` // success, error, warning, info
	Title     string `json:"title"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Duration  int    `json:"duration,omitempty"` // Duration in milliseconds
}

// ConnectionStatusData represents connection status data
type ConnectionStatusData struct {
	Status    string `json:"status"` // connected, disconnected, reconnecting
	Timestamp string `json:"timestamp"`
}

// Helper functions to create messages

// NewDownloadCountUpdateMessage creates a download count update message
func NewDownloadCountUpdateMessage(fileID, shareID string, downloadCount int) Message {
	return Message{
		Type: EventTypeDownloadCountUpdate,
		Data: DownloadCountUpdateData{
			FileID:        fileID,
			ShareID:       shareID,
			DownloadCount: downloadCount,
			Timestamp:     time.Now().Format(time.RFC3339),
		},
	}
}

// NewFileUploadProgressMessage creates a file upload progress message
func NewFileUploadProgressMessage(fileID, fileName string, progress float64, bytesTotal, bytesSent int64) Message {
	return Message{
		Type: EventTypeFileUploadProgress,
		Data: FileUploadProgressData{
			FileID:     fileID,
			FileName:   fileName,
			Progress:   progress,
			BytesTotal: bytesTotal,
			BytesSent:  bytesSent,
			Timestamp:  time.Now().Format(time.RFC3339),
		},
	}
}

// NewFileUploadCompleteMessage creates a file upload complete message
func NewFileUploadCompleteMessage(fileID, fileName string, fileSize int64, isDuplicate bool) Message {
	return Message{
		Type: EventTypeFileUploadComplete,
		Data: FileUploadCompleteData{
			FileID:      fileID,
			FileName:    fileName,
			FileSize:    fileSize,
			IsDuplicate: isDuplicate,
			Timestamp:   time.Now().Format(time.RFC3339),
		},
	}
}

// NewFileUploadErrorMessage creates a file upload error message
func NewFileUploadErrorMessage(fileID, fileName, errorMsg string) Message {
	return Message{
		Type: EventTypeFileUploadError,
		Data: FileUploadErrorData{
			FileID:    fileID,
			FileName:  fileName,
			Error:     errorMsg,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}
}

// NewFileDeletedMessage creates a file deleted message
func NewFileDeletedMessage(fileID, fileName string) Message {
	return Message{
		Type: EventTypeFileDeleted,
		Data: FileDeletedData{
			FileID:    fileID,
			FileName:  fileName,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}
}

// NewFileSharedMessage creates a file shared message
func NewFileSharedMessage(fileID, fileName, shareID, shareURL, expiresAt string) Message {
	return Message{
		Type: EventTypeFileShared,
		Data: FileSharedData{
			FileID:    fileID,
			FileName:  fileName,
			ShareID:   shareID,
			ShareURL:  shareURL,
			ExpiresAt: expiresAt,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}
}

// NewShareDeletedMessage creates a share deleted message
func NewShareDeletedMessage(shareID, fileID, fileName string) Message {
	return Message{
		Type: EventTypeShareDeleted,
		Data: ShareDeletedData{
			ShareID:   shareID,
			FileID:    fileID,
			FileName:  fileName,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}
}

// NewSystemStatsUpdateMessage creates a system stats update message
func NewSystemStatsUpdateMessage(stats SystemStatsUpdateData) Message {
	stats.Timestamp = time.Now().Format(time.RFC3339)
	return Message{
		Type: EventTypeSystemStatsUpdate,
		Data: stats,
	}
}

// NewUserStatsUpdateMessage creates a user stats update message
func NewUserStatsUpdateMessage(userID string, totalFiles int, storageUsed int64) Message {
	return Message{
		Type: EventTypeUserStatsUpdate,
		Data: UserStatsUpdateData{
			UserID:      userID,
			TotalFiles:  totalFiles,
			StorageUsed: storageUsed,
			Timestamp:   time.Now().Format(time.RFC3339),
		},
	}
}

// NewNotificationMessage creates a notification message
func NewNotificationMessage(notificationType, title, message string, duration int) Message {
	return Message{
		Type: EventTypeNotification,
		Data: NotificationData{
			ID:        uuid.New().String(),
			Type:      notificationType,
			Title:     title,
			Message:   message,
			Timestamp: time.Now().Format(time.RFC3339),
			Duration:  duration,
		},
	}
}

// NewConnectionStatusMessage creates a connection status message
func NewConnectionStatusMessage(status string) Message {
	return Message{
		Type: EventTypeConnectionStatus,
		Data: ConnectionStatusData{
			Status:    status,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}
}
