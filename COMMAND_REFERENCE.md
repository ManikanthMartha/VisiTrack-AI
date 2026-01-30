# Command Reference - AI Visibility Tracker

Quick reference for common commands and operations.

## 🔧 Setup Commands

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Install LLM package
pip install google-generativeai

# Run backend server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## 🤖 Worker Commands

### Basic Usage
```bash
cd backend

# Run all AI sources, all categories
python worker.py --ai-source all

# Run specific AI source
python worker.py --ai-source chatgpt
python worker.py --ai-source gemini
python worker.py --ai-source perplexity

# Run specific category
python worker.py --ai-source chatgpt --category {category_id}

# Limited iterations (for testing)
python worker.py --ai-source chatgpt --max-iterations 1
python worker.py --ai-source all --max-iterations 2
```

### Examples
```bash
# Test ChatGPT scraping (1 iteration)
python worker.py --ai-source chatgpt --max-iterations 1

# Run Gemini continuously
python worker.py --ai-source gemini

# Run all sources for specific category
python worker.py --ai-source all --category abc123-def456

# Test all sources (1 iteration each)
python worker.py --ai-source all --max-iterations 1
```

## 🧪 Testing Commands

### LLM Extraction Testing
```bash
cd backend

# Test on a few responses (interactive)
python test_llm_extraction.py

# Batch process all responses
python test_llm_extraction.py --batch
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Get all categories
curl http://localhost:8000/categories

# Get category details
curl http://localhost:8000/categories/{category_id}

# Get brand details
curl http://localhost:8000/brands/{brand_id}

# Get brand citations
curl http://localhost:8000/brands/{brand_id}/citations

# Get brand sentiment
curl http://localhost:8000/brands/{brand_id}/sentiment

# Get brand keywords
curl http://localhost:8000/brands/{brand_id}/keywords

# Get brand contexts
curl http://localhost:8000/brands/{brand_id}/contexts
```

### PowerShell Testing (Windows)
```powershell
# Test API endpoints
.\test_api.ps1

# Test Gemini scraper
.\test_gemini.ps1

# Test Perplexity scraper
.\test_perplexity.ps1

# Test proxy connection
.\test_proxy.ps1
```

## 🔐 Login Setup Commands

### Setup AI Platform Logins
```bash
cd backend

# Setup ChatGPT login
python setup_chatgpt_login.py

# Setup Gemini login
python setup_gemini_login.py

# Setup Perplexity login
python setup_perplexity_login.py
```

## 📊 Database Commands

### Supabase SQL
```sql
-- View all categories
SELECT * FROM categories;

-- View all brands
SELECT * FROM brands;

-- View all prompts
SELECT * FROM prompts;

-- View completed responses
SELECT * FROM responses WHERE status = 'completed';

-- View citations
SELECT * FROM citations LIMIT 10;

-- View brand mentions
SELECT * FROM brand_mentions LIMIT 10;

-- View category summary
SELECT * FROM category_summary;

-- View brand leaderboard
SELECT * FROM brand_leaderboard ORDER BY overall_visibility_score DESC;

-- View brand sentiment
SELECT * FROM brand_sentiment_breakdown WHERE brand_id = 'your-brand-id';

-- View top citations
SELECT * FROM brand_top_citations WHERE brand_id = 'your-brand-id' LIMIT 10;
```

### Database Queries
```bash
# Check prompts status
cd backend
python check_prompts.py

# View responses for a category
# (Use Supabase dashboard or SQL editor)
```

## 📝 Logging Commands

### View Logs
```bash
# Real-time logs
tail -f backend/logs/app.log

# Last 100 lines
tail -n 100 backend/logs/app.log

# Search for errors
grep "ERROR" backend/logs/app.log

# Search for LLM extraction
grep "LLM" backend/logs/app.log

# Search for specific brand
grep "Salesforce" backend/logs/app.log
```

### Windows PowerShell
```powershell
# View last 100 lines
Get-Content backend\logs\app.log -Tail 100

# Real-time monitoring
Get-Content backend\logs\app.log -Wait -Tail 50

# Search for errors
Select-String -Path backend\logs\app.log -Pattern "ERROR"
```

## 🔄 Git Commands

### Common Operations
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Add LLM extraction feature"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/llm-extraction

