# FileVault - Secure File Storage System

A production-grade MVP for a secure file vault system built with Go, GraphQL, PostgreSQL, React.js, and Docker Compose.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Go Backend    │    │   PostgreSQL    │
│   Frontend      │◄──►│   GraphQL API   │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8080)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **🔐 JWT Authentication** - Secure user registration and login
- **📁 File Upload & Storage** - Drag-and-drop file upload with progress
- **🔄 Deduplication** - SHA-256 based file deduplication to save storage
- **🔍 Search & Filter** - Advanced file search with multiple filters
- **⚡ Rate Limiting** - 2 requests per second per user
- **📊 Storage Quotas** - 10 MB default quota per user
- **🛡️ MIME Type Validation** - Security validation for uploaded files
- **📱 Responsive UI** - Modern React interface with TailwindCSS

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.21+ (for local development)
- Node.js 18+ (for local development)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd FileVault

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/query
# GraphQL Playground: http://localhost:8080/
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
go mod tidy

# Set up environment variables
cp env.example .env
# Edit .env with your database configuration

# Start PostgreSQL (if not using Docker)
# Create database: filevault
# Create user: filevault with password: password

# Run migrations
go run cmd/server/main.go
# Migrations will run automatically on startup

# Start the server
go run cmd/server/main.go
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📁 Project Structure

```
FileVault/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── api/            # GraphQL resolvers and schema
│   │   ├── config/         # Configuration management
│   │   ├── database/       # Database connection and migrations
│   │   ├── models/         # Data models
│   │   ├── repositories/   # Data access layer
│   │   └── services/       # Business logic
│   ├── migrations/         # SQL migration files
│   ├── uploads/           # File storage directory
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # GraphQL client
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)

```env
# Database Configuration
DATABASE_URL=postgres://filevault:password@localhost:5432/filevault?sslmode=disable

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# File Upload Configuration
UPLOAD_PATH=./uploads

# Server Configuration
PORT=8080
GIN_MODE=debug

# Rate Limiting (optional)
RATE_LIMIT_REQUESTS=2
RATE_LIMIT_WINDOW=1s

# Storage Quota (optional)
DEFAULT_QUOTA_MB=10
```

### Frontend (.env)

```env
# GraphQL API URL
REACT_APP_GRAPHQL_URL=http://localhost:8080/query
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `username` (String, Unique)
- `password_hash` (String)
- `role` (String, Default: 'user')
- `created_at`, `updated_at` (Timestamps)

### Files Table
- `id` (UUID, Primary Key)
- `filename` (String) - Generated unique filename
- `original_name` (String) - Original filename
- `mime_type` (String)
- `size` (Integer) - File size in bytes
- `hash` (String) - SHA-256 hash for deduplication
- `uploader_id` (UUID, Foreign Key)
- `created_at`, `updated_at` (Timestamps)

### File Hashes Table
- `id` (UUID, Primary Key)
- `hash` (String, Unique) - SHA-256 hash
- `file_path` (String) - Physical file location
- `size` (Integer) - File size in bytes
- `mime_type` (String)
- `created_at`, `updated_at` (Timestamps)

### Shares Table
- `id` (UUID, Primary Key)
- `file_id` (UUID, Foreign Key)
- `shared_by` (UUID, Foreign Key)
- `shared_with` (UUID, Foreign Key, Nullable)
- `permissions` (String) - 'read', 'write', 'admin'
- `expires_at` (Timestamp, Nullable)
- `created_at`, `updated_at` (Timestamps)

### Downloads Table
- `id` (UUID, Primary Key)
- `file_id` (UUID, Foreign Key)
- `downloaded_by` (UUID, Foreign Key)
- `ip_address` (String)
- `user_agent` (String)
- `created_at` (Timestamp)

## 🔌 GraphQL API

### Queries

