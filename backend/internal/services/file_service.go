package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/gabriel-vasile/mimetype"
	"github.com/google/uuid"
)

// FileService handles file operations with deduplication and cloud storage
type FileService struct {
	fileRepo              repositories.FileRepositoryInterface
	fileHashRepo          repositories.FileHashRepositoryInterface
	shareRepo             repositories.ShareRepositoryInterface
	downloadRepo          repositories.DownloadRepositoryInterface
	s3Service             S3ServiceInterface
	mimeValidationService *MimeValidationService
}

// NewFileService creates a new file service with all required dependencies
func NewFileService(
	fileRepo repositories.FileRepositoryInterface,
	fileHashRepo repositories.FileHashRepositoryInterface,
	shareRepo repositories.ShareRepositoryInterface,
	downloadRepo repositories.DownloadRepositoryInterface,
	s3Service S3ServiceInterface,
	mimeValidationService *MimeValidationService,
) *FileService {
	return &FileService{
		fileRepo:              fileRepo,
		fileHashRepo:          fileHashRepo,
		shareRepo:             shareRepo,
		downloadRepo:          downloadRepo,
		s3Service:             s3Service,
		mimeValidationService: mimeValidationService,
	}
}

// UploadFile uploads a file with deduplication to S3
// Returns the file record or an error if upload fails
func (s *FileService) UploadFile(file multipart.File, fileHeader *multipart.FileHeader, uploaderID uuid.UUID) (*models.File, error) {
	fmt.Println("=== FILE SERVICE UPLOAD DEBUG START ===")
	fmt.Printf("DEBUG: FileService.UploadFile called - File: %s, Size: %d, Uploader: %s\n",
		fileHeader.Filename, fileHeader.Size, uploaderID.String())

	// Validate file size (max 100MB)
	const maxFileSize = 100 * 1024 * 1024
	if fileHeader.Size > maxFileSize {
		fmt.Printf("ERROR: File too large: %d bytes (max: %d bytes)\n", fileHeader.Size, maxFileSize)
		return nil, fmt.Errorf("file too large: %d bytes (max: %d bytes)", fileHeader.Size, maxFileSize)
	}
	fmt.Printf("DEBUG: File size validation passed: %d bytes\n", fileHeader.Size)

	// Read file content for hash calculation
	fmt.Println("DEBUG: Reading file content...")
	fileContent, err := io.ReadAll(file)
	if err != nil {
		fmt.Printf("ERROR: Failed to read file content: %v\n", err)
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}
	fmt.Printf("DEBUG: File content read successfully: %d bytes\n", len(fileContent))

	// Validate MIME type for security
	fmt.Println("DEBUG: Detecting MIME type...")
	detectedMimeType := mimetype.Detect(fileContent)
	declaredMimeType := fileHeader.Header.Get("Content-Type")

	// Set default MIME type if not provided
	if declaredMimeType == "" {
		declaredMimeType = "application/octet-stream"
	}

	fmt.Printf("DEBUG: MIME types - Declared: %s, Detected: %s\n", declaredMimeType, detectedMimeType.String())

	// Validate MIME type against file content using the validation service
	fmt.Println("DEBUG: Validating MIME type against file content...")
	if err := s.mimeValidationService.ValidateMimeType(fileContent, declaredMimeType); err != nil {
		fmt.Printf("ERROR: MIME type validation failed: %v\n", err)
		return nil, fmt.Errorf("file content does not match declared MIME type '%s': %w", declaredMimeType, err)
	}
	fmt.Println("DEBUG: MIME type validation passed")

	// Log MIME type mismatches for security monitoring
	if declaredMimeType != "" && detectedMimeType.String() != declaredMimeType {
		log.Printf("WARNING: MIME type mismatch for file %s - declared: %s, detected: %s",
			fileHeader.Filename, declaredMimeType, detectedMimeType.String())
		fmt.Printf("WARNING: MIME type mismatch detected but validation passed...\n")
	}

	// Calculate SHA-256 hash
	fmt.Println("DEBUG: Calculating file hash...")
	hash := sha256.Sum256(fileContent)
	hashString := fmt.Sprintf("%x", hash)
	fmt.Printf("DEBUG: File hash calculated: %s\n", hashString)

	// Create a new reader from the content
	contentReader := bytes.NewReader(fileContent)

	// Check if file with this hash already exists
	fmt.Println("DEBUG: Checking for existing file with same hash...")
	existingFileHash, err := s.fileHashRepo.GetByHash(hashString)
	if err == nil {
		fmt.Println("DEBUG: Duplicate file detected, creating reference...")
		// File already exists, create a reference
		result, err := s.createFileReference(fileHeader, uploaderID, existingFileHash)
		if err != nil {
			fmt.Printf("ERROR: Failed to create file reference: %v\n", err)
			return nil, err
		}
		fmt.Printf("SUCCESS: File reference created: %s\n", result.ID)
		fmt.Println("=== FILE SERVICE UPLOAD DEBUG END (DUPLICATE) ===")
		return result, nil
	}
	fmt.Println("DEBUG: New file detected, proceeding with S3 upload...")

	// New file, upload to S3
	result, err := s.saveNewFileToS3(fileHeader, uploaderID, hashString, contentReader)
	if err != nil {
		fmt.Printf("ERROR: Failed to save new file to S3: %v\n", err)
		fmt.Println("=== FILE SERVICE UPLOAD DEBUG END (ERROR) ===")
		return nil, err
	}

	fmt.Printf("SUCCESS: New file uploaded to S3: %s\n", result.ID)
	fmt.Println("=== FILE SERVICE UPLOAD DEBUG END (SUCCESS) ===")
	return result, nil
}

