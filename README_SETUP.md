# CURE Portal - Healthcare Dispatch Management System

## 🏥 About CURE Portal

CURE Portal is a comprehensive healthcare dispatch management system designed to streamline the coordination and assignment of nursing services. It features real-time dispatch tracking, nurse availability management, and analytics dashboards.

**Tech Stack:**
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Node.js + Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT + Secure Cookies

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### 1. Clone & Install
```bash
git clone <repository-url>
cd cure
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL credentials
```

**Required Variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cure_portal
JWT_SECRET=<generate-random-32+-char-string>
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Initialize Database
```bash
npx prisma migrate dev --name init
npx prisma db seed  # Optional: adds sample data
```

### 4. Start Development
```bash
# Terminal 1: Frontend + API
npm run dev

# Terminal 2: Real-time Socket.IO
npm run dev:socket
```

Access: `http://localhost:3000`

---

## 📚 Documentation

### For Getting Started
- **[FRONTEND_BACKEND_SETUP.md](FRONTEND_BACKEND_SETUP.md)** - Complete setup and architecture guide
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Integration summary and quick reference
- **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)** - Step-by-step setup verification

### For Troubleshooting
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and data flow
- **[ROADMAP.md](ROADMAP.md)** - Feature roadmap

### Quick Scripts
```bash
# Setup verification
bash setup-check.sh

# Automated setup
bash quick-setup.sh

# Development
npm run dev              # Start frontend + API
npm run dev:socket      # Start Socket.IO server

# Building & Testing
npm run build            # Production build
npm run test             # Run tests
npm run test:coverage   # Tests with coverage

# Database
npx prisma studio      # GUI database inspector
npx prisma migrate reset # Reset database (dev only)
```

---

## 📋 Available Scripts

```bash
# Development
npm run dev                 # Start Next.js dev server
npm run dev:socket         # Start Socket.IO server

# Production
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run build              # Type-check with TypeScript

# Testing
npm run test               # Run unit tests
npm run test:coverage     # Run tests with coverage

# Database
npx prisma migrate dev    # Create and apply migration
npx prisma migrate reset  # Reset database (dev only)
npx prisma db seed        # Run seed script
npx prisma studio         # Open Prisma Studio GUI
```

---

## 🏗️ Project Structure

```
cure/
├── app/                          # Next.js frontend
│   ├── lib/
│   │   ├── api/                 # API client & endpoints
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── config-validator.ts  # Configuration validation
│   │   ├── integration-test.ts  # Integration testing
│   │   └── prisma.ts            # Database client
│   ├── api/                     # API routes (backend)
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── (auth)/                  # Auth pages
│   └── (dashboard)/             # Dashboard pages
│
├── backend/                      # Backend business logic
│   ├── config/                  # Configuration
│   ├── services/                # Business logic
│   ├── middlewares/             # Auth middleware
│   ├── sockets/                 # WebSocket handlers
│   ├── lib/                     # Utilities
│   └── utils/                   # Helpers
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Database seeding
│
├── tests/                       # Test suite
├── FRONTEND_BACKEND_SETUP.md   # Complete setup guide
├── SETUP_SUMMARY.md            # Integration summary
├── INTEGRATION_CHECKLIST.md    # Verification checklist
├── TROUBLESHOOTING.md          # Issue solutions
└── .env.example                # Environment template
```

---

## 🔐 Authentication

### Default Test Credentials (if seeded)
```
Email: admin@example.com
Password: password
Role: ADMIN
```

### Login Flow
1. Navigate to `/login`
2. Enter email and password
3. System validates credentials against bcrypt hash
4. JWT token generated and stored in HTTP-only cookie
5. Cookie automatically sent with all API requests
6. Token verified via middleware on protected routes

