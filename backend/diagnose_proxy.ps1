# Oxylabs Proxy Diagnostic Script
# This helps troubleshoot proxy authentication issues

Write-Host "🔍 Oxylabs Proxy Diagnostics" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Current Configuration:" -ForegroundColor Yellow
Write-Host ""

$config = python -c @"
from app.config import settings
print(f'Username: {settings.OXYLABS_USERNAME}')
print(f'Password: {settings.OXYLABS_PASSWORD[:3]}***{settings.OXYLABS_PASSWORD[-2:]}')
print(f'Host: {settings.OXYLABS_PROXY_HOST}')
print(f'Ports: {settings.OXYLABS_PROXY_PORTS}')
print(f'USE_PROXY: {settings.USE_PROXY}')
"@

Write-Host $config -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 Testing Different Auth Formats:" -ForegroundColor Yellow
Write-Host ""

# Test format 1: Plain username
Write-Host "1. Testing format: USERNAME:PASSWORD@host:port" -ForegroundColor Cyan
python -c @"
import requests
username = 'lelouch'
password = 'Marthamani=1'
proxy = 'dc.oxylabs.io:8001'
proxies = {'http': f'http://{username}:{password}@{proxy}'}
try:
    r = requests.get('http://ip.oxylabs.io/', proxies=proxies, timeout=5)
    print(f'   ✅ SUCCESS! Status: {r.status_code}')
except Exception as e:
    print(f'   ❌ Failed: {str(e)[:80]}...')
"@
Write-Host ""

# Test format 2: customer- prefix
Write-Host "2. Testing format: customer-USERNAME:PASSWORD@host:port" -ForegroundColor Cyan
python -c @"
import requests
username = 'lelouch'
password = 'Marthamani=1'
proxy = 'dc.oxylabs.io:8001'
proxies = {'http': f'http://customer-{username}:{password}@{proxy}'}
try:
    r = requests.get('http://ip.oxylabs.io/', proxies=proxies, timeout=5)
    print(f'   ✅ SUCCESS! Status: {r.status_code}')
except Exception as e:
    print(f'   ❌ Failed: {str(e)[:80]}...')
"@
Write-Host ""

# Test format 3: user- prefix
Write-Host "3. Testing format: user-USERNAME:PASSWORD@host:port" -ForegroundColor Cyan
python -c @"
import requests
username = 'lelouch'
password = 'Marthamani=1'
proxy = 'dc.oxylabs.io:8001'
proxies = {'http': f'http://user-{username}:{password}@{proxy}'}
try:
    r = requests.get('http://ip.oxylabs.io/', proxies=proxies, timeout=5)
    print(f'   ✅ SUCCESS! Status: {r.status_code}')
except Exception as e:
    print(f'   ❌ Failed: {str(e)[:80]}...')
"@
Write-Host ""

Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Common Issues:" -ForegroundColor Yellow
Write-Host "   1. Wrong username/password in Oxylabs dashboard" -ForegroundColor Gray
Write-Host "   2. Proxy subscription not active" -ForegroundColor Gray
Write-Host "   3. IP not whitelisted in Oxylabs dashboard" -ForegroundColor Gray
Write-Host "   4. Wrong authentication format" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Check your Oxylabs dashboard:" -ForegroundColor Cyan
Write-Host "   https://dashboard.oxylabs.io" -ForegroundColor Gray
Write-Host ""
