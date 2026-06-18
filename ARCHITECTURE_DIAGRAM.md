# Frontend-Backend Integration Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (React 19)                    │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Pages, Components, Hooks                            │  │   │
│  │  │  - Login Page                                        │  │   │
│  │  │  - Dashboard                                         │  │   │
│  │  │  - Dispatch Management                               │  │   │
│  │  │  - Analytics                                         │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                        ↓↑                                    │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  API Client & Utilities                              │  │   │
│  │  │  - app/lib/api/client.ts (HTTP client)              │  │   │
│  │  │  - app/lib/api/endpoints.ts (API definitions)       │  │   │
│  │  │  - app/lib/api/schemas.ts (Zod validation)          │  │   │
│  │  │  - app/lib/auth.ts (JWT & cookies)                  │  │   │
│  │  │  - Socket.IO client                                  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓↑ HTTP/WS
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER / BACKEND                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │               Next.js API Routes (Node.js)                    │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  App API Routes                                          │ │ │
│  │  │  /api/auth/           → Auth service                    │ │ │
│  │  │  /api/users/          → User service                    │ │ │
│  │  │  /api/dispatches/     → Dispatch service                │ │ │
│  │  │  /api/patients/       → Patient service                 │ │ │
│  │  │  /api/analytics/      → Analytics service               │ │ │
│  │  │  /api/ai-suggest/     → AI service                      │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                        ↓↑                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Backend Services                                       │ │ │
│  │  │  - backend/services/auth.service.ts                    │ │ │
│  │  │  - backend/services/user.service.ts                    │ │ │
│  │  │  - backend/services/dispatch.service.ts                │ │ │
│  │  │  - backend/services/patient.service.ts                 │ │ │
│  │  │  - backend/services/nurse.service.ts                   │ │ │
│  │  │  - backend/services/analytics.service.ts               │ │ │
│  │  │  + Error Handling                                      │ │ │
│  │  │  + Authorization Middleware                            │ │ │
│  │  │  + Logging                                             │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                        ↓↑                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Prisma ORM                                             │ │ │
│  │  │  - Type-safe database access                           │ │ │
│  │  │  - Query building                                      │ │ │
│  │  │  - Migration management                                │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                            ↓↑                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Socket.IO Server (Port 3001)                     │ │
│  │  - Real-time event handling                                   │ │
│  │  - Live dispatch updates                                      │ │
│  │  - Presence tracking                                          │ │
│  │  - Bidirectional communication                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            ↓↑ SQL
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE / PERSISTENCE                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Users      │  │  Patients    │  │ Dispatches   │         │ │
│  │  │ - id         │  │ - id         │  │ - id         │         │ │
│  │  │ - email      │  │ - name       │  │ - patientId  │         │ │
│  │  │ - password   │  │ - phone      │  │ - nurseId    │         │ │
│  │  │ - role       │  │ - address    │  │ - status     │         │ │
│  │  │ - isOnline   │  │ - condition  │  │ - priority   │         │ │
│  │  │ - avatar     │  │ - notes      │  │ - notes      │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │  ┌──────────────┐                                              │ │
│  │  │  AuditLogs   │                                              │ │
│  │  │ - id         │                                              │ │
│  │  │ - userId     │                                              │ │
│  │  │ - action     │                                              │ │
│  │  │ - entityType │                                              │ │
│  │  │ - details    │                                              │ │
│  │  └──────────────┘                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request/Response Flow

### 1. Authentication Flow
```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ 1. Enter email/password
         ↓
┌──────────────────────────┐
│  Login Page              │
│  (app/(auth)/login)      │
└────────┬─────────────────┘
         │ 2. authApi.login()
         ↓
┌──────────────────────────┐
│  API Client              │
│  (apiCall to fetch)      │
└────────┬─────────────────┘
         │ 3. POST /api/auth/login
         ↓
┌──────────────────────────┐
│  Route Handler           │
│  (app/api/auth/login)    │
└────────┬─────────────────┘
         │ 4. Validate input
         │ 5. Call authService.login()
         ↓
┌──────────────────────────┐
│  Auth Service            │
│  (backend/services)      │
└────────┬─────────────────┘
         │ 6. Find user in DB
         │ 7. bcrypt.compare(password)
         │ 8. signToken() → JWT
         ↓
┌──────────────────────────┐
│  Prisma Query            │
│  prisma.user.findUnique()│
└────────┬─────────────────┘
         │ 9. Query DB
         ↓
┌──────────────────────────┐
│  PostgreSQL              │
└────────┬─────────────────┘
         │ 10. Return user record
         ↓
┌──────────────────────────┐
│  Auth Service (cont.)    │
└────────┬─────────────────┘
         │ 11. Generate JWT
         │ 12. setAuthCookie()
         ↓
┌──────────────────────────┐
│  API Route (response)    │
└────────┬─────────────────┘
         │ 13. Return JWT + user
         ↓
┌──────────────────────────┐
│  API Client              │
└────────┬─────────────────┘
         │ 14. Parse response
         ↓
┌──────────────────────────┐
│  Frontend                │
│  - Store in state        │
│  - Redirect to dashboard │
└──────────────────────────┘
```

