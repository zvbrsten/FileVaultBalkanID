package repositories

import (
	"database/sql"
	"fmt"

	"filevault/internal/models"

	"github.com/google/uuid"
)

// FolderRepositoryInterface defines the interface for folder operations
type FolderRepositoryInterface interface {
	Create(folder *models.Folder) error
	GetByID(id uuid.UUID) (*models.Folder, error)
	GetByOwnerID(ownerID uuid.UUID) ([]*models.Folder, error)
	GetByParentID(parentID uuid.UUID) ([]*models.Folder, error)
	Update(folder *models.Folder) error
	Delete(id uuid.UUID) error
	GetDB() *sql.DB
}

// FolderRepository handles folder database operations
type FolderRepository struct {
	db *sql.DB
}

// NewFolderRepository creates a new folder repository
func NewFolderRepository(db *sql.DB) *FolderRepository {
	return &FolderRepository{
		db: db,
	}
}

// GetDB returns the database connection
func (r *FolderRepository) GetDB() *sql.DB {
	return r.db
}

// Create creates a new folder
func (r *FolderRepository) Create(folder *models.Folder) error {
	fmt.Printf("DEBUG: FolderRepository.Create called with folder: %+v\n", folder)

	query := `
		INSERT INTO folders (id, name, path, parent_id, owner_id, file_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)
	fmt.Printf("DEBUG: Parameters: id=%s, name=%s, path=%s, parent_id=%v, owner_id=%s, file_count=%d\n",
		folder.ID, folder.Name, folder.Path, folder.ParentID, folder.OwnerID, folder.FileCount)

	_, err := r.db.Exec(query,
		folder.ID,
		folder.Name,
		folder.Path,
		folder.ParentID,
		folder.OwnerID,
		folder.FileCount,
		folder.CreatedAt,
		folder.UpdatedAt,
	)

	if err != nil {
		fmt.Printf("ERROR: Failed to create folder: %v\n", err)
		return fmt.Errorf("failed to create folder: %w", err)
	}

	fmt.Printf("SUCCESS: Folder created successfully with ID: %s\n", folder.ID)
	return nil
}

// GetByID retrieves a folder by ID
func (r *FolderRepository) GetByID(id uuid.UUID) (*models.Folder, error) {
	fmt.Printf("DEBUG: FolderRepository.GetByID called with id: %s\n", id)

	query := `
		SELECT id, name, path, parent_id, owner_id, file_count, created_at, updated_at
		FROM folders
		WHERE id = $1
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)

	row := r.db.QueryRow(query, id)

	folder := &models.Folder{}
	var parentID sql.NullString
	var path sql.NullString

	err := row.Scan(
		&folder.ID,
		&folder.Name,
		&path,
		&parentID,
		&folder.OwnerID,
		&folder.FileCount,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("DEBUG: No folder found with ID: %s\n", id)
			return nil, nil
		}
		fmt.Printf("ERROR: Failed to get folder by ID: %v\n", err)
		return nil, fmt.Errorf("failed to get folder by ID: %w", err)
	}

	// Handle nullable parent_id
	if parentID.Valid {
		parentUUID, err := uuid.Parse(parentID.String)
		if err != nil {
			fmt.Printf("WARNING: Invalid parent_id UUID: %s\n", parentID.String)
		} else {
			folder.ParentID = &parentUUID
		}
	}

	// Handle nullable path
	if path.Valid {
		folder.Path = path.String
	} else {
		folder.Path = folder.Name // Use name as path if path is NULL
	}

	fmt.Printf("SUCCESS: Folder retrieved: %+v\n", folder)
	return folder, nil
}

