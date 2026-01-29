# Python Backend MVP - AI Visibility Tracker

## Architecture Overview

```plaintext
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│                   (TypeScript/React)                     │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌──────────────────────────────────────────────────────────┐
│              Python Scraping Service                     │
│                    (FastAPI)                             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │   ChatGPT   │  │    Gemini    │  │   Perplexity   │   │
│  │   Scraper   │  │   Scraper    │  │    Scraper     │   │
│  │ (undetected)│  │ (undetected) │  │  (Playwright)  │   │
│  └─────────────┘  └──────────────┘  └────────────────┘   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│                  Supabase Database                       │
│              (PostgreSQL + Storage)                      │
└──────────────────────────────────────────────────────────┘
```

---

## STEP 1: Python Environment Setup (10 min)

### 1.1 Create Project Structure

```bash
mkdir ai-visibility-backend
cd ai-visibility-backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create project structure
mkdir -p {app/{scrapers,models,utils},storage,logs}
touch app/__init__.py
touch app/main.py
touch app/config.py
touch requirements.txt
touch .env
```

**Final Structure:**

```plaintext
ai-visibility-backend/
├── venv/                          # Virtual environment
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app
│   ├── config.py                  # Configuration
│   ├── database.py                # Supabase client
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── base_scraper.py        # Base class
│   │   ├── chatgpt_scraper.py     # ChatGPT automation
│   │   ├── gemini_scraper.py      # Gemini automation
│   │   └── perplexity_scraper.py  # Perplexity automation
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic models
│   └── utils/
│       ├── __init__.py
│       ├── brand_detector.py      # Brand extraction logic
│       └── session_manager.py     # Cookie management
├── storage/                       # Cookie storage
│   ├── chatgpt_cookies.json
│   └── gemini_cookies.json
├── logs/                          # Application logs
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

### 1.2 Install Dependencies

**requirements.txt**

```text

# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Browser Automation (Anti-Detection)
undetected-chromedriver==3.5.5
selenium==4.16.0
playwright==1.41.0
playwright-stealth==1.0.0

# HTTP Client with TLS Fingerprinting
curl-cffi==0.6.2
httpx==0.26.0

# Database
supabase==2.3.4
postgrest==0.16.0

# Utilities
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
loguru==0.7.2

# Anti-Detection Enhancement
fake-useragent==1.4.0
pyautogui==0.9.54  # Human-like mouse movements
numpy==1.26.3      # For Bezier curves

# Background Jobs (Optional)
celery==5.3.6
redis==5.0.1
```

```bash
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 1.3 Environment Variables

**.env**

```properties
# Server
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage
STORAGE_PATH=./storage
LOG_PATH=./logs

# Anti-Detection Settings
HEADLESS=false
USE_STEALTH=true
RANDOM_DELAY_MIN=1
RANDOM_DELAY_MAX=3

# Rate Limiting
RATE_LIMIT_DELAY=180  # 3 minutes between requests
MAX_CONCURRENT_SESSIONS=3

# Proxy (Optional)
# PROXY_URL=http://username:password@proxy.com:8080
```

---

## STEP 2: Database Setup (15 min)

### 2.1 Database Client

