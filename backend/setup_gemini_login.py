"""
Gemini Login Setup Script
Run this ONCE to log in and save cookies for headless mode

Usage:
    python setup_gemini_login.py
"""
import asyncio
from loguru import logger
from app.scrapers.gemini_scraper import GeminiScraper
from app.config import settings


async def setup_login():
    """Open Gemini in visible mode, wait for login, and save cookies"""
    logger.info("=" * 80)
    logger.info("🤖 GEMINI LOGIN SETUP")
    logger.info("=" * 80)
    logger.info("This will open Gemini in a browser window.")
    logger.info("Please log in manually when the browser opens.")
    logger.info("Cookies will be saved for future headless use.")
    logger.info("=" * 80 + "\n")
    
    # Force visible mode and disable proxy temporarily for clean cookie capture
    original_headless = settings.HEADLESS
    original_proxy = settings.USE_PROXY
    settings.HEADLESS = False
    settings.USE_PROXY = False  # Disable proxy to avoid domain issues
    
    scraper = None
    try:
        scraper = GeminiScraper()
        
        # Initialize browser (don't load cookies since we're setting up)
        logger.info("🌐 Opening browser...")
        success = await scraper.initialize(load_cookies=False)
        
        if not success:
            logger.error("❌ Failed to initialize browser")
            return False
        
        logger.info("\n" + "=" * 80)
        logger.info("🔐 PLEASE LOG IN TO GEMINI")
        logger.info("=" * 80)
        logger.info("1. The browser window should now be open at gemini.google.com")
        logger.info("2. Log in with your Google account")
        logger.info("3. Wait until you see the Gemini chat interface")
        logger.info("4. This script will automatically save cookies in 90 seconds...")
        logger.info("=" * 80 + "\n")
        
        # Wait for user to log in
        await asyncio.sleep(90)
        
        # Save cookies
        logger.info("💾 Saving cookies...")
        cookies = scraper.driver.get_cookies()
        scraper.save_cookies(cookies)
        
        logger.success("✅ Cookies saved successfully!")
        logger.success(f"✅ Cookie file: {scraper.cookies_path}")
        
        # Verify login works
        logger.info("\n🔍 Verifying login status...")
        is_logged_in = await scraper.check_login_status()
        
        if is_logged_in:
            logger.success("✅ Login verified! You're all set!")
        else:
            logger.warning("⚠️  Could not verify login. You may need to run this again.")
            return False
        
        return True
        
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
        return False
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    finally:
        # Restore original settings
        settings.HEADLESS = original_headless
        settings.USE_PROXY = original_proxy
        
        if scraper:
            logger.info("\n⏳ Waiting 5 seconds before closing browser...")
            await asyncio.sleep(5)
            await scraper.cleanup()


if __name__ == "__main__":
    success = asyncio.run(setup_login())
    
    if success:
        logger.success("\n" + "=" * 80)
        logger.success("✅ GEMINI SETUP COMPLETE!")
        logger.success("=" * 80)
        logger.success("You can now run the worker in headless mode:")
        logger.success("  1. Set HEADLESS=True in your .env file")
        logger.success("  2. Run: python worker.py --ai-source gemini")
        logger.success("=" * 80)
    else:
        logger.error("\n" + "=" * 80)
        logger.error("❌ SETUP FAILED")
        logger.error("=" * 80)
        logger.error("Please run this script again and complete the login process.")
        logger.error("=" * 80)
