# Spott – Deployment & Production Guide

---

This document details the step-by-step production deployment workflow for **Spott – AI Events Organiser** on **Vercel** and **MongoDB Atlas**.

---

## 1. Prerequisites & Cloud Accounts

- **Vercel Account:** For Next.js serverless app hosting.
- **MongoDB Atlas Account:** For cloud database cluster.
- **Groq Developer Account:** For AI completions API key.
- **Unsplash Developer Account:** For image search access key.

---

## 2. Environment Variables Configuration

Create environment variables in Vercel project settings and `.env.local` for local development.

```env
# Database Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/spott?retryWrites=true&w=majority

# JWT Authentication Secret Key
JWT_SECRET=your_super_secret_jwt_signing_key_32bytes_min

# AI Service API Key (Groq)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional Fallback AI API Key (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Unsplash Image Search Access Key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

# Base Application URL
NEXT_PUBLIC_APP_URL=https://spott-events.vercel.app
```

---

## 3. MongoDB Atlas Provisioning

1. Log in to **MongoDB Atlas** and create a new **M0 Free Tier** database cluster.
2. Under **Database Access**, create a database user with read/write permissions.
3. Under **Network Access**, add IP Access List entry `0.0.0.0/0` (allows Vercel serverless functions to connect from dynamic IPs).
4. Obtain the connection string and populate `MONGODB_URI`.

---

## 4. Vercel Deployment Workflow

### Method 1: Git Integration (Recommended)
1. Push local code repository to GitHub/GitLab.
2. Import project in Vercel Dashboard.
3. Vercel automatically detects **Next.js**.
4. Add all environment variables listed above under **Environment Variables**.
5. Click **Deploy**.

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Build Script & Next.js Optimization

### Build Command (`package.json`)
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "seed": "node scripts/seed.mjs"
}
```

### External Image Configuration (`next.config.mjs`)
To allow Next.js `<Image />` optimization for remote images from Unsplash:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
```

---

## 6. Production Security Best Practices

1. **HttpOnly Cookies:** JWT tokens stored with `httpOnly: true` and `secure: true` in production environments.
2. **Password Security:** All passwords salted (10 rounds) and hashed using `bcryptjs` before writing to database.
3. **Database Connection Pooling:** Global caching in `lib/mongodb.ts` prevents connection exhaustion.
4. **Input Sanitization & Schema Validation:** Every incoming API request body parsed through strict Zod schemas (`lib/validations.ts`).
5. **Environment Variable Protection:** Server-only variables (`GROQ_API_KEY`, `JWT_SECRET`, `MONGODB_URI`) are never prefixed with `NEXT_PUBLIC_`, ensuring they are excluded from client bundle JavaScript.