```python
# app/database.py
from supabase import create_client, Client
from app.config import settings
from typing import Optional, List, Dict, Any
from loguru import logger

class Database:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    
    async def create_response(
        self,
        prompt_text: str,
        ai_source: str,
        brands: List[str]
    ) -> Optional[Dict[str, Any]]:
        """Create a new response record"""
        try:
            result = self.client.table('responses').insert({
                'prompt_text': prompt_text,
                'ai_source': ai_source,
                'brands_mentioned': [],
                'status': 'processing'
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Database error: {e}")
            return None
    
    async def update_response(
        self,
        response_id: str,
        response_text: str,
        brands_mentioned: List[str],
        status: str = 'completed',
        error_message: Optional[str] = None
    ) -> bool:
        """Update response with scraping results"""
        try:
            update_data = {
                'response_text': response_text,
                'brands_mentioned': brands_mentioned,
                'status': status,
                'completed_at': 'now()'
            }
            
            if error_message:
                update_data['error_message'] = error_message
            
            self.client.table('responses').update(update_data).eq(
                'id', response_id
            ).execute()
            
            return True
        except Exception as e:
            logger.error(f"Update error: {e}")
            return False
    
    async def get_response(self, response_id: str) -> Optional[Dict[str, Any]]:
        """Get response by ID"""
        try:
            result = self.client.table('responses').select('*').eq(
                'id', response_id
            ).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Fetch error: {e}")
            return None
    
    async def save_session(
        self,
        ai_source: str,
        cookies: List[Dict[str, Any]]
    ) -> bool:
        """Save scraper session cookies"""
        try:
            self.client.table('scraper_sessions').upsert({
                'ai_source': ai_source,
                'cookies': cookies,
                'is_logged_in': True,
                'last_used_at': 'now()'
            }).execute()
            
            return True
        except Exception as e:
            logger.error(f"Session save error: {e}")
            return False
    
    async def load_session(self, ai_source: str) -> Optional[List[Dict[str, Any]]]:
        """Load scraper session cookies"""
        try:
            result = self.client.table('scraper_sessions').select('cookies').eq(
                'ai_source', ai_source
            ).execute()
            
            return result.data[0]['cookies'] if result.data else None
        except Exception as e:
            logger.error(f"Session load error: {e}")
            return None

# Global database instance
db = Database()
```

### 2.2 Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Storage
    STORAGE_PATH: str = "./storage"
    LOG_PATH: str = "./logs"
    
    # Anti-Detection
    HEADLESS: bool = False
    USE_STEALTH: bool = True
    RANDOM_DELAY_MIN: int = 1
    RANDOM_DELAY_MAX: int = 3
    
    # Rate Limiting
    RATE_LIMIT_DELAY: int = 180
    MAX_CONCURRENT_SESSIONS: int = 3
    
    # Proxy (Optional)
    PROXY_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## STEP 3: Base Scraper Class (20 min)

```python
# app/scrapers/base_scraper.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import time
import random
import json
import os
from loguru import logger
from app.config import settings

class ScraperResponse:
    """Response from AI scraper"""
    def __init__(
        self,
        text: str,
        brands_mentioned: List[str],
        raw_html: Optional[str] = None,
        citations: Optional[List[str]] = None
    ):
        self.text = text
        self.brands_mentioned = brands_mentioned
        self.raw_html = raw_html
        self.citations = citations or []

class BaseScraper(ABC):
    """Base class for all AI scrapers"""
    
    def __init__(self, ai_source: str):
        self.ai_source = ai_source
        self.driver = None
        self.cookies_path = os.path.join(
            settings.STORAGE_PATH,
            f"{ai_source}_cookies.json"
        )
        self.last_request_time = 0
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the scraper (launch browser, load cookies, etc.)"""
        pass
    
    @abstractmethod
    async def query(self, prompt: str, brands: List[str]) -> ScraperResponse:
        """Execute a query and return response"""
        pass
    
    @abstractmethod
    async def cleanup(self):
        """Cleanup resources (close browser, etc.)"""
        pass
    
    # Helper Methods
    
    def delay(self, seconds: float):
        """Sleep for specified seconds"""
        time.sleep(seconds)
    
    def random_delay(self, min_sec: Optional[float] = None, max_sec: Optional[float] = None):
        """Sleep for random duration"""
        min_sec = min_sec or settings.RANDOM_DELAY_MIN
        max_sec = max_sec or settings.RANDOM_DELAY_MAX
        duration = random.uniform(min_sec, max_sec)
        logger.debug(f"Sleeping for {duration:.2f}s")
        time.sleep(duration)
    
    def enforce_rate_limit(self):
        """Ensure rate limiting between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < settings.RATE_LIMIT_DELAY:
            wait_time = settings.RATE_LIMIT_DELAY - elapsed
            logger.info(f"Rate limiting: waiting {wait_time:.0f}s")
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    def save_cookies(self, cookies: List[Dict[str, Any]]):
        """Save cookies to file"""
        try:
            os.makedirs(settings.STORAGE_PATH, exist_ok=True)
            with open(self.cookies_path, 'w') as f:
                json.dump(cookies, f, indent=2)
            logger.info(f"Saved cookies to {self.cookies_path}")
        except Exception as e:
            logger.error(f"Failed to save cookies: {e}")
    
    def load_cookies(self) -> Optional[List[Dict[str, Any]]]:
        """Load cookies from file"""
        try:
            if os.path.exists(self.cookies_path):
                with open(self.cookies_path, 'r') as f:
                    cookies = json.load(f)
                logger.info(f"Loaded cookies from {self.cookies_path}")
                return cookies
        except Exception as e:
            logger.error(f"Failed to load cookies: {e}")
        
        return None
    
    def extract_brands(self, text: str, brands: List[str]) -> List[str]:
        """Extract mentioned brands from text"""
        mentioned = []
        text_lower = text.lower()
        
        for brand in brands:
            # Case-insensitive search
            if brand.lower() in text_lower:
                mentioned.append(brand)
        
        return mentioned
    
    def human_like_typing(self, element, text: str):
        """Type text with human-like delays"""
        for char in text:
            element.send_keys(char)
            delay = random.uniform(0.05, 0.15)
            time.sleep(delay)
```

