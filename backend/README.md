# Backend Setup Guide

Python FastAPI backend for AI Visibility Tracker with browser automation and LLM extraction.

## Prerequisites

- Python 3.9 or higher
- Google Chrome browser
- PostgreSQL database (Supabase account)
- Google AI Studio API key

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Key packages**:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `selenium` - Browser automation
- `undetected-chromedriver` - Anti-detection
- `google-genai` - LLM extraction
- `supabase` - Database client
- `loguru` - Logging

### 3. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# LLM Extraction (Required)
GOOGLE_API_KEY=your-google-ai-studio-key
LLM_MODEL=gemini-2.5-flash

# Proxy (Optional - for production)
USE_PROXY=false
OXYLABS_USERNAME=your-username
OXYLABS_PASSWORD=your-password

# Scraper Settings
HEADLESS=true
RATE_LIMIT_DELAY=30
RANDOM_DELAY_MIN=1
RANDOM_DELAY_MAX=3
USE_STEALTH=true

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
```

### 4. Database Setup

**Create Supabase Project**:
1. Go to https://supabase.com
2. Create new project
3. Copy URL and anon key to `.env`

**Run SQL Migrations**:

Open Supabase SQL Editor and run:

1. **Main Schema** (`supabase_schema.sql`):
   - Creates categories, brands, prompts, responses tables
   - Sets up relationships and constraints

2. **LLM Schema** (`llm_extraction_schema.sql`):
   - Creates citations and brand_mentions tables
   - Creates analytics views

3. **Seed Data** (`seed_data.sql`):
   - Adds sample categories (CRM, Project Management)
   - Adds sample brands (Salesforce, HubSpot, etc.)
   - Adds sample prompts

### 5. Get Google AI Studio API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key to `.env` as `GOOGLE_API_KEY`

**Free Tier Limits**:
- 15 requests per minute
- 1,500 requests per day
- Sufficient for testing and small-scale usage

### 6. Setup Browser Sessions (One-time)

**ChatGPT**:
```bash
python setup_chatgpt_login.py
```
- Browser opens to ChatGPT
- Log in manually
- Wait 90 seconds
- Cookies saved automatically

**Gemini**:
```bash
python setup_gemini_login.py
```

**Perplexity**:
```bash
python setup_perplexity_login.py
```

Cookies are saved in `storage/` and reused for future scrapes.

## Running the Application

### Start API Server

```bash
python -m app.main
```

Server runs on http://localhost:8000

**API Documentation**: http://localhost:8000/docs

### Start Worker (Scraper)

```bash
python worker.py --ai-source chatgpt --max-iterations 5
```

**Options**:
- `--ai-source`: `chatgpt`, `gemini`, or `perplexity`
- `--max-iterations`: Number of prompts to process (default: infinite)
- `--category`: Filter by category ID (optional)

**Example**:
```bash
# Process 10 ChatGPT prompts
python worker.py --ai-source chatgpt --max-iterations 10

# Process all Gemini prompts in CRM category
python worker.py --ai-source gemini --category crm_software

# Run continuously
python worker.py --ai-source perplexity
```

## Project Structure

```
backend/
├── app/
│   ├── scrapers/
│   │   ├── base_scraper.py       # Base class with anti-detection
│   │   ├── chatgpt_scraper.py    # ChatGPT implementation
│   │   ├── gemini_scraper.py     # Gemini implementation
│   │   └── perplexity_scraper.py # Perplexity implementation
│   ├── utils/
│   │   ├── llm_extractor.py      # Gemini API extraction
│   │   ├── proxy_manager.py      # Proxy configuration
│   │   └── response_storage.py   # File storage
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   ├── config.py                 # Settings management
│   ├── database.py               # Database operations
│   └── main.py                   # FastAPI application
├── storage/
│   ├── chatgpt_cookies.json      # Saved sessions
│   ├── responses/                # Raw responses
│   └── debug/                    # Screenshots (headless)
├── logs/
│   └── app.log                   # Application logs
├── worker.py                     # Background scraper
├── requirements.txt              # Python dependencies
└── .env                          # Configuration
```

## API Endpoints

### Categories
```
GET  /categories                    # List all categories
GET  /categories/{id}               # Get category details
GET  /categories/{id}/leaderboard   # Brand rankings
GET  /categories/{id}/brands        # All brands in category
GET  /categories/{id}/prompts       # All prompts in category
```

### Brands
```
GET  /brands/{id}                   # Brand details
GET  /brands/{id}/timeseries        # Historical visibility
GET  /brands/{id}/platforms         # Per-platform scores
GET  /brands/{id}/citations         # Top cited sources
GET  /brands/{id}/contexts          # Example mentions
GET  /brands/{id}/sentiment         # Sentiment breakdown
GET  /brands/{id}/keywords          # Associated keywords
```

### Scraping
```
POST /scrape                        # Legacy scrape endpoint
POST /scrape/prompt                 # Scrape specific prompt
GET  /responses/{id}                # Get response by ID
```

### System
```
GET  /                              # Service info
GET  /health                        # Health check
```

## Testing

### Test LLM Extraction
```bash
python test_llm_extraction.py
```

Extracts data from a sample response and optionally saves to database.

### Test API
```bash
# Health check
curl http://localhost:8000/health

