package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	// Connect to database
	dbURL := "postgres://filevault:password123@localhost:5432/filevault?sslmode=disable"
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("✅ Database connection successful")

	// Check total users
	var totalUsers int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	if err != nil {
		log.Fatal("Failed to get total users:", err)
	}
	fmt.Printf("📊 Total users: %d\n", totalUsers)

	// Check admin users
	var adminUsers int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'admin'").Scan(&adminUsers)
	if err != nil {
		log.Fatal("Failed to get admin users:", err)
	}
	fmt.Printf("👑 Admin users: %d\n", adminUsers)

	// Check total files
	var totalFiles int
	err = db.QueryRow("SELECT COUNT(*) FROM files").Scan(&totalFiles)
	if err != nil {
		log.Fatal("Failed to get total files:", err)
	}
	fmt.Printf("📄 Total files: %d\n", totalFiles)

	// Check total storage
	var totalStorage int64
	err = db.QueryRow("SELECT COALESCE(SUM(size), 0) FROM files").Scan(&totalStorage)
	if err != nil {
		log.Fatal("Failed to get total storage:", err)
	}
	fmt.Printf("💾 Total storage: %d bytes\n", totalStorage)

	// Check unique files
	var uniqueFiles int
	err = db.QueryRow("SELECT COUNT(DISTINCT hash) FROM files").Scan(&uniqueFiles)
	if err != nil {
		log.Fatal("Failed to get unique files:", err)
	}
	fmt.Printf("🔗 Unique files: %d\n", uniqueFiles)

	// List all users
	rows, err := db.Query("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		log.Fatal("Failed to query users:", err)
	}
	defer rows.Close()

	fmt.Println("\n👥 All users:")
	for rows.Next() {
		var id, username, email, role, createdAt string
		if err := rows.Scan(&id, &username, &email, &role, &createdAt); err != nil {
			log.Fatal("Failed to scan user:", err)
		}
		fmt.Printf("  - %s (%s) - %s - %s\n", username, email, role, createdAt)
	}

	fmt.Println("\n✅ Admin data check complete!")
}
