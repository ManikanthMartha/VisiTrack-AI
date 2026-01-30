# AI Visibility Tracker

Track your brand's visibility across AI platforms (ChatGPT, Gemini, Perplexity). Monitor mentions, analyze sentiment, and understand how AI recommends your product.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (via Supabase)
- Google Chrome
- Google AI Studio API Key

### 1. Clone Repository
```bash
git clone <repository-url>
cd compound
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup
- Create Supabase project
- Run SQL from `backend/supabase_schema.sql`
- Run SQL from `backend/llm_extraction_schema.sql`
- Add seed data from `backend/seed_data.sql`

### 4. Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 5. Run Application

**Terminal 1 - Backend API**:
```bash
cd backend
python -m app.main
# Runs on http://localhost:8000
```

**Terminal 2 - Worker (Scraper)**:
```bash
cd backend
python worker.py --ai-source chatgpt --max-iterations 5
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## 📁 Project Structure

```
compound/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── scrapers/    # Browser automation
│   │   ├── utils/       # LLM extraction, proxies
│   │   ├── main.py      # API server
│   │   └── database.py  # Database operations
│   ├── worker.py        # Background scraper
│   └── requirements.txt
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # Pages and routes
│   │   ├── components/ # React components
│   │   └── lib/        # API client, utilities
│   └── package.json
└── ARCHITECTURE.md      # Detailed architecture docs
```

## 🎯 Features

### Current Features
- ✅ **Multi-Platform Scraping**: ChatGPT, Gemini, Perplexity
- ✅ **Anti-Detection**: undetected-chromedriver + proxies
- ✅ **LLM Extraction**: Automated citation, sentiment, keyword extraction
- ✅ **Real-time Dashboard**: Brand leaderboards, visibility charts
- ✅ **Analytics**: Time-series data, platform breakdowns
- ✅ **Authentication**: Secure user login

### What can be improved
- 🔄 Prompt heatmaps
- 🔄 Competitive analysis
- 🔄 Custom prompts
- 🔄 Scheduled reports

## 🛠️ Tech Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, Recharts  
**Backend**: FastAPI, Selenium, Google Gemini API  
**Database**: PostgreSQL (Supabase)  
**Automation**: undetected-chromedriver, Oxylabs proxies

## 📊 How It Works

1. **Worker** fetches prompts from database
2. **Scraper** opens browser, queries AI platform
3. **Response** saved to database with brand mentions
4. **LLM Extractor** analyzes response for citations, sentiment, keywords
5. **API** serves data to frontend
6. **Dashboard** displays analytics and insights

## 🔧 Configuration

### Backend (.env)
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# LLM Extraction
GOOGLE_API_KEY=your_google_ai_key
LLM_MODEL=gemini-2.0-flash-exp

# Proxy (Optional)
USE_PROXY=false
OXYLABS_USERNAME=your_username
OXYLABS_PASSWORD=your_password

# Scraper Settings
HEADLESS=true
RATE_LIMIT_DELAY=30
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=your_postgres_connection_string
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
```

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[SCALING.md](./SCALING.md)** - Scaling to 1000+ prompts
- **[backend/README.md](./backend/README.md)** - Backend setup guide
- **[frontend/README.md](./frontend/README.md)** - Frontend setup guide

## 🚦 API Endpoints

```
GET  /categories                    - List all categories
GET  /categories/{id}/leaderboard   - Brand rankings
GET  /brands/{id}                   - Brand details
GET  /brands/{id}/timeseries        - Historical visibility
GET  /brands/{id}/citations         - Top cited sources
GET  /brands/{id}/sentiment         - Sentiment breakdown
POST /scrape/prompt                 - Trigger scrape
```

Full API docs: http://localhost:8000/docs

## 🧪 Testing

```bash
# Backend tests
cd backend
python test_llm_extraction.py

# Test API
curl http://localhost:8000/health

# Frontend
cd frontend
npm run build
```

## 🐛 Troubleshooting

### Browser closes immediately
- Check Chrome version matches ChromeDriver
- Disable headless mode: `HEADLESS=false`

### LLM extraction fails
- Verify `GOOGLE_API_KEY` is set
- Check free tier limits (15 req/min)

### Proxy errors
- Set `USE_PROXY=false` for testing
- Verify Oxylabs credentials

### Database connection fails
- Check Supabase URL and key
- Verify network connectivity

## 📈 Performance

- **Scraping**: 2-3 prompts/minute per platform
- **LLM Extraction**: 20 brands/minute
- **API Response**: <100ms (cached)
- **Database**: Handles 100K+ responses

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **undetected-chromedriver** - Anti-detection magic
- **Oxylabs** - Reliable proxy infrastructure
- **Google Gemini** - LLM extraction capabilities
- **Supabase** - Database and authentication

---

**Need help?** Check the documentation or open an issue.
