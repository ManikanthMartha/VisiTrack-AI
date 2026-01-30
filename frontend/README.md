# Frontend Setup Guide

Next.js 15 frontend for AI Visibility Tracker with real-time analytics dashboard.

## Prerequisites

- Node.js 18+ and npm
- Backend API running (http://localhost:8000)
- PostgreSQL database (for authentication)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Key packages**:
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `recharts` - Charts
- `better-auth` - Authentication
- `@supabase/supabase-js` - Database client

### 2. Environment Configuration

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database (for authentication)
DATABASE_URL=postgresql://user:password@host:5432/database

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Optional: Supabase (if using Supabase auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Generate Auth Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup (Authentication)

Run SQL in your PostgreSQL database:

```sql
-- From create-auth-tables.sql
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified BOOLEAN NOT NULL DEFAULT false,
    name TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image TEXT
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt TIMESTAMP NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt TIMESTAMP,
    password TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Application runs on http://localhost:3000

**Features**:
- Hot reload on file changes
- Source maps for debugging
- Detailed error messages

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/           # Login page
│   │   │   └── signup/          # Signup page
│   │   ├── api/
│   │   │   └── auth/            # Auth API routes
│   │   ├── category/
│   │   │   └── [id]/            # Category detail page
│   │   ├── api-test/            # API testing page
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   ├── charts/
│   │   │   └── VisibilityChart.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── ui/                  # shadcn/ui components
│   │   └── ui-custom/           # Custom components
│   │       ├── BrandCard.tsx
│   │       ├── BrandCitations.tsx
│   │       ├── BrandContexts.tsx
│   │       ├── BrandKeywords.tsx
│   │       ├── BrandSentiment.tsx
│   │       ├── CategoryCard.tsx
│   │       ├── FilterBar.tsx
│   │       ├── Leaderboard.tsx
│   │       └── PlatformBreakdown.tsx
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth configuration
│   │   ├── auth-client.ts       # Auth client
│   │   └── utils.ts             # Utilities
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── middleware.ts            # Auth middleware
│   └── index.css                # Global styles
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.ts               # Next.js configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## Key Features

### 1. Home Page (`/`)
- Category cards with brand counts
- Top brands per category
- Sparkline charts
- Quick navigation

### 2. Category Page (`/category/[id]`)
- Brand leaderboard
- Visibility charts
- Platform breakdown
- LLM-powered insights:
  - Citations
  - Sentiment analysis
  - Keywords
  - Context examples

### 3. Authentication
- Email/password login
- Session management
- Protected routes
- User profile

### 4. API Integration
- Type-safe API client
- Automatic error handling
- Loading states
- Empty states

## Components

### Custom Components

**BrandCard**:
```tsx
<BrandCard brand={brandData} />
```
Shows brand overview with visibility score, rank, and metrics.

**BrandCitations**:
```tsx
<BrandCitations citations={citations} />
```
Displays top cited sources with URLs and counts.

**BrandSentiment**:
```tsx
<BrandSentiment sentiment={sentimentData} />
```
Shows sentiment breakdown with progress bars.

**BrandKeywords**:
```tsx
<BrandKeywords 
  keywords={keywords}
  onKeywordClick={handleClick}
/>
```
Tag cloud with clickable keywords.

**BrandContexts**:
```tsx
<BrandContexts 
  contexts={contexts}
  selectedKeyword={keyword}
/>
```
List of context examples with filtering.

**VisibilityChart**:
```tsx
<VisibilityChart 
  data={timeseriesData}
  title="Brand Visibility"
/>
```
Line chart showing visibility over time.

### UI Components (shadcn/ui)

Pre-built components in `src/components/ui/`:
- `button`, `card`, `badge`, `alert`
- `dialog`, `dropdown-menu`, `popover`
- `table`, `tabs`, `tooltip`
- And 50+ more...

## API Client

### Usage

```typescript
import { apiClient } from '@/lib/api';

// Get categories
const categories = await apiClient.getCategories();

// Get brand details
const brand = await apiClient.getBrandDetails(brandId);

// Get timeseries data
const timeseries = await apiClient.getBrandTimeseries(brandId, 30);

// Get LLM data
const citations = await apiClient.getBrandCitations(brandId);
const sentiment = await apiClient.getBrandSentiment(brandId);
const keywords = await apiClient.getBrandKeywords(brandId);
const contexts = await apiClient.getBrandContexts(brandId);
```

### Type Safety

All API responses are typed:

```typescript
interface BrandDetails {
  id: string;
  name: string;
  overall_visibility_score: number;
  total_mentions: number;
  // ...
}

interface Citation {
  brand_id: string;
  url: string;
  title: string | null;
  citation_count: number;
  // ...
}
```

## Styling

### Tailwind CSS

Utility-first CSS framework:

```tsx
<div className="flex items-center gap-4 p-6 bg-card rounded-lg">
  <h2 className="text-2xl font-bold">Title</h2>
</div>
```

### Custom Theme

Configured in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))',
      // ...
    }
  }
}
```

### Dark Mode

Automatic dark mode support:

```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

## Authentication

### Login

```typescript
import { authClient } from '@/lib/auth-client';

await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password'
});
```

### Signup

```typescript
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe'
});
```

### Protected Routes

```typescript
// middleware.ts
export default authMiddleware({
  publicRoutes: ['/login', '/signup'],
  defaultRedirectUrl: '/'
});
```