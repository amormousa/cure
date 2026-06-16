# Frontend-Backend Integration Setup Guide

## Overview
This project is a full-stack healthcare dispatch system with:
- **Frontend**: Next.js 16 with React 19 (TypeScript)
- **Backend**: Node.js services with Express-like routing through Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT-based with secure cookies

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your values:
```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/cure_portal"

# JWT Secret (min 32 chars)
JWT_SECRET="your-super-secure-random-string-min-32-characters"

# Node Environment
NODE_ENV="development"

# Socket.IO Configuration
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Auth
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Setup

#### Prerequisites
- PostgreSQL running locally or accessible
- Database created: `cure_portal`

#### Initialize Database
```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

### 3. Start Development Server

Terminal 1 - Next.js Frontend & API:
```bash
npm run dev
```

Terminal 2 - Socket.IO Server:
```bash
npm run dev:socket
```

The application will be available at: `http://localhost:3000`

## Architecture

### Frontend Structure
```
app/
├── api/                 # Next.js API routes (backend)
│   ├── auth/           # Authentication endpoints
│   ├── dispatches/     # Dispatch management
│   ├── users/          # User management
│   ├── patients/       # Patient data
│   └── analytics/      # Analytics data
├── (auth)/             # Auth pages
│   └── login/
├── (dashboard)/        # Dashboard pages
│   ├── admin/
│   ├── analytics/
│   ├── dispatches/
│   └── operations/
├── components/         # React components
│   ├── common/        # Shared components
│   ├── dashboard/     # Dashboard widgets
│   └── kanban/        # Kanban board
├── hooks/             # Custom React hooks
└── lib/               # Utility libraries
    ├── api/          # API client
    ├── auth.ts       # Auth utilities
    └── prisma.ts     # Database client
```

### Backend Structure
```
backend/
├── config/            # Environment config
├── db/                # Database
│   └── schema.prisma  # Data model
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── dispatch.service.ts
│   ├── user.service.ts
│   ├── patient.service.ts
│   ├── nurse.service.ts
│   └── analytics.service.ts
├── sockets/          # WebSocket handlers
├── middlewares/      # Auth middleware
├── lib/              # Libraries
│   ├── ai/          # AI/ML utilities
│   └── socket/      # Socket.IO utilities
└── utils/           # Helpers
    ├── errors.ts    # Error handling
    └── logger.ts    # Logging
```

### Data Flow

#### Authentication Flow
1. User submits credentials → `POST /api/auth/login`
2. API route validates and calls `authService.login()`
3. Service validates password with bcrypt
4. Returns JWT token → stored in secure HTTP-only cookie
5. Subsequent requests include token in cookie
6. Middleware validates token via `authorize()` function

#### Dispatch Management Flow
1. Frontend calls `dispatchApi.list()` or `dispatchApi.create()`
2. API client sends request to `POST/GET /api/dispatches`
3. Route middleware authorizes user
4. Route delegates to `dispatchService`
5. Service queries database via Prisma
6. Response sent back to frontend
7. Frontend updates state and re-renders

#### Real-time Updates
1. Socket.IO server listens on port 3001
2. Connected clients receive live updates
3. Backend emits events on data changes
4. Frontend receives and updates UI

## API Endpoints

### Authentication
```
POST   /api/auth/login        # Login with email/password
POST   /api/auth/logout       # Logout
GET    /api/auth/me           # Get current user
POST   /api/auth/refresh      # Refresh JWT token
```

### Dispatches
```
GET    /api/dispatches                    # List dispatches (with filters)
POST   /api/dispatches                    # Create dispatch
GET    /api/dispatches/[id]               # Get dispatch details
PATCH  /api/dispatches/[id]               # Update dispatch
DELETE /api/dispatches/[id]               # Cancel dispatch
POST   /api/dispatches/ai-suggest         # Get AI suggestions
```

### Users
```
GET    /api/users                         # List users (with role filter)
POST   /api/users                         # Create user
GET    /api/users/[id]                    # Get user details
PATCH  /api/users/[id]                    # Update user
DELETE /api/users/[id]                    # Delete user
```

### Patients
```
GET    /api/patients                      # List patients
POST   /api/patients                      # Create patient
GET    /api/patients/[id]                 # Get patient details
```

### Analytics
```
GET    /api/analytics                     # Get dashboard analytics
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "cuid",
  "email": "user@example.com",
  "role": "ADMIN" | "NURSE" | "DISPATCHER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Authorization Levels
- **ADMIN**: Full system access
- **DISPATCHER**: Can create/manage dispatches
- **NURSE**: Can view and manage assigned dispatches

### Protected Routes
```typescript
// Public
/login

// Protected (all authenticated users)
/dashboard
/admin/users
/admin/nurses
/analytics

// Role-based
/admin/* (ADMIN only)
```

## Database Seeding

The `prisma/seed.ts` script creates:
- Sample admin user
- Sample dispatcher user
- Sample nurse users
- Sample patients
- Sample dispatches

Run: `npx prisma db seed`

## Testing

```bash
# Unit tests
npm run test

# With coverage
npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test PostgreSQL connection
psql $DATABASE_URL

# Reset database (dev only)
npx prisma migrate reset
```

### API Not Responding
- Check both servers are running (`npm run dev` + `npm run dev:socket`)
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser Network tab for failed requests

### Authentication Failures
- Verify `JWT_SECRET` is set and consistent
- Check browser cookies (DevTools → Application → Cookies)
- Ensure `auth-token` cookie is present

### Socket.IO Connection Issues
- Verify `SOCKET_PORT` is open (default 3001)
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Monitor console for connection logs

## Deployment

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="<generate-strong-32+-char-secret>"
NODE_ENV="production"
SOCKET_PORT="3001"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com"
NEXT_PUBLIC_SOCKET_URL="wss://yourdomain.com/socket.io"
```

### Build & Start
```bash
npm run build
npm run start
npm run dev:socket  # In separate process
```

## Development Workflow

### Adding a New Feature

1. **Database Schema** (if needed)
   ```bash
   # Add model in prisma/schema.prisma
   npx prisma migrate dev --name add_feature
   ```

2. **Backend Service**
   ```typescript
   // backend/services/feature.service.ts
   export async function getFeature() {
     return prisma.feature.findMany()
   }
   ```

3. **API Route**
   ```typescript
   // app/api/features/route.ts
   import * as featureService from '@/backend/services/feature.service'
   
   export async function GET(req) {
     const { user, errorResponse } = await authorize()
     if (errorResponse) return errorResponse
     const data = await featureService.getFeature()
     return NextResponse.json({ data })
   }
   ```

4. **API Client**
   ```typescript
   // app/lib/api/endpoints.ts
   export const featureApi = {
     list: () => apiCall('/api/features', FeatureSchema)
   }
   ```

5. **Frontend Component**
   ```tsx
   import { featureApi } from '@/app/lib/api/endpoints'
   
   export function Feature() {
     const [data] = useState(null)
     useEffect(() => {
       featureApi.list().then(res => setData(res.data))
     }, [])
   }
   ```

## Common Issues & Solutions

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Module Not Found Errors
```bash
# Ensure tsconfig.json paths are correct
# Rebuild project
npm run build
```

### Type Errors
```bash
# Update Prisma types
npx prisma generate

# Rebuild TypeScript
npm run build
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org)
- [Prisma Documentation](https://www.prisma.io)
- [Socket.IO Documentation](https://socket.io)
- [TypeScript Documentation](https://www.typescriptlang.org)
