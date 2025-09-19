package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
)

// S3ServiceInterface defines the interface for S3 operations
type S3ServiceInterface interface {
	UploadFile(ctx context.Context, file io.Reader, filename string, contentType string) (string, error)
	DownloadFile(ctx context.Context, key string) (io.ReadCloser, error)
	DeleteFile(ctx context.Context, key string) error
	GeneratePresignedURL(ctx context.Context, key string, expiration time.Duration) (string, error)
	FileExists(ctx context.Context, key string) (bool, error)
	GetFileMetadata(ctx context.Context, key string) (map[string]string, error)
	ExtractKeyFromURL(url string) string
	GetClient() *s3.Client
}

// S3Service handles AWS S3 operations for file storage
type S3Service struct {
	client     *s3.Client
	uploader   *manager.Uploader
	downloader *manager.Downloader
	bucketName string
	bucketURL  string
}

// NewS3Service creates a new S3 service with AWS configuration
func NewS3Service(region, accessKey, secretKey, bucketName, bucketURL string) (*S3Service, error) {
	// Validate required parameters
	if region == "" || accessKey == "" || secretKey == "" || bucketName == "" {
		return nil, errors.New("region, accessKey, secretKey, and bucketName are required")
	}

	// Create AWS config with explicit credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Create S3 client
	client := s3.NewFromConfig(cfg)
	uploader := manager.NewUploader(client)
	downloader := manager.NewDownloader(client)

	return &S3Service{
		client:     client,
		uploader:   uploader,
		downloader: downloader,
		bucketName: bucketName,
		bucketURL:  bucketURL,
	}, nil
}

// UploadFile uploads a file to S3
func (s *S3Service) UploadFile(ctx context.Context, file io.Reader, filename string, contentType string) (string, error) {
	// Generate unique key for the file
	key := s.generateFileKey(filename)

	// Upload file to S3
	_, err := s.uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
		Metadata: map[string]string{
			"original-filename": filename,
			"upload-timestamp":  time.Now().Format(time.RFC3339),
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3: %w", err)
	}

	// Return the S3 URL
	return s.getFileURL(key), nil
}

// DownloadFile downloads a file from S3
func (s *S3Service) DownloadFile(ctx context.Context, key string) (io.ReadCloser, error) {
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to download file from S3: %w", err)
	}

	return result.Body, nil
}

// DeleteFile deletes a file from S3
func (s *S3Service) DeleteFile(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("failed to delete file from S3: %w", err)
	}

	return nil
}

// GeneratePresignedURL generates a presigned URL for public access
func (s *S3Service) GeneratePresignedURL(ctx context.Context, key string, expiration time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	request, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiration
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return request.URL, nil
}

// FileExists checks if a file exists in S3
func (s *S3Service) FileExists(ctx context.Context, key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		var notFound *types.NotFound
		if errors.As(err, &notFound) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check if file exists: %w", err)
	}

	return true, nil
}

// GetFileMetadata gets file metadata from S3
func (s *S3Service) GetFileMetadata(ctx context.Context, key string) (map[string]string, error) {
	result, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	metadata := make(map[string]string)
	if result.Metadata != nil {
		for k, v := range result.Metadata {
			if v != "" {
				metadata[k] = v
			}
		}
	}

	return metadata, nil
}

// generateFileKey generates a unique key for the file
func (s *S3Service) generateFileKey(filename string) string {
	// Get file extension
	ext := filepath.Ext(filename)

	// Generate unique ID
	id := uuid.New().String()

	// Create timestamp-based directory structure
	now := time.Now()
	datePath := now.Format("2006/01/02")

	// Combine to create unique key
	key := fmt.Sprintf("files/%s/%s%s", datePath, id, ext)

	return key
}

// getFileURL constructs the public URL for a file
func (s *S3Service) getFileURL(key string) string {
	return fmt.Sprintf("%s/%s", strings.TrimSuffix(s.bucketURL, "/"), key)
}

// ExtractKeyFromURL extracts the S3 key from a full URL
func (s *S3Service) ExtractKeyFromURL(url string) string {
	// Remove bucket URL prefix to get the key
	prefix := s.bucketURL + "/"
	if strings.HasPrefix(url, prefix) {
		return strings.TrimPrefix(url, prefix)
	}
	return ""
}

// GetClient returns the S3 client for external use
func (s *S3Service) GetClient() *s3.Client {
	return s.client
}