---

## STEP 4: ChatGPT Scraper with Undetected-Chromedriver (45 min)

```python
# app/scrapers/chatgpt_scraper.py
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from typing import List
from loguru import logger
from app.scrapers.base_scraper import BaseScraper, ScraperResponse
from app.config import settings
from app.database import db

class ChatGPTScraper(BaseScraper):
    """ChatGPT scraper using undetected-chromedriver"""
    
    def __init__(self):
        super().__init__('chatgpt')
        self.url = 'https://chat.openai.com'
    
    async def initialize(self) -> bool:
        """Initialize ChatGPT scraper"""
        try:
            logger.info("🚀 Initializing ChatGPT scraper with undetected-chromedriver...")
            
            # Configure Chrome options
            options = uc.ChromeOptions()
            
            if settings.HEADLESS:
                options.add_argument('--headless=new')
            
            # Anti-detection options
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            
            # Random user agent
            options.add_argument(
                'user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
            
            if settings.PROXY_URL:
                options.add_argument(f'--proxy-server={settings.PROXY_URL}')
            
            # Launch undetected Chrome
            self.driver = uc.Chrome(options=options, version_main=120)
            
            logger.info("✅ Browser launched successfully")
            
            # Navigate to ChatGPT
            logger.info(f"🌐 Navigating to {self.url}...")
            self.driver.get(self.url)
            self.random_delay(3, 5)
            
            # Try to load cookies
            cookies = self.load_cookies()
            if cookies:
                for cookie in cookies:
                    try:
                        self.driver.add_cookie(cookie)
                    except Exception as e:
                        logger.debug(f"Could not add cookie: {e}")
                
                # Reload with cookies
                self.driver.get(self.url)
                self.random_delay(2, 4)
            
            # Check if logged in
            is_logged_in = await self.check_login_status()
            
            if not is_logged_in:
                logger.warning("⚠️  Not logged in to ChatGPT")
                logger.info("Please log in manually in the browser window...")
                logger.info("Waiting 90 seconds for manual login...")
                self.delay(90)
                
                # Save cookies after login
                cookies = self.driver.get_cookies()
                self.save_cookies(cookies)
                await db.save_session('chatgpt', cookies)
                logger.success("✅ Cookies saved!")
            else:
                logger.success("✅ Already logged in!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            return False
    
    async def query(self, prompt: str, brands: List[str]) -> ScraperResponse:
        """Query ChatGPT"""
        if not self.driver:
            raise RuntimeError("Scraper not initialized")
        
        logger.info(f"\n💬 Querying ChatGPT: '{prompt[:50]}...'")
        
        try:
            # Enforce rate limiting
            self.enforce_rate_limit()
            
            # Wait for textarea
            logger.info("⏳ Waiting for chat input...")
            textarea = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.ID, "prompt-textarea"))
            )
            
            # Click to focus
            textarea.click()
            self.random_delay(0.5, 1)
            
            # Type prompt with human-like behavior
            logger.info("⌨️  Typing prompt...")
            self.human_like_typing(textarea, prompt)
            self.random_delay(0.5, 1.5)
            
            # Submit (press Enter)
            logger.info("📤 Submitting query...")
            textarea.submit()
            
            # Wait for response to start
            self.delay(3)
            
            # Wait for response to complete
            logger.info("⏳ Waiting for response...")
            response_complete = False
            max_wait = 120  # 2 minutes max
            start_time = time.time()
            
            while not response_complete and (time.time() - start_time) < max_wait:
                try:
                    # Check if "Stop generating" button exists
                    stop_buttons = self.driver.find_elements(
                        By.CSS_SELECTOR,
                        '[data-testid="stop-button"]'
                    )
                    
                    if len(stop_buttons) == 0:
                        response_complete = True
                    else:
                        self.delay(1)
                        
                except Exception:
                    response_complete = True
            
            if not response_complete:
                logger.warning("⚠️  Response took too long, extracting what we have...")
            
            logger.success("✅ Response complete!")
            self.random_delay(1, 2)
            
            # Extract response text
            response_text = self.driver.execute_script("""
                const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
                if (messages.length === 0) return '';
                const lastMessage = messages[messages.length - 1];
                return lastMessage.textContent || '';
            """)
            
            if not response_text:
                logger.warning("⚠️  Could not extract response text")
                response_text = "No response extracted"
            
            # Get raw HTML for debugging
            raw_html = self.driver.page_source
            
            # Extract brands mentioned
            brands_mentioned = self.extract_brands(response_text, brands)
            
            logger.info(f"📊 Found {len(brands_mentioned)} brand(s): {', '.join(brands_mentioned)}")
            
            return ScraperResponse(
                text=response_text,
                brands_mentioned=brands_mentioned,
                raw_html=raw_html
            )
            
        except TimeoutException:
            logger.error("❌ Timeout waiting for elements")
            raise RuntimeError("ChatGPT query timeout")
        
        except Exception as e:
            logger.error(f"❌ Query failed: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("✅ Browser closed")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
    
    async def check_login_status(self) -> bool:
        """Check if logged in to ChatGPT"""
        try:
            # Look for textarea (only visible when logged in)
            self.driver.find_element(By.ID, "prompt-textarea")
            return True
        except:
            return False
```

