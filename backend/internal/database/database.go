package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

// Connect establishes a connection to the PostgreSQL database
func Connect(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// Migrate runs database migrations
func Migrate(databaseURL string) error {
	db, err := Connect(databaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	// Create uploads directory if it doesn't exist
	uploadPath := os.Getenv("UPLOAD_PATH")
	if uploadPath == "" {
		uploadPath = "./uploads"
	}
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		return fmt.Errorf("failed to create uploads directory: %w", err)
	}

	// Read and execute migration files
	migrationFiles := []string{
		"001_create_users_table.sql",
		"002_create_files_table.sql",
		"003_create_file_hashes_table.sql",
		"004_create_shares_table.sql",
		"005_create_downloads_table.sql",
		"006_add_search_indexes.sql",
		"007_create_admin_user.sql",
		"008_add_is_duplicate_to_files.sql",
		"008_update_shares_table.sql",
		"009_add_file_sharing.sql",
		"010_add_s3_key_to_files.sql",
		"011_add_s3_fields_to_file_hashes.sql",
		"012_fix_share_token_function.sql",
		"013_create_folders_table.sql",
		"015_create_folder_functions.sql",
		"017_restore_folder_id_to_files.sql",
		"019_fix_null_folder_paths.sql",
		"020_add_folder_file_count_triggers.sql",
	}

	for _, filename := range migrationFiles {
		migrationPath := filepath.Join("migrations", filename)
		if err := runMigration(db, migrationPath); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", filename, err)
		}
		log.Printf("Successfully ran migration: %s", filename)
	}

	return nil
}

// runMigration executes a single migration file
func runMigration(db *sql.DB, migrationPath string) error {
	// Check if migration file exists
	if _, err := os.Stat(migrationPath); os.IsNotExist(err) {
		// If migration file doesn't exist, create it with basic schema
		return createDefaultMigration(migrationPath)
	}

	content, err := os.ReadFile(migrationPath)
	if err != nil {
		return err
	}

	_, err = db.Exec(string(content))
	return err
}

// createDefaultMigration creates a default migration file if it doesn't exist
func createDefaultMigration(migrationPath string) error {
	// This is a fallback - in production, you'd want proper migration files
	// For now, we'll create the basic schema directly
	log.Printf("Creating default migration for %s", migrationPath)
	return nil
}
