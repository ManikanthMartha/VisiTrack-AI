# Category-Based Tracking Setup Guide

## 🎯 Overview

The backend now supports **category-based brand tracking** with automated workers for continuous scraping.

### Key Features
- ✅ 2 Categories (CRM Software, Project Management)
- ✅ 20 Brands (10 per category)
- ✅ 30 Prompts (15 per category)
- ✅ Independent workers for ChatGPT and Gemini
- ✅ Real-time visibility score calculation
- ✅ Re-scraping every 2 hours

---

## 📋 Setup Steps

### 1. Run Database Schema

Go to your Supabase dashboard and execute these SQL files in order:

1. **Main Schema** - [supabase_schema.sql](./supabase_schema.sql)
   - Creates: categories, brands, prompts, responses tables
   - Creates: visibility score views
   - Sets up: RLS policies and indexes

2. **Seed Data** - [seed_data.sql](./seed_data.sql)
   - Inserts: 2 categories
   - Inserts: 20 brands
   - Inserts: 30 prompts

**Important:** Use your **service role key** in `.env` to bypass RLS:

```bash
SUPABASE_KEY=your-service-role-key-here
```

Get it from: Supabase Dashboard → Settings → API → `service_role` key

---

### 2. Update Environment Variables

Make sure your [.env](./. env) has:

```bash
# Supabase (use service role key!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Oxylabs Proxy
USE_PROXY=true
OXYLABS_USERNAME=lelouch
OXYLABS_PASSWORD=Marthamani=1
OXYLABS_PROXY_HOST=dc.oxylabs.io
OXYLABS_PROXY_PORTS=8001,8002,8003,8004,8005

# Rate Limiting
RATE_LIMIT_DELAY=180  # 3 minutes between requests per scraper
```

---

## 🚀 Running the System

### Option 1: Manual API Testing

Start the API server:
```bash
python -m app.main
```

Test endpoints at http://localhost:8000/docs

### Option 2: Background Workers (Recommended)

Run continuous scraping workers:

**ChatGPT only:**
```bash
python worker.py --ai-source chatgpt
```

**Gemini only:**
```bash
python worker.py --ai-source gemini
```

**Both platforms:**
```bash
python worker.py --ai-source both
```

**Specific category:**
```bash
python worker.py --ai-source chatgpt --category crm_software
```

**Limited iterations (for testing):**
```bash
python worker.py --ai-source chatgpt --max-iterations 3
```

---

## 📊 API Endpoints

### Category Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/categories` | GET | List all categories |
| `/categories/{id}` | GET | Get single category |
| `/categories/{id}/brands` | GET | Get brands in category |
| `/categories/{id}/prompts` | GET | Get prompts in category |
| `/categories/{id}/analytics` | GET | Get category analytics |

### Scraping

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/scrape/prompt` | POST | Scrape a specific prompt by ID |
| `/scrape` | POST | Legacy endpoint (no DB tracking) |

**Scrape Prompt Example:**
```json
POST /scrape/prompt
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "ai_source": "chatgpt"
}
```

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/visibility/scores` | GET | Get brand visibility scores |
| `/visibility/scores?category_id=crm_software` | GET | Filter by category |
| `/visibility/scores?ai_source=chatgpt` | GET | Filter by AI source |
| `/visibility/scores` (no ai_source) | GET | Combined scores |

---

## 🧮 Visibility Score Calculation

### Formula
```
Visibility Score = (Brand Mentions / Total Prompts in Category) × 100
```

### Example
- Category: CRM Software
- Total Prompts: 15
- Brand: Salesforce
- ChatGPT mentions: 8/15 prompts
- **ChatGPT Score: 53.33%**

### Per-Platform vs Combined

**Per-Platform:**
```sql
SELECT * FROM brand_visibility_stats 
WHERE category_id = 'crm_software' 
  AND ai_source = 'chatgpt';
```

**Combined (all AI sources):**
```sql
SELECT * FROM brand_visibility_combined
WHERE category_id = 'crm_software';
```

---

## 🔄 How Workers Work

### Worker Flow