// createFileReference creates a file reference for an existing file
func (s *FileService) createFileReference(fileHeader *multipart.FileHeader, uploaderID uuid.UUID, existingFileHash *models.FileHash) (*models.File, error) {
	fmt.Println("DEBUG: Creating file reference for duplicate file...")
	file := &models.File{
		ID:           uuid.New(),
		Filename:     s.generateFilename(fileHeader.Filename),
		OriginalName: fileHeader.Filename,
		MimeType:     fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		Hash:         existingFileHash.Hash,
		IsDuplicate:  true, // This is a duplicate file
		UploaderID:   uploaderID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	fmt.Printf("DEBUG: File reference struct created: %+v\n", file)
	if err := s.fileRepo.Create(file); err != nil {
		fmt.Printf("ERROR: Failed to create file reference in database: %v\n", err)
		return nil, fmt.Errorf("failed to create file reference: %w", err)
	}
	fmt.Println("DEBUG: File reference created successfully in database")

	return file, nil
}

// saveNewFileToS3 saves a new file to S3 and database
func (s *FileService) saveNewFileToS3(fileHeader *multipart.FileHeader, uploaderID uuid.UUID, hashString string, src io.Reader) (*models.File, error) {
	fmt.Println("DEBUG: Starting S3 upload process...")

	// Upload file to S3
	fmt.Printf("DEBUG: Uploading file to S3 - Filename: %s, ContentType: %s\n",
		fileHeader.Filename, fileHeader.Header.Get("Content-Type"))
	s3URL, err := s.s3Service.UploadFile(context.Background(), src, fileHeader.Filename, fileHeader.Header.Get("Content-Type"))
	if err != nil {
		fmt.Printf("ERROR: S3 upload failed: %v\n", err)
		return nil, fmt.Errorf("failed to upload file to S3: %w", err)
	}
	fmt.Printf("DEBUG: S3 upload successful - URL: %s\n", s3URL)

	// Extract S3 key from URL
	s3Key := s.s3Service.ExtractKeyFromURL(s3URL)
	fmt.Printf("DEBUG: Extracted S3 key: %s\n", s3Key)

	// Generate unique filename for database record
	filename := s.generateFilename(fileHeader.Filename)
	fmt.Printf("DEBUG: Generated unique filename: %s\n", filename)

	// Create file hash record
	fileHash := &models.FileHash{
		ID:        uuid.New(),
		Hash:      hashString,
		S3Key:     s3Key,
		S3URL:     s3URL,
		Size:      fileHeader.Size,
		MimeType:  fileHeader.Header.Get("Content-Type"),
		CreatedAt: time.Now(),
	}
	fmt.Printf("DEBUG: FileHash struct created: %+v\n", fileHash)

	if err := s.fileHashRepo.Create(fileHash); err != nil {
		fmt.Printf("ERROR: Failed to create file hash record: %v\n", err)
		// Clean up S3 file on error
		fmt.Println("DEBUG: Cleaning up S3 file due to database error...")
		s.s3Service.DeleteFile(context.Background(), s3Key)
		return nil, fmt.Errorf("failed to create file hash: %w", err)
	}
	fmt.Println("DEBUG: FileHash record created successfully in database")

	// Create file record
	file := &models.File{
		ID:           uuid.New(),
		Filename:     filename,
		OriginalName: fileHeader.Filename,
		MimeType:     fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		Hash:         hashString,
		S3Key:        s3Key,
		IsDuplicate:  false, // This is a new unique file
		UploaderID:   uploaderID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	fmt.Printf("DEBUG: File struct created: %+v\n", file)

	if err := s.fileRepo.Create(file); err != nil {
		fmt.Printf("ERROR: Failed to create file record: %v\n", err)
		// Clean up S3 file and hash record on error
		fmt.Println("DEBUG: Cleaning up S3 file and hash record due to database error...")
		s.s3Service.DeleteFile(context.Background(), s3Key)
		s.fileHashRepo.Delete(hashString)
		return nil, fmt.Errorf("failed to create file record: %w", err)
	}
	fmt.Println("DEBUG: File record created successfully in database")

	return file, nil
}

// GetFilesByUserID retrieves files for a specific user
func (s *FileService) GetFilesByUserID(userID uuid.UUID, limit, offset int) ([]*models.File, error) {
	return s.fileRepo.GetByUserID(userID, limit, offset)
}

// SearchFilesByUserID searches files for a specific user
func (s *FileService) SearchFilesByUserID(userID uuid.UUID, searchTerm string, limit, offset int) ([]*models.File, error) {
	return s.fileRepo.SearchByUserID(userID, searchTerm, limit, offset)
}

// GetFileByID retrieves a file by ID
func (s *FileService) GetFileByID(fileID uuid.UUID) (*models.File, error) {
	return s.fileRepo.GetByID(fileID)
}

// DeleteFile deletes a file (only if user is the uploader)
func (s *FileService) DeleteFile(fileID uuid.UUID, userID uuid.UUID) error {
	// Get file to verify ownership
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	// Check if user is the uploader
	if file.UploaderID != userID {
		return fmt.Errorf("unauthorized: only the uploader can delete this file")
	}

	// Delete file record
	if err := s.fileRepo.Delete(fileID); err != nil {
		return fmt.Errorf("failed to delete file record: %w", err)
	}

	// Check if there are other references to this file
	otherFiles, err := s.fileRepo.GetByHash(file.Hash)
	if err != nil || len(otherFiles) == 0 {
		// No other references, delete the S3 file and hash record
		fileHash, err := s.fileHashRepo.GetByHash(file.Hash)
		if err == nil {
			if fileHash.S3Key != "" {
				s.s3Service.DeleteFile(context.Background(), fileHash.S3Key) // Remove S3 file
			}
			s.fileHashRepo.Delete(file.Hash) // Remove hash record
		}
	}

	return nil
}

// generateFilename generates a unique filename
func (s *FileService) generateFilename(originalName string) string {
	ext := filepath.Ext(originalName)
	name := strings.TrimSuffix(originalName, ext)
	return fmt.Sprintf("%s_%s%s", name, uuid.New().String(), ext)
}
