"""
Perplexity scraper using undetected-chromedriver for anti-detection
"""
import time
import random
from loguru import logger
from app.scrapers.base_scraper import BaseScraper
from app.config import settings


class PerplexityScraper(BaseScraper):
    """
    Perplexity scraper using undetected-chromedriver
    
    Inherits all browser management, cookie handling, and brand detection
    from BaseScraper. Only implements Perplexity-specific response handling.
    """
    
    # Platform-specific selectors
    URL = 'https://www.perplexity.ai'
    LOGIN_SELECTOR = 'div[contenteditable="true"][id="ask-input"]'
    INPUT_SELECTOR = 'div[contenteditable="true"][id="ask-input"]'
    SEND_BUTTON_SELECTOR = 'button[aria-label="Submit"]'
    RESPONSE_SELECTOR = 'div[id^="markdown-content-"] .prose'
    
    def __init__(self):
        super().__init__('perplexity')
    
    def _enter_prompt(self, input_field, prompt: str):
        """
        Override: Perplexity uses Lexical editor which needs special handling
        """
        logger.info("🖱️  Focusing on input field...")
        
        # Scroll into view and click
        self.driver.execute_script("arguments[0].scrollIntoView(true);", input_field)
        self.delay(0.5)
        
        # Click to focus
        input_field.click()
        self.delay(0.5)
        
        # Clear any existing content
        try:
            self.driver.execute_script("""
                const editor = arguments[0];
                editor.textContent = '';
                editor.innerHTML = '<p><br></p>';
                editor.focus();
            """, input_field)
            self.delay(0.3)
        except Exception as e:
            logger.debug(f"Clear content failed: {e}")
        
        logger.info("⌨️  Typing prompt using send_keys...")
        
        # Use Selenium's send_keys which triggers proper keyboard events
        try:
            # Focus again
            input_field.click()
            self.delay(0.2)
            
            # Type the prompt
            input_field.send_keys(prompt)
            
            logger.success("✅ Finished typing prompt")
            self.random_delay(0.5, 1)
            
        except Exception as e:
            logger.error(f"❌ send_keys failed: {e}")
            
            # Fallback: Try ActionChains
            logger.info("� Trying ActionChains...")
            try:
                from selenium.webdriver.common.action_chains import ActionChains
                
                actions = ActionChains(self.driver)
                actions.move_to_element(input_field)
                actions.click()
                actions.pause(0.3)
                actions.send_keys(prompt)
                actions.perform()
                
                logger.success("✅ ActionChains succeeded")
                self.random_delay(0.5, 1)
                
            except Exception as e2:
                logger.error(f"❌ ActionChains also failed: {e2}")
                raise RuntimeError("Could not enter text into Perplexity input field")
    
    def _send_message(self, input_field):
        """
        Override: Perplexity send button handling
        """
        logger.info("📤 Looking for send button...")
        
        # Wait a moment for the button to become enabled
        self.delay(1)
        
        # Check if text was actually entered
        text_content = self.driver.execute_script("""
            const editor = arguments[0];
            return editor.textContent || editor.innerText || '';
        """, input_field)
        
        logger.info(f"📝 Text in editor: '{text_content.strip()[:50]}...'")
        
        if not text_content.strip():
            logger.error("❌ No text in editor! Cannot send.")
            raise RuntimeError("Text was not entered into the editor")
        
        try:
            # Find the send button
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.by import By
            
            send_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, self.SEND_BUTTON_SELECTOR))
            )
            
            logger.info("🖱️  Clicking send button...")
            
            # Try multiple click methods
            try:
                send_button.click()
                logger.success("✅ Clicked send button")
            except Exception as e:
                logger.warning(f"Regular click failed: {e}, trying JavaScript click...")
                self.driver.execute_script("arguments[0].click();", send_button)
                logger.success("✅ JavaScript click succeeded")
            
            self.delay(1)
            
        except Exception as e:
            logger.error(f"❌ Could not click send button: {e}")
            
            # Try to find any button that might be the send button
            logger.info("🔍 Looking for alternative send button...")
            try:
                buttons = self.driver.find_elements("css selector", "button")
                for btn in buttons:
                    aria_label = btn.get_attribute("aria-label")
                    if aria_label and "submit" in aria_label.lower():
                        logger.info(f"Found button with aria-label: {aria_label}")
                        btn.click()
                        logger.success("✅ Clicked alternative send button")
                        return
            except Exception as e2:
                logger.error(f"Alternative button search failed: {e2}")
            
            raise RuntimeError("Could not find or click send button")
    
    def _wait_for_response(self):
        """Wait for Perplexity to finish generating response"""
        if not self.driver:
            raise RuntimeError("Driver not initialized")
            
        self.delay(3)  # Initial delay for response to start
        
        logger.info("⏳ Waiting for Perplexity to finish responding...")
        max_wait = 120  # 2 minutes max
        start_time = time.time()
        
        while (time.time() - start_time) < max_wait:
            try:
                # Check for response container with markdown content
                response_containers = self.driver.find_elements(
                    "css selector",
                    'div[id^="markdown-content-"]'
                )
                
                if response_containers:
                    # Check if response has actual content (not just placeholder)
                    has_content = self.driver.execute_script("""
                        const containers = document.querySelectorAll('div[id^="markdown-content-"]');
                        if (containers.length === 0) return false;
                        
                        const lastContainer = containers[containers.length - 1];
                        const prose = lastContainer.querySelector('.prose');
                        if (!prose) return false;
                        
                        const text = prose.textContent || prose.innerText || '';
                        return text.trim().length > 10; // More than just a greeting
                    """)
                    
                    if has_content:
                        logger.success("✅ Response generation complete!")
                        break
                    
                    logger.debug("⏳ Still generating...")
                    self.delay(2)
                else:
                    logger.debug("⏳ Waiting for response to appear...")
                    self.delay(1)
                    
            except Exception:
                self.delay(1)
        else:
            logger.warning("⚠️ Response took too long, extracting what we have...")
        
        self.random_delay(1, 2)
    
    def _extract_response(self) -> str:
        """Extract the full response text from Perplexity"""
        if not self.driver:
            raise RuntimeError("Driver not initialized")
            
        logger.info("📊 Extracting response text...")
        
        # Use JavaScript to get ALL text content from the response
        response_text = self.driver.execute_script("""
            // Get all markdown content containers
            const containers = document.querySelectorAll('div[id^="markdown-content-"]');
            
            if (containers.length === 0) {
                return '';
            }
            
            // Get the last (most recent) response
            const lastContainer = containers[containers.length - 1];
            
            // Find the prose content inside it
            const prose = lastContainer.querySelector('.prose');
            if (prose) {
                // Get full innerHTML and extract all text properly
                const clone = prose.cloneNode(true);
                
                // Replace <br> with newlines
                clone.querySelectorAll('br').forEach(br => br.replaceWith('\\n'));
                
                // Replace block elements with newlines
                clone.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.prepend(document.createTextNode('\\n'));
                    el.append(document.createTextNode('\\n'));
                });
                
                // Get text content
                let text = clone.textContent || clone.innerText || '';
                
                // Clean up multiple newlines
                text = text.replace(/\\n{3,}/g, '\\n\\n').trim();
                
                // Filter out generic greetings if the response is too short
                if (text.length < 50 && (text.includes('Hi!') || text.includes('Hello') || text.includes('What\\'s up'))) {
                    return 'No substantive response extracted';
                }
                
                return text;
            }
            
            return '';
        """)
        
        if not response_text or response_text.strip() == '':
            logger.warning("⚠️ Could not extract response text. Trying alternative method...")
            
            # Alternative method
            try:
                # Try to get any text from markdown containers
                response_elements = self.driver.find_elements(
                    "css selector",
                    'div[id^="markdown-content-"] .prose p'
                )
                if response_elements:
                    response_text = '\n'.join([el.text for el in response_elements if el.text.strip()])
                    
                    # Filter out short generic responses
                    if len(response_text.strip()) < 20:
                        response_text = 'No substantive response extracted'
                else:
                    response_text = 'No response extracted'
            except Exception as e:
                logger.error(f"Alternative extraction failed: {e}")
                response_text = 'No response extracted'
        
        return response_text