1. **Initialize** - Launch browser, login (first time only)
2. **Get Queue** - Fetch prompts not scraped in last 2 hours
3. **Process** - Scrape each prompt (30s delay between)
4. **Save** - Store to database + local file
5. **Wait** - 2 minutes before next iteration
6. **Repeat** - Continuous loop

### Multiple Workers

Run 2 terminal windows:

**Terminal 1 (ChatGPT):**
```bash
python worker.py --ai-source chatgpt
```

**Terminal 2 (Gemini):**
```bash
python worker.py --ai-source gemini
```

They run **completely independently** and write to the same database.

---

## 📈 Frontend Integration

### Get All Categories with Brands
```typescript
const response = await fetch('http://localhost:8000/categories');
const { data: categories } = await response.json();

// Each category has:
{
  id: "crm_software",
  name: "CRM Software",
  description: "...",
  created_at: "2026-01-28T..."
}
```

### Get Brands for Category
```typescript
const response = await fetch('http://localhost:8000/categories/crm_software/brands');
const { data: brands } = await response.json();

// Returns array of brands with IDs
```

### Get Visibility Scores
```typescript
// Per-platform scores
const chatgptScores = await fetch('http://localhost:8000/visibility/scores?category_id=crm_software&ai_source=chatgpt');

// Combined scores
const combinedScores = await fetch('http://localhost:8000/visibility/scores?category_id=crm_software');

// Example response:
{
  success: true,
  count: 10,
  data: [
    {
      brand_id: "uuid",
      brand_name: "Salesforce",
      category_id: "crm_software",
      category_name: "CRM Software",
      ai_source: "chatgpt",  // or null for combined
      mention_count: 8,
      total_prompts: 15,
      visibility_score: 53.33
    },
    ...
  ]
}
```

### Get Category Analytics
```typescript
const response = await fetch('http://localhost:8000/categories/crm_software/analytics');
const { data } = await response.json();

// Returns:
{
  category_id: "crm_software",
  category_name: "CRM Software",
  total_brands: 10,
  total_prompts: 15,
  total_responses: 28,
  chatgpt_responses: 14,
  gemini_responses: 14,
  completion_rate: 93.33,  // (28 / 30) * 100
  top_brands: [...]  // Top 10 by visibility score
}
```

---

## 🎯 Production Deployment

### Run Workers as Services

**Using PM2:**
```bash
# Install PM2
npm install -g pm2

# Start ChatGPT worker
pm2 start worker.py --name chatgpt-worker --interpreter python3 -- --ai-source chatgpt

# Start Gemini worker
pm2 start worker.py --name gemini-worker --interpreter python3 -- --ai-source gemini

# Save configuration
pm2 save
pm2 startup
```

**View Logs:**
```bash
pm2 logs chatgpt-worker
pm2 logs gemini-worker
```

---

## 🐛 Troubleshooting

### No Prompts Being Scraped

Check if prompts exist:
```bash
python -c "
import asyncio
from app.database import db

async def check():
    prompts = await db.get_prompts('crm_software')
    print(f'Found {len(prompts)} prompts')

asyncio.run(check())
"
```

### Worker Stuck

Check last scrape time in logs. If rate-limited, it will wait 180 seconds.

### Database Connection Error

Verify service role key is correct:
```bash
python -c "
from app.database import db
print('✅ Database connected!')
"
```

### Visibility Scores Not Updating

Scores are calculated from the `responses` table. Check:
1. Are responses being created? (`SELECT COUNT(*) FROM responses`)
2. Are brands being detected? (`SELECT brands_mentioned FROM responses LIMIT 5`)
3. Are responses marked as completed? (`SELECT status, COUNT(*) FROM responses GROUP BY status`)

---

## ✅ Next Steps

1. ✅ Run `supabase_schema.sql` in Supabase SQL Editor
2. ✅ Run `seed_data.sql` to insert categories/brands/prompts
3. ✅ Update `.env` with service role key
4. ✅ Test API: `python -m app.main` → http://localhost:8000/docs
5. ✅ Start worker: `python worker.py --ai-source chatgpt --max-iterations 1`
6. ✅ Check visibility scores: `GET /visibility/scores?category_id=crm_software`
7. ✅ Integrate with Next.js frontend

---

**Questions?** Check the logs in `logs/app.log` or review the API docs at `/docs`
