# Test Gemini Scraper

Write-Host "=" -ForegroundColor Cyan
Write-Host "Testing Gemini Scraper" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan

# Test 1: Check if Gemini scraper can be imported
Write-Host "`n1. Testing Gemini scraper import..." -ForegroundColor Yellow
python -c "from app.scrapers.gemini_scraper import GeminiScraper; print('OK - Gemini scraper imported successfully')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED - Could not import Gemini scraper" -ForegroundColor Red
    exit 1
}

# Test 2: Initialize Gemini scraper
Write-Host "`n2. Testing Gemini scraper initialization..." -ForegroundColor Yellow
Write-Host "This will open a browser window..." -ForegroundColor Gray
Write-Host "You will need to login to Gemini manually (first time only)" -ForegroundColor Gray

python -c @"
import asyncio
from app.scrapers.gemini_scraper import GeminiScraper

async def test():
    scraper = GeminiScraper()
    success = await scraper.initialize()
    
    if success:
        print('OK - Gemini scraper initialized')
        await scraper.cleanup()
        return 0
    else:
        print('FAILED - Initialization failed')
        return 1

exit(asyncio.run(test()))
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED - Initialization error" -ForegroundColor Red
    exit 1
}

# Test 3: Test fresh browser query
Write-Host "`n3. Testing fresh browser query..." -ForegroundColor Yellow

python -c @"
import asyncio
from app.scrapers.gemini_scraper import GeminiScraper

async def test():
    scraper = GeminiScraper()
    result = await scraper.query_with_fresh_browser(
        prompt='What is 2+2?',
        brands=['Salesforce', 'HubSpot']
    )
    
    print(f'OK - Response: {result.text[:100]}...')
    print(f'OK - Brands mentioned: {result.brands_mentioned}')
    return 0

exit(asyncio.run(test()))
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nTEST FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "`nGemini scraper is ready to use!" -ForegroundColor Cyan
Write-Host "You can now run:" -ForegroundColor Gray
Write-Host "  python worker.py --ai-source gemini" -ForegroundColor White
