package services

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// RateLimiter handles rate limiting for users
type RateLimiter struct {
	requests map[uuid.UUID][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[uuid.UUID][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Allow checks if a request is allowed for the given user
func (rl *RateLimiter) Allow(userID uuid.UUID) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// Clean up old requests
	if requests, exists := rl.requests[userID]; exists {
		var validRequests []time.Time
		for _, reqTime := range requests {
			if reqTime.After(cutoff) {
				validRequests = append(validRequests, reqTime)
			}
		}
		rl.requests[userID] = validRequests
	}

	// Check if under limit
	if len(rl.requests[userID]) < rl.limit {
		rl.requests[userID] = append(rl.requests[userID], now)
		return true
	}

	return false
}

// GetRemainingRequests returns the number of remaining requests for a user
func (rl *RateLimiter) GetRemainingRequests(userID uuid.UUID) int {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	if requests, exists := rl.requests[userID]; exists {
		var validRequests []time.Time
		for _, reqTime := range requests {
			if reqTime.After(cutoff) {
				validRequests = append(validRequests, reqTime)
			}
		}
		return rl.limit - len(validRequests)
	}

	return rl.limit
}
