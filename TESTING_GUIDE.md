# Testing Guide - Type Verification

This guide helps you verify that data flows correctly from database → backend → frontend.

## Step 1: Apply Database Schema

1. Open Supabase SQL Editor
2. Run `backend/COMPLETE_SCHEMA_UPDATES.sql`
3. Verify no errors

## Step 2: Add Sample Data (if needed)

```sql
-- Insert a test category
INSERT INTO categories (id, name, description) 
VALUES ('test-category', 'Test Category', 'A test category for verification')
ON CONFLICT (id) DO NOTHING;

-- Insert test brands
INSERT INTO brands (name, category_id, logo_url, website) 
VALUES 
  ('Test Brand A', 'test-category', 'https://via.placeholder.com/150', 'https://example.com'),
  ('Test Brand B', 'test-category', 'https://via.placeholder.com/150', 'https://example.com'),
  ('Test Brand C', 'test-category', NULL, NULL)
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert test prompts
INSERT INTO prompts (text, category_id) 
VALUES 
  ('What is the best test product?', 'test-category'),
  ('Compare test products', 'test-category')
ON CONFLICT (text, category_id) DO NOTHING;

-- Insert test responses (get prompt IDs first)
-- Replace 'prompt-uuid-1' with actual UUID from prompts table
INSERT INTO responses (prompt_id, prompt_text, response_text, ai_source, brands_mentioned, status)
VALUES 
  ('prompt-uuid-1', 'What is the best test product?', 'Test Brand A is great. Test Brand B is also good.', 'chatgpt', ARRAY['Test Brand A', 'Test Brand B'], 'completed'),
  ('prompt-uuid-1', 'What is the best test product?', 'Test Brand A is excellent.', 'gemini', ARRAY['Test Brand A'], 'completed');
```

## Step 3: Test Database Views

### Test category_summary
```sql
SELECT * FROM category_summary WHERE id = 'test-category';
```

**Expected Output:**
```
id              | test-category
name            | Test Category
description     | A test category for verification
brand_count     | 3
prompt_count    | 2
response_count  | 2
top_brands      | [{"id":"uuid","name":"Test Brand A","logo_url":"...","visibility_score":100.00}, ...]
created_at      | 2024-01-29T...
```

**Type Check:**
- ✅ `id` is string (VARCHAR)
- ✅ `brand_count` is number (BIGINT)
- ✅ `top_brands` is array of objects (JSONB)
- ✅ Each brand in `top_brands` has `id` as string (UUID::text)

### Test brand_leaderboard
```sql
SELECT * FROM brand_leaderboard WHERE category_id = 'test-category' ORDER BY overall_visibility_score DESC;
```

**Expected Output:**
```
id                                   | name          | logo_url              | category_id    | overall_visibility_score | total_mentions
uuid-string                          | Test Brand A  | https://...           | test-category  | 100.00                   | 2
uuid-string                          | Test Brand B  | https://...           | test-category  | 50.00                    | 1
uuid-string                          | Test Brand C  | NULL                  | test-category  | 0.00                     | 0
```

**Type Check:**
- ✅ `id` is string (UUID::text)
- ✅ `logo_url` can be NULL
- ✅ `overall_visibility_score` is NUMERIC (2 decimal places)
- ✅ `total_mentions` is BIGINT

### Test brand_details
```sql
SELECT * FROM brand_details WHERE name = 'Test Brand A';
```

**Expected Output:**
```
id                  | uuid-string
name                | Test Brand A
category_id         | test-category
logo_url            | https://...
website             | https://example.com
category_name       | Test Category
overall_visibility_score | 100.00
total_mentions      | 2
total_responses     | 2
mention_rate        | 100.00
```

**Type Check:**
- ✅ All UUIDs are strings
- ✅ Nullable fields (logo_url, website) can be NULL
- ✅ Scores are NUMERIC with 2 decimals

### Test brand_visibility_timeseries
```sql
SELECT * FROM brand_visibility_timeseries 
WHERE brand_name = 'Test Brand A' 
ORDER BY date DESC 
LIMIT 5;
```

**Expected Output:**
```
brand_id            | uuid-string
brand_name          | Test Brand A
category_id         | test-category
date                | 2024-01-29
ai_source           | chatgpt
mention_count       | 1
total_responses     | 1
daily_visibility_score | 100.00
```

**Type Check:**
- ✅ `date` is DATE (YYYY-MM-DD format)
- ✅ `ai_source` is string (chatgpt/gemini/perplexity)
- ✅ Counts are BIGINT

### Test brand_platform_scores
```sql
SELECT * FROM brand_platform_scores WHERE brand_name = 'Test Brand A';
```

**Expected Output:**
```
brand_id            | uuid-string
brand_name          | Test Brand A
category_id         | test-category
ai_source           | chatgpt
mention_count       | 1
total_responses     | 1
platform_visibility_score | 100.00
---
brand_id            | uuid-string
brand_name          | Test Brand A
category_id         | test-category
ai_source           | gemini
mention_count       | 1
total_responses     | 1
platform_visibility_score | 100.00
```