---

## STEP 5: Gemini Scraper (30 min)

```python
# app/scrapers/gemini_scraper.py
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from typing import List
import time
from loguru import logger
from app.scrapers.base_scraper import BaseScraper, ScraperResponse
from app.config import settings
from app.database import db

class GeminiScraper(BaseScraper):
    """Gemini scraper using undetected-chromedriver"""
    
    def __init__(self):
        super().__init__('gemini')
        self.url = 'https://gemini.google.com'
    
    async def initialize(self) -> bool:
        """Initialize Gemini scraper"""
        try:
            logger.info("🚀 Initializing Gemini scraper...")
            
            options = uc.ChromeOptions()
            
            if settings.HEADLESS:
                options.add_argument('--headless=new')
            
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--window-size=1920,1080')
            
            self.driver = uc.Chrome(options=options, version_main=120)
            
            logger.info("🌐 Navigating to Gemini...")
            self.driver.get(self.url)
            self.random_delay(3, 5)
            
            # Load cookies
            cookies = self.load_cookies()
            if cookies:
                for cookie in cookies:
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass
                
                self.driver.get(self.url)
                self.random_delay(2, 4)
            
            # Check login
            is_logged_in = await self.check_login_status()
            
            if not is_logged_in:
                logger.warning("⚠️  Not logged in to Gemini")
                logger.info("Please log in manually...")
                logger.info("Waiting 90 seconds...")
                self.delay(90)
                
                cookies = self.driver.get_cookies()
                self.save_cookies(cookies)
                await db.save_session('gemini', cookies)
                logger.success("✅ Cookies saved!")
            else:
                logger.success("✅ Already logged in!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            return False
    
    async def query(self, prompt: str, brands: List[str]) -> ScraperResponse:
        """Query Gemini"""
        if not self.driver:
            raise RuntimeError("Scraper not initialized")
        
        logger.info(f"\n💬 Querying Gemini: '{prompt[:50]}...'")
        
        try:
            self.enforce_rate_limit()
            
            # Wait for input
            logger.info("⏳ Waiting for chat input...")
            input_selector = 'rich-textarea[aria-label*="prompt"]'
            input_element = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, input_selector))
            )
            
            # Click to focus
            input_element.click()
            self.random_delay(0.5, 1)
            
            # Type prompt
            logger.info("⌨️  Typing prompt...")
            # Get the actual input div inside rich-textarea
            editable_div = self.driver.find_element(
                By.CSS_SELECTOR,
                'rich-textarea .ql-editor'
            )
            self.human_like_typing(editable_div, prompt)
            self.random_delay(0.5, 1.5)
            
            # Submit
            logger.info("📤 Submitting query...")
            from selenium.webdriver.common.keys import Keys
            editable_div.send_keys(Keys.RETURN)
            
            # Wait for response
            self.delay(3)
            
            logger.info("⏳ Waiting for response...")
            response_complete = False
            max_wait = 120
            start_time = time.time()
            
            while not response_complete and (time.time() - start_time) < max_wait:
                try:
                    # Check if "Stop generating" button exists
                    stop_buttons = self.driver.find_elements(
                        By.CSS_SELECTOR,
                        'button[aria-label*="Stop"]'
                    )
                    
                    if len(stop_buttons) == 0:
                        response_complete = True
                    else:
                        self.delay(1)
                        
                except:
                    response_complete = True
            
            logger.success("✅ Response complete!")
            self.random_delay(1, 2)
            
            # Extract response
            response_text = self.driver.execute_script("""
                // Try multiple selectors for Gemini's response
                const selectors = [
                    '.model-response-text',
                    '[data-test-id="model-response"]',
                    '.response-container'
                ];
                
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        const lastElement = elements[elements.length - 1];
                        return lastElement.textContent || '';
                    }
                }
                
                // Fallback: get all text
                return document.body.innerText;
            """)
            
            if not response_text:
                logger.warning("⚠️  Could not extract response")
                response_text = "No response extracted"
            
            raw_html = self.driver.page_source
            brands_mentioned = self.extract_brands(response_text, brands)
            
            logger.info(f"📊 Found {len(brands_mentioned)} brand(s): {', '.join(brands_mentioned)}")
            
            return ScraperResponse(
                text=response_text,
                brands_mentioned=brands_mentioned,
                raw_html=raw_html
            )
            
        except TimeoutException:
            logger.error("❌ Timeout")
            raise RuntimeError("Gemini query timeout")
        
        except Exception as e:
            logger.error(f"❌ Query failed: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("✅ Browser closed")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
    
    async def check_login_status(self) -> bool:
        """Check if logged in"""
        try:
            self.driver.find_element(By.CSS_SELECTOR, 'rich-textarea')
            return True
        except:
            return False
```

