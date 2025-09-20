package services

import (
	"fmt"
	"strings"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/google/uuid"
)

// FolderService handles folder business logic
type FolderService struct {
	folderRepo *repositories.FolderRepository
}

// NewFolderService creates a new folder service
func NewFolderService(folderRepo *repositories.FolderRepository) *FolderService {
	return &FolderService{
		folderRepo: folderRepo,
	}
}

// CreateFolder creates a new folder
func (s *FolderService) CreateFolder(ownerID uuid.UUID, req *models.CreateFolderRequest) (*models.Folder, error) {
	fmt.Printf("=== FOLDER SERVICE CREATE DEBUG START ===\n")
	fmt.Printf("DEBUG: FolderService.CreateFolder called with ownerID=%s, req=%+v\n", ownerID, req)

	// Validate request
	if req == nil {
		fmt.Printf("ERROR: Request is nil\n")
		return nil, fmt.Errorf("request cannot be nil")
	}

	if strings.TrimSpace(req.Name) == "" {
		fmt.Printf("ERROR: Folder name is empty\n")
		return nil, fmt.Errorf("folder name is required")
	}

	// Clean the folder name
	folderName := strings.TrimSpace(req.Name)
	fmt.Printf("DEBUG: Cleaned folder name: '%s'\n", folderName)

	// Check if parent folder exists and belongs to the user
	var parentPath string
	if req.ParentID != nil {
		fmt.Printf("DEBUG: Checking parent folder with ID: %s\n", *req.ParentID)
		parentFolder, err := s.folderRepo.GetByID(*req.ParentID)
		if err != nil {
			fmt.Printf("ERROR: Failed to get parent folder: %v\n", err)
			return nil, fmt.Errorf("failed to get parent folder: %w", err)
		}
		if parentFolder == nil {
			fmt.Printf("ERROR: Parent folder not found\n")
			return nil, fmt.Errorf("parent folder not found")
		}
		if parentFolder.OwnerID != ownerID {
			fmt.Printf("ERROR: Parent folder does not belong to user\n")
			return nil, fmt.Errorf("parent folder does not belong to you")
		}
		parentPath = parentFolder.Path
		fmt.Printf("DEBUG: Parent folder found, path: %s\n", parentPath)
	} else {
		parentPath = ""
		fmt.Printf("DEBUG: No parent folder, creating root folder\n")
	}

	// Build the full path
	var fullPath string
	if parentPath == "" {
		fullPath = folderName
	} else {
		fullPath = parentPath + "/" + folderName
	}
	fmt.Printf("DEBUG: Full path will be: %s\n", fullPath)

	// Check if folder with same name already exists in the same parent
	existingFolders, err := s.folderRepo.GetByOwnerID(ownerID)
	if err != nil {
		fmt.Printf("ERROR: Failed to get existing folders: %v\n", err)
		return nil, fmt.Errorf("failed to check existing folders: %w", err)
	}

	for _, existing := range existingFolders {
		if existing.Path == fullPath {
			fmt.Printf("ERROR: Folder with same path already exists: %s\n", fullPath)
			return nil, fmt.Errorf("folder with name '%s' already exists in this location", folderName)
		}
	}

	// Create the folder
	folder := &models.Folder{
		ID:        uuid.New(),
		Name:      folderName,
		Path:      fullPath,
		ParentID:  req.ParentID,
		OwnerID:   ownerID,
		FileCount: 0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	fmt.Printf("DEBUG: Created folder struct: %+v\n", folder)

	// Save to database
	err = s.folderRepo.Create(folder)
	if err != nil {
		fmt.Printf("ERROR: Failed to create folder in database: %v\n", err)
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	fmt.Printf("SUCCESS: Folder created successfully with ID: %s\n", folder.ID)
	fmt.Printf("=== FOLDER SERVICE CREATE DEBUG END ===\n")
	return folder, nil
}

// GetUserFolders retrieves all folders for a user
func (s *FolderService) GetUserFolders(ownerID uuid.UUID) ([]*models.Folder, error) {
	fmt.Printf("=== FOLDER SERVICE GET USER FOLDERS DEBUG START ===\n")
	fmt.Printf("DEBUG: FolderService.GetUserFolders called with ownerID=%s\n", ownerID)

	folders, err := s.folderRepo.GetByOwnerID(ownerID)
	if err != nil {
		fmt.Printf("ERROR: Failed to get user folders: %v\n", err)
		return nil, fmt.Errorf("failed to get user folders: %w", err)
	}

	fmt.Printf("SUCCESS: Retrieved %d folders for user %s\n", len(folders), ownerID)
	for i, folder := range folders {
		fmt.Printf("DEBUG: Folder %d: %s (path: %s)\n", i+1, folder.Name, folder.Path)
	}
	fmt.Printf("=== FOLDER SERVICE GET USER FOLDERS DEBUG END ===\n")
	return folders, nil
}

// GetFolderByID retrieves a folder by ID
func (s *FolderService) GetFolderByID(folderID uuid.UUID, userID uuid.UUID) (*models.Folder, error) {
	fmt.Printf("=== FOLDER SERVICE GET BY ID DEBUG START ===\n")
	fmt.Printf("DEBUG: FolderService.GetFolderByID called with folderID=%s, userID=%s\n", folderID, userID)

	folder, err := s.folderRepo.GetByID(folderID)
	if err != nil {
		fmt.Printf("ERROR: Failed to get folder by ID: %v\n", err)
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		fmt.Printf("DEBUG: Folder not found\n")
		return nil, fmt.Errorf("folder not found")
	}

	if folder.OwnerID != userID {
		fmt.Printf("ERROR: Folder does not belong to user\n")
		return nil, fmt.Errorf("folder does not belong to you")
	}

	fmt.Printf("SUCCESS: Folder retrieved: %+v\n", folder)
	fmt.Printf("=== FOLDER SERVICE GET BY ID DEBUG END ===\n")
	return folder, nil
}

// UpdateFolder updates a folder
func (s *FolderService) UpdateFolder(folderID uuid.UUID, userID uuid.UUID, req *models.UpdateFolderRequest) (*models.Folder, error) {
	fmt.Printf("=== FOLDER SERVICE UPDATE DEBUG START ===\n")
	fmt.Printf("DEBUG: FolderService.UpdateFolder called with folderID=%s, userID=%s, req=%+v\n", folderID, userID, req)

	// Get existing folder
	folder, err := s.GetFolderByID(folderID, userID)
	if err != nil {
		fmt.Printf("ERROR: Failed to get folder for update: %v\n", err)
		return nil, err
	}

	// Validate new name
	if strings.TrimSpace(req.Name) == "" {
		fmt.Printf("ERROR: New folder name is empty\n")
		return nil, fmt.Errorf("folder name is required")
	}

	newName := strings.TrimSpace(req.Name)
	fmt.Printf("DEBUG: Updating folder name from '%s' to '%s'\n", folder.Name, newName)

	// Update the folder
	folder.Name = newName
	folder.UpdatedAt = time.Now()

	// Update path if needed (for now, just update the name part)
	// TODO: Implement proper path updating logic
	pathParts := strings.Split(folder.Path, "/")
	if len(pathParts) > 0 {
		pathParts[len(pathParts)-1] = newName
		folder.Path = strings.Join(pathParts, "/")
	}

	fmt.Printf("DEBUG: Updated folder struct: %+v\n", folder)

	err = s.folderRepo.Update(folder)
	if err != nil {
		fmt.Printf("ERROR: Failed to update folder in database: %v\n", err)
		return nil, fmt.Errorf("failed to update folder: %w", err)
	}

	fmt.Printf("SUCCESS: Folder updated successfully\n")
	fmt.Printf("=== FOLDER SERVICE UPDATE DEBUG END ===\n")
	return folder, nil
}

// DeleteFolder deletes a folder
func (s *FolderService) DeleteFolder(folderID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("=== FOLDER SERVICE DELETE DEBUG START ===\n")
	fmt.Printf("DEBUG: FolderService.DeleteFolder called with folderID=%s, userID=%s\n", folderID, userID)

	// Get folder to verify ownership
	folder, err := s.GetFolderByID(folderID, userID)
	if err != nil {
		fmt.Printf("ERROR: Failed to get folder for deletion: %v\n", err)
		return err
	}

	// Check if folder has files
	if folder.FileCount > 0 {
		fmt.Printf("ERROR: Cannot delete folder with files (file count: %d)\n", folder.FileCount)
		return fmt.Errorf("cannot delete folder that contains files")
	}

	// Check if folder has subfolders
	subfolders, err := s.folderRepo.GetByParentID(folderID)
	if err != nil {
		fmt.Printf("ERROR: Failed to check for subfolders: %v\n", err)
		return fmt.Errorf("failed to check for subfolders: %w", err)
	}

	if len(subfolders) > 0 {
		fmt.Printf("ERROR: Cannot delete folder with subfolders (subfolder count: %d)\n", len(subfolders))
		return fmt.Errorf("cannot delete folder that contains subfolders")
	}

	// Delete the folder
	err = s.folderRepo.Delete(folderID)
	if err != nil {
		fmt.Printf("ERROR: Failed to delete folder from database: %v\n", err)
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	fmt.Printf("SUCCESS: Folder deleted successfully\n")
	fmt.Printf("=== FOLDER SERVICE DELETE DEBUG END ===\n")
	return nil
}