**Type Check:**
- ✅ One row per AI platform
- ✅ All types match expectations

## Step 4: Test Backend API

### Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Test Endpoints with curl

#### GET /categories
```bash
curl http://localhost:8000/categories
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "test-category",
      "name": "Test Category",
      "description": "A test category for verification",
      "brand_count": 3,
      "prompt_count": 2,
      "response_count": 2,
      "top_brands": [
        {
          "id": "uuid-string",
          "name": "Test Brand A",
          "logo_url": "https://...",
          "visibility_score": 100.0
        }
      ],
      "created_at": "2024-01-29T..."
    }
  ]
}
```

**Type Verification:**
- ✅ Response has `success` and `data` fields
- ✅ `data` is array
- ✅ `top_brands` is array of objects
- ✅ All IDs are strings

#### GET /categories/{id}/leaderboard
```bash
curl http://localhost:8000/categories/test-category/leaderboard
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "Test Brand A",
      "logo_url": "https://...",
      "overall_visibility_score": 100.0,
      "total_mentions": 2
    }
  ]
}
```

#### GET /brands/{id}
```bash
# Replace with actual brand UUID
curl http://localhost:8000/brands/your-brand-uuid
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "Test Brand A",
    "category_id": "test-category",
    "category_name": "Test Category",
    "logo_url": "https://...",
    "website": "https://example.com",
    "overall_visibility_score": 100.0,
    "total_mentions": 2,
    "total_responses": 2,
    "mention_rate": 100.0
  }
}
```

#### GET /brands/{id}/timeseries
```bash
curl http://localhost:8000/brands/your-brand-uuid/timeseries?days=30
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid-string",
      "brand_name": "Test Brand A",
      "category_id": "test-category",
      "date": "2024-01-29",
      "ai_source": "chatgpt",
      "mention_count": 1,
      "total_responses": 1,
      "daily_visibility_score": 100.0
    }
  ]
}
```

#### GET /brands/{id}/platforms
```bash
curl http://localhost:8000/brands/your-brand-uuid/platforms
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid-string",
      "brand_name": "Test Brand A",
      "category_id": "test-category",
      "ai_source": "chatgpt",
      "mention_count": 1,
      "total_responses": 1,
      "platform_visibility_score": 100.0
    },
    {
      "brand_id": "uuid-string",
      "brand_name": "Test Brand A",
      "category_id": "test-category",
      "ai_source": "gemini",
      "mention_count": 1,
      "total_responses": 1,
      "platform_visibility_score": 100.0
    }
  ]
}
```

## Step 5: Test Frontend

### Start Frontend
```bash
cd frontend
npm run dev
```

### Open Browser DevTools

1. Navigate to `http://localhost:3000`
2. Open DevTools → Network tab
3. Filter by "Fetch/XHR"

### Verify Home Page

**Check Network Request:**
- Request: `GET http://localhost:8000/categories`
- Status: 200
- Response matches backend format

**Check Console:**
```javascript
// Should see no TypeScript errors
// Categories should render with:
// - Category name
// - Brand count
// - Top 5 brand logos
```

### Verify Category Page

1. Click on a category
2. Check Network Requests:
   - `GET /categories/{id}/leaderboard`
   - `GET /brands/{id}` (for selected brand)
   - `GET /brands/{id}/timeseries`
   - `GET /brands/{id}/platforms`

**Check Console:**
```javascript
// Should see no TypeScript errors
// Page should render:
// - Leaderboard with brand names and scores
// - Brand details card
// - Visibility chart with time-series data
// - Platform breakdown (ChatGPT, Gemini, Perplexity)
```

## Step 6: Type Safety Verification

### Check TypeScript Compilation
```bash
cd frontend
npm run build
```

**Expected:** No type errors

### Common Type Issues to Watch For

❌ **Wrong:**
```typescript
// Treating number as string
const id: string = category.brand_count; // ERROR

// Not handling null
const logo = brand.logo_url.toLowerCase(); // ERROR if null
```

✅ **Correct:**
```typescript
// Proper type usage
const count: number = category.brand_count;

// Null handling
const logo = brand.logo_url || 'fallback-url';
const logoLower = brand.logo_url?.toLowerCase() ?? 'default';
```

## Troubleshooting

### Issue: "top_brands is null"
**Cause:** View returns NULL instead of empty array
**Fix:** Use `COALESCE(..., '[]'::jsonb)` in view

### Issue: "UUID type mismatch"
**Cause:** UUID not converted to string
**Fix:** Use `id::text` in all views

### Issue: "Cannot read property of null"
**Cause:** Not handling nullable fields
**Fix:** Use optional chaining `?.` or nullish coalescing `??`

### Issue: "Number precision loss"
**Cause:** BIGINT too large for JavaScript number
**Fix:** For counts < 2^53, JavaScript number is safe

## Success Criteria

✅ All database views return expected data types
✅ Backend API responses match TypeScript interfaces
✅ Frontend renders without console errors
✅ No TypeScript compilation errors
✅ Null values handled gracefully
✅ UUIDs are strings throughout the stack
✅ Numbers maintain precision
✅ Dates formatted consistently