---

## STEP 6: FastAPI Application (30 min)

```python
# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class QueryRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    brands: List[str] = Field(..., min_items=1, max_items=10)
    ai_source: str = Field(..., pattern="^(chatgpt|gemini|perplexity)$")

class QueryResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class ResponseData(BaseModel):
    id: str
    prompt: str
    ai_source: str
    response_text: str
    brands_mentioned: List[str]
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
```

```python
# app/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys
from app.models.schemas import QueryRequest, QueryResponse
from app.scrapers.chatgpt_scraper import ChatGPTScraper
from app.scrapers.gemini_scraper import GeminiScraper
from app.database import db
from app.config import settings

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO"
)
logger.add(
    f"{settings.LOG_PATH}/app.log",
    rotation="500 MB",
    level="DEBUG"
)

# Initialize FastAPI
app = FastAPI(
    title="AI Visibility Tracker - Scraping Service",
    description="Python backend for browser automation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global scraper instances (reuse for performance)
scrapers = {}

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting AI Visibility Tracker Scraping Service")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Headless mode: {settings.HEADLESS}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Shutting down scrapers...")
    for source, scraper in scrapers.items():
        try:
            await scraper.cleanup()
        except Exception as e:
            logger.error(f"Error cleaning up {source}: {e}")

@app.get("/")
async def root():
    return {
        "service": "AI Visibility Tracker - Scraping Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "scrapers": list(scrapers.keys())}

@app.post("/scrape", response_model=QueryResponse)
async def scrape_endpoint(request: QueryRequest):
    """
    Scrape AI platform with anti-detection
    
    Body:
    {
        "prompt": "What's the best CRM?",
        "brands": ["Salesforce", "HubSpot"],
        "ai_source": "chatgpt"
    }
    """
    try:
        logger.info(f"📥 Received scrape request for {request.ai_source}")
        
        # Create database record
        response_record = await db.create_response(
            prompt_text=request.prompt,
            ai_source=request.ai_source,
            brands=request.brands
        )
        
        if not response_record:
            raise HTTPException(status_code=500, detail="Database error")
        
        response_id = response_record['id']
        
        # Get or create scraper
        scraper = None
        
        try:
            if request.ai_source not in scrapers:
                    logger.info(f"Creating new {request.ai_source} scraper...")
                
                if request.ai_source == 'chatgpt':
                    scraper = ChatGPTScraper()
                elif request.ai_source == 'gemini':
                    scraper = GeminiScraper()
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported AI source: {request.ai_source}"
                    )
                
                # Initialize scraper
                success = await scraper.initialize()
                if not success:
                    raise RuntimeError("Scraper initialization failed")
                
                # Cache scraper for reuse
                scrapers[request.ai_source] = scraper
            else:
                logger.info(f"Reusing existing {request.ai_source} scraper")
                scraper = scrapers[request.ai_source]
            
            # Execute query
            result = await scraper.query(request.prompt, request.brands)
            
            # Update database
            await db.update_response(
                response_id=response_id,
                response_text=result.text,
                brands_mentioned=result.brands_mentioned,
                status='completed'
            )
            
            return QueryResponse(
                success=True,
                data={
                    "id": response_id,
                    "prompt": request.prompt,
                    "ai_source": request.ai_source,
                    "response": result.text,
                    "brands_mentioned": result.brands_mentioned
                }
            )
            
        except Exception as scraper_error:
            logger.error(f"❌ Scraper error: {scraper_error}")
            
            # Update database with error
            await db.update_response(
                response_id=response_id,
                response_text="",
                brands_mentioned=[],
                status='failed',
                error_message=str(scraper_error)
            )
            
            # Remove failed scraper from cache
            if request.ai_source in scrapers:
                try:
                    await scrapers[request.ai_source].cleanup()
                except:
                    pass
                del scrapers[request.ai_source]
            
            raise HTTPException(
                status_code=500,
                detail=f"Scraping failed: {str(scraper_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/responses/{response_id}")
async def get_response(response_id: str):
    """Get response by ID"""
    result = await db.get_response(response_id)
    if not result:
        raise HTTPException(status_code=404, detail="Response not found")
    
    return {"success": True, "data": result}

@app.get("/responses")
async def list_responses(
    ai_source: Optional[str] = None,
    status: Optional[str] = None
):
    """List all responses with optional filters"""
    # This would need a new method in db.py
    return {"success": True, "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
```

