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

## 📁 Project Structure

```
FileVault/
├── backend/                 # Go backend application
├── frontend/               # React frontend application
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## 🔧 Development

This project follows a microservices architecture with:
- **Backend**: Go with GraphQL API
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker Compose

## 📄 License

This project is licensed under the MIT License.
