# Multi-Tenant SaaS Notes Application

A secure multi-tenant SaaS notes API with role-based access control, subscription limits, and strict tenant isolation. Backend runs on Express and is configured for Vercel serverless deployment.

## 🏗️ Multi-Tenancy Architecture

This application implements a **shared schema with tenant ID approach** for multi-tenancy:

### Why Shared Schema with Tenant ID?

We chose the shared schema approach for the following reasons:

1. **Cost Efficiency**: Single database and shared infrastructure reduce operational costs
2. **Scalability**: Easier to scale horizontally and manage resources
3. **Maintenance**: Single codebase and schema to maintain
4. **Performance**: Better resource utilization compared to separate databases per tenant
5. **Compliance**: Easier to implement cross-tenant analytics while maintaining isolation

### Implementation Details

- **Tenant Isolation**: Every data model includes a `tenantId` field
- **Query Filtering**: All database queries are automatically filtered by tenant ID
- **Middleware Protection**: Authentication middleware ensures users can only access their tenant's data
- **Compound Indexes**: Database indexes on `(tenantId, otherFields)` for optimal performance

### Data Models

```javascript
// Tenant Model
{
  id: ObjectId,
  name: String,
  slug: String (unique),
  subscription: String (FREE|PRO),
  noteLimit: Number,
  timestamps
}

// User Model  
{
  id: ObjectId,
  email: String,
  password: String (hashed),
  role: String (ADMIN|MEMBER),
  tenantId: ObjectId (references Tenant),
  timestamps
}

// Note Model
{
  id: ObjectId,
  title: String,
  content: String,
  userId: ObjectId (references User),
  tenantId: ObjectId (references Tenant),
  timestamps
}
```

## 🚀 Features

### Multi-Tenancy
- ✅ Strict tenant data isolation
- ✅ Two demo tenants: Acme and Globex
- ✅ Shared schema with tenant ID approach
- ✅ Automatic tenant filtering in all queries

### Authentication & Authorization  
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin/Member)
- ✅ Secure password hashing with bcrypt
- ✅ Protected routes and middleware

### Subscription Management
- ✅ Free Plan: Limited to 3 notes per tenant
- ✅ Pro Plan: Unlimited notes
- ✅ Admin-only upgrade functionality
- ✅ Real-time limit enforcement

### Notes Management (CRUD)
- ✅ Create, read, update, delete notes
- ✅ Tenant-isolated note access
- ✅ User ownership validation
- ✅ Pagination support

### Frontend
- ✅ Responsive React application
- ✅ Login with predefined accounts
- ✅ Notes dashboard with CRUD operations
- ✅ Upgrade to Pro functionality
- ✅ Real-time subscription status

### Deployment
- ✅ Vercel-ready configuration
- ✅ MongoDB Atlas integration
- ✅ CORS enabled for automated testing
- ✅ Health check endpoint

## 🔐 Test Accounts

The application comes with 4 predefined test accounts (all with password: `password`):

| Email | Role | Tenant | Subscription |
|-------|------|--------|-------------|
| admin@acme.test | Admin | Acme Corporation | FREE |
| user@acme.test | Member | Acme Corporation | FREE |
| admin@globex.test | Admin | Globex Corporation | FREE |
| user@globex.test | Member | Globex Corporation | FREE |

## 📚 API Documentation

### Health Check
```
GET /health
Response: { "status": "ok", "database": "connected", "timestamp": "...", "uptime": 123 }
```

### Authentication
```
POST /api/auth/login
Body: { "email": "admin@acme.test", "password": "password" }
Response: { "token": "jwt-token", "user": {...} }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { "user": {...} }
```

### Notes CRUD
```
GET /api/notes
Headers: Authorization: Bearer <token>
Response: { "notes": [...], "pagination": {...} }

POST /api/notes  
Headers: Authorization: Bearer <token>
Body: { "title": "Note Title", "content": "Note content..." }
Response: { "message": "Note created", "note": {...} }

GET /api/notes/:id
Headers: Authorization: Bearer <token>
Response: { "note": {...} }

PUT /api/notes/:id
Headers: Authorization: Bearer <token>
Body: { "title": "Updated Title", "content": "Updated content..." }
Response: { "message": "Note updated", "note": {...} }

DELETE /api/notes/:id
Headers: Authorization: Bearer <token>
Response: { "message": "Note deleted", "noteId": "..." }
```

### Tenant Management
```
GET /api/tenants/current
Headers: Authorization: Bearer <token>
Response: { "tenant": { "subscription": "FREE", "noteCount": 2, "canCreateNote": true, ... } }

POST /api/tenants/:slug/upgrade (Admin only)
Headers: Authorization: Bearer <token>
Response: { "message": "Successfully upgraded to Pro plan", "tenant": {...} }
```

