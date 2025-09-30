# Deployment Guide

This guide will help you deploy the Multi-Tenant Notes Application to Vercel.

## Prerequisites

1. [Vercel Account](https://vercel.com)
2. [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)
3. [GitHub Account](https://github.com) (recommended for continuous deployment)

## Step-by-Step Deployment

### 1. Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas account and cluster
2. Create a database user with read/write permissions
3. Whitelist your IP (0.0.0.0/0 for production or specific IPs)
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```

### 2. Backend Deployment

#### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to the project root (not frontend)
5. Configure environment variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `your-mongodb-atlas-connection-string`
   - `JWT_SECRET` = `your-super-secure-jwt-secret-key`
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app` (set this after frontend deployment)

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Set environment variables
vercel env add NODE_ENV production
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

### 3. Frontend Deployment

#### Option A: Deploy via Vercel Dashboard

1. Create another Vercel project
2. Import the same GitHub repository
3. Set **Root Directory** to `frontend`
4. Configure environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.vercel.app`

#### Option B: Deploy via Vercel CLI

```bash
# Navigate to frontend directory
cd frontend

# Deploy frontend
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
```

### 4. Database Seeding

After both deployments are complete:

1. Update the backend's `FRONTEND_URL` environment variable with your actual frontend URL
2. Trigger a redeployment of the backend
3. Run the database seeding:

#### Option A: Run locally and seed remote database
```bash
# Set your production MongoDB URI in local .env
MONGODB_URI="your-production-mongodb-uri" npm run seed
```

#### Option B: Use MongoDB Compass/Atlas to manually create data

Create the following collections and documents:

**Tenants Collection:**
```json
[
  {
    "name": "Acme Corporation",
    "slug": "acme", 
    "subscription": "FREE"
  },
  {
    "name": "Globex Corporation",
    "slug": "globex",
    "subscription": "FREE"
  }
]
```

**Users Collection:**
```json
[
  {
    "email": "admin@acme.test",
    "password": "$2b$12$hash-for-password",
    "role": "ADMIN", 
    "tenantId": "acme-tenant-object-id"
  },
  {
    "email": "user@acme.test",
    "password": "$2b$12$hash-for-password",
    "role": "MEMBER",
    "tenantId": "acme-tenant-object-id" 
  },
  {
    "email": "admin@globex.test", 
    "password": "$2b$12$hash-for-password",
    "role": "ADMIN",
    "tenantId": "globex-tenant-object-id"
  },
  {
    "email": "user@globex.test",
    "password": "$2b$12$hash-for-password", 
    "role": "MEMBER",
    "tenantId": "globex-tenant-object-id"
  }
]
```

### 5. Verify Deployment

1. Check health endpoint: `GET https://your-backend-url.vercel.app/health`
2. Test login with test accounts via frontend
3. Verify CORS is working for automated testing

### 6. Domain Configuration (Optional)

If you want custom domains:

1. Add custom domains in Vercel dashboard for both projects
2. Update CORS configuration and environment variables accordingly

## Environment Variables Summary

### Backend Environment Variables
- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://...` 
- `JWT_SECRET=your-super-secure-secret`
- `FRONTEND_URL=https://your-frontend-domain.vercel.app`
- `PORT=3000` (optional, Vercel sets this automatically)

### Frontend Environment Variables  
- `NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure FRONTEND_URL is set correctly in backend environment variables
2. **Database Connection**: Check MongoDB Atlas network access and user credentials
3. **Authentication Issues**: Verify JWT_SECRET is set and consistent
4. **Build Failures**: Check Node.js version compatibility (18+)

### Useful Commands

```bash
# Check Vercel deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Check environment variables
vercel env ls

# Redeploy after environment changes
vercel --prod
```

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Post-Deployment Testing

Run through the test scenarios:

1. Health check: `curl https://your-backend.vercel.app/health`
2. Login test accounts via frontend
3. Create notes (test subscription limits)
4. Test upgrade functionality
5. Verify tenant isolation by logging into different accounts

Your Multi-Tenant Notes Application should now be live and ready for automated testing!