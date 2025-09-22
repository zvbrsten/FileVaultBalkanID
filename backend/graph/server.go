package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"filevault/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/parser"
)

// SimpleGraphQLServer provides a basic GraphQL server
type SimpleGraphQLServer struct {
	resolver *Resolver
}

// NewSimpleGraphQLServer creates a new simple GraphQL server
func NewSimpleGraphQLServer(authService *services.AuthService, fileService *services.FileService, searchService *services.SearchService, adminService *services.AdminService, fileShareService *services.FileShareService, folderService *services.FolderService) *SimpleGraphQLServer {
	return &SimpleGraphQLServer{
		resolver: NewResolver(authService, fileService, searchService, adminService, fileShareService, folderService),
	}
}

// GraphQLRequest represents a GraphQL request
type GraphQLRequest struct {
	Query         string                 `json:"query"`
	Variables     map[string]interface{} `json:"variables"`
	OperationName string                 `json:"operationName"`
}

// GraphQLResponse represents a GraphQL response
type GraphQLResponse struct {
	Data   interface{} `json:"data,omitempty"`
	Errors []string    `json:"errors,omitempty"`
}

// HandleGraphQL handles GraphQL requests
func (s *SimpleGraphQLServer) HandleGraphQL(c *gin.Context) {
	// Handle JSON requests only (no file uploads)
	var req GraphQLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Invalid JSON: " + err.Error()},
		})
		return
	}

	// Validate request
	if req.Query == "" {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Query is required"},
		})
		return
	}

	// Parse the query
	doc, err := parser.ParseQuery(&ast.Source{Input: req.Query})
	if err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{err.Error()},
		})
		return
	}

	// Create context with user
	ctx := c.Request.Context()
	if user, exists := c.Get("user"); exists {
		ctx = context.WithValue(ctx, "user", user)
	}

	// Execute the query
	result, err := s.executeQuery(doc, req.Variables, c, ctx)
	if err != nil {
		// For authentication errors, return 200 with error in GraphQL response
		// For other errors, return 500
		statusCode := http.StatusInternalServerError
		if strings.Contains(err.Error(), "Invalid email or password") ||
			strings.Contains(err.Error(), "already exists") ||
			strings.Contains(err.Error(), "already taken") ||
			strings.Contains(err.Error(), "Failed to create account") {
			statusCode = http.StatusOK
		}

		c.JSON(statusCode, GraphQLResponse{
			Errors: []string{err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, GraphQLResponse{
		Data: result,
	})
}

// executeQuery executes a GraphQL query
func (s *SimpleGraphQLServer) executeQuery(doc *ast.QueryDocument, variables map[string]interface{}, c *gin.Context, ctx context.Context) (interface{}, error) {
	result := make(map[string]interface{})

	for _, op := range doc.Operations {
		switch op.Operation {
		case ast.Query:
			queryResult, err := s.executeQueryOperation(op, variables, c, ctx)
			if err != nil {
				return nil, err
			}
			for k, v := range queryResult {
				result[k] = v
			}
		case ast.Mutation:
			mutationResult, err := s.executeMutationOperation(op, variables, c, ctx)
			if err != nil {
				return nil, err
			}
			for k, v := range mutationResult {
				result[k] = v
			}
		}
	}

	return result, nil
}

// executeQueryOperation executes a query operation
func (s *SimpleGraphQLServer) executeQueryOperation(op *ast.OperationDefinition, variables map[string]interface{}, c *gin.Context, ctx context.Context) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for _, sel := range op.SelectionSet {
		if field, ok := sel.(*ast.Field); ok {
			switch field.Name {
			case "me":
				user, err := s.resolver.Me(ctx)
				if err != nil {
					// Return null for me query if user is not authenticated
					result["me"] = nil
					continue
				}
				result["me"] = user
			case "files":
				limit := 10
				offset := 0
				if limitVal, ok := variables["limit"]; ok {
					if l, ok := limitVal.(int); ok {
						limit = l
					}
				}
				if offsetVal, ok := variables["offset"]; ok {
					if o, ok := offsetVal.(int); ok {
						offset = o
					}
				}
				files, err := s.resolver.Files(ctx, &limit, &offset)
				if err != nil {
					// Return empty array for files query if user is not authenticated
					result["files"] = []interface{}{}
					continue
				}
				result["files"] = files
			case "file":
				if id, ok := variables["id"]; ok {
					if idStr, ok := id.(string); ok {
						file, err := s.resolver.File(ctx, idStr)
						if err != nil {
							result["file"] = nil
							continue
						}
						result["file"] = file
					}
				}
			case "searchFiles":
				if searchTerm, ok := variables["searchTerm"]; ok {
					if term, ok := searchTerm.(string); ok {
						limit := 10
						offset := 0
						if limitVal, ok := variables["limit"]; ok {
							if l, ok := limitVal.(int); ok {
								limit = l
							}
						}
						if offsetVal, ok := variables["offset"]; ok {
							if o, ok := offsetVal.(int); ok {
								offset = o
							}
						}
						files, err := s.resolver.SearchFiles(ctx, term, &limit, &offset)
						if err != nil {
							result["searchFiles"] = []interface{}{}
							continue
						}
						result["searchFiles"] = files
					}
				}
			case "advancedSearch":
				// Handle advanced search with multiple filters
				searchResult, err := s.resolver.AdvancedSearch(ctx,
					getStringPtr(variables, "searchTerm"),
					getStringSlice(variables, "mimeTypes"),
					getIntPtr(variables, "minSize"),
					getIntPtr(variables, "maxSize"),
					getStringPtr(variables, "dateFrom"),
					getStringPtr(variables, "dateTo"),
					getStringPtr(variables, "sortBy"),
					getStringPtr(variables, "sortOrder"),
					getIntPtr(variables, "limit"),
					getIntPtr(variables, "offset"))
				if err != nil {
					result["advancedSearch"] = map[string]interface{}{
						"files":      []interface{}{},
						"totalCount": 0,
						"hasMore":    false,
					}
					continue
				}
				result["advancedSearch"] = searchResult
			case "fileStats":
				stats, err := s.resolver.FileStats(ctx)
				if err != nil {
					result["fileStats"] = nil
					continue
				}
				result["fileStats"] = stats
			case "mimeTypeCategories":
				categories, err := s.resolver.MimeTypeCategories(ctx)
				if err != nil {
					result["mimeTypeCategories"] = nil
					continue
				}
				result["mimeTypeCategories"] = categories
			case "adminStats":
				stats, err := s.resolver.AdminStats(ctx)
				if err != nil {
					result["adminStats"] = nil
					continue
				}
				result["adminStats"] = stats
			case "adminUsers":
				users, err := s.resolver.AdminUsers(ctx,
					getIntPtr(variables, "limit"),
					getIntPtr(variables, "offset"))
				if err != nil {
					result["adminUsers"] = []interface{}{}
					continue
				}
				result["adminUsers"] = users
			case "adminUserDetails":
				userDetails, err := s.resolver.AdminUserDetails(ctx,
					getString(variables, "userId"))
				if err != nil {
					result["adminUserDetails"] = nil
					continue
				}
				result["adminUserDetails"] = userDetails
			case "adminSystemHealth":
				health, err := s.resolver.AdminSystemHealth(ctx)
				if err != nil {
					result["adminSystemHealth"] = nil
					continue
				}
				result["adminSystemHealth"] = health
			case "myFileShares":
				shares, err := s.resolver.MyFileShares(ctx,
					getIntPtr(variables, "limit"),
					getIntPtr(variables, "offset"))
				if err != nil {
					result["myFileShares"] = []interface{}{}
					continue
				}
				result["myFileShares"] = shares
			case "fileShareStats":
				stats, err := s.resolver.FileShareStats(ctx,
					getString(variables, "shareId"))
				if err != nil {
					result["fileShareStats"] = nil
					continue
				}
				result["fileShareStats"] = stats
			case "folders":
				folders, err := s.resolver.Folders(ctx)
				if err != nil {
					result["folders"] = []interface{}{}
					continue
				}
				result["folders"] = folders
			case "folder":
				folder, err := s.resolver.Folder(ctx,
					getString(variables, "id"))
				if err != nil {
					result["folder"] = nil
					continue
				}
				result["folder"] = folder
			case "filesByFolder":
				files, err := s.resolver.FilesByFolder(ctx,
					getString(variables, "folderId"),
					getInt(variables, "limit"),
					getInt(variables, "offset"))
				if err != nil {
					result["filesByFolder"] = []interface{}{}
					continue
				}
				result["filesByFolder"] = files
			}
		}
	}

	return result, nil
}

// executeMutationOperation executes a mutation operation
func (s *SimpleGraphQLServer) executeMutationOperation(op *ast.OperationDefinition, variables map[string]interface{}, c *gin.Context, ctx context.Context) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for _, sel := range op.SelectionSet {
		if field, ok := sel.(*ast.Field); ok {
			switch field.Name {
			case "registerUser":
				if email, ok := variables["email"]; ok {
					if username, ok := variables["username"]; ok {
						if password, ok := variables["password"]; ok {
							if emailStr, ok := email.(string); ok {
								if usernameStr, ok := username.(string); ok {
									if passwordStr, ok := password.(string); ok {
										authPayload, err := s.resolver.RegisterUser(ctx, emailStr, usernameStr, passwordStr)
										if err != nil {
											return nil, err
										}
										result["registerUser"] = authPayload
									}
								}
							}
						}
					}
				}
			case "loginUser":
				if email, ok := variables["email"]; ok {
					if password, ok := variables["password"]; ok {
						if emailStr, ok := email.(string); ok {
							if passwordStr, ok := password.(string); ok {
								authPayload, err := s.resolver.LoginUser(ctx, emailStr, passwordStr)
								if err != nil {
									return nil, err
								}
								result["loginUser"] = authPayload
							} else {
							}
						} else {
						}
					} else {
					}
				} else {
				}
			// uploadFile mutation removed - will be rebuilt later
			case "deleteFile":
				if id, ok := variables["id"]; ok {
					if idStr, ok := id.(string); ok {
						success, err := s.resolver.DeleteFile(ctx, idStr)
						if err != nil {
							result["deleteFile"] = false
							continue
						}
						result["deleteFile"] = success
					}
				}
			case "adminDeleteUser":
				if userID, ok := variables["userId"]; ok {
					if userIDStr, ok := userID.(string); ok {
						success, err := s.resolver.AdminDeleteUser(ctx, userIDStr)
						if err != nil {
							result["adminDeleteUser"] = false
							continue
						}
						result["adminDeleteUser"] = success
					}
				}
			case "adminUpdateUserRole":
				if userID, ok := variables["userId"]; ok {
					if role, ok := variables["role"]; ok {
						if userIDStr, ok := userID.(string); ok {
							if roleStr, ok := role.(string); ok {
								success, err := s.resolver.AdminUpdateUserRole(ctx, userIDStr, roleStr)
								if err != nil {
									result["adminUpdateUserRole"] = false
									continue
								}
								result["adminUpdateUserRole"] = success
							}
						}
					}
				}
			case "createFileShare":
				fmt.Printf("DEBUG: Processing createFileShare mutation\n")
				if fileID, ok := variables["fileId"]; ok {
					if fileIDStr, ok := fileID.(string); ok {
						fmt.Printf("DEBUG: FileID: %s\n", fileIDStr)
						expiresAt := getStringPtr(variables, "expiresAt")
						maxDownloads := getIntPtr(variables, "maxDownloads")

						fmt.Printf("DEBUG: Calling resolver.CreateFileShare\n")
						fileShare, err := s.resolver.CreateFileShare(ctx, fileIDStr, expiresAt, maxDownloads)
						if err != nil {
							fmt.Printf("DEBUG: CreateFileShare error: %v\n", err)
							result["createFileShare"] = nil
							continue
						}
						fmt.Printf("DEBUG: CreateFileShare success: %+v\n", fileShare)
						result["createFileShare"] = fileShare
					} else {
						fmt.Printf("DEBUG: fileID is not a string: %T\n", fileID)
					}
				} else {
					fmt.Printf("DEBUG: fileId not found in variables\n")
				}
			case "updateFileShare":
				if shareID, ok := variables["shareId"]; ok {
					if shareIDStr, ok := shareID.(string); ok {
						isActive := getBoolPtr(variables, "isActive")
						expiresAt := getStringPtr(variables, "expiresAt")
						maxDownloads := getIntPtr(variables, "maxDownloads")

						fileShare, err := s.resolver.UpdateFileShare(ctx, shareIDStr, isActive, expiresAt, maxDownloads)
						if err != nil {
							result["updateFileShare"] = nil
							continue
						}
						result["updateFileShare"] = fileShare
					}
				}
			case "deleteFileShare":
				if shareID, ok := variables["shareId"]; ok {
					if shareIDStr, ok := shareID.(string); ok {
						success, err := s.resolver.DeleteFileShare(ctx, shareIDStr)
						if err != nil {
							result["deleteFileShare"] = false
							continue
						}
						result["deleteFileShare"] = success
					}
				}
			case "createFolder":
				if name, ok := variables["name"]; ok {
					if nameStr, ok := name.(string); ok {
						parentID := getStringPtr(variables, "parentId")
						folder, err := s.resolver.CreateFolder(ctx, nameStr, parentID)
						if err != nil {
							result["createFolder"] = nil
							continue
						}
						result["createFolder"] = folder
					}
				}
			case "updateFolder":
				if id, ok := variables["id"]; ok {
					if idStr, ok := id.(string); ok {
						if name, ok := variables["name"]; ok {
							if nameStr, ok := name.(string); ok {
								folder, err := s.resolver.UpdateFolder(ctx, idStr, nameStr)
								if err != nil {
									result["updateFolder"] = nil
									continue
								}
								result["updateFolder"] = folder
							}
						}
					}
				}
			case "deleteFolder":
				if id, ok := variables["id"]; ok {
					if idStr, ok := id.(string); ok {
						success, err := s.resolver.DeleteFolder(ctx, idStr)
						if err != nil {
							result["deleteFolder"] = false
							continue
						}
						result["deleteFolder"] = success
					}
				}
			}
		}
	}

	return result, nil
}

