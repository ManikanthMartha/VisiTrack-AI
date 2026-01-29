# 🔒 Oxylabs Proxy - Quick Reference

## 🎯 What You Need To Do

### 1. Update .env File

Open `.env` and replace these values:

```properties
OXYLABS_USERNAME=your-actual-username-here
OXYLABS_PASSWORD=your-actual-password-here
USE_PROXY=true
```

**Example:**
```properties
OXYLABS_USERNAME=john_doe_12345
OXYLABS_PASSWORD=SecurePass123!
USE_PROXY=true
```

### 2. Test Proxy

```powershell
.\test_proxy.ps1
```

✅ **Success:** See "Proxy connection successful!"
❌ **Failed:** Check username/password

### 3. Start Scraping

```powershell
python -m app.main
```

---

## 🌐 Proxy Endpoints

Your traffic will rotate through these:

| Endpoint | Port | US IP |
|----------|------|-------|
| dc.oxylabs.io | 8001 | 93.115.200.159 |
| dc.oxylabs.io | 8002 | 93.115.200.158 |
| dc.oxylabs.io | 8003 | 93.115.200.157 |
| dc.oxylabs.io | 8004 | 93.115.200.156 |
| dc.oxylabs.io | 8005 | 93.115.200.155 |

---

## ⚡ Quick Test

```python
# Test proxy in Python
from app.utils.proxy_manager import proxy_manager
proxy_manager.test_proxy()
```

---

## 🔍 Verify It's Working

When scraping:
1. Look for: `🔒 Proxy mode enabled` in logs
2. Look for: `✅ Proxy authentication extension loaded`
3. Browser should connect through proxy
4. ChatGPT sees Oxylabs IP, not yours

---

## ❌ If Something Goes Wrong

### "Proxy connection test failed"
→ Check username/password in `.env`

### "Proxy auth extension not created"
→ Run: `New-Item -ItemType Directory -Force -Path ".\storage"`

### Browser can't load ChatGPT
→ Verify Oxylabs subscription is active

---

## 📖 Full Documentation

See [OXYLABS_SETUP.md](OXYLABS_SETUP.md) for complete guide.

---

## ✅ Safety Checklist

Before production:
- [ ] `.env` has real Oxylabs credentials
- [ ] `test_proxy.ps1` passes
- [ ] `USE_PROXY=true` in `.env`
- [ ] Logs show "Proxy mode enabled"

**You're protected!** All traffic goes through Oxylabs 🛡️
