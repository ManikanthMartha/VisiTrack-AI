# Quick test script for the scraping service
# Run this after starting the server to test it

Write-Host "🧪 Testing AI Visibility Tracker Backend" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Health Check
Write-Host "1️⃣  Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Environment: $($health.environment)" -ForegroundColor Gray
    Write-Host "   Active scrapers: $($health.scrapers -join ', ')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the server is running: python -m app.main" -ForegroundColor Red
    exit 1
}

# Test 2: Scrape Request
Write-Host "2️⃣  Testing scrape endpoint (ChatGPT)..." -ForegroundColor Yellow
Write-Host "   This will open a browser window if it's your first time" -ForegroundColor Gray
Write-Host "   You may need to log in to ChatGPT manually" -ForegroundColor Gray
Write-Host ""

$scrapeBody = @{
    prompt = "What are the top 3 CRM software for small businesses?"
    brands = @("Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday.com")
    ai_source = "chatgpt"
} | ConvertTo-Json

try {
    Write-Host "   Sending request..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/scrape" -Method Post -Body $scrapeBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Scrape successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Results:" -ForegroundColor Cyan
        Write-Host "   Response ID: $($response.data.id)" -ForegroundColor Gray
        Write-Host "   AI Source: $($response.data.ai_source)" -ForegroundColor Gray
        Write-Host "   Prompt: $($response.data.prompt)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   🏷️  Brands mentioned: $($response.data.brands_mentioned -join ', ')" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   📝 Response preview:" -ForegroundColor Cyan
        $preview = $response.data.response.Substring(0, [Math]::Min(200, $response.data.response.Length))
        Write-Host "   $preview..." -ForegroundColor Gray
        Write-Host ""
        
        # Save response ID for later
        $responseId = $response.data.id
        
        # Test 3: Get Response by ID
        Write-Host "3️⃣  Testing get response endpoint..." -ForegroundColor Yellow
        $savedResponse = Invoke-RestMethod -Uri "$baseUrl/responses/$responseId" -Method Get
        
        if ($savedResponse.success) {
            Write-Host "✅ Successfully retrieved saved response!" -ForegroundColor Green
            Write-Host "   Status: $($savedResponse.data.status)" -ForegroundColor Gray
            Write-Host ""
        }
        
    } else {
        Write-Host "❌ Scrape failed: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Scrape request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    if ($_.ErrorDetails.Message) {
        $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error details: $($errorDetail.detail)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🔍 View logs: Get-Content .\logs\app.log -Wait -Tail 50" -ForegroundColor Cyan
Write-Host ""
