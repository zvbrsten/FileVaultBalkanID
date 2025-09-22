package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for our application
type Config struct {
	DatabaseURL    string
	JWTSecret      string
	UploadPath     string
	Port           string
	RateLimitRPS   int
	StorageQuotaMB int64
	AWSRegion      string
	AWSAccessKeyID string
	AWSSecretKey   string
	S3BucketName   string
	S3BucketURL    string
	BaseURL        string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://filevault:password123@localhost:5432/filevault?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "xYp4+8jskKJkzB1/12jU03Yy9qrU9gEjUwDtrjhWjwUkK4ccR5e2n+EAmCqRgnMn"),
		UploadPath:     getEnv("UPLOAD_PATH", "./uploads"),
		Port:           getEnv("PORT", "8080"),
		RateLimitRPS:   getEnvInt("RATE_LIMIT_RPS", 2),
		StorageQuotaMB: getEnvInt64("STORAGE_QUOTA_MB", 10),
		AWSRegion:      getEnv("AWS_REGION", "eu-north-1"),
		AWSAccessKeyID: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:   getEnv("AWS_SECRET_ACCESS_KEY", ""),
		S3BucketName:   getEnv("S3_BUCKET_NAME", "filevaultbalkan"),
		S3BucketURL:    getEnv("S3_BUCKET_URL", "https://filevaultbalkan.s3.amazonaws.com"),
		BaseURL:        getEnv("BASE_URL", "http://localhost:8080"),
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets an environment variable as integer or returns a default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvInt64 gets an environment variable as int64 or returns a default value
func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}