# Get categories
curl http://localhost:8000/categories

# Get brand details
curl http://localhost:8000/brands/{brand-id}
```

### Test Scraper
```bash
# Test ChatGPT scraper
python -c "
from app.scrapers.chatgpt_scraper import ChatGPTScraper
import asyncio

async def test():
    scraper = ChatGPTScraper()
    await scraper.initialize()
    result = await scraper.query('What is the best CRM?', ['Salesforce', 'HubSpot'])
    print(result.text)
    await scraper.cleanup()

asyncio.run(test())
"
```

## Troubleshooting

### Browser Issues

**Problem**: Browser closes immediately
```bash
# Solution: Disable headless mode
# In .env:
HEADLESS=false
```

**Problem**: ChromeDriver version mismatch
```bash
# Solution: Update Chrome or let undetected-chromedriver auto-download
pip install --upgrade undetected-chromedriver
```

### LLM Extraction Issues

**Problem**: JSON parsing errors
```bash
# Check API key is valid
python -c "
from google import genai
client = genai.Client(api_key='your-key')
print('API key valid!')
"
```

**Problem**: Rate limit exceeded
```bash
# Free tier: 15 req/min, 1,500 req/day
# Solution: Add delays or upgrade to paid tier
```

### Database Issues

**Problem**: Connection refused
```bash
# Check Supabase URL and key in .env
# Verify network connectivity
curl https://your-project.supabase.co
```

**Problem**: Missing tables
```bash
# Run SQL migrations in Supabase dashboard
# Check supabase_schema.sql and llm_extraction_schema.sql
```

### Proxy Issues

**Problem**: Proxy connection failed
```bash
# Solution: Disable proxy for testing
# In .env:
USE_PROXY=false
```

**Problem**: Authentication failed
```bash
# Verify Oxylabs credentials
# Test proxy manually:
curl -x http://username:password@proxy.oxylabs.io:7777 https://ip.oxylabs.io
```

## Configuration Options

### Scraper Settings

```python
# config.py
HEADLESS = True              # Run browser in background
RATE_LIMIT_DELAY = 30        # Seconds between requests
RANDOM_DELAY_MIN = 1         # Min random delay
RANDOM_DELAY_MAX = 3         # Max random delay
USE_STEALTH = True           # Enable anti-detection
```

### LLM Settings

```python
LLM_MODEL = "gemini-2.0-flash-exp"  # Gemini model
MAX_OUTPUT_TOKENS = 2048             # Per batch
BATCH_SIZE = 3                       # Brands per batch
```

### Proxy Settings

```python
USE_PROXY = False                    # Enable/disable
OXYLABS_USERNAME = "username"        # Proxy username
OXYLABS_PASSWORD = "password"        # Proxy password
PROXY_HOST = "proxy.oxylabs.io"      # Proxy host
PROXY_PORT = 7777                    # Proxy port
```

## Logging

Logs are written to:
- **Console**: Colored output with timestamps
- **File**: `logs/app.log` (rotated at 500MB)

**Log Levels**:
- `DEBUG`: Detailed information
- `INFO`: General information
- `SUCCESS`: Successful operations
- `WARNING`: Warning messages
- `ERROR`: Error messages

**View Logs**:
```bash
# Tail logs
tail -f logs/app.log

# Search logs
grep "ERROR" logs/app.log

# Filter by component
grep "llm_extractor" logs/app.log
```

## Performance Tips

1. **Parallel Workers**: Run multiple workers for different platforms
2. **Headless Mode**: Enable for better performance
3. **Proxy Rotation**: Use proxies to avoid rate limits
4. **Batch Processing**: LLM processes 3 brands at a time
5. **Connection Pooling**: Reuse database connections