### User Management (Admin only)
```
GET /api/users
Headers: Authorization: Bearer <token>
Response: { "users": [...] }

POST /api/users/invite
Headers: Authorization: Bearer <token>
Body: { "email": "new@user.com", "role": "MEMBER" }
Response: { "message": "User invited successfully", "user": {...} }
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Backend Setup
```bash
# Clone repository
git clone <repo-url>
cd Notes_app
=======
A secure, multi-tenant SaaS application for managing notes with role-based access control and subscription-based feature gating.

## Architecture Overview

### Multi-Tenancy Approach: Shared Schema with Tenant ID Column

This application implements multi-tenancy using a **shared schema with tenant ID column** approach. This design choice was made for the following reasons:

1. **Simplicity**: Single database with tenant isolation at the application level
2. **Cost-effectiveness**: Shared infrastructure reduces operational costs
3. **Maintainability**: Single schema to maintain and migrate
4. **Scalability**: Efficient resource utilization across tenants

### Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    tenant_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);
```

### Tenant Isolation

Tenant isolation is enforced through:

1. **Database Level**: All queries include `tenant_id` in WHERE clauses
2. **Middleware Level**: JWT tokens contain tenant information
3. **API Level**: All endpoints verify tenant ownership before data access
4. **Frontend Level**: UI only displays data for the authenticated user's tenant

## Features

### 1. Multi-Tenancy
- ✅ Support for multiple tenants (Acme and Globex pre-configured)
- ✅ Strict data isolation between tenants
- ✅ Shared schema with tenant ID column approach

### 2. Authentication and Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin and Member roles)
- ✅ Predefined test accounts with secure password hashing

### 3. Subscription Feature Gating
- ✅ Free Plan: Maximum 3 notes per tenant
- ✅ Pro Plan: Unlimited notes
- ✅ Admin-only upgrade endpoint
- ✅ Real-time limit enforcement

### 4. Notes API (CRUD)
- ✅ `POST /notes` - Create a note
- ✅ `GET /notes` - List all notes for current tenant
- ✅ `GET /notes/:id` - Retrieve specific note
- ✅ `PUT /notes/:id` - Update a note
- ✅ `DELETE /notes/:id` - Delete a note

### 5. Additional Endpoints
- ✅ `GET /health` - Health check endpoint
- ✅ `POST /auth/login` - User authentication
- ✅ `GET /auth/me` - Get current user info
- ✅ `POST /tenants/:slug/upgrade` - Upgrade subscription (Admin only)
- ✅ `POST /tenants/:slug/invite` - Invite user to tenant (Admin only, stubbed in this demo)

## Test Accounts

All test accounts use the password: `password`

| Email | Role | Tenant | Plan |
|-------|------|--------|------|
| admin@acme.test | Admin | Acme | Free |
| user@acme.test | Member | Acme | Free |
| admin@globex.test | Admin | Globex | Free |
| user@globex.test | Member | Globex | Free |

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite with prepared statements
- **Authentication**: JWT tokens with bcrypt password hashing
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Vercel
- **Security**: Helmet.js, CORS, Rate limiting



### Subscription Management

#### Upgrade Tenant (Admin only)
```http
POST /tenants/acme/upgrade
Authorization: Bearer <admin_token>
```

## Security Features

1. **Password Security**: bcrypt hashing with salt rounds
2. **JWT Security**: Signed tokens with expiration
3. **CORS**: Configured for cross-origin requests
4. **Rate Limiting**: Protection against abuse
5. **Input Validation**: Server-side validation for all inputs
6. **SQL Injection Protection**: Prepared statements
7. **XSS Protection**: HTML escaping in frontend

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd multi-tenant-notes-saas

# Install dependencies
npm install

<<<<<<< HEAD
# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed database with test accounts
npm run seed

# Start backend server
npm run dev
# Server runs on http://localhost:3000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
# Frontend runs on http://localhost:3001
```

### Environment Variables

Backend (`.env`):
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/multi-tenant-notes
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3001
PORT=3000
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🌐 Deployment

### Backend Deployment (Vercel)

1. Create a new Vercel project
2. Connect your GitHub repository
3. Set the root directory to the project root
4. Configure environment variables in Vercel dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-mongodb-atlas-uri>`
   - `JWT_SECRET=<your-production-jwt-secret>`
   - `FRONTEND_URL=<your-frontend-vercel-url>`

### Frontend Deployment (Vercel)

1. Create a new Vercel project for the frontend
2. Set the root directory to `frontend`
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL=<your-backend-vercel-url>`

### Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas cluster
2. Create a database user with read/write access
3. Whitelist your IP addresses (or use 0.0.0.0/0 for development)
4. Get the connection string and add it to your environment variables
5. Run the seed script to populate test data

