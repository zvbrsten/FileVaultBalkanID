@echo off
REM FileVault Frontend Test Runner for Windows
REM This script runs all frontend tests with proper setup

echo 🧪 Starting FileVault Frontend Tests...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the frontend directory.
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Install test dependencies if not already installed
echo 📦 Installing test dependencies...
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom ts-jest

REM Run unit tests
echo 🔬 Running unit tests...
npm test -- --coverage --watchAll=false

REM Run integration tests
echo 🔬 Running integration tests...
npm test -- --testPathPattern=integration --coverage --watchAll=false

echo ✅ All tests completed!
echo 📊 Coverage report generated in coverage/ directory

