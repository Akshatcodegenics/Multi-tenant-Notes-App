# Multi-Tenant SaaS Notes Application

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
