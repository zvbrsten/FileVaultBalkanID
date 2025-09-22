package main

import (
	"fmt"
	"log"

	"filevault/internal/config"
	"filevault/internal/database"
	"filevault/internal/repositories"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize user repository
	userRepo := repositories.NewUserRepository(db)

	// Create admin user
	adminEmail := "admin@filevault.com"
	adminUsername := "admin"
	adminPassword := "admin123"

	// Check if admin user already exists
	existingUser, err := userRepo.GetByEmail(adminEmail)
	if err == nil && existingUser != nil {
		fmt.Printf("Admin user already exists: %s\n", adminEmail)
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	// Create admin user
	adminUser := &struct {
		ID       string
		Email    string
		Username string
		Password string
		Role     string
	}{
		ID:       "550e8400-e29b-41d4-a716-446655440000",
		Email:    adminEmail,
		Username: adminUsername,
		Password: string(hashedPassword),
		Role:     "admin",
	}

	// Insert admin user directly
	query := `
		INSERT INTO users (id, email, username, password, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET
			username = EXCLUDED.username,
			password = EXCLUDED.password,
			role = EXCLUDED.role,
			updated_at = NOW()
	`

	_, err = db.Exec(query, adminUser.ID, adminUser.Email, adminUser.Username, adminUser.Password, adminUser.Role)
	if err != nil {
		log.Fatal("Failed to create admin user:", err)
	}

	fmt.Printf("Admin user created successfully!\n")
	fmt.Printf("Email: %s\n", adminEmail)
	fmt.Printf("Username: %s\n", adminUsername)
	fmt.Printf("Password: %s\n", adminPassword)
	fmt.Printf("Role: %s\n", adminUser.Role)
}