---

## STEP 7: Run and Test (15 min)

### 7.1 Start the Server
```bash
# Activate virtual environment
source venv/bin/activate

# Run the server
python -m app.main

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```plaintext
🚀 Starting AI Visibility Tracker Scraping Service
Environment: development
Headless mode: False
INFO:     Uvicorn running on http://0.0.0.0:8000
```
```

### 7.2 Test with Postman

#### Test 1: Health Check

```http
GET http://localhost:8000/health
```

Response:

```json
{
  "status": "healthy",
  "scrapers": []
}
```

#### Test 2: Scrape ChatGPT

```http
POST http://localhost:8000/scrape
Content-Type: application/json

{
  "prompt": "What's the best CRM software for startups?",
  "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday.com"],
  "ai_source": "chatgpt"
}
```

**What happens:**
1. Browser window opens (non-headless)
2. First run: Prompts for manual login
3. After login: Saves cookies
4. Executes query
5. Returns response

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "prompt": "What's the best CRM software for startups?",
    "ai_source": "chatgpt",
    "response": "For startups, I'd recommend...",
    "brands_mentioned": ["HubSpot", "Pipedrive"]
  }
}
```

#### Test 3: Scrape Gemini

```http
POST http://localhost:8000/scrape
Content-Type: application/json

{
  "prompt": "Top 5 project management tools",
  "brands": ["Asana", "Monday.com", "Trello", "ClickUp", "Notion"],
  "ai_source": "gemini"
}
```

#### Test 4: Get Response

```http
GET http://localhost:8000/responses/{response-id}
```

---

## STEP 8: Connect to Next.js (20 min)

### 8.1 Next.js API Route
```typescript
// app/api/scrape/route.ts (in your Next.js project)
import { NextRequest, NextResponse } from 'next/server'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward request to Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Scraping failed' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
```

### 8.2 Test Integration

```http
POST http://localhost:3000/api/scrape
Content-Type: application/json

