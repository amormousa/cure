# Frontend-Backend Integration: Troubleshooting & FAQ

## 🔴 Common Issues & Solutions

### Database & Prisma Issues

#### "error: connect ECONNREFUSED 127.0.0.1:5432"
**Problem**: PostgreSQL is not running or connection string is wrong

**Solutions**:
```bash
# Start PostgreSQL service
# macOS (Homebrew): brew services start postgresql
# Windows: Services > PostgreSQL
# Linux: sudo systemctl start postgresql

# Verify connection
psql -U postgres -h localhost

# Check connection string format
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Test with psql
psql $DATABASE_URL
```

#### "Cannot find native platform binding for this OS"
**Problem**: Prisma client not properly generated

**Solution**:
```bash
npx prisma generate
npx prisma db push
npm run build
```

#### "Prisma schema validation error"
**Problem**: Issues in `prisma/schema.prisma`

**Solution**:
```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Check for syntax errors
cat prisma/schema.prisma
```

#### "migration failed"
**Problem**: Database migration didn't complete

**Solutions**:
```bash
# Reset database (dev only!)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --rolled-back migration_name

# Check migration status
npx prisma migrate status
```

---

### Authentication Issues

#### "JWT verification failed"
**Problem**: Token validation is failing

**Solutions**:
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify minimum length (32 chars)
echo $JWT_SECRET | wc -c

# If changed, clear browser cookies and re-login
# DevTools > Application > Cookies > Delete "auth-token"

# In .env.local, ensure:
JWT_SECRET="your-super-secret-key-with-32-chars-minimum"
```

#### "Cookie not being set"
**Problem**: Authentication cookie not persisting

**Solutions**:
```typescript
// Check in browser DevTools:
// 1. Application tab > Cookies > your-domain
// 2. Look for "auth-token"
// 3. Check flags: HttpOnly ✓, Secure ✓, SameSite ✓

// In production, ensure:
// - HTTPS enabled
// - NODE_ENV="production"
// - Secure flag will auto-enable

// For development HTTPS:
// Use: https://localhost:3000
```

#### "401 Unauthorized on protected routes"
**Problem**: User is not authenticated

**Solutions**:
1. Login first: `http://localhost:3000/login`
2. Check cookie exists in DevTools
3. Verify JWT_SECRET matches
4. Check token expiration:
   ```bash
   # Install jwt.io or use: https://jwt.io
   # Paste token and verify signature
   ```
5. Try refreshing token: `POST /api/auth/refresh`

#### "Cannot read property 'userId' of null"
**Problem**: Auth user is null (not authenticated)

**Solution**:
```typescript
// Check authorization middleware is being called
const { user, errorResponse } = await authorize()
if (errorResponse) return errorResponse

// Verify token is in cookie
console.log(await getTokenFromCookies())

// Test auth endpoint
fetch('/api/auth/me').then(r => r.json())
```

---

### API & Endpoint Issues

#### "Cannot GET /api/dispatches"
**Problem**: API route not found (404)

**Solutions**:
```bash
# Verify file exists
ls -la app/api/dispatches/route.ts

# Check naming (must be route.ts, not routes.ts)
# Check syntax in file

# Rebuild Next.js
npm run build

# Restart dev server
# Kill: Ctrl+C
# Start: npm run dev
```

#### "CORS error when calling API"
**Problem**: Cross-origin request blocked

**Solutions**:
```typescript
// For same-origin (default):
// Frontend: http://localhost:3000
// API: http://localhost:3000/api/*
// No CORS headers needed

// For cross-origin:
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}
```

#### "API returns 422 - Validation Failed"
**Problem**: Request validation failed

**Solution**:
```bash
# Check request body matches schema
# Inspect error details in response:

fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
})
.then(r => r.json())
.then(r => console.log(r.error.details)) // Shows validation errors
```

#### "API returns 500 - Internal Server Error"
**Problem**: Unhandled error in API route

**Solutions**:
```bash
# Check server logs (npm run dev terminal)
# Look for stack trace

# Common causes:
# 1. Database not accessible
# 2. Missing environment variable
# 3. Service function error

# Debug:
# 1. Add logging to service
# 2. Check all required env vars set
# 3. Verify database connection

# Check error details:
fetch('/api/endpoint')
  .then(r => r.json())
  .then(r => console.log(r.error))
```

