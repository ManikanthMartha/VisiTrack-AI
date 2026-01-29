# Setup Guide

Quick start guide for the AI Visibility Tracker Next.js application.

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   The `.env.local` file is already created with default values. Update it if needed:
   ```bash
   # Required
   BETTER_AUTH_SECRET=your-secret-key-change-this-in-production
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Setup (Optional)

To enable social authentication with GitHub and Google:

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret
5. Add to `.env.local`:
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret
7. Add to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

## Database Setup (Optional)

By default, Better Auth uses an in-memory SQLite database for development. For production, you should use a persistent database:

### PostgreSQL Example
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### MySQL Example
```bash
DATABASE_URL=mysql://user:password@localhost:3306/dbname
```

Update `src/lib/auth.ts` to use your database:
```typescript
export const auth = betterAuth({
  database: {
    provider: "postgres", // or "mysql"
    url: process.env.DATABASE_URL,
  },
  // ... rest of config
});
```

## Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can specify a different port:
```bash
PORT=3001 npm run dev
```

### Authentication not working
- Ensure `.env.local` has the correct values
- Restart the development server after changing environment variables
- Check that OAuth redirect URIs match your configuration

### Build errors
- Clear the `.next` folder: `rm -rf .next` (or `rmdir /s /q .next` on Windows)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Next Steps

- Customize the UI components in `src/components/`
- Add your own data sources in `src/data/`
- Configure additional Better Auth features
- Deploy to Vercel, Netlify, or your preferred platform

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
