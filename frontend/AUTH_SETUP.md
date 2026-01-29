# Authentication Setup Guide

This guide explains how to set up and use the Better Auth authentication system with Supabase.

## Database Setup

### 1. Run the SQL Schema

Execute the updated `backend/supabase_schema.sql` in your Supabase SQL Editor. This will create:
- `users` table (id, name, email, password, email_verified, created_at, updated_at)
- `sessions` table (id, user_id, expires_at, token, created_at, updated_at)
- All existing tables (categories, brands, prompts, responses, scraper_sessions)

### 2. Get Your Database Connection String

1. Go to your Supabase project settings
2. Navigate to Database → Connection String
3. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
4. Update `frontend/.env.local` with your actual database password

## Environment Variables

Update `frontend/.env.local`:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hcbldivhiqpekytahxew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL for Better Auth (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.hcbldivhiqpekytahxew.supabase.co:5432/postgres
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

## How It Works

### Authentication Flow

1. **Unauthenticated User:**
   - Visits the website
   - Middleware checks for session token
   - Redirects to `/login` if not authenticated

2. **Sign Up:**
   - User fills out signup form (name, email, password)
   - Password is hashed using Better Auth
   - User record created in `users` table
   - Session created in `sessions` table
   - User redirected to dashboard

3. **Sign In:**
   - User enters email and password
   - Better Auth verifies credentials
   - Session created
   - User redirected to dashboard

4. **Protected Routes:**
   - All routes except `/login` and `/signup` require authentication
   - Middleware checks session token on every request
   - Unauthenticated users are redirected to login

### Files Modified

1. **backend/supabase_schema.sql** - Added users and sessions tables
2. **frontend/src/lib/auth.ts** - Configured Better Auth with Supabase
3. **frontend/src/middleware.ts** - Added authentication checks
4. **frontend/src/app/page.tsx** - Added session check and loading state
5. **frontend/.env.local** - Added Supabase and database configuration

### API Routes

Better Auth automatically creates these API routes:
- `POST /api/auth/sign-up` - Create new user
- `POST /api/auth/sign-in` - Sign in user
- `POST /api/auth/sign-out` - Sign out user
- `GET /api/auth/session` - Get current session

These are handled by the catch-all route at `frontend/src/app/api/auth/[...all]/route.ts`.

## Testing

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Visit `http://localhost:3000`
   - You should be redirected to `/login`

3. Create an account at `/signup`
   - Enter name, email, and password (min 8 characters)
   - You'll be redirected to the dashboard

4. Sign out and sign in again to test the flow

## Security Features

- Passwords are hashed using bcrypt
- Sessions are stored securely with expiration
- CSRF protection enabled
- Secure cookie settings
- Email validation

## Troubleshooting

### "Failed to create account"
- Check that DATABASE_URL is correct in `.env.local`
- Verify the users table exists in Supabase
- Check browser console for detailed errors

### "Invalid email or password"
- Ensure the user exists in the database
- Check that the password is correct
- Verify sessions table exists

### Redirects not working
- Clear browser cookies
- Check middleware configuration
- Verify BETTER_AUTH_URL matches your local URL

## Next Steps

- Add email verification
- Implement password reset
- Add OAuth providers (Google, GitHub)
- Add user profile management
- Implement role-based access control
