# Frontend-Backend Integration Checklist

## ✅ Project Structure Verification

### Frontend Setup
- [x] Next.js 16.2.9 configured
- [x] React 19 with TypeScript
- [x] Tailwind CSS configured
- [x] API client setup (`app/lib/api/client.ts`)
- [x] API endpoints defined (`app/lib/api/endpoints.ts`)
- [x] Authentication utilities (`app/lib/auth.ts`)
- [x] Prisma client configured (`app/lib/prisma.ts`)
- [x] API routes in `app/api/`

### Backend Setup
- [x] Backend services in `backend/services/`
- [x] Service exports properly configured
- [x] Auth middleware implemented
- [x] Error handling utilities
- [x] Logger utilities
- [x] Environment config validation

### Database Setup
- [x] Prisma schema defined
- [x] Data models: User, Patient, Dispatch, AuditLog
- [x] Enums: Role, DispatchStatus, Priority
- [x] PostgreSQL configured as datasource

### Authentication & Security
- [x] JWT token signing/verification
- [x] Password hashing with bcrypt
- [x] HTTP-only secure cookies
- [x] Role-based authorization
- [x] Rate limiting on login endpoint

### Real-time Communication
- [x] Socket.IO server configured
- [x] Socket client setup
- [x] Event emitters created

---

## 🚀 Getting Started - Step by Step

### Step 1: Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values:
# - DATABASE_URL: postgresql://user:password@localhost:5432/cure_portal
# - JWT_SECRET: (min 32 characters, use strong random string)
# - SOCKET_PORT: 3001 (or your preferred port)
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Database Initialization
```bash
# Create and migrate database
npx prisma migrate dev --name init

# Optional: Seed with sample data
npx prisma db seed
```

### Step 4: Start Development Servers

**Terminal 1: Frontend + API Routes**
```bash
npm run dev
```
Access at: `http://localhost:3000`

**Terminal 2: Socket.IO Server (Optional, for real-time features)**
```bash
npm run dev:socket
```
Access at: `http://localhost:3001`

---

## 📋 Frontend-Backend Connection Points

### Authentication Flow
```
Frontend (login page)
    ↓
POST /api/auth/login (request body: { email, password })
    ↓
app/api/auth/login/route.ts (validates request)
    ↓
backend/services/auth.service.ts (business logic)
    ↓
Prisma client queries database
    ↓
Password validation with bcrypt
    ↓
JWT token created and signed
    ↓
setAuthCookie() stores token in HTTP-only cookie
    ↓
Frontend receives token, redirects to dashboard
```

### API Request Flow (Example: List Dispatches)
```
Frontend component
    ↓
dispatchApi.list() in app/lib/api/endpoints.ts
    ↓
apiCall() in app/lib/api/client.ts
    ↓
fetch('/api/dispatches')
    ↓
app/api/dispatches/route.ts
    ↓
authorize() middleware validates JWT from cookie
    ↓
dispatchService.listDispatches() in backend/services/
    ↓
prisma.dispatch.findMany() queries database
    ↓
Returns paginated list
    ↓
Frontend updates state and re-renders
```

---

## 🔍 Verification Checklist

### Configuration Files
- [ ] `.env.local` exists and has required variables
- [ ] `DATABASE_URL` points to PostgreSQL instance
- [ ] `JWT_SECRET` is set (min 32 chars)
- [ ] `SOCKET_PORT` is configured
- [ ] `NEXTAUTH_URL` matches your app URL

### Database
- [ ] PostgreSQL service is running
- [ ] Database `cure_portal` exists
- [ ] Migrations have been run (`npx prisma migrate dev`)
- [ ] Prisma client is generated (`npx prisma generate`)

### Dependencies
- [ ] `node_modules/` folder exists
- [ ] All packages installed (`npm install`)
- [ ] TypeScript compiled successfully
- [ ] No `@types` missing

### API Routes
- [ ] Authentication routes working (`/api/auth/*`)
- [ ] User routes working (`/api/users/*`)
- [ ] Dispatch routes working (`/api/dispatches/*`)
- [ ] Patient routes working (`/api/patients/*`)
- [ ] Analytics routes working (`/api/analytics/*`)

### Frontend Components
- [ ] Login page functional
- [ ] Dashboard loads without errors
- [ ] API data displays correctly
- [ ] Error handling works
- [ ] Loading states appear

### Security
- [ ] JWT tokens are validated
- [ ] Cookies are HTTP-only and secure
- [ ] Password hashing with bcrypt
- [ ] Role-based access control working
- [ ] Rate limiting on login endpoint

---

## 🧪 Testing the Integration

### Manual Testing

**1. Test Authentication**
```bash
# Try logging in with default credentials (if seeded)
# Default admin user: admin@example.com / password
```

