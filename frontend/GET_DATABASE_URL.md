# How to Get Your Supabase Database URL

## Step 1: Get Your Database Password

1. Go to your Supabase project: https://supabase.com/dashboard/project/hcbldivhiqpekytahxew
2. Click on **Settings** (gear icon in the left sidebar)
3. Click on **Database**
4. Scroll down to **Connection string**
5. Select **URI** tab
6. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.hcbldivhiqpekytahxew.supabase.co:5432/postgres
   ```
7. The password is shown in the connection string (or you can click "Reset database password" if you forgot it)

## Step 2: Update Your .env.local File

Open `frontend/.env.local` and replace the DATABASE_URL line with your actual connection string:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hcbldivhiqpekytahxew.supabase.co:5432/postgres
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD` with your real database password!

## Step 3: Run the SQL Schema

1. Go to your Supabase project
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `backend/supabase_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - this means the tables were created!

## Step 4: Verify Tables Were Created

1. In Supabase, click on **Table Editor** in the left sidebar
2. You should see these new tables:
   - users
   - sessions
   - categories
   - brands
   - prompts
   - responses
   - scraper_sessions

## Step 5: Start Your App

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 and you should be redirected to the login page!

## Troubleshooting

### "Connection refused" or "Database error"
- Check that your DATABASE_URL is correct
- Make sure you replaced [YOUR-PASSWORD] with your actual password
- Verify the database is running in Supabase dashboard

### "Table does not exist"
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check the Table Editor to verify tables were created

### "Invalid credentials"
- Your database password might be wrong
- Try resetting your database password in Supabase settings
- Update the DATABASE_URL with the new password
