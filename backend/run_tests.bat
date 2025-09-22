@echo off
REM FileVault Backend Test Runner for Windows
REM This script runs all backend tests with proper setup

echo 🧪 Starting FileVault Backend Tests...

REM Check if we're in the right directory
if not exist "go.mod" (
    echo ❌ Error: go.mod not found. Please run this script from the backend directory.
    exit /b 1
)

REM Install test dependencies if not already installed
echo 📦 Installing test dependencies...
go mod tidy

REM Check if testify is installed
go list -m github.com/stretchr/testify >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing testify...
    go get github.com/stretchr/testify
)

REM Run unit tests
echo 🔬 Running unit tests...
go test -v ./internal/services/... -coverprofile=coverage_services.out

REM Run handler tests
echo 🔬 Running handler tests...
go test -v ./internal/handlers/... -coverprofile=coverage_handlers.out

REM Run integration tests (only if CI environment is set)
if "%CI%"=="true" (
    echo 🔬 Running integration tests...
    go test -v ./integration_test.go -coverprofile=coverage_integration.out
) else (
    echo ⏭️  Skipping integration tests (set CI=true to run them)
)

REM Combine coverage reports
echo 📊 Generating coverage report...
go test -v ./... -coverprofile=coverage.out

REM Generate HTML coverage report
go tool cover -html=coverage.out -o coverage.html

echo ✅ All tests completed!
echo 📊 Coverage report generated: coverage.html

REM Show coverage summary
echo 📈 Coverage Summary:
go tool cover -func=coverage.out | findstr total

