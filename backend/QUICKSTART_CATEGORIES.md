# Quick Start - Category-Based Tracking

## 🚀 5-Minute Setup

### Step 1: Setup Database (2 minutes)

1. Open [Supabase Dashboard](https://app.supabase.com/project/hcbldivhiqpekytahxew/sql/new)

2. Copy and paste [supabase_schema.sql](./supabase_schema.sql) → Click "Run"

3. Copy and paste [seed_data.sql](./seed_data.sql) → Click "Run"

4. Get your **service role key**:
   - Settings → API → Copy `service_role` (secret) key

5. Update `.env`:
   ```bash
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cC...  # Your service role key here
   ```

---

### Step 2: Test API (1 minute)

```bash
# Start server
python -m app.main

# Open browser
http://localhost:8000/docs
```

Try these endpoints:
- `GET /categories` - See your 2 categories
- `GET /categories/crm_software/brands` - See 10 CRM brands
- `GET /categories/crm_software/prompts` - See 15 prompts

---

### Step 3: Test Scraping (2 minutes)

#### Get a Prompt ID

```bash
# Run this in PowerShell
python -c "import asyncio; from app.database import db; asyncio.run((lambda: db.get_prompts('crm_software'))()).then(lambda p: print('Prompt ID:', p[0]['id']))"
```

Or use the API:
```bash
curl http://localhost:8000/categories/crm_software/prompts
```

Copy the first `id` value (e.g., `550e8400-e29b-41d4-a716-446655440000`)

#### Scrape It

In the API docs (http://localhost:8000/docs):

1. Find `POST /scrape/prompt`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "prompt_id": "YOUR_PROMPT_ID_HERE",
     "ai_source": "chatgpt"
   }
   ```
4. Click "Execute"

**What happens:**
- Browser opens (you'll see it)
- First time: You manually login to ChatGPT (90 seconds)
- System scrapes the AI response
- Saves to database + local file
- Returns brand mentions

---

### Step 4: Check Results

```bash
# Get visibility scores
curl http://localhost:8000/visibility/scores?category_id=crm_software
```

Should return something like:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "brand_name": "Salesforce",
      "visibility_score": 6.67,  // 1/15 prompts mentioned it
      "mention_count": 1,
      "total_prompts": 15
    }
  ]
}
```

---

### Step 5: Run Background Worker (Optional)

```bash
# Test mode: scrape 3 prompts then stop
python worker.py --ai-source chatgpt --max-iterations 1

# Production mode: run forever
python worker.py --ai-source chatgpt
```

**Worker will:**
1. Initialize ChatGPT scraper
2. Find prompts not scraped in last 2 hours
3. Scrape each prompt
4. Wait 30 seconds between prompts
5. Wait 2 minutes, then repeat

---

## ✅ Verification Checklist

After Step 2:
- [ ] `/categories` returns 2 categories
- [ ] `/categories/crm_software/brands` returns 10 brands
- [ ] `/categories/crm_software/prompts` returns 15 prompts

After Step 3:
- [ ] Browser opened and you logged in (first time only)
- [ ] Response returned with `brands_mentioned` array
- [ ] File created in `storage/responses/2026-01-28/chatgpt/`

After Step 4:
- [ ] Visibility scores show at least 1 brand with score > 0
- [ ] `mention_count` matches your scrape results

After Step 5:
- [ ] Worker processes prompts every 2 minutes
- [ ] Multiple responses accumulate in database
- [ ] Visibility scores increase over time

---

## 🎯 Common Issues

### "Database error creating record"
- **Fix:** Check `.env` has **service role key** (not anon key)
- Get it from: Supabase → Settings → API → `service_role`

### "No pending prompts"
- **Fix:** All prompts already scraped in last 2 hours
- Wait 2 hours OR manually delete responses to re-scrape

### "ChatGPT login required"
- **Fix:** Normal for first run. Browser opens, you login manually, cookies saved
- Next time: Automatic login using saved cookies

### "Proxy connection failed"
- **Fix:** Check Oxylabs credentials in `.env`
- Verify: `USE_PROXY=true` and credentials correct

---

## 📊 Next: Frontend Integration

Your Next.js frontend should call:

```typescript
// 1. Get categories
const categories = await api.get('/categories');

// 2. Get brands for each category
const brands = await api.get(`/categories/${catId}/brands`);

// 3. Get visibility scores (updates in real-time as workers scrape)
const scores = await api.get(`/visibility/scores?category_id=${catId}&ai_source=chatgpt`);
const combinedScores = await api.get(`/visibility/scores?category_id=${catId}`);

// 4. Display:
// - Category selector
// - Brand list with visibility scores
// - ChatGPT score | Gemini score | Combined score
```

---

**Ready to go! 🚀**

Any issues? Check:
- `logs/app.log` - Application logs
- API docs - http://localhost:8000/docs
- Setup guide - [CATEGORY_TRACKING_SETUP.md](./CATEGORY_TRACKING_SETUP.md)