### 2. Protected API Call Flow
```
┌─────────────────┐
│  Component      │
└────────┬────────┘
         │ 1. useEffect() → dispatchApi.list()
         ↓
┌──────────────────────────┐
│  API Endpoint            │
│  (dispatchApi.list())    │
└────────┬─────────────────┘
         │ 2. Call apiCall('/api/dispatches')
         ↓
┌──────────────────────────┐
│  API Client              │
│  - Build fetch options   │
│  - Add headers           │
│  - credentials: 'same-or' │ (includes cookies)
└────────┬─────────────────┘
         │ 3. GET /api/dispatches
         │    + auth-token cookie
         ↓
┌──────────────────────────┐
│  Route Handler           │
│  (app/api/dispatches)    │
└────────┬─────────────────┘
         │ 4. authorize() middleware
         │ 5. Extract token from cookie
         │ 6. Verify token (JWT)
         ↓
┌──────────────────────────┐
│  Auth Utils              │
│  (verifyToken)           │
└────────┬─────────────────┘
         │ 7. Validate signature
         │ 8. Check expiration
         │ 9. Extract claims
         ↓
┌──────────────────────────┐
│  Authorization Check     │
│  (Check roles)           │
└────────┬─────────────────┘
         │ 10. If auth OK → continue
         │ 11. If not → return 401
         ↓
┌──────────────────────────┐
│  Route Handler (cont.)   │
└────────┬─────────────────┘
         │ 12. Call dispatchService.list()
         ↓
┌──────────────────────────┐
│  Dispatch Service        │
└────────┬─────────────────┘
         │ 13. prisma.dispatch.findMany()
         ↓
┌──────────────────────────┐
│  PostgreSQL              │
└────────┬─────────────────┘
         │ 14. Query results
         ↓
┌──────────────────────────┐
│  Service (cont.)         │
└────────┬─────────────────┘
         │ 15. Return formatted data
         ↓
┌──────────────────────────┐
│  Route Handler (resp.)   │
└────────┬─────────────────┘
         │ 16. NextResponse.json()
         ↓
┌──────────────────────────┐
│  API Client              │
└────────┬─────────────────┘
         │ 17. Parse JSON
         │ 18. Validate schema
         ↓
┌──────────────────────────┐
│  Endpoint Function       │
└────────┬─────────────────┘
         │ 19. Return ApiResponse
         ↓
┌──────────────────────────┐
│  Component               │
│  - setState(data)        │
│  - Re-render             │
└──────────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY ARCHITECTURE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Client-Side Security                             │ │
│  │  ✓ Password validation (client-side)              │ │
│  │  ✓ HTTPS only (production)                        │ │
│  │  ✓ Secure storage (HttpOnly cookies)              │ │
│  │  ✓ XSS protection (React sanitization)            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Network Security                                 │ │
│  │  ✓ HTTPS encryption (production)                  │ │
│  │  ✓ HTTP-only cookies (no JavaScript access)       │ │
│  │  ✓ SameSite=Lax (CSRF protection)                 │ │
│  │  ✓ Secure flag (HTTPS only in production)         │ │
│  │  ✓ CORS configuration                             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Server-Side Security                             │ │
│  │  ✓ Input validation (Zod schemas)                 │ │
│  │  ✓ JWT verification (HMAC-SHA256)                 │ │
│  │  ✓ Password hashing (bcrypt 10+ rounds)           │ │
│  │  ✓ Rate limiting (5 attempts/minute)              │ │
│  │  ✓ Authorization checks (role-based)              │ │
│  │  ✓ SQL injection prevention (Prisma ORM)          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Database Security                                │ │
│  │  ✓ Parameterized queries (Prisma)                 │ │
│  │  ✓ Connection pooling                             │ │
│  │  ✓ User role separation                           │ │
│  │  ✓ Audit logging                                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 Real-time Communication (Socket.IO)

```
┌─────────────────────────────────────────────────────────┐
│              REAL-TIME ARCHITECTURE                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Browser (Client)              Server (Node.js)        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │ socket.io    │◄────WS────►  │ Socket.IO    │        │
│  │ client       │  (port 3001)  │ server       │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                             │                │
│    - connect                      - dispatch           │
│    - dispatch:update              - presence           │
│    - dispatch:created             - message            │
│    - disconnect                   - notification       │
│                                                         │
│  Connected Events:                Backend Services:    │
│  ┌──────────────────────────┐  ┌──────────────────┐   │
│  │ Real-time updates        │  │ Event emitters   │   │
│  │ - New dispatches         │  │ - Notify rooms   │   │
│  │ - Status changes         │  │ - Broadcast      │   │
│  │ - Nurse availability     │  │ - Targeted emit  │   │
│  │ - Analytics updates      │  │ - Rate limiting  │   │
│  └──────────────────────────┘  └──────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model Relationships

