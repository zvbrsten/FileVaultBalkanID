package main

import (
	"database/sql"
	"fmt"
	"log"

	"filevault/internal/repositories"
	"filevault/internal/services"

	_ "github.com/lib/pq"
)

func main() {
	fmt.Println("🔧 Testing AdminService directly...")

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

	// Create repositories
	userRepo := repositories.NewUserRepository(db)
	fileRepo := repositories.NewFileRepository(db)
	fileHashRepo := repositories.NewFileHashRepository(db)

	// Create admin service
	adminService := services.NewAdminService(userRepo, fileRepo, fileHashRepo, nil, nil)

	// Test GetSystemStats
	fmt.Println("📊 Testing GetSystemStats...")
	stats, err := adminService.GetSystemStats()
	if err != nil {
		fmt.Printf("❌ GetSystemStats failed: %v\n", err)
		return
	}

	fmt.Printf("✅ GetSystemStats successful!\n")
	fmt.Printf("  Total Users: %d\n", stats.TotalUsers)
	fmt.Printf("  Total Files: %d\n", stats.TotalFiles)
	fmt.Printf("  Total Storage: %d bytes\n", stats.TotalStorage)
	fmt.Printf("  Unique Files: %d\n", stats.UniqueFiles)
	fmt.Printf("  Duplicate Files: %d\n", stats.DuplicateFiles)
	fmt.Printf("  Storage Efficiency: %.2f%%\n", stats.StorageEfficiency)
	fmt.Printf("  Active Users: %d\n", stats.ActiveUsers)
	fmt.Printf("  New Users Today: %d\n", stats.NewUsersToday)

	if stats.DeduplicationStats.TotalFileRecords > 0 {
		fmt.Printf("  Deduplication Stats:\n")
		fmt.Printf("    Total File Records: %d\n", stats.DeduplicationStats.TotalFileRecords)
		fmt.Printf("    Unique File Hashes: %d\n", stats.DeduplicationStats.UniqueFileHashes)
		fmt.Printf("    Duplicate Records: %d\n", stats.DeduplicationStats.DuplicateRecords)
		fmt.Printf("    Storage Saved: %d bytes\n", stats.DeduplicationStats.StorageSaved)
		fmt.Printf("    Storage Saved Percent: %.2f%%\n", stats.DeduplicationStats.StorageSavedPercent)
		fmt.Printf("    Cost Savings USD: $%.2f\n", stats.DeduplicationStats.CostSavingsUSD)
	}
}