// GetByOwnerID retrieves all folders for a specific owner
func (r *FolderRepository) GetByOwnerID(ownerID uuid.UUID) ([]*models.Folder, error) {
	fmt.Printf("DEBUG: FolderRepository.GetByOwnerID called with ownerID: %s\n", ownerID)

	query := `
		SELECT id, name, path, parent_id, owner_id, file_count, created_at, updated_at
		FROM folders
		WHERE owner_id = $1
		ORDER BY name ASC
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)

	rows, err := r.db.Query(query, ownerID)
	if err != nil {
		fmt.Printf("ERROR: Failed to query folders by owner: %v\n", err)
		return nil, fmt.Errorf("failed to get folders by owner: %w", err)
	}
	defer rows.Close()

	var folders []*models.Folder
	for rows.Next() {
		folder := &models.Folder{}
		var parentID sql.NullString
		var path sql.NullString

		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&path,
			&parentID,
			&folder.OwnerID,
			&folder.FileCount,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)

		if err != nil {
			fmt.Printf("ERROR: Failed to scan folder: %v\n", err)
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}

		// Handle nullable parent_id
		if parentID.Valid {
			parentUUID, err := uuid.Parse(parentID.String)
			if err != nil {
				fmt.Printf("WARNING: Invalid parent_id UUID: %s\n", parentID.String)
			} else {
				folder.ParentID = &parentUUID
			}
		}

		// Handle nullable path
		if path.Valid {
			folder.Path = path.String
		} else {
			folder.Path = folder.Name // Use name as path if path is NULL
		}

		folders = append(folders, folder)
	}

	fmt.Printf("SUCCESS: Retrieved %d folders for owner %s\n", len(folders), ownerID)
	return folders, nil
}

// GetByParentID retrieves all subfolders for a specific parent
func (r *FolderRepository) GetByParentID(parentID uuid.UUID) ([]*models.Folder, error) {
	fmt.Printf("DEBUG: FolderRepository.GetByParentID called with parentID: %s\n", parentID)

	query := `
		SELECT id, name, path, parent_id, owner_id, file_count, created_at, updated_at
		FROM folders
		WHERE parent_id = $1
		ORDER BY name ASC
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)

	rows, err := r.db.Query(query, parentID)
	if err != nil {
		fmt.Printf("ERROR: Failed to query subfolders: %v\n", err)
		return nil, fmt.Errorf("failed to get subfolders: %w", err)
	}
	defer rows.Close()

	var folders []*models.Folder
	for rows.Next() {
		folder := &models.Folder{}
		var parentID sql.NullString
		var path sql.NullString

		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&path,
			&parentID,
			&folder.OwnerID,
			&folder.FileCount,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)

		if err != nil {
			fmt.Printf("ERROR: Failed to scan subfolder: %v\n", err)
			return nil, fmt.Errorf("failed to scan subfolder: %w", err)
		}

		// Handle nullable parent_id
		if parentID.Valid {
			parentUUID, err := uuid.Parse(parentID.String)
			if err != nil {
				fmt.Printf("WARNING: Invalid parent_id UUID: %s\n", parentID.String)
			} else {
				folder.ParentID = &parentUUID
			}
		}

		// Handle nullable path
		if path.Valid {
			folder.Path = path.String
		} else {
			folder.Path = folder.Name // Use name as path if path is NULL
		}

		folders = append(folders, folder)
	}

	fmt.Printf("SUCCESS: Retrieved %d subfolders for parent %s\n", len(folders), parentID)
	return folders, nil
}

// Update updates an existing folder
func (r *FolderRepository) Update(folder *models.Folder) error {
	fmt.Printf("DEBUG: FolderRepository.Update called with folder: %+v\n", folder)

	query := `
		UPDATE folders 
		SET name = $2, path = $3, parent_id = $4, file_count = $5, updated_at = $6
		WHERE id = $1
	`

	fmt.Printf("DEBUG: Executing query: %s\n", query)

	result, err := r.db.Exec(query,
		folder.ID,
		folder.Name,
		folder.Path,
		folder.ParentID,
		folder.FileCount,
		folder.UpdatedAt,
	)

	if err != nil {
		fmt.Printf("ERROR: Failed to update folder: %v\n", err)
		return fmt.Errorf("failed to update folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("WARNING: Could not get rows affected: %v\n", err)
	} else {
		fmt.Printf("DEBUG: Updated %d rows\n", rowsAffected)
	}

	fmt.Printf("SUCCESS: Folder updated successfully\n")
	return nil
}

// Delete deletes a folder
func (r *FolderRepository) Delete(id uuid.UUID) error {
	fmt.Printf("DEBUG: FolderRepository.Delete called with id: %s\n", id)

	query := `DELETE FROM folders WHERE id = $1`

	fmt.Printf("DEBUG: Executing query: %s\n", query)

	result, err := r.db.Exec(query, id)
	if err != nil {
		fmt.Printf("ERROR: Failed to delete folder: %v\n", err)
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("WARNING: Could not get rows affected: %v\n", err)
	} else {
		fmt.Printf("DEBUG: Deleted %d rows\n", rowsAffected)
	}

	fmt.Printf("SUCCESS: Folder deleted successfully\n")
	return nil
}
