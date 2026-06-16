#!/bin/bash

# CURE Portal - Diagnostic Script
# شغّل هذا الملف لتشخيص مشاكل تسجيل الدخول

set +e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   CURE Portal - Diagnostic Check${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# 1. Check PostgreSQL
echo -e "${YELLOW}1. Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
  echo -e "${GREEN}✓ psql installed${NC}"
else
  echo -e "${RED}✗ psql not installed${NC}"
  echo "  Install PostgreSQL from https://www.postgresql.org/download/"
  exit 1
fi

# 2. Check connection
echo -e "${YELLOW}2. Checking database connection...${NC}"
if psql -U postgres -c "SELECT 1" &> /dev/null; then
  echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
  echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
  echo "  Start PostgreSQL service:"
  echo "  - macOS: brew services start postgresql"
  echo "  - Windows: Services > PostgreSQL"
  echo "  - Linux: sudo systemctl start postgresql"
  exit 1
fi

# 3. Check database existence
echo -e "${YELLOW}3. Checking cure_portal database...${NC}"
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw cure_portal; then
  echo -e "${GREEN}✓ cure_portal database exists${NC}"
else
  echo -e "${RED}✗ cure_portal database does NOT exist${NC}"
  echo "  Run: createdb cure_portal"
  exit 1
fi

# 4. Check tables
echo -e "${YELLOW}4. Checking database tables...${NC}"
TABLE_COUNT=$(psql -U postgres -d cure_portal -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Database has $TABLE_COUNT tables${NC}"
else
  echo -e "${RED}✗ Database has NO tables${NC}"
  echo "  Run migrations: npx prisma migrate dev --name init"
  exit 1
fi

# 5. Check users
echo -e "${YELLOW}5. Checking users in database...${NC}"
USER_COUNT=$(psql -U postgres -d cure_portal -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | tr -d ' ')

if [ "$USER_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Database has $USER_COUNT users${NC}"
  
  # Show users
  echo -e "${BLUE}   Users:${NC}"
  psql -U postgres -d cure_portal -t -c 'SELECT email, role FROM "User" ORDER BY role;' 2>/dev/null | while read line; do
    if [ ! -z "$line" ]; then
      email=$(echo "$line" | awk '{print $1}')
      role=$(echo "$line" | awk '{print $2}')
      echo -e "   ${GREEN}✓${NC} $email ($role)"
    fi
  done
else
  echo -e "${RED}✗ Database has NO users${NC}"
  echo "  Seed database: npx prisma db seed"
  exit 1
fi

# 6. Check dispatcher user specifically
echo -e "${YELLOW}6. Checking dispatcher@cure.com user...${NC}"
DISPATCHER=$(psql -U postgres -d cure_portal -t -c "SELECT id FROM \"User\" WHERE email='dispatcher@cure.com';" 2>/dev/null | tr -d ' ')

if [ ! -z "$DISPATCHER" ]; then
  echo -e "${GREEN}✓ dispatcher@cure.com found${NC}"
else
  echo -e "${RED}✗ dispatcher@cure.com NOT found${NC}"
  echo "  Seed database: npx prisma db seed"
  exit 1
fi

# 7. Check .env.local
echo -e "${YELLOW}7. Checking .env.local configuration...${NC}"
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✓ .env.local exists${NC}"
  
  if grep -q "DATABASE_URL" .env.local; then
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
  else
    echo -e "${RED}✗ DATABASE_URL not configured${NC}"
  fi
  
  if grep -q "JWT_SECRET" .env.local; then
    echo -e "${GREEN}✓ JWT_SECRET configured${NC}"
  else
    echo -e "${RED}✗ JWT_SECRET not configured${NC}"
  fi
else
  echo -e "${RED}✗ .env.local not found${NC}"
  echo "  Run: cp .env.example .env.local"
  exit 1
fi

# 8. Check Node modules
echo -e "${YELLOW}8. Checking node_modules...${NC}"
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓ node_modules exists${NC}"
else
  echo -e "${RED}✗ node_modules NOT found${NC}"
  echo "  Run: npm install"
  exit 1
fi

# 9. Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Your system is ready. You can login with:${NC}"
echo ""
echo "  Email: dispatcher@cure.com"
echo "  Password: Disp@123"
echo ""
echo -e "${YELLOW}To start development:${NC}"
echo ""
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: npm run dev:socket"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