{
  "prompt": "Best email marketing tools",
  "brands": ["Mailchimp", "SendGrid", "ConvertKit"],
  "ai_source": "chatgpt"
}
```

---

## STEP 9: Production Deployment

### 9.1 Docker Setup

**Dockerfile**

```dockerfile
FROM python:3.11-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  python-scraper:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - HEADLESS=true
    volumes:
      - ./storage:/app/storage
      - ./logs:/app/logs
    restart: unless-stopped
```

### 9.2 Deploy to Railway/Render

**railway.json**

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Troubleshooting Guide

### Issue 1: "Chrome binary not found"
```bash
# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb
```

### Issue 2: "Session creation failed"
- Check Chrome version matches undetected-chromedriver
- Try: `uc.Chrome(version_main=None)` to auto-detect

### Issue 3: "Still getting detected"
- Use residential proxies
- Increase random delays
- Check if cookies are loading correctly
- Try different user agents

### Issue 4: "Timeout waiting for elements"
- Increase WebDriverWait timeout
- Inspect page to verify selectors
- Check if page structure changed

---

## Performance Optimization

### 1. Scraper Pooling
```python
# Instead of creating new scrapers, reuse them
from typing import Dict
import asyncio

class ScraperPool:
    def __init__(self, max_size: int = 3):
        self.pool: Dict[str, BaseScraper] = {}
        self.max_size = max_size
        self.lock = asyncio.Lock()
    
    async def get_scraper(self, ai_source: str) -> BaseScraper:
        async with self.lock:
            if ai_source not in self.pool:
                # Create new scraper
                pass
            return self.pool[ai_source]
```

### 2. Background Jobs with Celery
```python
# app/celery_app.py
from celery import Celery

celery_app = Celery(
    'scraper',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@celery_app.task
def scrape_task(prompt: str, brands: list, ai_source: str):
    # Run scraping in background
    pass
```

---

## Testing Checklist

- [ ] Health endpoint returns 200
- [ ] ChatGPT scraper initializes
- [ ] Can log in to ChatGPT (manual)
- [ ] Cookies persist between runs
- [ ] ChatGPT query returns response
- [ ] Brands correctly detected
- [ ] Gemini scraper works
- [ ] Rate limiting enforced
- [ ] Errors handled gracefully
- [ ] Database records created
- [ ] Next.js integration works

---

## Success Metrics

✅ **Anti-Detection**: Can run 50+ queries without blocks  
✅ **Session Persistence**: No manual login after first time  
✅ **Response Time**: <30 seconds per query  
✅ **Accuracy**: 90%+ brand detection rate  
✅ **Reliability**: <5% error rate  
✅ **Integration**: Works seamlessly with Next.js  

---

## Next Steps

1. Add Perplexity scraper (similar pattern)
2. Implement job queue (Celery + Redis)
3. Add more anti-detection techniques
4. Implement proxy rotation
5. Add captcha solving
6. Build monitoring dashboard
7. Add retry logic
8. Implement rate limit backoff

**Time Estimate**: 4-5 hours for complete MVP

Good luck! 🚀</parameter>