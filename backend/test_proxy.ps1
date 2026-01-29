# Test Oxylabs Proxy Connection
# Run this to verify your proxy credentials work

Write-Host "Testing Oxylabs Proxy Configuration" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test Python imports
Write-Host "[1] Testing Python configuration..." -ForegroundColor Yellow
try {
    $configTest = python -c "from app.config import settings; print(f'USE_PROXY: {settings.USE_PROXY}'); print(f'USERNAME: {settings.OXYLABS_USERNAME[:5]}***' if settings.OXYLABS_USERNAME else 'USERNAME: Not set'); print(f'PORTS: {settings.OXYLABS_PROXY_PORTS}')" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuration loaded:" -ForegroundColor Green
        Write-Host "   $configTest" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ Failed to load configuration" -ForegroundColor Red
        Write-Host $configTest
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test proxy connection
Write-Host "[2] Testing proxy connection to Oxylabs..." -ForegroundColor Yellow
Write-Host "   This may take a few seconds..." -ForegroundColor Gray
Write-Host ""

$proxyTest = python -c @"
from app.utils.proxy_manager import proxy_manager
import sys

# Test proxy
success = proxy_manager.test_proxy()

if success:
    print('✅ Proxy connection successful!')
    sys.exit(0)
else:
    print('❌ Proxy connection failed!')
    sys.exit(1)
"@ 2>&1

Write-Host $proxyTest

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS - Proxy Configuration Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] Credentials: Valid" -ForegroundColor Green
    Write-Host "[OK] Connection: Working" -ForegroundColor Green
    Write-Host "[OK] Ready to scrape: Yes" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Start the server: python -m app.main" -ForegroundColor Gray
    Write-Host "   2. Run scrape test: .\test_api.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[SECURE] All traffic will go through Oxylabs proxies" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[FAILED] Proxy Test Failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Check OXYLABS_USERNAME in .env file" -ForegroundColor Gray
    Write-Host "   2. Check OXYLABS_PASSWORD in .env file" -ForegroundColor Gray
    Write-Host "   3. Verify your Oxylabs subscription is active" -ForegroundColor Gray
    Write-Host "   4. Check if ports 8001-8005 are correct" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Edit .env file and update:" -ForegroundColor Cyan
    Write-Host "   OXYLABS_USERNAME=your-actual-username" -ForegroundColor Gray
    Write-Host "   OXYLABS_PASSWORD=your-actual-password" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
