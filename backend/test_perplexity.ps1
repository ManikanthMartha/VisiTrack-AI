# Test Perplexity Scraper
# Run this script to test the Perplexity scraper implementation

Write-Host "🧪 Testing Perplexity Scraper..." -ForegroundColor Cyan
Write-Host "=" * 50

# Test 1: Import check
Write-Host "`n🔍 Test 1: Import Check" -ForegroundColor Yellow
try {
    python -c "
from app.scrapers.perplexity_scraper import PerplexityScraper
print('✅ Import successful')
"
    Write-Host "✅ Perplexity scraper imported successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Import failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Initialization
Write-Host "`n🔧 Test 2: Initialization" -ForegroundColor Yellow
try {
    python -c "
from app.scrapers.perplexity_scraper import PerplexityScraper
scraper = PerplexityScraper()
print('✅ Initialization successful')
print(f'URL: {scraper.URL}')
print(f'AI Source: {scraper.ai_source}')
"
    Write-Host "✅ Perplexity scraper initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Initialization failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Fresh Browser Query (requires manual login first time)
Write-Host "`n🌐 Test 3: Fresh Browser Query" -ForegroundColor Yellow
Write-Host "⚠️  This will open a browser window. If not logged in, you'll have 90 seconds to log in manually." -ForegroundColor Yellow
$confirmation = Read-Host "Do you want to proceed? (y/n)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    try {
        python -c "
import asyncio
from app.scrapers.perplexity_scraper import PerplexityScraper

async def test():
    scraper = PerplexityScraper()
    
    # Test with a simple question
    result = await scraper.query_with_fresh_browser(
        'What is the best CRM software for startups?',
        ['Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive']
    )
    
    print(f'Response: {result.text[:200]}...')
    print(f'Brands mentioned: {result.brands_mentioned}')
    print('✅ Fresh browser query successful')

asyncio.run(test())
"
        Write-Host "✅ Fresh browser query completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Fresh browser query failed: $_" -ForegroundColor Red
        Write-Host "This may be expected on first run if manual login is required." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping fresh browser test" -ForegroundColor Yellow
}

Write-Host "`n🎉 Perplexity Scraper Test Complete!" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "`n📚 Usage Examples:" -ForegroundColor Cyan
Write-Host "1. Test via API:" -ForegroundColor White
Write-Host '   curl -X POST http://localhost:8000/scrape/prompt -H "Content-Type: application/json" -d "{""prompt_id"": ""YOUR_PROMPT_ID"", ""ai_source"": ""perplexity""}"' -ForegroundColor Gray

Write-Host "`n2. Run worker for Perplexity:" -ForegroundColor White
Write-Host "   python worker.py --ai-source perplexity" -ForegroundColor Gray

Write-Host "`n3. Run all workers (ChatGPT + Gemini + Perplexity):" -ForegroundColor White
Write-Host "   python worker.py --ai-source all" -ForegroundColor Gray