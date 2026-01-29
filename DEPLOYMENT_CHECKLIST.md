# Deployment Checklist

Use this checklist to ensure everything is set up correctly.

## ✅ Database Setup

- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `backend/COMPLETE_SCHEMA_UPDATES.sql`
- [ ] Run the SQL script
- [ ] Verify no errors in output
- [ ] Run test query: `SELECT * FROM category_summary LIMIT 1;`
- [ ] Verify view returns data (or empty array if no data yet)

## ✅ Backend Setup

- [ ] Navigate to backend directory: `cd backend`
- [ ] Activate virtual environment (if using): `source venv/bin/activate` or `venv\Scripts\activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify environment variables in `.env`:
  - [ ] `SUPABASE_URL` is set
  - [ ] `SUPABASE_KEY` is set
- [ ] Start server: `python -m uvicorn app.main:app --reload`
- [ ] Verify server starts without errors
- [ ] Check health endpoint: `curl http://localhost:8000/health`
- [ ] Expected response: `{"status":"healthy",...}`

## ✅ Backend API Testing

Test each endpoint with curl or browser:

- [ ] `GET http://localhost:8000/categories`
  - [ ] Returns `{"success": true, "data": [...]}`
  - [ ] `data` is an array
  - [ ] Each category has `id`, `name`, `brand_count`, `top_brands`

- [ ] `GET http://localhost:8000/categories/{category-id}`
  - [ ] Returns single category with summary
  - [ ] Replace `{category-id}` with actual ID from database

- [ ] `GET http://localhost:8000/categories/{category-id}/leaderboard`
  - [ ] Returns array of brands sorted by score
  - [ ] Each brand has `id`, `name`, `overall_visibility_score`

- [ ] `GET http://localhost:8000/brands/{brand-id}`
  - [ ] Returns brand details
  - [ ] Replace `{brand-id}` with actual UUID from database
  - [ ] Has `overall_visibility_score`, `total_mentions`, etc.

- [ ] `GET http://localhost:8000/brands/{brand-id}/timeseries`
  - [ ] Returns array of daily scores
  - [ ] Each item has `date`, `ai_source`, `daily_visibility_score`

- [ ] `GET http://localhost:8000/brands/{brand-id}/platforms`
  - [ ] Returns array of platform scores
  - [ ] Has entries for different `ai_source` values

## ✅ Frontend Setup

- [ ] Navigate to frontend directory: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Verify `.env.local` has:
  - [ ] `NEXT_PUBLIC_API_URL=http://localhost:8000`
  - [ ] All other required env vars (Supabase, Better Auth)
- [ ] Start dev server: `npm run dev`
- [ ] Verify server starts without errors
- [ ] Open browser to `http://localhost:3000`

## ✅ Frontend Testing

### Home Page (`/`)

- [ ] Page loads without errors
- [ ] Check browser console - no errors
- [ ] Check Network tab - `GET /categories` request succeeds
- [ ] Categories display with:
  - [ ] Category name
  - [ ] Brand count
  - [ ] Top 5 brand logos (or placeholders)
- [ ] Search functionality works
- [ ] Sort dropdown works
- [ ] Grid/List view toggle works
- [ ] Click on category navigates to category page

### Category Page (`/category/{id}`)

- [ ] Page loads without errors
- [ ] Check browser console - no errors
- [ ] Check Network tab - multiple requests succeed:
  - [ ] `GET /categories/{id}/leaderboard`
  - [ ] `GET /brands/{id}`
  - [ ] `GET /brands/{id}/timeseries`
  - [ ] `GET /brands/{id}/platforms`
- [ ] Leaderboard displays with:
  - [ ] Brand names
  - [ ] Visibility scores
  - [ ] Logos (or placeholders)
- [ ] Brand card displays with:
  - [ ] Brand name and logo
  - [ ] Visibility score
  - [ ] Rank
  - [ ] Total mentions
- [ ] Visibility chart displays:
  - [ ] Time-series data
  - [ ] Proper date formatting
  - [ ] Scores plotted correctly
- [ ] Platform breakdown displays:
  - [ ] ChatGPT score
  - [ ] Gemini score
  - [ ] Perplexity score (if data exists)