**2. Test API Endpoints**
```bash
# In browser console or Postman:

# List users
fetch('/api/users')

# Get current user
fetch('/api/auth/me')

# List dispatches
fetch('/api/dispatches')
```

**3. Test Database Connection**
```bash
# Verify Prisma can connect
npx prisma db validate
```

### Automated Testing
```bash
# Run test suite
npm run test

# With coverage
npm run test:coverage
```

---

## 🔧 Common Configuration Issues

### "Cannot find module" errors
**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Rebuild TypeScript
npm run build
```

### Database connection failed
**Solution:**
```bash
# Check connection string
echo $DATABASE_URL

# Test PostgreSQL directly
psql $DATABASE_URL

# Reset database (dev only)
npx prisma migrate reset
```

### JWT verification failed
**Solution:**
- Verify `JWT_SECRET` is set in `.env.local`
- Check secret is consistent (not accidentally changed)
- Clear browser cookies and re-login

### Port already in use
**Solution:**
```bash
# Change port in .env.local
SOCKET_PORT=3002

# Or kill existing process
# macOS/Linux: lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Windows: netstat -ano | findstr :3001
```

---

## 📁 File Structure Overview

```
cure/
├── .env.local                          # Environment variables (create from .env.example)
├── next.config.ts                      # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── prisma/
│   ├── schema.prisma                   # Data model definition
│   └── seed.ts                         # Database seeding script
│
├── app/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # API client (core request logic)
│   │   │   ├── endpoints.ts           # API endpoint definitions
│   │   │   ├── hooks.ts               # React hooks for API
│   │   │   ├── schemas.ts             # Zod validation schemas
│   │   │   └── realtime.ts            # Real-time event handlers
│   │   ├── auth.ts                    # JWT/cookie utilities
│   │   ├── prisma.ts                  # Database client
│   │   └── integration-test.ts        # Integration testing utilities
│   ├── api/
│   │   ├── auth/                      # Authentication endpoints
│   │   ├── users/                     # User management
│   │   ├── dispatches/                # Dispatch management
│   │   ├── patients/                  # Patient data
│   │   └── analytics/                 # Analytics data
│   ├── components/                    # React components
│   ├── hooks/                         # React hooks
│   ├── (auth)/                        # Auth pages
│   └── (dashboard)/                   # Dashboard pages
│
└── backend/
    ├── config/
    │   └── env.ts                     # Environment validation
    ├── services/
    │   ├── auth.service.ts            # Authentication logic
    │   ├── user.service.ts            # User operations
    │   ├── dispatch.service.ts        # Dispatch operations
    │   ├── patient.service.ts         # Patient operations
    │   ├── nurse.service.ts           # Nurse operations
    │   ├── analytics.service.ts       # Analytics logic
    │   └── index.ts                   # Service exports
    ├── sockets/
    │   └── index.ts                   # Socket.IO handlers
    ├── middlewares/
    │   └── auth.ts                    # Auth middleware
    ├── utils/
    │   ├── errors.ts                  # Error handling
    │   └── logger.ts                  # Logging
    └── lib/
        ├── ai/                        # AI utilities
        └── socket/                    # Socket utilities
```

---

## 🚨 Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| "DATABASE_URL not set" | Add to `.env.local`: `DATABASE_URL="postgresql://..."`  |
| "JWT_SECRET missing" | Add to `.env.local`: `JWT_SECRET="<min-32-chars>"` |
| "Cannot find Prisma client" | Run: `npx prisma generate` |
| "API returns 401" | Login first; check cookie stored in browser |
| "API returns 403" | User doesn't have required role for endpoint |
| "Socket.IO not connecting" | Ensure `npm run dev:socket` is running; check `NEXT_PUBLIC_SOCKET_URL` |
| "Port 3000/3001 in use" | Change port in config or kill existing process |
| "Migration failed" | Run: `npx prisma migrate reset` (dev only) |

---

## 📚 Additional Resources

- [Next.js API Routes Docs](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Client Docs](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Socket.IO Docs](https://socket.io/docs/)
- [JWT.io - JWT Information](https://jwt.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Tips for Development

1. **Use TypeScript**: Full type safety between frontend and backend
2. **Validate Inputs**: Use Zod schemas for runtime validation
3. **Log Everything**: Use `createLogger()` for debugging
4. **Test APIs**: Use browser DevTools Network tab to inspect requests
5. **Version Control**: Commit `.env.local` patterns, not actual secrets
6. **Database Backups**: Back up PostgreSQL before running migrations
7. **Performance**: Use Prisma's select/include for optimized queries

---

## ✨ You're Ready!

With all these steps completed, your frontend-backend integration is ready for development. Start by:

1. ✅ Verify environment configuration
2. ✅ Test database connection
3. ✅ Run authentication flow
4. ✅ Test API endpoints
5. ✅ Build your features!

Happy coding! 🚀
