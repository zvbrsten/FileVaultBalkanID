package handlers

import (
	"filevault/internal/services"
	"filevault/internal/websocket"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub              *websocket.Hub
	authService      *services.AuthService
	websocketService *services.WebSocketService
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(hub *websocket.Hub, authService *services.AuthService, websocketService *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{
		hub:              hub,
		authService:      authService,
		websocketService: websocketService,
	}
}

// HandleWebSocket handles WebSocket connections
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	var token string

	// Try to get token from query parameter first (for WebSocket connections)
	if tokenParam := c.Query("token"); tokenParam != "" {
		token = tokenParam
	} else {
		// Fallback to Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			return
		}

		// Check if the header starts with "Bearer "
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}

		// Extract the token
		token = authHeader[7:]
	}

	// Validate the token
	user, err := h.authService.ValidateToken(token)
	if err != nil {
		log.Printf("WebSocket authentication failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Log the WebSocket connection attempt
	log.Printf("WebSocket connection attempt from user: %s (role: %s)", user.Username, user.Role)

	// Upgrade the connection to WebSocket
	websocket.ServeWS(h.hub, c.Writer, c.Request, user.ID.String(), user.Role)
}

// GetConnectionStatus returns the current WebSocket connection status
func (h *WebSocketHandler) GetConnectionStatus(c *gin.Context) {
	// Get the Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
		return
	}

	// Check if the header starts with "Bearer "
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
		return
	}

	// Extract the token
	token := authHeader[7:]

	// Validate the token
	user, err := h.authService.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Return connection status
	c.JSON(http.StatusOK, gin.H{
		"connected":        true,
		"userId":           user.ID.String(),
		"userRole":         user.Role,
		"totalConnections": h.hub.GetConnectedUsers(),
		"adminConnections": h.hub.GetConnectedAdmins(),
	})
}
