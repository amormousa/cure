#!/bin/bash

# Frontend-Backend Integration Setup Checklist
# This script verifies all required setup steps

set -e

echo "════════════════════════════════════════════════"
echo "  CURE Portal - Frontend/Backend Setup Check"
echo "════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_item() {
  local item=$1
  local status=$2
  
  if [ "$status" = "ok" ]; then
    echo -e "${GREEN}✓${NC} $item"
  else
    echo -e "${RED}✗${NC} $item"
  fi
}

# 1. Check Node.js and npm
echo "1. Checking Node.js Environment..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  check_item "Node.js installed ($NODE_VERSION)" "ok"
else
  check_item "Node.js installed" "fail"
  exit 1
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  check_item "npm installed ($NPM_VERSION)" "ok"
else
  check_item "npm installed" "fail"
  exit 1
fi
echo ""

# 2. Check environment configuration
echo "2. Checking Environment Configuration..."
if [ -f ".env.local" ]; then
  check_item ".env.local exists" "ok"
  
  if grep -q "DATABASE_URL" .env.local; then
    check_item "DATABASE_URL configured" "ok"
  else
    check_item "DATABASE_URL configured" "fail"
  fi
  
  if grep -q "JWT_SECRET" .env.local; then
    check_item "JWT_SECRET configured" "ok"
  else
    check_item "JWT_SECRET configured" "fail"
  fi
else
  check_item ".env.local exists" "fail"
  echo "    Create with: cp .env.example .env.local"
fi
echo ""

# 3. Check dependencies
echo "3. Checking Dependencies..."
if [ -d "node_modules" ]; then
  check_item "node_modules installed" "ok"
else
  check_item "node_modules installed" "fail"
  echo "    Run: npm install"
fi

if [ -f "package.json" ]; then
  check_item "package.json exists" "ok"
else
  check_item "package.json exists" "fail"
fi
echo ""

# 4. Check database configuration
echo "4. Checking Database Configuration..."
if [ -f "prisma/schema.prisma" ]; then
  check_item "Prisma schema exists" "ok"
else
  check_item "Prisma schema exists" "fail"
fi

if [ -d ".next" ] || [ -f "next.config.ts" ]; then
  check_item "Next.js configured" "ok"
else
  check_item "Next.js configured" "fail"
fi
echo ""

# 5. Check critical files
echo "5. Checking Critical Files..."
CRITICAL_FILES=(
  "app/lib/api/client.ts:API Client"
  "app/lib/api/endpoints.ts:API Endpoints"
  "app/lib/auth.ts:Authentication"
  "backend/services/index.ts:Backend Services"
  "backend/config/env.ts:Environment Config"
  "tsconfig.json:TypeScript Config"
)

for file_info in "${CRITICAL_FILES[@]}"; do
  IFS=':' read -r file label <<< "$file_info"
  if [ -f "$file" ]; then
    check_item "$label ($file)" "ok"
  else
    check_item "$label ($file)" "fail"
  fi
done
echo ""

# 6. Check script availability
echo "6. Checking Available Scripts..."
if grep -q '"dev":' package.json; then
  check_item "dev script (npm run dev)" "ok"
else
  check_item "dev script (npm run dev)" "fail"
fi

if grep -q '"dev:socket":' package.json; then
  check_item "dev:socket script (npm run dev:socket)" "ok"
else
  check_item "dev:socket script (npm run dev:socket)" "fail"
fi

if grep -q '"build":' package.json; then
  check_item "build script (npm run build)" "ok"
else
  check_item "build script (npm run build)" "fail"
fi
echo ""

echo "════════════════════════════════════════════════"
echo "  Setup Checklist Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Update .env.local with your database credentials"
echo "2. Run: npx prisma migrate dev --name init"
echo "3. Run: npx prisma db seed (optional)"
echo "4. Start development: npm run dev"
echo "5. In another terminal: npm run dev:socket"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""
