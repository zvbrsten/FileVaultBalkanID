# FileVault System Architecture

## Overview

This document outlines the system architecture for FileVault, a secure file storage system with advanced features including deduplication, search, and quota management.

## System Components

### 1. User-Facing Components

#### User Interface (Frontend)
- **Technology**: React.js with TypeScript
- **Responsibilities**:
  - Sends GraphQL requests for Auth, Upload, Search, Sharing
  - Receives JSON responses with Search results, File metadata, Stats
  - Provides drag-and-drop file upload interface
  - Displays file listings with advanced search filters

#### Frontend Layer
- **Technology**: React with TailwindCSS
- **Responsibilities**:
  - Sends GraphQL requests to Backend
  - Handles user authentication state
  - Manages file upload progress and status

### 2. Core Logic and Backend Services

#### Authentication & Logic (GraphQL API)
- **Technology**: Go with GraphQL
- **Responsibilities**:
  - Receives GraphQL requests: Auth, Upload, Search, Sharing
  - Sends JSON responses: Search results, File metadata, Stats
  - Manages user authentication and authorization
  - Handles business logic for file operations
  - Interacts with User Info & Metadata storage
  - Manages Sharing Permissions & Stats

#### Backend Services
- **Technology**: Go with Gin framework
- **Responsibilities**:
  - Receives GraphQL requests from Frontend
  - Performs File content upload/download with FileStorage
  - Performs Metadata read/write with Database
  - Implements rate limiting and quota enforcement

### 3. Data Storage Components

#### FileStorage
- **Technology**: Local file system with Docker volumes
- **Responsibilities**:
  - Stores actual file content
  - Handles file upload/download operations
  - Manages file deduplication storage

#### File Contents Storage
- **Technology**: Optimized file system storage
- **Responsibilities**:
  - Receives Upload files from Deduplication & Quotas
  - Sends Fetch files to Deduplication & Quotas
  - Stores unique file content only (deduplication)

#### Database (PostgreSQL)
- **Technology**: PostgreSQL 15
- **Responsibilities**:
  - Stores system metadata
  - Manages user information
  - Handles file metadata and relationships
  - Provides metadata response to Deduplication & Quotas

#### User Info & Metadata
- **Technology**: PostgreSQL tables
- **Responsibilities**:
  - Stores user-specific information
  - Manages file metadata and relationships
  - Interacts with Authentication & Logic

#### Sharing Permissions & Stats
- **Technology**: PostgreSQL tables
- **Responsibilities**:
  - Stores file sharing permissions
  - Tracks usage statistics
  - Manages quota information

### 4. Specialized Processes

#### Deduplication & Quotas
- **Technology**: Go services with SHA-256 hashing
- **Responsibilities**:
  - Receives Metadata response from Database
  - Checks for file deduplication
  - Enforces user storage quotas
  - Manages file upload to File Contents Storage
  - Fetches files for deduplication checks

## Data Flow Patterns

### User Interaction Flow
1. Users interact via User Interface or Frontend
2. User Interface communicates with Authentication & Logic for core actions
3. Frontend communicates with Backend via GraphQL
4. Responses flow back through the same channels

### File Upload/Download Flow
1. **Upload**:
   - Backend handles file content upload/download with FileStorage
   - Files are processed by Deduplication & Quotas
   - Deduplication & Quotas interacts with Database for metadata checks
   - Unique files are stored in File Contents Storage

2. **Download**:
   - Backend retrieves file content from FileStorage
   - Metadata is fetched from Database
   - File is served to user through Frontend

### Metadata Management Flow
1. Backend performs Metadata read/write with Database
2. Authentication & Logic stores/retrieves metadata from User Info & Metadata
3. Sharing Permissions & Stats are managed through Authentication & Logic

### Deduplication and Quota Enforcement Flow
1. Deduplication & Quotas checks metadata from Database
2. File content is analyzed for duplicates using SHA-256 hashing
3. Only unique files are stored in File Contents Storage
4. User quotas are enforced before file storage
5. Reference counting maintains file relationships

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Per-user request rate limiting
- **MIME Type Validation**: Security validation for uploaded files
- **CORS Configuration**: Secure cross-origin request handling

## Performance Optimizations

- **File Deduplication**: SHA-256 based deduplication saves storage
- **Database Indexing**: Optimized queries with proper indexes
- **Storage Quotas**: Manages resource usage efficiently
- **Efficient File Storage**: Only unique files stored physically

## Technology Stack

- **Backend**: Go, GraphQL, Gin framework
- **Frontend**: React.js, TypeScript, TailwindCSS
- **Database**: PostgreSQL 15
- **Authentication**: JWT with bcrypt
- **File Storage**: Local file system with Docker volumes
- **Containerization**: Docker Compose
- **API**: GraphQL with custom resolvers

## Scalability Considerations

- **Microservices Architecture**: Clear separation of concerns
- **Database Optimization**: Proper indexing and query optimization
- **File Storage**: Efficient deduplication reduces storage requirements
- **Rate Limiting**: Prevents system overload
- **Containerization**: Easy horizontal scaling with Docker