```
┌─────────────────────────────────────────────────────────┐
│                  DATABASE SCHEMA                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User (ADMIN, NURSE, DISPATCHER)                       │
│  ├─ id (String, primary)                              │
│  ├─ email (String, unique)                            │
│  ├─ password (String, bcrypt hash)                    │
│  ├─ name (String)                                     │
│  ├─ role (Enum: ADMIN, NURSE, DISPATCHER)             │
│  ├─ isOnline (Boolean)                                │
│  ├─ avatar (String?, URL)                             │
│  ├─ phone (String?)                                   │
│  ├─ createdAt (DateTime)                              │
│  ├─ updatedAt (DateTime)                              │
│  ├─ dispatches (One-to-Many → Dispatch)              │
│  └─ auditLogs (One-to-Many → AuditLog)                │
│                                                         │
│                         │                               │
│                         ├──────────────┐                │
│                         ↓              ↓                │
│                                                         │
│  Patient                 Dispatch (PENDING, ASSIGNED...) │
│  ├─ id                  ├─ id                          │
│  ├─ name                ├─ patientId (FK)              │
│  ├─ phone               ├─ patient (Many-to-One)       │
│  ├─ address             ├─ nurseId (FK, nullable)      │
│  ├─ condition           ├─ nurse (Many-to-One)         │
│  ├─ notes               ├─ status (Enum)               │
│  ├─ createdAt           ├─ priority (Enum)             │
│  └─ dispatches          ├─ scheduledFor (DateTime)     │
│     (One-to-Many)       ├─ completedAt (DateTime?)     │
│                         ├─ notes (String?)             │
│                         ├─ createdAt                   │
│                         ├─ updatedAt                   │
│                         └─ auditLogs (One-to-Many)     │
│                                                         │
│  AuditLog                                               │
│  ├─ id                                                 │
│  ├─ userId (FK → User)                                │
│  ├─ action (String)                                   │
│  ├─ entityType (String)                               │
│  ├─ entityId (String)                                 │
│  ├─ details (Json?)                                   │
│  ├─ createdAt                                         │
│  ├─ dispatchId (FK, nullable)                         │
│  └─ dispatch (Many-to-One, nullable)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  PRODUCTION DEPLOYMENT                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Load Balancer / Reverse Proxy            │ │
│  │           (Nginx / AWS ALB)                        │ │
│  └─────────────┬────────────────────────────────────┘ │
│                │                                       │
│    ┌───────────┼───────────┐                          │
│    ↓           ↓           ↓                          │
│  ┌─────┐   ┌─────┐     ┌─────┐                       │
│  │ API │   │ API │ ... │ API │  (Scaled instances)   │
│  │  1  │   │  2  │     │  N  │                       │
│  └─┬───┘   └─┬───┘     └─┬───┘                       │
│    │         │           │                           │
│    └─────────┼───────────┘                           │
│              ↓                                        │
│    ┌──────────────────────┐                          │
│    │   PostgreSQL         │                          │
│    │   (Primary DB)       │                          │
│    └──────────────────────┘                          │
│              │                                        │
│              ├─→ (Read Replicas)                     │
│              └─→ (Backups)                           │
│                                                      │
│    ┌──────────────────────┐                          │
│    │  Socket.IO Cluster   │                          │
│    │  (Redis Adapter)     │                          │
│    └──────────────────────┘                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Integration Checklist

```
FRONTEND-BACKEND INTEGRATION STATUS:

✓ API Client                    Fully implemented
✓ API Endpoints                 Fully implemented
✓ Authentication System         Fully implemented
✓ Authorization Middleware      Fully implemented
✓ Database Schema              Fully implemented
✓ Backend Services             Fully implemented
✓ Error Handling               Fully implemented
✓ Input Validation             Fully implemented
✓ Logging System               Fully implemented
✓ Socket.IO Setup              Fully implemented
✓ Type Safety                  Fully implemented
✓ Security Measures            Fully implemented
✓ Documentation                Fully implemented
✓ Testing Utilities            Fully implemented
✓ Validation Tools             Fully implemented

READY FOR PRODUCTION: YES ✅
```

---

**Frontend-Backend Integration Complete**
**Architecture & Data Flow Diagram**
