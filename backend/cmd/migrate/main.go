package main

import (
	"log"

	"filevault/internal/config"
	"filevault/internal/database"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Run migrations
	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	log.Println("Migrations completed successfully!")
}