#### "Socket.IO connection failed"
**Problem**: Real-time connection not working

**Solutions**:
```bash
# Verify Socket server is running
npm run dev:socket
# Should output: Socket.IO server listening on port 3001

# Check port is available
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Verify in .env.local:
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Check browser console for connection errors
# DevTools > Console > look for socket.io messages

# Test connection:
const socket = io('http://localhost:3001')
socket.on('connect', () => console.log('Connected!'))
```

---

### TypeScript & Build Issues

#### "Cannot find module"
**Problem**: Import path doesn't exist

**Solutions**:
```bash
# Regenerate Prisma types
npx prisma generate

# Verify tsconfig.json paths
cat tsconfig.json | grep -A5 '"paths"'

# Common fixes:
# @/app/... → app/...
# @/backend/... → backend/...

# Rebuild
npm run build
```

#### "Type 'X' is not assignable to type 'Y'"
**Problem**: Type mismatch in code

**Solutions**:
```bash
# Regenerate all types
npx prisma generate

# Check Prisma model matches usage
npx prisma validate

# Force rebuild
rm -rf .next
npm run build
```

#### "Build fails with TypeScript errors"
**Problem**: Compilation errors

**Solutions**:
```bash
# See detailed errors
npm run build

# Check specific file
npx tsc --noEmit app/lib/api/client.ts

# Type check all files
npx tsc --noEmit

# Fix common issues:
# - Import missing modules
# - Add type annotations
# - Verify Prisma types are generated
```

---

### Development Server Issues

#### "Port 3000 already in use"
**Problem**: Another process is using the port

**Solutions**:
```bash
# Find and kill process
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000 | findstr LISTENING        # Windows (get PID)
taskkill /PID <PID> /F                                  # Windows kill

# Or use different port
PORT=3001 npm run dev
```

#### "Module parse failed"
**Problem**: Invalid JavaScript/TypeScript file

**Solutions**:
```bash
# Check file syntax
node -c app/lib/api/client.ts

# Look for common issues:
# - Missing imports
# - Invalid JSX
# - Unmatched braces

# Verify Next.js config
cat next.config.ts
```

#### "Dev server slow or freezing"
**Problem**: Performance issue

**Solutions**:
```bash
# Restart dev server
# 1. Ctrl+C to stop
# 2. npm run dev to start

# Clear Next.js cache
rm -rf .next
npm run dev

# Check for large dependencies
npm list | head -20

# Monitor performance
npm run dev --profile
```

---

### Environment & Configuration Issues

#### "Missing required environment variable"
**Problem**: An env var is not set

**Solution**:
```bash
# Check .env.local exists
ls .env.local

# View configured variables
grep "^[^#]" .env.local

# Add missing variable:
echo "VARIABLE_NAME=value" >> .env.local

# Required variables:
# - DATABASE_URL
# - JWT_SECRET (min 32 chars)
# - SOCKET_PORT (optional, default 3001)
```

#### ".env.local not loading"
**Problem**: Environment variables not available

**Solutions**:
```bash
# Verify file location
ls -la .env.local

# Check permissions
chmod 644 .env.local

# For Next.js to reload env:
# 1. Save .env.local
# 2. Restart dev server (Ctrl+C, npm run dev)

# Verify loading
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

#### "NODE_ENV not detected correctly"
**Problem**: Development/production mode confusion

**Solutions**:
```bash
# Check current env
echo $NODE_ENV

# Set explicitly
export NODE_ENV=development  # macOS/Linux
set NODE_ENV=development     # Windows

# For production build
npm run build
npm run start
# NODE_ENV will auto-be "production"
```

---

### Data Synchronization Issues

#### "Data not appearing after API call"
**Problem**: API returned success but data not visible

**Solutions**:
```typescript
// Check response
const res = await dispatchApi.create(data)
console.log(res.ok)
console.log(res.data)

// Verify data structure matches schema
// Check if client-side cache needs refresh:
// - React Query: invalidate queries
// - SWR: trigger revalidation
// - Manual: refetch data

