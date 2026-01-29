# AI Visibility Tracker - Python Backend

Python scraping service using FastAPI and undetected-chromedriver for anti-detection browser automation.

## ✅ Setup Complete

All core files have been implemented:
- ✅ Configuration management (`app/config.py`)
- ✅ Supabase database client (`app/database.py`)
- ✅ **Oxylabs proxy integration** (`app/utils/proxy_manager.py`) 🔒
- ✅ **Local response storage** (`app/utils/response_storage.py`) 💾
- ✅ Base scraper with anti-detection (`app/scrapers/base_scraper.py`)
- ✅ ChatGPT scraper (`app/scrapers/chatgpt_scraper.py`)
- ✅ FastAPI application (`app/main.py`)
- ✅ Pydantic models (`app/models/schemas.py`)

## 🔒 Oxylabs Proxy Integration

**IMPORTANT:** The scraper is configured to use Oxylabs datacenter proxies. All traffic goes through proxies - your IP is never exposed.

**Quick Setup:**
1. Add Oxylabs credentials to `.env`
2. Run `.\test_proxy.ps1` to verify
3. Start scraping safely!

See **[OXYLABS_SETUP.md](OXYLABS_SETUP.md)** for complete guide.

## 🚀 Quick Start

### 1. Setup Supabase Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Open supabase_schema.sql and copy/paste into Supabase SQL Editor
```

This creates:
- `responses` table - stores AI responses and brand mentions
- `scraper_sessions` table - stores authentication cookies
- `brand_mentions` table - aggregated brand statistics

### 2. Configure Environment

Your `.env` file should have:
```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
HEADLESS=false  # Set to false for first run (manual login)
```

### 3. Run the Server

```powershell
# Activate virtual environment (if not already active)
.\venv\Scripts\activate

# Run the server
python -m app.main

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
🚀 Starting AI Visibility Tracker Scraping Service
📍 Environment: development
👁️  Headless mode: False
```

### 4. First Run - Manual Login

When you first run a scrape request:
1. A Chrome browser window will open
2. Navigate to ChatGPT and log in manually
3. The script waits 90 seconds
4. After login, cookies are saved automatically
5. Future runs won't need manual login!

## 📡 API Endpoints

### Health Check
```http
GET http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "scrapers": ["chatgpt"],
  "environment": "development"
}
```

### Scrape ChatGPT
```http
POST http://localhost:8000/scrape
Content-Type: application/json

{
  "prompt": "What's the best CRM software for startups?",
  "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday.com"],
  "ai_source": "chatgpt"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "prompt": "What's the best CRM software for startups?",
    "ai_source": "chatgpt",
    "response": "Here are some excellent CRM options for startups...",
    "brands_mentioned": ["HubSpot", "Pipedrive"]
  }
}
```

### Get Response by ID
```http
GET http://localhost:8000/responses/{response-id}
```

### Reset Scraper
If the scraper gets stuck or you need to re-login:
```http
DELETE http://localhost:8000/scrapers/chatgpt
```

## 🧪 Testing

### Using PowerShell (Invoke-RestMethod)

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get

# Scrape request
$body = @{
    prompt = "What are the best project management tools?"
    brands = @("Asana", "Monday.com", "Trello", "ClickUp", "Notion")
    ai_source = "chatgpt"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/scrape" -Method Post -Body $body -ContentType "application/json"
```

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Scrape request
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the best email marketing tools?",
    "brands": ["Mailchimp", "SendGrid", "ConvertKit"],
    "ai_source": "chatgpt"
  }'
```

## 🎯 How It Works

1. **Request comes in** → Creates database record with status 'processing'
2. **Scraper initialization** → 
   - Launches undetected Chrome browser
   - Loads saved cookies (if available)
   - Checks login status
   - Waits for manual login if needed (first run only)
3. **Query execution** →
   - Enforces rate limiting (3 min between requests by default)
   - Types prompt with human-like delays
   - Waits for response to complete
   - Extracts text using JavaScript
4. **Brand detection** → Scans response for brand mentions (case-insensitive)
5. **Database update** → Saves response and brand mentions
6. **Return results** → Returns to API caller

## 🔒 Anti-Detection Features

- ✅ **undetected-chromedriver** - Bypasses Cloudflare and bot detection
- ✅ **Cookie persistence** - Maintains login sessions
- ✅ **Human-like typing** - Random delays between keystrokes (50-150ms)
- ✅ **Random delays** - Random waits between actions (1-3s)
- ✅ **Rate limiting** - 3 minutes between requests (configurable)
- ✅ **Realistic user agent** - Mimics real browser
- ✅ **Session reuse** - Keeps browser open between requests

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings from .env
│   ├── database.py          # Supabase client
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── base_scraper.py  # Base class
│   │   └── chatgpt_scraper.py
│   └── utils/
│       ├── __init__.py
│       └── brand_detector.py
├── storage/                 # Cookie storage
├── logs/                    # Application logs
├── .env                     # Environment variables
├── requirements.txt
└── supabase_schema.sql      # Database schema
```

## ⚙️ Configuration

Edit `.env` to customize:

```properties
# Change to true after first successful login
HEADLESS=false

# Adjust delays (in seconds)
RANDOM_DELAY_MIN=1
RANDOM_DELAY_MAX=3
RATE_LIMIT_DELAY=180  # 3 minutes

# Add proxy if needed
# PROXY_URL=http://username:password@proxy.com:8080
```

## 🐛 Troubleshooting

### "Scraper not initialized" error
- Restart the server
- Delete cached scraper: `DELETE /scrapers/chatgpt`

### "Could not extract response text"
- Check if ChatGPT UI changed
- Look at browser window (if not headless)
- Check logs in `logs/app.log`

### Chrome/ChromeDriver version mismatch
The scraper auto-detects Chrome version. If issues occur:
```python
# In chatgpt_scraper.py, line with uc.Chrome()
self.driver = uc.Chrome(options=options, version_main=120)  # Specify version
```

### Still getting detected
1. Use residential proxy (set PROXY_URL in .env)
2. Increase delays in .env
3. Run in non-headless mode
4. Check if cookies are loading correctly

## 📊 Viewing Logs

```powershell
# Real-time logs
Get-Content -Path ".\logs\app.log" -Wait -Tail 50

# Or just open the file
notepad .\logs\app.log
```

## 🔜 Next Steps

- [ ] Add Gemini scraper (similar to ChatGPT)
- [ ] Add Perplexity scraper
- [ ] Implement background jobs with Celery
- [ ] Add retry logic for failed requests
- [ ] Add more brand detection patterns
- [ ] Implement proxy rotation
- [ ] Add captcha solving
- [ ] Build monitoring dashboard

## 📚 API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🎉 Success!

Your Python backend is ready! Start the server and make your first scrape request.
