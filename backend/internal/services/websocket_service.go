package services

import (
	"filevault/internal/websocket"
	"log"
)

// WebSocketService handles real-time communication
type WebSocketService struct {
	hub *websocket.Hub
}

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService(hub *websocket.Hub) *WebSocketService {
	return &WebSocketService{
		hub: hub,
	}
}

// BroadcastDownloadCountUpdate broadcasts download count update to file owner
func (s *WebSocketService) BroadcastDownloadCountUpdate(fileID, shareID, ownerID string, downloadCount int) {
	message := websocket.NewDownloadCountUpdateMessage(fileID, shareID, downloadCount)
	s.hub.BroadcastToUser(ownerID, message)
	log.Printf("Broadcasted download count update: FileID=%s, ShareID=%s, Count=%d", fileID, shareID, downloadCount)
}

// BroadcastFileUploadProgress broadcasts file upload progress to user
func (s *WebSocketService) BroadcastFileUploadProgress(userID, fileID, fileName string, progress float64, bytesTotal, bytesSent int64) {
	message := websocket.NewFileUploadProgressMessage(fileID, fileName, progress, bytesTotal, bytesSent)
	s.hub.BroadcastToUser(userID, message)
}

// BroadcastFileUploadComplete broadcasts file upload completion to user
func (s *WebSocketService) BroadcastFileUploadComplete(userID, fileID, fileName string, fileSize int64, isDuplicate bool) {
	message := websocket.NewFileUploadCompleteMessage(fileID, fileName, fileSize, false) // Always false since we removed isDuplicate concept
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted file upload complete: UserID=%s, FileID=%s, FileName=%s", userID, fileID, fileName)
}

// BroadcastFileUploadError broadcasts file upload error to user
func (s *WebSocketService) BroadcastFileUploadError(userID, fileID, fileName, errorMsg string) {
	message := websocket.NewFileUploadErrorMessage(fileID, fileName, errorMsg)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted file upload error: UserID=%s, FileID=%s, Error=%s", userID, fileID, errorMsg)
}

// BroadcastFileDeleted broadcasts file deletion to user
func (s *WebSocketService) BroadcastFileDeleted(userID, fileID, fileName string) {
	message := websocket.NewFileDeletedMessage(fileID, fileName)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted file deleted: UserID=%s, FileID=%s, FileName=%s", userID, fileID, fileName)
}

// BroadcastFileSharedWithUser broadcasts file shared notification to user
func (s *WebSocketService) BroadcastFileSharedWithUser(userID, fromUsername, fileName, shareID string) {
	message := websocket.NewFileSharedWithUserMessage(fromUsername, fileName, shareID)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted file shared: UserID=%s, From=%s, FileName=%s, ShareID=%s", userID, fromUsername, fileName, shareID)
}

// BroadcastFileShared broadcasts file sharing to user
func (s *WebSocketService) BroadcastFileShared(userID, fileID, fileName, shareID, shareURL, expiresAt string) {
	message := websocket.NewFileSharedMessage(fileID, fileName, shareID, shareURL, expiresAt)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted file shared: UserID=%s, FileID=%s, ShareID=%s", userID, fileID, shareID)
}

// BroadcastShareDeleted broadcasts share deletion to user
func (s *WebSocketService) BroadcastShareDeleted(userID, shareID, fileID, fileName string) {
	message := websocket.NewShareDeletedMessage(shareID, fileID, fileName)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted share deleted: UserID=%s, ShareID=%s", userID, shareID)
}

// BroadcastSystemStatsUpdate broadcasts system stats update to all admins
func (s *WebSocketService) BroadcastSystemStatsUpdate(stats websocket.SystemStatsUpdateData) {
	message := websocket.NewSystemStatsUpdateMessage(stats)
	s.hub.BroadcastToAdmins(message)
	log.Printf("Broadcasted system stats update to admins")
}

// BroadcastUserStatsUpdate broadcasts user stats update to user
func (s *WebSocketService) BroadcastUserStatsUpdate(userID string, totalFiles int, storageUsed int64) {
	message := websocket.NewUserStatsUpdateMessage(userID, totalFiles, storageUsed)
	s.hub.BroadcastToUser(userID, message)
	log.Printf("Broadcasted user stats update: UserID=%s, Files=%d, Storage=%d", userID, totalFiles, storageUsed)
}

// BroadcastNotification broadcasts notification to user
func (s *WebSocketService) BroadcastNotification(userID, notificationType, title, message string, duration int) {
	wsMessage := websocket.NewNotificationMessage(notificationType, title, message, duration)
	s.hub.BroadcastToUser(userID, wsMessage)
	log.Printf("Broadcasted notification: UserID=%s, Type=%s, Title=%s", userID, notificationType, title)
}

// BroadcastAdminNotification broadcasts notification to all admins
func (s *WebSocketService) BroadcastAdminNotification(notificationType, title, message string, duration int) {
	wsMessage := websocket.NewNotificationMessage(notificationType, title, message, duration)
	s.hub.BroadcastToAdmins(wsMessage)
	log.Printf("Broadcasted admin notification: Type=%s, Title=%s", notificationType, title)
}

// GetConnectedUsers returns the number of connected users
func (s *WebSocketService) GetConnectedUsers() int {
	return s.hub.GetConnectedUsers()
}

// GetConnectedAdmins returns the number of connected admin users
func (s *WebSocketService) GetConnectedAdmins() int {
	return s.hub.GetConnectedAdmins()
}