```graphql
# Get current user
query Me {
  me {
    id
    email
    username
    role
  }
}

# Get user's files
query Files($limit: Int, $offset: Int) {
  files(limit: $limit, offset: $offset) {
    id
    filename
    originalName
    mimeType
    size
    hash
    createdAt
  }
}

# Search files
query SearchFiles($searchTerm: String!, $limit: Int, $offset: Int) {
  searchFiles(searchTerm: $searchTerm, limit: $limit, offset: $offset) {
    id
    filename
    originalName
    mimeType
    size
    hash
    createdAt
  }
}

# Get specific file
query File($id: ID!) {
  file(id: $id) {
    id
    filename
    originalName
    mimeType
    size
    hash
    createdAt
  }
}
```

### Mutations

```graphql
# Register new user
mutation RegisterUser($email: String!, $username: String!, $password: String!) {
  registerUser(email: $email, username: $username, password: $password) {
    token
    user {
      id
      email
      username
    }
  }
}

# Login user
mutation LoginUser($email: String!, $password: String!) {
  loginUser(email: $email, password: $password) {
    token
    user {
      id
      email
      username
    }
  }
}

# Upload file
mutation UploadFile($file: Upload!) {
  uploadFile(file: $file) {
    id
    filename
    originalName
    mimeType
    size
    hash
    createdAt
  }
}

# Delete file
mutation DeleteFile($id: ID!) {
  deleteFile(id: $id)
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./internal/services -v
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Production Deployment

1. **Update Environment Variables**
   ```bash
   # Set production values
   JWT_SECRET=your-super-secure-secret-key
   GIN_MODE=release
   DATABASE_URL=postgres://user:pass@prod-db:5432/filevault
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

3. **SSL/HTTPS Setup**
   - Use a reverse proxy (nginx/traefik)
   - Configure SSL certificates
   - Update CORS settings for production domain

### Environment-Specific Configurations

- **Development**: Debug mode, local database
- **Staging**: Production-like with test data
- **Production**: Optimized, secure, monitored

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **MIME Type Validation** to prevent malicious uploads
- **File Deduplication** to optimize storage
- **CORS Configuration** for secure cross-origin requests
- **Input Validation** on all user inputs

## 📊 Performance Features

- **File Deduplication** - SHA-256 based deduplication saves storage
- **Database Indexing** - Optimized queries with proper indexes
- **Rate Limiting** - Prevents system overload
- **Storage Quotas** - Manages resource usage
- **Efficient File Storage** - Only unique files stored physically

## 🛠️ Development

### Adding New Features

1. **Backend Changes**
   - Add models in `internal/models/`
   - Create repositories in `internal/repositories/`
   - Implement business logic in `internal/services/`
   - Add GraphQL resolvers in `internal/api/`

2. **Frontend Changes**
   - Create components in `src/components/`
   - Add pages in `src/pages/`
   - Update GraphQL queries in `src/api/queries.ts`

3. **Database Changes**
   - Create migration files in `migrations/`
   - Update models accordingly
   - Test migrations locally

### Code Quality

- **Go**: Use `gofmt`, `golint`, `go vet`
- **TypeScript**: Use ESLint, Prettier
- **Testing**: Maintain >80% test coverage
- **Documentation**: Update README for new features

## 📝 API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### Error Handling

The API returns structured error responses:
```json
{
  "errors": ["Error message"],
  "data": null
}
```

### Rate Limiting

- **Limit**: 2 requests per second per user
- **Response**: 429 Too Many Requests when exceeded
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the GraphQL playground at `/` endpoint

## 🎯 Roadmap

- [ ] File sharing with expiration
- [ ] Advanced search filters (date range, size range)
- [ ] File versioning
- [ ] Admin dashboard
- [ ] API rate limiting improvements
- [ ] File compression
- [ ] CDN integration
- [ ] Mobile app
- [ ] Webhook support
- [ ] Audit logging

---

**Built with ❤️ for secure file storage**