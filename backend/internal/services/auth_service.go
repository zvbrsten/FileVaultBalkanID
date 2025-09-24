package services

import (
	"errors"
	"fmt"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// AuthService handles authentication and authorization
type AuthService struct {
	userRepo  *repositories.UserRepository
	jwtSecret string
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo *repositories.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

// RegisterUser registers a new user
func (s *AuthService) RegisterUser(email, username, password string) (*models.User, error) {
	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(email)
	if existingUser != nil {
		return nil, fmt.Errorf("An account with this email already exists. Please use a different email or try logging in.")
	}

	existingUser, _ = s.userRepo.GetByUsername(username)
	if existingUser != nil {
		return nil, fmt.Errorf("This username is already taken. Please choose a different username.")
	}

	// Create new user
	user := &models.User{
		ID:        uuid.New(),
		Email:     email,
		Username:  username,
		Password:  password,
		Role:      models.RoleUser,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save user to database
	err := s.userRepo.Create(user)
	if err != nil {
		return nil, fmt.Errorf("Failed to create account. Please try again.")
	}

	// Clear password from response
	user.Password = ""

	return user, nil
}

// LoginUser authenticates a user and returns a JWT token
func (s *AuthService) LoginUser(email, password string) (string, *models.User, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return "", nil, fmt.Errorf("Invalid email or password. Please check your credentials and try again.")
	}

	// Verify password
	err = s.userRepo.VerifyPassword(user, password)
	if err != nil {
		return "", nil, fmt.Errorf("Invalid email or password. Please check your credentials and try again.")
	}

	// Generate JWT token
	token, err := s.GenerateToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Clear password from response
	user.Password = ""

	return token, user, nil
}

// GenerateToken generates a JWT token for a user
func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID.String(),
		"email":    user.Email,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the user
func (s *AuthService) ValidateToken(tokenString string) (*models.User, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Extract user data directly from JWT claims to avoid database query
	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return nil, errors.New("invalid user ID in token")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// Create user object from JWT claims instead of database query
	user := &models.User{
		ID:       userID,
		Email:    claims["email"].(string),
		Username: claims["username"].(string),
		Role:     claims["role"].(string),
		Password: "", // Never include password in response
	}

	return user, nil
}

// RefreshToken generates a new token for an existing user
func (s *AuthService) RefreshToken(user *models.User) (string, error) {
	return s.GenerateToken(user)
}
