# Multi-Tenant SaaS Notes Application

A secure multi-tenant Software-as-a-Service (SaaS) notes application built with the MERN stack, featuring role-based access control, subscription limits, and strict tenant isolation.

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

# Install dependencies
npm install

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