# Migration from Vite to Next.js

This document outlines the migration from React + Vite to Next.js 15 with App Router.

## What Changed

### Framework Migration
- **From:** React 19 + Vite
- **To:** Next.js 15 with App Router

### Removed Files
- `vite.config.ts` - Vite configuration
- `index.html` - HTML entry point (Next.js generates this)
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main App component (migrated to pages)
- `src/App.css` - App-specific styles
- `src/pages/Auth.tsx` - Auth page (migrated to app router)
- `eslint.config.js` - Old ESLint config
- `tsconfig.node.json` - Vite TypeScript config
- `tsconfig.app.json` - Vite TypeScript config
- `dist/` - Build output directory

### New Files
- `next.config.ts` - Next.js configuration
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/app/category/[id]/page.tsx` - Dynamic category page
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/signup/page.tsx` - Signup page
- `src/app/api/auth/[...all]/route.ts` - Better Auth API routes
- `src/lib/auth.ts` - Better Auth server configuration
- `src/lib/auth-client.ts` - Better Auth client hooks
- `src/middleware.ts` - Next.js middleware
- `.eslintrc.json` - Next.js ESLint config
- `next-env.d.ts` - Next.js TypeScript declarations
- `.env.local` - Environment variables

### Updated Files
- `package.json` - Updated dependencies and scripts
- `tsconfig.json` - Updated for Next.js
- `README.md` - Updated documentation
- `src/components/layout/Sidebar.tsx` - Updated to use Next.js Link and usePathname
- `src/components/layout/Topbar.tsx` - Updated to use Next.js Link

## Authentication

### Better Auth Integration
The project now uses Better Auth instead of custom authentication:

- **Email/Password authentication** - Built-in support
- **Social providers** - GitHub and Google OAuth (optional)
- **Session management** - Automatic session handling
- **API routes** - `/api/auth/*` for all auth operations

### Auth Hooks
```typescript
import { signIn, signUp, signOut, useSession } from '@/lib/auth-client';

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ email, password, name });

// Sign out
await signOut();

// Get session
const { data: session } = useSession();
```

## Routing

### Old (Vite + React)
- Hash-based routing (`#/login`, `#/signup`)
- Manual state management for views
- Client-side only routing

### New (Next.js App Router)
- File-based routing
- Server and client components
- Automatic code splitting
- Built-in layouts and nested routes

### Route Structure
```
/                           → src/app/page.tsx
/login                      → src/app/(auth)/login/page.tsx
/signup                     → src/app/(auth)/signup/page.tsx
/category/[id]              → src/app/category/[id]/page.tsx
/api/auth/*                 → src/app/api/auth/[...all]/route.ts
```

## Key Differences

### 1. Client vs Server Components
- All interactive components use `"use client"` directive
- API routes are server-side only
- Auth configuration is server-side

### 2. Navigation
```typescript
// Old (Vite)
window.location.hash = '#/login';

// New (Next.js)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/login');
```

### 3. Links
```typescript
// Old (Vite)
<a href="#/category/123">Category</a>

// New (Next.js)
import Link from 'next/link';
<Link href="/category/123">Category</Link>
```

### 4. Environment Variables
```bash
# Old (Vite)
VITE_API_URL=...

# New (Next.js)
# Server-side only
API_URL=...

# Client-side (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=...
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Notes

- All UI components remain unchanged
- Styling with Tailwind CSS is identical
- Framer Motion animations work the same
- Mock data and types are unchanged
- All custom components in `src/components/` are preserved
