# AI Visibility Tracker - Architecture

## Overview

AI Visibility Tracker monitors brand mentions across AI platforms (ChatGPT, Gemini, Perplexity) to track brand visibility in AI-generated responses. It scrapes AI platforms, extracts structured data using LLM, and provides analytics through a modern web interface.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - React Components (Brand Cards, Charts, Leaderboards)     │
│  - TypeScript API Client                                     │
│  - Real-time Analytics Dashboard                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  - REST API Endpoints                                        │
│  - Browser Automation (Selenium + undetected-chromedriver)  │
│  - LLM Extraction Layer (Google Gemini)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────┐ ┌───▼──────────┐
│   ChatGPT    │ │ Gemini │ │  Perplexity  │
│   Scraper    │ │ Scraper│ │   Scraper    │
└──────────────┘ └────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Database (Supabase/PostgreSQL)                  │
│  - Categories, Brands, Prompts                              │
│  - Responses, Citations, Brand Mentions                     │
│  - Materialized Views for Analytics                         │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Better Auth** - Authentication

### Backend
- **FastAPI** - Python web framework
- **Selenium** - Browser automation
- **undetected-chromedriver** - Anti-detection
- **Google Gemini API** - LLM extraction
- **Supabase Client** - Database access
- **Loguru** - Logging

### Database
- **PostgreSQL** (via Supabase)
- **Materialized Views** - Pre-computed analytics
- **JSONB** - Flexible data storage

## Key Components

### 1. Browser Automation Layer

**Challenge**: AI platforms have anti-bot detection that blocks standard automation.

**Solution**: Multi-layered approach:

1. **undetected-chromedriver**: Chosen as one of the most effective anti-detection tools. Patches ChromeDriver to avoid detection signatures.

2. **Proxy Support (Oxylabs)**: Rotating residential proxies to:
   - Avoid IP blocking
   - Distribute requests across IPs
   - Mimic real user traffic patterns

3. **Human-like Behavior**:
   - Random delays between actions
   - Cookie persistence across sessions
   - Fresh browser instances per query

4. **Platform-Specific Selectors**:
   - Each scraper (ChatGPT, Gemini, Perplexity) has custom CSS selectors
   - Handles dynamic content loading
   - Waits for response generation (10-15 seconds post-send)

**Code Structure**:
```python
BaseScraper (base_scraper.py)
├── Browser management
├── Cookie handling
├── Anti-detection setup
└── Brand extraction

ChatGPTScraper, GeminiScraper, PerplexityScraper
└── Platform-specific response handling
```

### 2. LLM Extraction Layer

**Challenge**: Raw AI responses contain unstructured text with embedded URLs and brand mentions.

**Solution**: Google Gemini API for structured extraction:

**What it extracts**:
- **Citations**: URLs with titles, domains, positions
- **Context**: 2-3 sentence summaries per brand
- **Sentiment**: Positive/neutral/negative classification
- **Keywords**: 3-5 key themes per brand

**Why Gemini**:
- Free tier with generous limits
- Structured JSON output (`response_mime_type: 'application/json'`)
- Fast processing (2-3 seconds per batch)
- High accuracy for extraction tasks

**Batch Processing**:
- Processes 3 brands at a time to stay under token limits
- 2048 tokens per batch
- Automatic retry on failures

**Code**: `backend/app/utils/llm_extractor.py`

### 3. Data Flow

```
1. Worker fetches prompt from database
   ↓
2. Scraper opens fresh browser, logs in (cookies)
   ↓
3. Enters prompt, waits 10-15s, extracts response
   ↓
4. Saves raw response to database
   ↓
5. LLM Extractor processes response (batched)
   ↓
6. Saves citations, contexts, sentiment, keywords
   ↓
7. Frontend fetches via API endpoints
   ↓
8. Displays in dashboard with charts/analytics
```

### 4. Database Schema

**Core Tables**:
- `categories` - CRM Software, Project Management, etc.
- `brands` - Salesforce, HubSpot, Asana, etc.
- `prompts` - Questions to ask AI platforms
- `responses` - Raw AI responses with brand mentions
- `citations` - Extracted URLs per brand
- `brand_mentions` - Context, sentiment, keywords

**Views** (Pre-computed):
- `category_summary` - Brand counts, response counts
- `brand_leaderboard` - Visibility scores per category
- `brand_details` - Comprehensive brand metrics
- `brand_visibility_timeseries` - Daily scores
- `brand_platform_scores` - Per-platform breakdown
- `brand_sentiment_breakdown` - Sentiment percentages

### 5. API Architecture

**RESTful Endpoints**:

