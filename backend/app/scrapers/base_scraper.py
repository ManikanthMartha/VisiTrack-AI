"""
Base scraper class with anti-detection capabilities and shared browser logic
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import random
import json
import os
import re
from loguru import logger
from app.config import settings
from app.database import db
from app.utils.proxy_manager import proxy_manager


class ScraperResponse:
    """Response from AI scraper containing text and brand mentions"""
    
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
    """
    Base class for all AI scrapers with anti-detection features
    
    Features:
    - Fresh browser per query
    - Cookie persistence
    - Random delays to mimic human behavior
    - Rate limiting
    - Advanced brand extraction with fuzzy matching
    - Shared browser initialization logic
    """
    
    # Subclasses must set these
    URL: str = ""
    LOGIN_SELECTOR: str = ""  # Selector that indicates user is logged in
    INPUT_SELECTOR: str = ""  # Selector for text input
    SEND_BUTTON_SELECTOR: str = ""  # Selector for send button
    RESPONSE_SELECTOR: str = ""  # Selector for response content
    
    def __init__(self, ai_source: str):
        """
        Initialize base scraper
        
        Args:
            ai_source: Name of AI platform (chatgpt, gemini, perplexity)
        """
        self.ai_source = ai_source
        self.driver = None
        self.cookies_path = os.path.join(
            settings.STORAGE_PATH,
            f"{ai_source}_cookies.json"
        )
        self.last_request_time = 0
        self._screenshot_thread = None
        self._stop_screenshots = False
        self._screenshot_dir = None
        
        # Ensure storage directory exists
        os.makedirs(settings.STORAGE_PATH, exist_ok=True)
        os.makedirs(settings.LOG_PATH, exist_ok=True)
    
    # ==================== BROWSER MANAGEMENT ====================
    
    def _start_screenshot_capture(self, interval: int = 2):
        """Start background thread to capture screenshots for debugging"""
        import threading
        from datetime import datetime
        
        def capture_screenshots():
            screenshot_num = 0
            while not self._stop_screenshots and self.driver:
                try:
                    screenshot_num += 1
                    timestamp = datetime.now().strftime("%H%M%S")
                    filename = f"debug_{screenshot_num:03d}_{timestamp}.png"
                    filepath = os.path.join(self._screenshot_dir, filename)
                    self.driver.save_screenshot(filepath)
                    logger.debug(f"📸 Screenshot saved: {filename}")
                except Exception as e:
                    logger.debug(f"Screenshot error: {e}")
                time.sleep(interval)
        
        if settings.HEADLESS:  # Only in headless mode
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self._screenshot_dir = os.path.join(
                settings.STORAGE_PATH, 
                "debug", 
                self.ai_source, 
                timestamp
            )
            os.makedirs(self._screenshot_dir, exist_ok=True)
            
            self._stop_screenshots = False
            self._screenshot_thread = threading.Thread(target=capture_screenshots, daemon=True)
            self._screenshot_thread.start()
            logger.info(f"📸 Screenshot capture started: {self._screenshot_dir}")
    
    def _stop_screenshot_capture(self):
        """Stop background screenshot capture"""
        self._stop_screenshots = True
        if self._screenshot_thread:
            self._screenshot_thread.join(timeout=2)
            logger.info("📸 Screenshot capture stopped")
    
    async def initialize(self, load_cookies: bool = True) -> bool:
        """
        Initialize scraper with undetected Chrome browser
        
        Args:
            load_cookies: Whether to load saved cookies (default: True)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"🚀 Initializing {self.ai_source} scraper with undetected-chromedriver...")
            
            # Validate proxy configuration
            if not self._setup_proxy():
                return False
            
            # Configure and launch browser
            options = self._get_chrome_options()
            
            logger.info("🌐 Launching Chrome browser...")
            # Get Chrome version and use it explicitly to avoid version mismatches
            try:
                import re
                import subprocess
                result = subprocess.run(
                    ['reg', 'query', 'HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon', '/v', 'version'],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0:
                    match = re.search(r'version\s+REG_SZ\s+(\d+)', result.stdout)
                    if match:
                        chrome_version = int(match.group(1))
                        logger.info(f"🔍 Detected Chrome version: {chrome_version}")
                        # Headless mode needs additional settings
                        if settings.HEADLESS:
                            self.driver = uc.Chrome(
                                options=options, 
                                version_main=chrome_version,
                                headless=True,
                                use_subprocess=True
                            )
                        else:
                            self.driver = uc.Chrome(options=options, version_main=chrome_version)
                    else:
                        self.driver = uc.Chrome(options=options, headless=settings.HEADLESS)
                else:
                    self.driver = uc.Chrome(options=options, headless=settings.HEADLESS)
            except Exception as version_error:
                logger.warning(f"⚠️ Could not detect Chrome version: {version_error}, using auto-detect")
                try:
                    self.driver = uc.Chrome(options=options, headless=settings.HEADLESS)
                except Exception as uc_error:
                    logger.error(f"❌ Failed to launch with undetected-chromedriver: {uc_error}")
                    logger.info("⚙️ Trying standard ChromeDriver as fallback...")
                    from selenium import webdriver
                    service = webdriver.ChromeService()
                    self.driver = webdriver.Chrome(service=service, options=options)
            logger.success("✅ Browser launched successfully!")
            
            # Start screenshot capture for debugging (headless only)
            self._start_screenshot_capture(interval=5)
            
            # Navigate to AI platform
            logger.info(f"🌐 Navigating to {self.URL}...")
            self.driver.get(self.URL)
            self.random_delay(3, 5)
            
            # Load cookies if available
            if load_cookies:
                self._load_and_apply_cookies()
            
            # Check login status
            is_logged_in = await self.check_login_status()
            
            if not is_logged_in and load_cookies:
                await self._handle_manual_login()
                is_logged_in = await self.check_login_status()
                if not is_logged_in:
                    logger.error("❌ Still not logged in. Please try again.")
                    return False
            elif is_logged_in:
                logger.success(f"✅ Already logged in to {self.ai_source}!")
            
            logger.success(f"🎉 {self.ai_source} scraper initialized successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _setup_proxy(self) -> bool:
        """Setup and validate proxy configuration"""
        if settings.USE_PROXY:
            if not settings.OXYLABS_USERNAME or not settings.OXYLABS_PASSWORD:
                logger.error("❌ USE_PROXY is True but Oxylabs credentials are missing!")
                return False
            
            logger.info("🔒 Proxy mode enabled")
            
            if not proxy_manager.test_proxy():
                logger.error("❌ Proxy connection test failed!")
                return False
        else:
            logger.warning("⚠️  WARNING: Running WITHOUT proxy!")
        
        return True
    
    def _get_chrome_options(self) -> uc.ChromeOptions:
        """Get configured Chrome options"""
        options = uc.ChromeOptions()
        
        # Headless mode
        if settings.HEADLESS:
            # Use old headless mode for better compatibility
            options.add_argument('--headless')
            options.add_argument('--disable-gpu')
            options.add_argument('--disable-software-rasterizer')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--no-sandbox')
            # Larger window for headless to ensure content loads
            options.add_argument('--window-size=1920,1080')
            logger.info("🕶️  Running in headless mode")
        else:
            logger.info("👁️  Running in visible mode")
            options.add_argument('--start-maximized')
        
        # Anti-detection options
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--no-sandbox')
        
        if not settings.HEADLESS:
            # Window size for visible mode
            options.add_argument('--window-size=1920,1080')
        
        # User agent
        options.add_argument(
            'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/144.0.0.0 Safari/537.36'
        )
        
        # Proxy extension (only in non-headless mode)
        # Extensions often fail in headless, use direct proxy instead
        if settings.USE_PROXY and not settings.HEADLESS:
            ext_path = proxy_manager.get_auth_extension_path()
            if ext_path:
                options.add_argument(f'--load-extension={ext_path}')
                logger.success("✅ Proxy authentication extension loaded")
        elif settings.USE_PROXY and settings.HEADLESS:
            # In headless mode, configure proxy differently
            proxy = proxy_manager.get_proxy_for_selenium()
            if proxy:
                options.add_argument(f'--proxy-server={proxy}')
                logger.info(f"🔒 Headless proxy configured: {proxy}")
        
        return options
    
    def _load_and_apply_cookies(self):
        """Load cookies from file and apply to browser"""
        cookies = self.load_cookies()
        if cookies:
            logger.info("🍪 Loading saved cookies...")
            
            # Clean cookies to fix domain issues
            current_domain = self.driver.execute_script("return document.domain")
            logger.debug(f"Current domain: {current_domain}")
            
            success_count = 0
            for cookie in cookies:
                try:
                    # Fix domain issues - remove domain or set to current domain
                    if 'domain' in cookie:
                        # If cookie domain doesn't match current domain, try to fix it
                        cookie_domain = cookie['domain']
                        if cookie_domain.startswith('.'):
                            cookie_domain = cookie_domain[1:]  # Remove leading dot
                        
                        # Check if current domain matches or is subdomain
                        if current_domain not in cookie_domain and cookie_domain not in current_domain:
                            logger.debug(f"Skipping cookie {cookie.get('name')} - domain mismatch")
                            continue
                    
                    # Remove sameSite if it's 'None' without secure flag (can cause issues)
                    if cookie.get('sameSite') == 'None' and not cookie.get('secure'):
                        cookie.pop('sameSite', None)
                    
                    self.driver.add_cookie(cookie)
                    success_count += 1
                except Exception as e:
                    logger.debug(f"Could not add cookie {cookie.get('name', 'unknown')}: {e}")
            
            logger.info(f"✅ Successfully loaded {success_count}/{len(cookies)} cookies")
            
            if success_count > 0:
                logger.info("🔄 Reloading page with cookies...")
                self.driver.get(self.URL)
                self.random_delay(2, 4)
    
    async def _handle_manual_login(self):
        """Handle manual login flow"""
        logger.warning(f"⚠️  Not logged in to {self.ai_source}")
        logger.info("=" * 60)
        logger.info("🔐 MANUAL LOGIN REQUIRED")
        logger.info("=" * 60)
        logger.info(f"Please log in to {self.ai_source} in the browser window.")
        logger.info("Waiting 90 seconds for you to log in...")
        logger.info("=" * 60)
        
        self.delay(90)
        
        # Save cookies after login
        logger.info("💾 Saving login session...")
        cookies = self.driver.get_cookies()
        self.save_cookies(cookies)
        
        await db.save_session(self.ai_source, cookies)
        logger.success("✅ Session cookies saved!")
    
    async def cleanup(self):
        """Close browser and cleanup resources"""
        # Stop screenshot capture first
        self._stop_screenshot_capture()
        
        if self.driver:
            try:
                logger.info("🧹 Closing browser...")
                self.driver.quit()
                self.driver = None
                logger.success("✅ Browser closed successfully")
            except Exception as e:
                logger.error(f"❌ Cleanup error: {e}")
    
    async def check_login_status(self) -> bool:
        """
        Check if currently logged in
        
        Returns:
            True if logged in, False otherwise
        """
        try:
            self.driver.find_element(By.CSS_SELECTOR, self.LOGIN_SELECTOR)
            logger.info("✅ Login status: Logged in")
            return True
        except NoSuchElementException:
            logger.info("ℹ️  Login status: Not logged in")
            return False
        except Exception as e:
            logger.warning(f"⚠️  Could not determine login status: {e}")
            return False
    
    # ==================== QUERY EXECUTION ====================
    
    async def query_with_fresh_browser(self, prompt: str, brands: List[str]) -> ScraperResponse:
        """
        Query AI with a FRESH browser instance (opens, queries, closes)
        
        Args:
            prompt: The question/prompt to send
            brands: List of brands to track in response
            
        Returns:
            ScraperResponse with AI's answer and brand mentions
        """
        logger.info("\n" + "="*80)
        logger.info(f"🆕 Starting FRESH BROWSER instance for {self.ai_source}")
        logger.info("="*80)
        
        try:
            success = await self.initialize(load_cookies=True)
            if not success:
                raise RuntimeError("Failed to initialize browser")
            
            result = await self.query(prompt, brands)
            
            logger.success("✅ Fresh browser session completed and closed")
            return result
            
        except Exception as e:
            logger.error(f"❌ Fresh browser query failed: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def query(self, prompt: str, brands: List[str]) -> ScraperResponse:
        """
        Query AI platform and extract response
        
        Args:
            prompt: The question/prompt to send
            brands: List of brands to track in response
            
        Returns:
            ScraperResponse with AI's answer and brand mentions
        """
        if not self.driver:
            raise RuntimeError("Scraper not initialized. Call initialize() first.")
        
        logger.info(f"\n{'='*60}")
        logger.info(f"💬 Querying {self.ai_source}")
        logger.info(f"📝 Prompt: '{prompt[:80]}{'...' if len(prompt) > 80 else ''}'")
        logger.info(f"🏷️  Tracking {len(brands)} brands")
        logger.info(f"{'='*60}\n")
        
        try:
            self.enforce_rate_limit()
            
            # Find and interact with input field
            input_field = self._find_input_field()
            self._enter_prompt(input_field, prompt)
            self._send_message(input_field)
            
            # Wait for and extract response
            self._wait_for_response()
            response_text = self._extract_response()
            
            # Get raw HTML for debugging
            raw_html = self.driver.page_source if settings.ENVIRONMENT == 'development' else None
            
            # Extract brands mentioned
            brands_mentioned = self.extract_brands(response_text, brands)
            
            logger.success(f"✅ Response extracted successfully!")
            logger.info(f"📝 Response length: {len(response_text)} characters")
            logger.info(f"🏷️  Brands mentioned: {', '.join(brands_mentioned) if brands_mentioned else 'None'}")
            logger.info(f"{'='*60}\n")
            
            return ScraperResponse(
                text=response_text,
                brands_mentioned=brands_mentioned,
                raw_html=raw_html
            )
            
        except TimeoutException:
            logger.error("❌ Timeout waiting for page elements")
            raise RuntimeError(f"{self.ai_source} query timeout")
        
        except Exception as e:
            logger.error(f"❌ Query failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def _find_input_field(self):
        """Find and return the input field element"""
        logger.info("⏳ Waiting for input field...")
        try:
            input_field = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.INPUT_SELECTOR))
            )
            logger.success("✅ Input field found!")
            return input_field
        except TimeoutException:
            logger.error("❌ Timeout waiting for input field")
            raise RuntimeError(f"{self.ai_source} input field not found")
    
    def _enter_prompt(self, input_field, prompt: str):
        """Enter prompt text into the input field"""
        logger.info("🖱️  Clicking on input field...")
        input_field.click()
        self.random_delay(0.5, 1)
        
        logger.info("⌨️  Typing prompt...")
        # Use JavaScript to set text in contenteditable divs
        self.driver.execute_script(
            "arguments[0].textContent = arguments[1];",
            input_field,
            prompt
        )
        # Trigger input event
        self.driver.execute_script(
            "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
            input_field
        )
        self.random_delay(0.5, 1.5)
    
    def _send_message(self, input_field):
        """Click send button or press Enter"""
        logger.info("📤 Finding send button...")
        try:
            send_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, self.SEND_BUTTON_SELECTOR))
            )
            logger.info("🖱️  Clicking send button...")
            send_button.click()
        except TimeoutException:
            logger.warning("⚠️ Send button not found, trying Enter key...")
            input_field.send_keys(Keys.RETURN)
    
    @abstractmethod
    def _wait_for_response(self):
        """Wait for AI response to complete (platform-specific)"""
        pass
    
    @abstractmethod
    def _extract_response(self) -> str:
        """Extract response text from page (platform-specific)"""
        pass
    
    # ==================== UTILITY METHODS ====================
    
    def delay(self, seconds: float):
        """Sleep for specified seconds"""
        time.sleep(seconds)
    
    def random_delay(self, min_sec: Optional[float] = None, max_sec: Optional[float] = None):
        """Sleep for random duration to mimic human behavior"""
        min_sec = min_sec or settings.RANDOM_DELAY_MIN
        max_sec = max_sec or settings.RANDOM_DELAY_MAX
        duration = random.uniform(min_sec, max_sec)
        logger.debug(f"💤 Sleeping for {duration:.2f}s")
        time.sleep(duration)
    
    def enforce_rate_limit(self):
        """Ensure rate limiting between requests"""
        if self.last_request_time == 0:
            self.last_request_time = time.time()
            return
            
        elapsed = time.time() - self.last_request_time
        if elapsed < settings.RATE_LIMIT_DELAY:
            wait_time = settings.RATE_LIMIT_DELAY - elapsed
            logger.info(f"⏱️  Rate limiting: waiting {wait_time:.0f}s before next request")
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    def save_cookies(self, cookies: List[Dict[str, Any]]):
        """Save cookies to local file for persistence"""
        try:
            with open(self.cookies_path, 'w') as f:
                json.dump(cookies, f, indent=2)
            logger.info(f"💾 Saved cookies to {self.cookies_path}")
        except Exception as e:
            logger.error(f"❌ Failed to save cookies: {e}")
    
    def load_cookies(self) -> Optional[List[Dict[str, Any]]]:
        """Load cookies from local file"""
        try:
            if os.path.exists(self.cookies_path):
                with open(self.cookies_path, 'r') as f:
                    cookies = json.load(f)
                logger.info(f"📂 Loaded {len(cookies)} cookies from {self.cookies_path}")
                return cookies
            else:
                logger.info(f"ℹ️  No cookies file found at {self.cookies_path}")
                return None
        except Exception as e:
            logger.error(f"❌ Failed to load cookies: {e}")
            return None
    
    # ==================== BRAND DETECTION ====================
    
    def extract_brands(self, text: str, brands: List[str]) -> List[str]:
        """
        Extract mentioned brands from text with advanced matching
        
        Features:
        - Case-insensitive matching
        - Handles brand name variations (e.g., "HubSpot" vs "Hub Spot")
        - Matches partial brand names in compound words
        - Handles common abbreviations and aliases
        
        Args:
            text: Response text to search
            brands: List of brand names to look for
            
        Returns:
            List of brands that were mentioned
        """
        if not text or not brands:
            return []
        
        mentioned = set()
        text_lower = text.lower()
        
        # Pre-process text: normalize whitespace and punctuation
        text_normalized = re.sub(r'[^\w\s]', ' ', text_lower)
        text_normalized = re.sub(r'\s+', ' ', text_normalized)
        
        for brand in brands:
            if self._is_brand_mentioned(text_lower, text_normalized, brand):
                mentioned.add(brand)
        
        return list(mentioned)
    
    def _is_brand_mentioned(self, text_lower: str, text_normalized: str, brand: str) -> bool:
        """
        Check if a brand is mentioned in the text using multiple strategies
        """
        brand_lower = brand.lower()
        
        # Strategy 1: Exact word boundary match
        pattern = r'\b' + re.escape(brand_lower) + r'\b'
        if re.search(pattern, text_lower):
            return True
        
        # Strategy 2: Match without spaces (e.g., "Hub Spot" matches "hubspot")
        brand_no_space = brand_lower.replace(' ', '')
        if len(brand_no_space) > 3:
            pattern = r'\b' + re.escape(brand_no_space) + r'\b'
            if re.search(pattern, text_normalized.replace(' ', '')):
                return True
        
        # Strategy 3: Match with flexible spacing (e.g., "HubSpot" matches "Hub Spot")
        brand_parts = brand_lower.split()
        if len(brand_parts) > 1:
            flexible_pattern = r'\b' + r'\s*'.join(re.escape(part) for part in brand_parts) + r'\b'
            if re.search(flexible_pattern, text_lower):
                return True
        
        # Strategy 4: Handle CamelCase brands (e.g., "HubSpot" -> "hub spot")
        camel_split = re.sub(r'([a-z])([A-Z])', r'\1 \2', brand).lower()
        if camel_split != brand_lower:
            pattern = r'\b' + re.escape(camel_split) + r'\b'
            if re.search(pattern, text_lower):
                return True
            # Also try without spaces
            pattern = r'\b' + re.escape(camel_split.replace(' ', '')) + r'\b'
            if re.search(pattern, text_normalized):
                return True
        
        # Strategy 5: Common variations and aliases
        variations = self._get_brand_variations(brand)
        for variation in variations:
            pattern = r'\b' + re.escape(variation.lower()) + r'\b'
            if re.search(pattern, text_lower):
                return True
        
        return False
    
    def _get_brand_variations(self, brand: str) -> List[str]:
        """Get common variations of a brand name"""
        variations = []
        brand_lower = brand.lower()
        
        # Common CRM/PM tool aliases
        aliases = {
            'salesforce': ['sfdc', 'sales force', 'salesforce.com'],
            'hubspot': ['hub spot', 'hubspot crm'],
            'zoho crm': ['zoho', 'zohocrm'],
            'pipedrive': ['pipe drive'],
            'freshsales': ['fresh sales', 'freshworks crm'],
            'monday crm': ['monday.com crm'],
            'monday.com': ['monday', 'mondaycom'],
            'sugarcrm': ['sugar crm', 'sugar'],
            'jira': ['jira software', 'atlassian jira'],
            'asana': ['asana.com'],
            'trello': ['trello.com'],
            'clickup': ['click up', 'clickup.com'],
            'notion': ['notion.so'],
            'linear': ['linear.app'],
            'basecamp': ['base camp'],
            'smartsheet': ['smart sheet'],
            'wrike': ['wrike.com'],
            'copper': ['copper crm'],
            'close': ['close crm', 'close.com'],
            'insightly': ['insightly crm'],
        }
        
        if brand_lower in aliases:
            variations.extend(aliases[brand_lower])
        
        # Check if brand ends with common suffixes and try without
        suffixes = [' crm', ' software', '.com', '.io', ' app']
        for suffix in suffixes:
            if brand_lower.endswith(suffix):
                variations.append(brand_lower[:-len(suffix)])
        
        return variations
