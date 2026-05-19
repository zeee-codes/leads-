# 🚀 Vercel Deployment Guide

This guide describes how to deploy the Prowider B2B Lead Distribution Engine to Vercel and link it to the Neon Serverless Postgres database.

---

## 📦 Setup & Prerequisites

1. **GitHub Repository**: Make sure your local codebase is pushed to a remote GitHub repository.
2. **Neon Connection String**: Ensure you have the database connection string. The connection string format is:
   ```
   postgresql://<username>:<password>@<host>/<database>?sslmode=require
   ```

---

## ⚡ Deployment Steps

### 1. Import Project to Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
2. Select your imported GitHub repository and click **Import**.

### 2. Configure Build Settings
Vercel automatically detects Next.js. The default build settings will work out of the box because the build script has been updated to generate the Prisma Client:
* **Build Command**: `prisma generate && next build` (configured automatically via `package.json`)
* **Output Directory**: `.next`
* **Install Command**: `npm install`

### 3. Add Environment Variables
Add the following key-value pairs in the **Environment Variables** section:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://<username>:<password>@<host>/<database>?sslmode=require` | The primary connection string for queries and migrations. |

### 4. Click Deploy
* Click **Deploy**. Vercel will build the application, run type-checking, generate the Prisma Client, and deploy the serverless functions.

---

## 🔄 Database Migrations in Production

If you modify the Prisma schema in the future, you must apply migrations to the production Neon database. You can do this:

### Option A: Local CLI Deploy (Recommended)
Apply migrations from your local workspace to Neon using your local console:
```bash
npx prisma migrate deploy
```

### Option B: Build Step Integration
If you prefer automatic migrations on every deployment, you can update the `build` script in `package.json` to:
```json
"build": "npx prisma migrate deploy && prisma generate && next build"
```
> [!NOTE]
> This requires the build container to have network access to the database (which it does via the `DATABASE_URL` environment variable).