### User Roles
- **ADMIN**: Full system access
- **DISPATCHER**: Can create and manage dispatches
- **NURSE**: Can view and manage assigned dispatches

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login              Login with credentials
POST   /api/auth/logout             Logout
GET    /api/auth/me                 Get current user
POST   /api/auth/refresh            Refresh JWT token
```

### Users
```
GET    /api/users                   List users
POST   /api/users                   Create user
GET    /api/users/[id]              Get user details
PATCH  /api/users/[id]              Update user
DELETE /api/users/[id]              Delete user
```

### Dispatches
```
GET    /api/dispatches              List dispatches
POST   /api/dispatches              Create dispatch
GET    /api/dispatches/[id]         Get dispatch
PATCH  /api/dispatches/[id]         Update dispatch
DELETE /api/dispatches/[id]         Cancel dispatch
POST   /api/dispatches/ai-suggest   Get AI suggestions
```

### Additional Endpoints
```
GET    /api/patients                List patients
POST   /api/patients                Create patient
GET    /api/analytics               Get dashboard data
```

---

## 🧪 Testing

### Run Tests
```bash
npm run test              # Unit tests
npm run test:coverage    # With coverage
```

### Validation Tools
```typescript
// In browser console or component:

// Validate configuration
import { validateConfig, printValidationReport } from '@/app/lib/config-validator'
const report = await validateConfig()
printValidationReport(report)

// Run integration tests
import { runFullIntegrationTest } from '@/app/lib/integration-test'
await runFullIntegrationTest()
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Setup
```env
# Production .env.local
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host/prod_db
JWT_SECRET=<generate-strong-32+-char-secret>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_SOCKET_URL=wss://yourdomain.com/socket.io
```

### Deployment Checklist
- [ ] All environment variables set securely
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Build completes successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Tests pass (`npm run test`)
- [ ] HTTPS enabled in production
- [ ] JWT_SECRET is strong and secure
- [ ] Database backups configured

---

## 🛠️ Development Workflow

### Creating a New Feature

1. **Database Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name add_feature_name
   ```

2. **Backend Service**
   ```typescript
   // backend/services/feature.service.ts
   export async function getFeatures() {
     return prisma.feature.findMany()
   }
   ```

3. **API Route**
   ```typescript
   // app/api/features/route.ts
   export async function GET(req) {
     const { user, errorResponse } = await authorize()
     if (errorResponse) return errorResponse
     const data = await featureService.getFeatures()
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
   'use client'
   import { featureApi } from '@/app/lib/api/endpoints'
   
   export function Features() {
     const [data, setData] = useState(null)
     useEffect(() => {
       featureApi.list().then(res => {
         if (res.ok) setData(res.data)
       })
     }, [])
     return <div>{/* Component JSX */}</div>
   }
   ```

---

## ❓ Common Questions

### Q: How do I reset the database?
```bash
npx prisma migrate reset  # Dev only!
```

### Q: How do I add a new user?
```bash
# Via API
POST /api/users
{
  "email": "user@example.com",
  "password": "hashed-password",
  "name": "User Name",
  "role": "NURSE"
}

# Via Prisma Studio
npx prisma studio
```

### Q: How do I check database state?
```bash
npx prisma studio    # GUI
psql $DATABASE_URL   # CLI
```

### Q: Socket.IO not working?
1. Ensure `npm run dev:socket` is running
2. Check port 3001 is open
3. Verify `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
4. Check browser console for errors

---

## 🐛 Troubleshooting

See **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for:
- Database connection issues
- Authentication problems
- API endpoint errors
- Socket.IO issues
- Build and deployment errors
- And more!

Common commands:
```bash
# Validate setup
bash setup-check.sh

# Validate configuration
npx prisma validate

# Check database
npx prisma db validate

# View database
npx prisma studio
```

---

## 📖 Further Reading

- **[FRONTEND_BACKEND_SETUP.md](FRONTEND_BACKEND_SETUP.md)** - Complete integration guide
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Quick reference
- **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)** - Verification steps
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problem solutions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[ROADMAP.md](ROADMAP.md)** - Feature planning

## 📚 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

---

## 📊 Project Status

- ✅ Frontend-Backend Integration: Complete
- ✅ API Routes: Complete
- ✅ Authentication System: Complete
- ✅ Database Schema: Complete
- ✅ Documentation: Complete
- 🔄 Real-time Features: In Progress
- 🔄 Analytics Dashboard: In Development
- ⏳ Mobile Support: Planned

---

## 📝 License

[Your License Here]

---

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

---

## 📞 Support

For issues and questions:
1. Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
2. Review **[FRONTEND_BACKEND_SETUP.md](FRONTEND_BACKEND_SETUP.md)**
3. Check GitHub issues
4. Contact development team

---

**CURE Portal v0.1.0**
Healthcare Dispatch Management System
Built with Next.js, React, TypeScript, and PostgreSQL

Happy coding! 🚀