// Check database actually saved
psql $DATABASE_URL
SELECT * FROM "Dispatch" WHERE id = '<id>';
```

#### "Stale data in frontend"
**Problem**: Old data is cached

**Solutions**:
```typescript
// Hard refresh
location.reload()

// Clear browser cache
// DevTools > Application > Cache Storage > Delete

// In API calls, disable cache
const response = await dispatchApi.list({
  // Response is always fresh
})
```

#### "Database out of sync with frontend"
**Problem**: Data inconsistency

**Solution**:
```bash
# Check database state
psql $DATABASE_URL -c "SELECT * FROM \"User\" LIMIT 1;"

# Clear and reseed
npx prisma migrate reset
npx prisma db seed

# Verify data loaded
npx prisma studio
```

---

## ❓ Frequently Asked Questions

### Q: How do I add a new API endpoint?
**A:**
1. Create service function in `backend/services/`
2. Create route in `app/api/`
3. Add endpoint definition in `app/lib/api/endpoints.ts`
4. Add Zod schema in `app/lib/api/schemas.ts`

### Q: How do I change the JWT secret?
**A:**
```bash
# Generate new secret
openssl rand -base64 32

# Update .env.local
JWT_SECRET="<new-secret>"

# Restart server - old tokens will be invalid
# Users will need to re-login
```

### Q: How do I reset the database?
**A:**
```bash
# Development only!
npx prisma migrate reset

# Or manual reset
npx prisma db push --force-reset
npx prisma db seed
```

### Q: How do I change the database?
**A:**
```bash
# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://new_user:password@host:5432/new_db"

# Run migrations
npx prisma migrate deploy

# Or for fresh database
npx prisma db push
npx prisma db seed
```

### Q: How do I deploy to production?
**A:**
```bash
# 1. Build
npm run build

# 2. Set production environment variables
export NODE_ENV=production
export JWT_SECRET="<strong-secret>"
export DATABASE_URL="postgresql://prod..."

# 3. Run migrations (one-time)
npx prisma migrate deploy

# 4. Start
npm run start

# 5. Socket server (separate process)
npm run dev:socket
```

### Q: How do I debug API calls?
**A:**
```typescript
// Enable debug logging
// .env.local:
NEXT_PUBLIC_DEBUG=true

// Check Network tab
// DevTools > Network > Filter by XHR/Fetch
// Click request > see Request/Response

// Add console logging
console.log('Request:', { endpoint, method, body })
console.log('Response:', response)
```

### Q: How do I handle errors gracefully?
**A:**
```typescript
try {
  const res = await dispatchApi.list()
  if (!res.ok) {
    // API error
    console.error(res.error.message)
    setError(res.error.message)
  } else {
    setData(res.data)
  }
} catch (error) {
  // Network error
  setError('Failed to load data')
}
```

### Q: How do I implement caching?
**A:**
```typescript
// Disable caching
apiCall('/api/endpoint', schema, { cache: false })

// Enable caching (default for GET)
apiCall('/api/endpoint', schema, { cache: true })

// Use React Query for advanced caching
useQuery({
  queryKey: ['dispatches'],
  queryFn: () => dispatchApi.list()
})
```

### Q: How do I update Prisma schema?
**A:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_your_change

# 3. Types auto-generate
# 4. Rebuild TypeScript
npm run build
```

### Q: How do I add role-based permissions?
**A:**
```typescript
// In API route:
const { user, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
if (errorResponse) return errorResponse

// User must be ADMIN or DISPATCHER
// Otherwise returns 403 Forbidden
```

---

## 📞 Getting Help

1. **Check this FAQ** - Most issues are documented above
2. **Read Documentation** - `FRONTEND_BACKEND_SETUP.md`
3. **Check Logs** - Terminal output when running `npm run dev`
4. **Browser DevTools** - Network tab shows API calls
5. **Database GUI** - `npx prisma studio` to inspect data
6. **Error Details** - API responses include detailed error messages

---

## 🐛 Reporting Issues

When reporting bugs:
1. Include exact error message
2. Show steps to reproduce
3. Check `.env.local` configuration (without secrets)
4. Provide output of: `npm run build`
5. Verify: `npx prisma validate`

---

**Last Updated**: 2024
**Frontend-Backend Integration Troubleshooting Guide**
