# 🚀 Quick Start Guide

## ✅ Implementation Complete!

All files have been created and the system is ready to run.

## 📋 Next Steps

### 1. **Setup Supabase Database Tables**

Open [supabase_schema.sql](supabase_schema.sql) and:
1. Go to your Supabase project: https://hcbldivhiqpekytahxew.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `supabase_schema.sql`
4. Click "Run" to create all tables

This creates:
- ✅ `responses` table
- ✅ `scraper_sessions` table  
- ✅ `brand_mentions` table

### 2. **Start the Server**

```powershell
# Make sure you're in the backend directory
cd e:\compound\backend

# Run the FastAPI server
python -m app.main
```

You should see:
```
🚀 Starting AI Visibility Tracker Scraping Service
================================================================================
📍 Environment: development
👁️  Headless mode: False
...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. **First Test - Manual Login**

Open a new PowerShell terminal and run:

```powershell
.\test_api.ps1
```

**What will happen:**
1. ✅ Health check runs
2. 🌐 Chrome browser opens automatically
3. 🔐 You'll need to **log in to ChatGPT manually** (only first time!)
4. ⏱️ Script waits 90 seconds for you to log in
5. 💾 Cookies saved automatically
6. 🤖 Query is sent to ChatGPT
7. 📊 Results are displayed

**Important:** Don't close the browser during the 90-second wait!

### 4. **Alternative - Manual Testing**

#### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
```

#### Send a Query
```powershell
$body = @{
    prompt = "What are the best CRM tools for startups?"
    brands = @("Salesforce", "HubSpot", "Pipedrive", "Zoho")
    ai_source = "chatgpt"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/scrape" -Method Post -Body $body -ContentType "application/json"
```

## 🎯 Expected Behavior

### First Run (No Cookies)
1. Browser opens
2. Navigates to chat.openai.com
3. **MANUAL LOGIN REQUIRED**: Log in to ChatGPT
4. Wait for 90 seconds
5. Cookies saved automatically
6. Query runs
7. Response extracted

### Subsequent Runs (Has Cookies)
1. Browser opens
2. Loads saved cookies
3. Already logged in! ✅
4. Query runs immediately
5. Response extracted

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/scrape` | POST | Main scraping endpoint |
| `/responses/{id}` | GET | Get saved response |
| `/scrapers/{source}` | DELETE | Reset scraper |
| `/docs` | GET | Interactive API docs |

## 🔍 Monitoring

### View Real-time Logs
```powershell
Get-Content -Path ".\logs\app.log" -Wait -Tail 50
```

### Check Saved Cookies
```powershell
Get-Content ".\storage\chatgpt_cookies.json"
```

## ⚙️ Configuration

Edit `.env` to customize:

```properties
# Set to true after successful login (runs browser hidden)
HEADLESS=false

# Reduce delays for faster testing (increase to avoid detection)
RATE_LIMIT_DELAY=180  # seconds between requests
RANDOM_DELAY_MIN=1
RANDOM_DELAY_MAX=3
```

## 🐛 Troubleshooting

### Browser doesn't open
- Check if Chrome is installed
- Try: `pip install undetected-chromedriver --upgrade`

### "Not logged in" error
1. Delete cookies: `Remove-Item .\storage\chatgpt_cookies.json`
2. Restart server
3. Log in again manually

### Rate limiting error
- Wait 3 minutes between requests (default)
- Or reduce `RATE_LIMIT_DELAY` in `.env`

### ChromeDriver version mismatch
The scraper auto-detects Chrome version. If it fails:
- Manually update Chrome to latest version
- Or specify version in code (see README.md)

## 📚 Documentation

- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **ReDoc**: http://localhost:8000/redoc (Alternative docs)
- **Full README**: [README.md](README.md)

## 🎉 Success Indicators

✅ Server starts without errors
✅ Health endpoint returns "healthy"
✅ Browser opens automatically
✅ Can log in to ChatGPT
✅ Cookies saved in `storage/`
✅ Query completes successfully
✅ Brands detected in response
✅ Data saved to Supabase

## 🔜 After First Successful Run

1. Set `HEADLESS=true` in `.env` for production use
2. Test multiple queries
3. Check Supabase dashboard for saved responses
4. Integrate with Next.js frontend

## 💡 Tips

- **First run**: Keep browser visible (`HEADLESS=false`)
- **Debugging**: Check `logs/app.log` for detailed info
- **Performance**: Scraper is cached between requests (no need to restart)
- **Reset**: Use DELETE `/scrapers/chatgpt` to force re-initialization

## 🏁 You're Ready!

Run `python -m app.main` and start scraping! 🚀
