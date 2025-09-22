package main

import (
	"context"
	"filevault/graph"
	"filevault/internal/config"
	"filevault/internal/database"
	"filevault/internal/handlers"
	"filevault/internal/models"
	"filevault/internal/repositories"
	"filevault/internal/services"
	"filevault/internal/websocket"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	fileRepo := repositories.NewFileRepository(db)
	fileHashRepo := repositories.NewFileHashRepository(db)
	shareRepo := repositories.NewShareRepository(db)
	downloadRepo := repositories.NewDownloadRepository(db)
	fileShareRepo := repositories.NewFileShareRepository(db)
	folderRepo := repositories.NewFolderRepository(db)

	// Initialize S3 service
	log.Printf("DEBUG: Initializing S3Service with AWS Region: %s, Bucket: %s", cfg.AWSRegion, cfg.S3BucketName)
	log.Printf("DEBUG: AWS Access Key ID: %s...", cfg.AWSAccessKeyID[:10])
	log.Printf("DEBUG: AWS Secret Key: %s...", cfg.AWSSecretKey[:10])
	s3Service, err := services.NewS3Service(cfg.AWSRegion, cfg.AWSAccessKeyID, cfg.AWSSecretKey, cfg.S3BucketName, cfg.S3BucketURL)
	if err != nil {
		log.Fatal("Failed to initialize S3 service:", err)
	}
	log.Printf("DEBUG: S3Service initialized successfully")

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	mimeValidationService := services.NewMimeValidationService()
	websocketService := services.NewWebSocketService(hub)
	fileService := services.NewFileService(fileRepo, fileHashRepo, shareRepo, downloadRepo, s3Service, mimeValidationService, websocketService)
	quotaService := services.NewQuotaService(fileRepo, cfg.StorageQuotaMB)
	searchService := services.NewSearchService(fileRepo)
	adminService := services.NewAdminService(userRepo, fileRepo, fileHashRepo, s3Service, websocketService)
	folderService := services.NewFolderService(folderRepo)

	// Initialize file share service with S3 configuration
	log.Printf("DEBUG: Initializing FileShareService with AWS Region: %s, Bucket: %s, BaseURL: %s", cfg.AWSRegion, cfg.S3BucketName, cfg.BaseURL)
	fileShareService, err := services.NewFileShareService(
		fileShareRepo,
		fileRepo,
		cfg.AWSRegion,
		cfg.AWSAccessKeyID,
		cfg.AWSSecretKey,
		cfg.S3BucketName,
		cfg.BaseURL,
		websocketService,
	)
	if err != nil {
		log.Fatal("Failed to initialize file share service:", err)
	}
	log.Printf("DEBUG: FileShareService initialized successfully")

	// Create simple GraphQL server
	log.Printf("DEBUG: Creating GraphQL server with FileShareService and FolderService")
	graphqlServer := graph.NewSimpleGraphQLServer(authService, fileService, searchService, adminService, fileShareService, folderService)
	log.Printf("DEBUG: GraphQL server created successfully")

	// Setup Gin router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Cache-Control"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // 12 hours
	}))

	// Auth middleware for protected routes
	authMiddleware := graph.AuthMiddleware(authService)

	// API group for protected routes
	api := r.Group("/api")
	api.Use(authMiddleware)

	// GraphQL playground (only in development)
	if os.Getenv("GIN_MODE") != "release" {
		r.GET("/", gin.WrapH(playground.Handler("GraphQL playground", "/query")))
	}

	// GraphQL endpoint (no auth middleware - handled internally)
	r.POST("/query", func(c *gin.Context) {
		fmt.Printf("DEBUG: POST /query received - Content-Type: %s\n", c.GetHeader("Content-Type"))
		// Try to authenticate user if token is present
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if user, err := authService.ValidateToken(token); err == nil {
				// Set user in both request context and Gin context
				ctx := context.WithValue(c.Request.Context(), "user", user)
				c.Request = c.Request.WithContext(ctx)
				c.Set("user", user) // Also set in Gin context for GraphQL server
				fmt.Printf("DEBUG: User authenticated and set in context: %+v\n", user)
			} else {
				fmt.Printf("DEBUG: Token validation failed: %v\n", err)
			}
		} else {
			fmt.Println("DEBUG: No valid Authorization header found")
		}
		graphqlServer.HandleGraphQL(c)
	})

	// File upload endpoint with detailed debug statements
	api.POST("/upload", func(c *gin.Context) {
		fmt.Println("=== UPLOAD ENDPOINT DEBUG START ===")
		fmt.Printf("DEBUG: Upload endpoint called - Method: %s, Content-Type: %s\n", c.Request.Method, c.GetHeader("Content-Type"))

		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			fmt.Println("ERROR: No user found in context")
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userModel, ok := user.(*models.User)
		if !ok {
			fmt.Println("ERROR: Invalid user data in context")
			c.JSON(500, gin.H{"error": "Invalid user data"})
			return
		}
		fmt.Printf("DEBUG: User authenticated: %s (%s)\n", userModel.Username, userModel.ID)

		// Parse multipart form
		fmt.Println("DEBUG: Parsing multipart form...")
		err := c.Request.ParseMultipartForm(100 << 20) // 100 MB max
		if err != nil {
			fmt.Printf("ERROR: Failed to parse multipart form: %v\n", err)
			c.JSON(400, gin.H{"error": "Failed to parse form data"})
			return
		}
		fmt.Println("DEBUG: Multipart form parsed successfully")

		// Get file from form
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			fmt.Printf("ERROR: No file provided or failed to get file: %v\n", err)
			c.JSON(400, gin.H{"error": "No file provided"})
			return
		}
		defer file.Close()
		fmt.Printf("DEBUG: File received - Name: %s, Size: %d, Content-Type: %s\n",
			header.Filename, header.Size, header.Header.Get("Content-Type"))

		// Get folder_id from form (optional)
		var folderID *uuid.UUID
		if folderIDStr := c.PostForm("folder_id"); folderIDStr != "" {
			fmt.Printf("DEBUG: Folder ID provided: %s\n", folderIDStr)
			if parsedFolderID, err := uuid.Parse(folderIDStr); err == nil {
				folderID = &parsedFolderID
				fmt.Printf("DEBUG: Parsed folder ID: %s\n", folderID.String())
			} else {
				fmt.Printf("WARNING: Invalid folder ID format: %s\n", folderIDStr)
			}
		} else {
			fmt.Println("DEBUG: No folder ID provided, uploading to root")
		}

		// Upload file using service
		fmt.Println("DEBUG: Calling FileService.UploadFile...")
		uploadedFile, err := fileService.UploadFile(file, header, userModel.ID, folderID)
		if err != nil {
			fmt.Printf("ERROR: FileService.UploadFile failed: %v\n", err)
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		fmt.Printf("DEBUG: File uploaded successfully: %s\n", uploadedFile.ID)

		fmt.Println("=== UPLOAD ENDPOINT DEBUG END (SUCCESS) ===")
		c.JSON(200, gin.H{"file": uploadedFile})
	})

	// Simple file listing endpoint
	r.GET("/files", authMiddleware, func(c *gin.Context) {
		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userModel, ok := user.(*models.User)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user data"})
			return
		}

		// Get files for the user
		files, err := fileRepo.GetByUserID(userModel.ID, 100, 0)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get files: %v", err)})
			return
		}

		c.JSON(200, gin.H{
			"files": files,
			"count": len(files),
		})
	})

	// File preview endpoint (serves file for inline viewing)
	r.GET("/files/:id/preview", func(c *gin.Context) {
		fileID := c.Param("id")
		token := c.Query("token")

		var user *models.User
		var err error

		// Validate token if provided
		if token != "" {
			// Parse and validate JWT token
			user, err = authService.ValidateToken(token)
			if err != nil {
				c.JSON(401, gin.H{"error": "Invalid token"})
				return
			}
		} else {
			// No token provided, try to get from Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(401, gin.H{"error": "Authentication required"})
				return
			}

			// Extract token from "Bearer <token>"
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				c.JSON(401, gin.H{"error": "Invalid authorization header"})
				return
			}

			// Parse and validate JWT token
			user, err = authService.ValidateToken(tokenParts[1])
			if err != nil {
				c.JSON(401, gin.H{"error": "Invalid token"})
				return
			}
		}

		// Get file from database
		file, err := fileRepo.GetByID(uuid.MustParse(fileID))
		if err != nil {
			c.JSON(404, gin.H{"error": "File not found"})
			return
		}

		// Check if user owns the file
		if file.UploaderID != user.ID {
			c.JSON(403, gin.H{"error": "Access denied"})
			return
		}

		// Check if file has S3 key (new files) or use filename (legacy files)
		s3Key := file.S3Key
		if s3Key == "" {
			// Legacy file without S3 key, try local file
			localFilePath := filepath.Join(cfg.UploadPath, file.Filename)
			if _, err := os.Stat(localFilePath); err == nil {
				// Set headers for inline viewing
				c.Header("Content-Type", file.MimeType)
				c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", file.OriginalName))
				c.Header("Content-Length", fmt.Sprintf("%d", file.Size))
				c.File(localFilePath)
				return
			} else {
				c.JSON(404, gin.H{"error": "File not found on storage"})
				return
			}
		}

		// Download file from S3 and serve it directly for preview
		result, err := s3Service.GetClient().GetObject(c.Request.Context(), &s3.GetObjectInput{
			Bucket: aws.String(cfg.S3BucketName),
			Key:    aws.String(s3Key),
		})
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to download file from S3"})
			return
		}
		defer result.Body.Close()

		// Set appropriate headers for inline viewing
		c.Header("Content-Type", file.MimeType)
		c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", file.OriginalName))
		c.Header("Content-Length", fmt.Sprintf("%d", file.Size))
		c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour

		// Stream the file content
		io.Copy(c.Writer, result.Body)
	})

	// Simple file download endpoint
	r.GET("/files/:id/download", authMiddleware, func(c *gin.Context) {
		fileID := c.Param("id")

		// Get file from database
		file, err := fileRepo.GetByID(uuid.MustParse(fileID))
		if err != nil {
			c.JSON(404, gin.H{"error": "File not found"})
			return
		}

		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userModel, ok := user.(*models.User)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user data"})
			return
		}

		// Check if user owns the file
		if file.UploaderID != userModel.ID {
			c.JSON(403, gin.H{"error": "Access denied"})
			return
		}

		// Check if file has S3 key (new files) or use filename (legacy files)
		s3Key := file.S3Key
		if s3Key == "" {
			// Legacy file without S3 key, try local file
			localFilePath := filepath.Join(cfg.UploadPath, file.Filename)
			if _, err := os.Stat(localFilePath); err == nil {
				c.File(localFilePath)
				return
			} else {
				c.JSON(404, gin.H{"error": "File not found on storage"})
				return
			}
		}

		// Download file from S3 and serve it directly
		result, err := s3Service.GetClient().GetObject(c.Request.Context(), &s3.GetObjectInput{
			Bucket: aws.String(cfg.S3BucketName),
			Key:    aws.String(s3Key),
		})
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to download file from S3"})
			return
		}
		defer result.Body.Close()

		// Set appropriate headers
		c.Header("Content-Type", file.MimeType)
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.OriginalName))
		c.Header("Content-Length", fmt.Sprintf("%d", file.Size))

		// Stream the file content
		io.Copy(c.Writer, result.Body)
	})

	// Simple file deletion endpoint
	r.DELETE("/files/:id", authMiddleware, func(c *gin.Context) {
		fileID := c.Param("id")

		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userModel, ok := user.(*models.User)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user data"})
			return
		}

		// Use the file service to delete the file (handles S3 cleanup)
		if err := fileService.DeleteFile(uuid.MustParse(fileID), userModel.ID); err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to delete file: %v", err)})
			return
		}

		c.JSON(200, gin.H{"message": "File deleted successfully"})
	})

	// Quota info endpoint
	r.GET("/quota", authMiddleware, func(c *gin.Context) {
		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userModel, ok := user.(*models.User)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user data"})
			return
		}

		quotaInfo, err := quotaService.GetQuotaInfo(userModel.ID)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get quota info: %v", err)})
			return
		}

		c.JSON(200, quotaInfo)
	})

	// Initialize WebSocket handler
	wsHandler := handlers.NewWebSocketHandler(hub, authService, websocketService)

	// WebSocket endpoint (outside auth middleware - handles auth internally)
	r.GET("/api/ws", wsHandler.HandleWebSocket)
	api.GET("/ws/status", wsHandler.GetConnectionStatus)

	// File sharing routes
	handlers.RegisterFileShareRoutes(r, fileShareService)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Println("DEBUG: Server started with updated code")
	log.Fatal(r.Run(":" + port))
}