// handleMultipartRequest handles multipart form data requests (file uploads)
func (s *SimpleGraphQLServer) handleMultipartRequest(c *gin.Context) {
	fmt.Println("DEBUG: Starting multipart request handling")

	// Debug: Check if user is in context
	if user, exists := c.Get("user"); exists {
		fmt.Printf("DEBUG: User found in Gin context (multipart): %+v\n", user)
	} else {
		fmt.Println("DEBUG: No user found in Gin context (multipart)")
	}
	// Parse the multipart form
	err := c.Request.ParseMultipartForm(32 << 20) // 32 MB max
	if err != nil {
		fmt.Printf("DEBUG: Failed to parse multipart form: %v\n", err)
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Failed to parse multipart form"},
		})
		return
	}
	fmt.Println("DEBUG: Successfully parsed multipart form")

	// Debug: Print all form fields
	fmt.Println("DEBUG: Form fields:")
	for key, values := range c.Request.PostForm {
		fmt.Printf("  %s: %v\n", key, values)
	}

	// Get the operations field (contains the GraphQL query)
	operations := c.PostForm("operations")
	if operations == "" {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Missing operations field"},
		})
		return
	}

	// Parse the operations JSON
	var req GraphQLRequest
	if err := json.Unmarshal([]byte(operations), &req); err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Invalid operations JSON"},
		})
		return
	}

	// Get the map field (maps file variables to form fields)
	mapField := c.PostForm("map")
	if mapField == "" {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Missing map field"},
		})
		return
	}

	// Parse the map JSON
	var fileMap map[string][]string
	if err := json.Unmarshal([]byte(mapField), &fileMap); err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{"Invalid map JSON"},
		})
		return
	}

	// Replace file variables with actual files
	fmt.Printf("DEBUG: Processing file map: %+v\n", fileMap)
	for variable, fileKeys := range fileMap {
		fmt.Printf("DEBUG: Processing variable %s with file keys: %v\n", variable, fileKeys)
		for _, fileKey := range fileKeys {
			fmt.Printf("DEBUG: Getting file with key: %s\n", fileKey)
			file, header, err := c.Request.FormFile(fileKey)
			if err != nil {
				fmt.Printf("ERROR: Failed to get file %s: %v\n", fileKey, err)
				c.JSON(http.StatusBadRequest, GraphQLResponse{
					Errors: []string{fmt.Sprintf("Failed to get file %s: %v", fileKey, err)},
				})
				return
			}
			defer file.Close()

			fmt.Printf("DEBUG: File retrieved successfully: %s, size: %d\n", header.Filename, header.Size)

			// Set the file in variables
			if req.Variables == nil {
				req.Variables = make(map[string]interface{})
			}
			req.Variables[variable] = file

			// Store file header in context for later use
			c.Set("fileHeader", header)
			fmt.Printf("DEBUG: File set in variables and context\n")
		}
	}

	// Parse the query
	fmt.Printf("DEBUG: Parsing GraphQL query: %s\n", req.Query)
	doc, err := parser.ParseQuery(&ast.Source{Input: req.Query})
	if err != nil {
		fmt.Printf("ERROR: Query parsing failed: %v\n", err)
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []string{err.Error()},
		})
		return
	}
	fmt.Println("DEBUG: Query parsed successfully")

	// Create context with user
	ctx := c.Request.Context()
	if user, exists := c.Get("user"); exists {
		ctx = context.WithValue(ctx, "user", user)
		fmt.Printf("DEBUG: User context set: %+v\n", user)
	}

	// Execute the query
	fmt.Printf("DEBUG: Executing query with variables: %+v\n", req.Variables)
	result, err := s.executeQuery(doc, req.Variables, c, ctx)
	if err != nil {
		fmt.Printf("ERROR: Query execution failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, GraphQLResponse{
			Errors: []string{err.Error()},
		})
		return
	}
	fmt.Printf("DEBUG: Query executed successfully, result: %+v\n", result)

	c.JSON(http.StatusOK, GraphQLResponse{
		Data: result,
	})
}