- [ ] Competitor toggle works:
  - [ ] Can switch between brands
  - [ ] Data updates when switching
- [ ] Back button works

## ✅ Type Safety Verification

- [ ] Run TypeScript build: `npm run build` (in frontend directory)
- [ ] No TypeScript errors
- [ ] No type mismatches
- [ ] All interfaces match API responses

## ✅ Error Handling

### Test Backend Errors

- [ ] Request non-existent category: `GET /categories/fake-id`
  - [ ] Returns 404 error
  - [ ] Frontend displays error message

- [ ] Request non-existent brand: `GET /brands/00000000-0000-0000-0000-000000000000`
  - [ ] Returns 404 error
  - [ ] Frontend displays error message

### Test Frontend Errors

- [ ] Stop backend server
- [ ] Refresh frontend
- [ ] Error message displays: "Failed to load categories"
- [ ] No console errors (errors caught gracefully)

## ✅ Data Validation

### Check Database Data

- [ ] At least one category exists
- [ ] At least one brand exists per category
- [ ] At least one prompt exists per category
- [ ] At least one response exists (status='completed')
- [ ] Responses have `brands_mentioned` array populated

### Check Data Flow

- [ ] Database view returns correct types:
  - [ ] UUIDs are strings (not objects)
  - [ ] Counts are numbers
  - [ ] Scores are numbers with 2 decimals
  - [ ] Arrays are never null

- [ ] Backend returns correct types:
  - [ ] Response has `success` and `data` fields
  - [ ] Data matches expected structure

- [ ] Frontend receives correct types:
  - [ ] TypeScript interfaces match
  - [ ] No type coercion needed
  - [ ] Null values handled

## ✅ Performance Check

- [ ] Home page loads in < 2 seconds
- [ ] Category page loads in < 3 seconds
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] API responses are < 500ms (check Network tab)
- [ ] Database queries are efficient (check Supabase logs)

## ✅ Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

Check for:
- [ ] No console errors
- [ ] UI renders correctly
- [ ] All functionality works

## ✅ Mobile Responsiveness

- [ ] Open DevTools responsive mode
- [ ] Test at different screen sizes:
  - [ ] Mobile (375px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1920px)
- [ ] UI adapts correctly
- [ ] No horizontal scroll
- [ ] Touch interactions work

## ✅ Documentation Review

- [ ] Read `QUICK_REFERENCE.md` - understand common patterns
- [ ] Read `TESTING_GUIDE.md` - know how to test
- [ ] Read `DATA_FLOW_DOCUMENTATION.md` - understand type flow
- [ ] Bookmark `API_DOCUMENTATION.md` - for API reference

## ✅ Code Quality

- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] Consistent code formatting
- [ ] Meaningful variable names
- [ ] Error messages are user-friendly

## ✅ Security

- [ ] API keys not exposed in frontend code
- [ ] Environment variables properly configured
- [ ] CORS configured correctly
- [ ] No sensitive data in logs
- [ ] SQL injection prevented (using parameterized queries)

## ✅ Final Checks

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No network errors
- [ ] Data displays correctly
- [ ] Navigation works
- [ ] Error handling works
- [ ] Loading states work

## 🎉 Ready for Development!

Once all items are checked, you're ready to:
- Add more features
- Add real data
- Implement remaining TODOs
- Deploy to production

## 📝 Notes

Use this space to track any issues or observations:

```
Issue: 
Solution: 

Issue: 
Solution: 

Issue: 
Solution: 
```

## 🆘 Troubleshooting

If something doesn't work:

1. **Check the logs**
   - Backend: Terminal where uvicorn is running
   - Frontend: Browser console
   - Database: Supabase logs

2. **Verify environment**
   - Backend `.env` file
   - Frontend `.env.local` file
   - Database connection

3. **Check documentation**
   - `TESTING_GUIDE.md` for testing steps
   - `QUICK_REFERENCE.md` for common patterns
   - `DATA_FLOW_DOCUMENTATION.md` for type issues

4. **Common fixes**
   - Restart backend server
   - Clear browser cache
   - Rebuild frontend: `npm run build`
   - Check database views exist
   - Verify data exists in database

## ✅ Deployment Complete

Date: _______________
Deployed by: _______________
Notes: _______________
