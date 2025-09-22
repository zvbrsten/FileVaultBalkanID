#!/bin/bash

# FileVault Backend Test Runner
# This script runs all backend tests with proper setup

set -e

echo "🧪 Starting FileVault Backend Tests..."

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo "❌ Error: go.mod not found. Please run this script from the backend directory."
    exit 1
fi

# Install test dependencies if not already installed
echo "📦 Installing test dependencies..."
go mod tidy

# Check if testify is installed
if ! go list -m github.com/stretchr/testify > /dev/null 2>&1; then
    echo "📦 Installing testify..."
    go get github.com/stretchr/testify
fi

# Run unit tests
echo "🔬 Running unit tests..."
go test -v ./internal/services/... -coverprofile=coverage_services.out

# Run handler tests
echo "🔬 Running handler tests..."
go test -v ./internal/handlers/... -coverprofile=coverage_handlers.out

# Run integration tests (only if CI environment is set)
if [ "$CI" = "true" ]; then
    echo "🔬 Running integration tests..."
    go test -v ./integration_test.go -coverprofile=coverage_integration.out
else
    echo "⏭️  Skipping integration tests (set CI=true to run them)"
fi

# Combine coverage reports
echo "📊 Generating coverage report..."
go test -v ./... -coverprofile=coverage.out

# Generate HTML coverage report
go tool cover -html=coverage.out -o coverage.html

echo "✅ All tests completed!"
echo "📊 Coverage report generated: coverage.html"

# Show coverage summary
echo "📈 Coverage Summary:"
go tool cover -func=coverage.out | tail -1