```
GET  /categories                    - List all categories
GET  /categories/{id}/leaderboard   - Brand rankings
GET  /brands/{id}                   - Brand details
GET  /brands/{id}/timeseries        - Historical data
GET  /brands/{id}/citations         - Top cited sources
GET  /brands/{id}/contexts          - Example mentions
GET  /brands/{id}/sentiment         - Sentiment breakdown
GET  /brands/{id}/keywords          - Associated keywords
POST /scrape/prompt                 - Trigger scrape
```

**Response Format**:
```json
{
  "success": true,
  "data": { ... }
}
```

## Technical Decisions

### Why undetected-chromedriver?
- Most effective anti-detection tool available
- Actively maintained with frequent updates
- Patches ChromeDriver at runtime to avoid signatures
- Works with headless mode (with proper configuration)

### Why Proxies (Oxylabs)?
- **IP Blocking Risk**: AI platforms rate-limit by IP
- **Residential Proxies**: Appear as real users
- **Rotation**: Distributes load across IPs
- **Reliability**: 99.9% uptime for continuous scraping

### Why Fresh Browser Per Query?
- **Clean State**: No cross-contamination between queries
- **Memory Management**: Prevents memory leaks
- **Reliability**: Isolated failures don't affect other queries
- **Detection Avoidance**: Each session looks like a new user

### Why Google Gemini for Extraction?
- **Free Tier**: 15 requests/minute, 1500 requests/day
- **Structured Output**: Native JSON response format
- **Accuracy**: Better than regex for complex extraction
- **Speed**: 2-3 seconds per batch vs manual parsing

### Why Batch Processing (3 brands)?
- **Token Limits**: Stays under 2048 tokens per request
- **Free Tier**: Maximizes free quota usage
- **Reliability**: Smaller batches = fewer failures
- **Cost**: Zero cost for typical usage

## What We Can Improve

### 1. Enhanced Analytics
- **Prompt Heatmap**: Matrix showing which prompts mention which brands
- **Trend Analysis**: Week-over-week visibility changes
- **Competitive Analysis**: Head-to-head brand comparisons
- **Citation Network**: Graph of source relationships

### 2. Scalability
- **Distributed Workers**: Multiple scrapers in parallel
- **Queue System**: Redis/RabbitMQ for job management
- **Caching Layer**: Redis for frequently accessed data
- **CDN**: Static asset delivery

### 3. Monitoring
- **Real-time Dashboard**: Worker status, success rates
- **Alerting**: Slack/email on failures
- **Metrics**: Prometheus + Grafana
- **Error Tracking**: Sentry integration

### 4. Advanced Features
- **Custom Prompts**: User-generated questions
- **Scheduled Reports**: Weekly email summaries
- **API Webhooks**: Real-time notifications
- **Export**: CSV/PDF report generation

### 5. Detection Avoidance
- **Captcha Solving**: 2Captcha integration
- **Browser Fingerprinting**: Randomized profiles
- **Behavioral Patterns**: More human-like interactions
- **Session Management**: Longer-lived sessions

### 6. Data Quality
- **Duplicate Detection**: Avoid re-scraping same prompts
- **Response Validation**: Check for errors/blocks
- **Citation Verification**: Validate URLs are accessible
- **Sentiment Calibration**: Fine-tune LLM prompts

## Performance Characteristics

### Current Capacity
- **Scraping**: ~2-3 prompts/minute per platform
- **LLM Extraction**: ~20 brands/minute
- **API Response**: <100ms for cached queries
- **Database**: Handles 100K+ responses

### Bottlenecks
1. **Browser Automation**: Slowest component (30-60s per query)
2. **LLM API**: Rate limited (15 req/min free tier)
3. **Network**: Proxy latency adds 1-2s

### Optimization Opportunities
- Parallel scrapers (3x throughput)
- Response caching (10x faster reads)
- Incremental updates (avoid full re-scrapes)

## Security Considerations

- **Credentials**: Stored in `.env`, never committed
- **API Keys**: Rotated regularly
- **Database**: Row-level security (RLS) enabled
- **Authentication**: JWT tokens with expiration
- **Rate Limiting**: Prevents API abuse

## Development Workflow

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python worker.py --ai-source chatgpt

# Frontend
cd frontend
npm install
npm run dev

# Database
# Run SQL migrations in Supabase dashboard
```

## Deployment Architecture

```
Frontend (Vercel)
    ↓
Backend (Railway/Render)
    ↓
Database (Supabase)
    ↓
Workers (Background Jobs)
```

---

**Built with**: Python, TypeScript, PostgreSQL, and a lot of anti-detection magic ✨
