#!/bin/bash

# CURE Portal - Quick Setup Script
# This script automates the frontend-backend integration setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════${NC}"
  echo ""
}

print_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Main setup
main() {
  print_header "CURE Portal - Frontend/Backend Integration Setup"

  # Check Node.js
  print_step "Checking Node.js..."
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
  fi
  print_success "Node.js $(node -v) found"

  # Check npm
  print_step "Checking npm..."
  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi
  print_success "npm $(npm -v) found"

  # Check PostgreSQL
  print_step "Checking PostgreSQL..."
  if command -v psql &> /dev/null; then
    print_success "PostgreSQL found"
  else
    print_info "PostgreSQL not in PATH, but you can still proceed if it's running"
  fi

  # Environment setup
  if [ ! -f ".env.local" ]; then
    print_step "Setting up environment configuration..."
    cp .env.example .env.local
    print_success ".env.local created"
    print_info "Please update .env.local with your database credentials:"
    print_info "  - DATABASE_URL"
    print_info "  - JWT_SECRET"
    print_info "  - Other configuration values as needed"
    read -p "Press Enter once you've updated .env.local..."
  else
    print_info ".env.local already exists"
  fi

  # Install dependencies
  print_step "Installing dependencies..."
  if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
  else
    print_info "node_modules already exists"
  fi

  # Prisma setup
  print_step "Setting up Prisma..."
  npx prisma generate
  print_success "Prisma client generated"

  # Database migration
  print_step "Running database migrations..."
  if read -p "Run migrations? (y/n) " -n 1 -r; then
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npx prisma migrate dev --name init
      print_success "Migrations completed"
    fi
  fi

  # Database seeding
  print_step "Database seeding..."
  if read -p "Seed database with sample data? (y/n) " -n 1 -r; then
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npx prisma db seed
      print_success "Database seeded"
    fi
  fi

  # Build TypeScript
  print_step "Building TypeScript..."
  npm run build > /dev/null 2>&1 && print_success "Build successful" || print_error "Build failed (check logs)"

  # Success summary
  print_header "Setup Complete! ✨"

  echo "Your CURE Portal is ready to run!"
  echo ""
  echo "To start development:"
  echo ""
  echo -e "${GREEN}Terminal 1 - Frontend & API:${NC}"
  echo "  npm run dev"
  echo ""
  echo -e "${GREEN}Terminal 2 - Real-time Socket.IO (optional):${NC}"
  echo "  npm run dev:socket"
  echo ""
  echo -e "${BLUE}Access the application:${NC}"
  echo "  Frontend: http://localhost:3000"
  echo "  Socket.IO: http://localhost:3001"
  echo ""
  echo -e "${YELLOW}Default credentials (if seeded):${NC}"
  echo "  Email: admin@example.com"
  echo "  Password: password"
  echo ""
  echo -e "${BLUE}Documentation:${NC}"
  echo "  - Setup Guide: FRONTEND_BACKEND_SETUP.md"
  echo "  - Integration Checklist: INTEGRATION_CHECKLIST.md"
  echo "  - Architecture: ARCHITECTURE.md"
  echo ""
  print_success "Happy coding! 🚀"
}

# Run main function
main
