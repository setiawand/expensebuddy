#!/bin/bash

# ExpenseBuddy Deployment Script
# This script handles the deployment of ExpenseBuddy to production

set -e  # Exit on any error

echo "🚀 Starting ExpenseBuddy deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Pull latest changes (if in git repository)
if [ -d ".git" ]; then
    print_status "Pulling latest changes from repository..."
    git pull origin master || {
        print_warning "Failed to pull latest changes. Continuing with current code..."
    }
fi

# Stop existing services
print_status "Stopping existing services..."
docker-compose -f docker-compose.prod.yml down || {
    print_warning "No existing services to stop."
}

# Remove old images to save space
print_status "Cleaning up old Docker images..."
docker image prune -f || true

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Health check
print_status "Performing health check..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend is running successfully!"
else
    print_error "❌ Frontend health check failed!"
    exit 1
fi

if curl -f http://localhost:8004/docs > /dev/null 2>&1; then
    print_status "✅ Backend is running successfully!"
else
    print_error "❌ Backend health check failed!"
    exit 1
fi

# Show running containers
print_status "Current running containers:"
docker-compose -f docker-compose.prod.yml ps

print_status "🎉 Deployment completed successfully!"
print_status "Frontend: http://localhost:3000"
print_status "Backend API: http://localhost:8004"
print_status "API Documentation: http://localhost:8004/docs"

echo ""
print_status "To view logs, run: docker-compose -f docker-compose.prod.yml logs -f"
print_status "To stop services, run: docker-compose -f docker-compose.prod.yml down"