## 🧪 Testing

The application is designed to be validated by automated test scripts that verify:

- ✅ Health endpoint availability
- ✅ Authentication with predefined accounts
- ✅ Tenant isolation enforcement
- ✅ Role-based access restrictions
- ✅ Subscription limit enforcement and upgrade functionality
- ✅ CRUD operations for notes
- ✅ Frontend accessibility and functionality

### Manual Testing

1. Access the frontend application
2. Login with any test account
3. Create, edit, and delete notes
4. Test subscription limits (create 3+ notes on FREE plan)
5. Test upgrade functionality (Admin accounts only)
6. Verify tenant isolation by switching between accounts

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Express rate limiter middleware
- **CORS Configuration**: Properly configured for production
- **Input Validation**: Server-side validation for all inputs
- **Tenant Isolation**: Strict database-level isolation
- **Role-based Access**: Granular permission system

## 📈 Performance Optimizations

- **Database Indexes**: Compound indexes on tenant + other fields
- **Query Optimization**: Efficient tenant-filtered queries  
- **Connection Pooling**: MongoDB connection pooling
- **Pagination**: Built-in pagination for large datasets
- **Caching**: Static asset caching in frontend

## 🛡️ Tenant Isolation Verification

The application ensures strict tenant isolation through:

1. **Database Level**: All queries include tenant ID filtering
2. **Application Level**: Middleware validates tenant access
3. **API Level**: Routes verify tenant ownership
4. **Frontend Level**: UI only shows tenant-specific data

Example isolation verification:
```javascript
// Every database query includes tenantId
const notes = await Note.find({ 
  tenantId: req.user.tenantId,  // Auto-injected by middleware
  // other filters...
});

// Users can only access their tenant's data
if (requestedTenantId !== req.user.tenantId) {
  return res.status(403).json({ error: 'Access denied' });
}
```

## 📝 Notes

- The application uses MongoDB for production-ready scalability
- JWT tokens expire after 24 hours for security
- Free plan users are limited to 3 notes per tenant
- Admin users can upgrade their tenant's subscription
- All passwords are hashed using bcrypt with 12 salt rounds
- CORS is configured to allow automated testing scripts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
=======
# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file:
```env
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=3000
DATABASE_PATH=./database.sqlite
# Optional: set a specific frontend origin for CORS, otherwise all origins are allowed in this demo
# FRONTEND_URL=https://your-frontend.vercel.app
```

## Deployment

The application is configured for deployment on Vercel with the included `vercel.json` configuration.

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- `JWT_SECRET`: Strong secret key for JWT signing
- `NODE_ENV`: Set to "production"
- `DATABASE_PATH`: "/tmp/database.sqlite" for Vercel

### PR Dev Checklist
- [ ] Migrations initialized (SQLite tables created on boot)
- [ ] Seeds executed (Acme/Globex + 4 users seeded automatically)
- [ ] `.env` configured with JWT_SECRET and DATABASE_PATH
- [ ] Backend deployed to Vercel (check `/health`)
- [ ] Frontend served from `/public` on the same domain (Vercel static)
- [ ] Verified: login with 4 seeded accounts
- [ ] Verified: note limit at 3 for Free; upgrade lifts immediately
- [ ] Verified: tenant isolation (no cross-tenant access)
- [ ] Verified: role restrictions (member cannot upgrade/invite)

## Testing

### Manual Testing
1. Visit the deployed application
2. Use the test account buttons to quickly login
3. Test note creation, editing, and deletion
4. Test subscription limits (create 4 notes on free plan)
5. Test admin upgrade functionality

### Automated Testing Validation
The application is designed to pass automated validation tests for:
- Health endpoint availability
- Authentication with all test accounts
- Tenant isolation enforcement
- Role-based access restrictions (upgrade/invite are admin-only)
- Subscription limit enforcement with real-time upgrade lifting limits
- CRUD operations functionality within tenant scope
- Frontend accessibility

### Example cURL Commands

1) Login (returns JWT):
```
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'
```

2) Create note (tenant scoped):
```
curl -X POST "$API_BASE/notes" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"x","content":"y"}'
```

3) Upgrade tenant to Pro (admin only):
```
curl -X POST "$API_BASE/tenants/acme/upgrade" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

4) Invite user (stub, admin only):
```
curl -X POST "$API_BASE/tenants/acme/invite" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"new.user@acme.test"}'
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure SQLite file permissions are correct
2. **JWT Errors**: Verify JWT_SECRET is set and consistent
3. **CORS Issues**: Check CORS configuration for your domain
4. **Rate Limiting**: Reduce request frequency if hitting limits

### Logs
Check server logs for detailed error information:
```bash
npm start
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.
>>>>>>> 27dab73caf82517654ba9173660553be91951889
