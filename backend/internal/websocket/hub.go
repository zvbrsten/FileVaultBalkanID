package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread safety
	mutex sync.RWMutex
}

// Client represents a websocket client
type Client struct {
	hub *Hub

	// The websocket connection
	conn *websocket.Conn

	// Buffered channel of outbound messages
	send chan []byte

	// User ID for this client
	userID string

	// User role for this client
	userRole string
}

// Message represents a websocket message
type Message struct {
	Type   string      `json:"type"`
	Data   interface{} `json:"data"`
	UserID string      `json:"userId,omitempty"`
	Room   string      `json:"room,omitempty"`
}

// NewHub creates a new hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client connected: %s (role: %s) - Total clients: %d", client.userID, client.userRole, len(h.clients))

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mutex.Unlock()
			log.Printf("Client disconnected: %s", client.userID)

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// BroadcastToUser sends a message to a specific user
func (h *Hub) BroadcastToUser(userID string, message Message) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	clientFound := false
	for client := range h.clients {
		if client.userID == userID {
			clientFound = true
			select {
			case client.send <- data:
				log.Printf("Message sent to user %s: %s", userID, message.Type)
			default:
				log.Printf("Failed to send message to user %s: channel full", userID)
				close(client.send)
				delete(h.clients, client)
			}
		}
	}

	if !clientFound {
		log.Printf("No connected client found for user %s", userID)
	}
}

// BroadcastToAdmins sends a message to all admin users
func (h *Hub) BroadcastToAdmins(message Message) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for client := range h.clients {
		if client.userRole == "admin" {
			select {
			case client.send <- data:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

// BroadcastToAll sends a message to all connected clients
func (h *Hub) BroadcastToAll(message Message) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for client := range h.clients {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

// GetConnectedUsers returns the number of connected users
func (h *Hub) GetConnectedUsers() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	return len(h.clients)
}

// GetConnectedAdmins returns the number of connected admin users
func (h *Hub) GetConnectedAdmins() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	count := 0
	for client := range h.clients {
		if client.userRole == "admin" {
			count++
		}
	}
	return count
}