# Switch branches
git checkout main
```

## 🐛 Debugging Commands

### Python Debugging
```bash
# Run with verbose logging
cd backend
python -m pdb worker.py

# Check Python version
python --version

# Check installed packages
pip list

# Check specific package
pip show google-generativeai
```

### Browser Debugging
```bash
# Run worker in non-headless mode (see browser)
# Edit backend/.env: HEADLESS=false
python worker.py --ai-source chatgpt --max-iterations 1
```

### Network Debugging
```bash
# Test proxy connection
cd backend
python -c "from app.utils.proxy_manager import ProxyManager; pm = ProxyManager(); print(pm.get_random_proxy())"

# Test Supabase connection
python -c "from app.database import db; print('Connected' if db.client else 'Failed')"
```

## 📦 Package Management

### Python Packages
```bash
# Install from requirements.txt
pip install -r requirements.txt

# Update a package
pip install --upgrade google-generativeai

# Freeze current packages
pip freeze > requirements.txt

# Uninstall a package
pip uninstall google-generativeai
```

### Node Packages
```bash
cd frontend

# Install packages
npm install

# Update packages
npm update

# Install specific package
npm install recharts

# Uninstall package
npm uninstall recharts
```

## 🚀 Deployment Commands

### Backend Deployment
```bash
# Build for production
cd backend

# Set environment
export ENVIRONMENT=production

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment
```bash
cd frontend

# Build for production
npm run build

# Start production server
npm start

# Export static site
npm run export
```

## 🔍 Monitoring Commands

### System Monitoring
```bash
# Check CPU/Memory usage
top

# Check disk space
df -h

# Check running processes
ps aux | grep python

# Kill a process
kill -9 {process_id}
```

### Application Monitoring
```bash
# Check backend status
curl http://localhost:8000/health

# Check frontend status
curl http://localhost:3000

# Monitor worker logs
tail -f backend/logs/app.log | grep "✅"
```

## 💾 Backup Commands

### Database Backup
```bash
# Export from Supabase
# (Use Supabase dashboard > Database > Backups)

# Or use pg_dump if you have direct access
pg_dump -h your-host -U your-user -d your-db > backup.sql
```

### Code Backup
```bash
# Create archive
tar -czf backup-$(date +%Y%m%d).tar.gz backend/ frontend/

# Extract archive
tar -xzf backup-20260130.tar.gz
```

## 🔧 Environment Variables

### View Environment
```bash
# Linux/Mac
printenv | grep GOOGLE

# Windows PowerShell
Get-ChildItem Env: | Where-Object {$_.Name -like "*GOOGLE*"}
```

### Set Environment (Temporary)
```bash
# Linux/Mac
export GOOGLE_API_KEY=your_key_here

# Windows PowerShell
$env:GOOGLE_API_KEY="your_key_here"
```

## 📚 Documentation Commands

### Generate API Docs
```bash
# Backend API docs (automatic)
# Visit: http://localhost:8000/docs

# Or ReDoc format
# Visit: http://localhost:8000/redoc
```

### View Documentation
```bash
# Open in browser
open backend/LLM_EXTRACTION_SETUP.md
open QUICK_START_LLM.md
open TODO_CHECKLIST.md

# Or use cat/less
cat QUICK_START_LLM.md
less IMPLEMENTATION_STATUS.md
```

## 🎯 Quick Workflows

### Complete Setup Workflow
```bash
# 1. Setup backend
cd backend
pip install -r requirements.txt
# Add GOOGLE_API_KEY to .env
python test_llm_extraction.py

# 2. Setup frontend
cd ../frontend
npm install
npm run dev

# 3. Run worker
cd ../backend
python worker.py --ai-source chatgpt --max-iterations 1
```

### Daily Development Workflow
```bash
# 1. Pull latest changes
git pull origin main

# 2. Start backend
cd backend
python -m uvicorn app.main:app --reload &

# 3. Start frontend
cd ../frontend
npm run dev &

# 4. Run worker (optional)
cd ../backend
python worker.py --ai-source all
```

### Testing Workflow
```bash
# 1. Test LLM extraction
cd backend
python test_llm_extraction.py

# 2. Test API
curl http://localhost:8000/health
curl http://localhost:8000/categories

# 3. Test frontend
# Open browser: http://localhost:3000

# 4. Check logs
tail -f backend/logs/app.log
```

---

**Tip:** Bookmark this file for quick reference!
