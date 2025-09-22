package main

import (
	"context"
	"fmt"
	"log"

	"filevault/internal/config"
	"filevault/internal/services"
)

func main() {
	fmt.Println("=== AWS Connection Test ===")

	// Load configuration
	cfg := config.LoadConfig()
	fmt.Printf("AWS Region: %s\n", cfg.AWSRegion)
	fmt.Printf("S3 Bucket: %s\n", cfg.S3BucketName)
	fmt.Printf("Access Key ID: %s...\n", cfg.AWSAccessKeyID[:10])

	// Initialize S3 service
	s3Service, err := services.NewS3Service(cfg.AWSRegion, cfg.AWSAccessKeyID, cfg.AWSSecretKey, cfg.S3BucketName, cfg.S3BucketURL)
	if err != nil {
		log.Fatalf("Failed to initialize S3 service: %v", err)
	}
	fmt.Println("✅ S3 Service initialized successfully")

	// Test S3 connection by checking if we can access the client
	fmt.Println("Testing S3 connection...")
	ctx := context.Background()

	// Get the S3 client and test basic connectivity
	client := s3Service.GetClient()
	if client == nil {
		log.Printf("❌ S3 client is nil")
		return
	}

	// Try to check if a test file exists (this will test the connection)
	testKey := "test-connection-check"
	exists, err := s3Service.FileExists(ctx, testKey)
	if err != nil {
		log.Printf("❌ Failed to check S3 connection: %v", err)
		fmt.Println("This could mean:")
		fmt.Println("1. AWS credentials are invalid")
		fmt.Println("2. S3 bucket doesn't exist")
		fmt.Println("3. No permissions to access the bucket")
		fmt.Println("4. Network connectivity issues")
		return
	}

	fmt.Printf("✅ S3 connection successful! Test file exists: %v\n", exists)

	fmt.Println("=== AWS Connection Test Complete ===")
}
