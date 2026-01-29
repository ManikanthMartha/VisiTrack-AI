"""
Gemini scraper using undetected-chromedriver for anti-detection
"""
import time
from loguru import logger
from app.scrapers.base_scraper import BaseScraper
from app.config import settings


class GeminiScraper(BaseScraper):
    """
    Gemini (Google Bard) scraper using undetected-chromedriver
    
    Inherits all browser management, cookie handling, and brand detection
    from BaseScraper. Only implements Gemini-specific response handling.
    """
    
    # Platform-specific selectors
    URL = 'https://gemini.google.com'
    LOGIN_SELECTOR = 'div.ql-editor.textarea[contenteditable="true"]'
    INPUT_SELECTOR = 'div.ql-editor.textarea.new-input-ui[contenteditable="true"]'
    SEND_BUTTON_SELECTOR = 'button.send-button[aria-label="Send message"]'
    RESPONSE_SELECTOR = 'model-response .markdown.markdown-main-panel'
    
    def __init__(self):
        super().__init__('gemini')
    
    def _wait_for_response(self):
        """Wait for Gemini to finish generating response"""
        
        self.delay(3)  # Initial delay for response to start
        
        logger.info("⏳ Waiting for Gemini to finish responding...")
        max_wait = 120  # 2 minutes max
        start_time = time.time()
        
        while (time.time() - start_time) < max_wait:
            try:
                # Check for response container
                response_containers = self.driver.find_elements(
                    "css selector",
                    'model-response .markdown.markdown-main-panel'
                )
                
                if response_containers:
                    # Check if still generating (aria-busy="true")
                    is_busy = self.driver.execute_script("""
                        const containers = document.querySelectorAll('model-response .markdown');
                        if (containers.length === 0) return false;
                        const lastContainer = containers[containers.length - 1];
                        return lastContainer.getAttribute('aria-busy') === 'true';
                    """)
                    
                    if not is_busy:
                        logger.success("✅ Response generation complete!")
                        break
                    
                    logger.debug("⏳ Still generating...")
                    self.delay(1)
                else:
                    logger.debug("⏳ Waiting for response to appear...")
                    self.delay(1)
                    
            except Exception:
                self.delay(1)
        else:
            logger.warning("⚠️ Response took too long, extracting what we have...")
        
        self.random_delay(1, 2)
    
    def _extract_response(self) -> str:
        """Extract the full response text from Gemini"""
        logger.info("📊 Extracting response text...")
        
        # Use JavaScript to get ALL text content from the response
        response_text = self.driver.execute_script("""
            // Get all model-response elements
            const responses = document.querySelectorAll('model-response');
            
            if (responses.length === 0) {
                return '';
            }
            
            // Get the last (most recent) response
            const lastResponse = responses[responses.length - 1];
            
            // Find the markdown container inside it
            const markdown = lastResponse.querySelector('.markdown.markdown-main-panel');
            if (markdown) {
                // Get full innerHTML and extract all text properly
                const clone = markdown.cloneNode(true);
                
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
                
                return text;
            }
            
            return '';
        """)
        
        if not response_text or response_text.strip() == '':
            logger.warning("⚠️ Could not extract response text. Trying alternative method...")
            
            # Alternative method
            try:
                response_elements = self.driver.find_elements(
                    "css selector",
                    'model-response .markdown p'
                )
                if response_elements:
                    response_text = '\n'.join([el.text for el in response_elements])
                else:
                    response_text = 'No response extracted'
            except Exception as e:
                logger.error(f"Alternative extraction failed: {e}")
                response_text = 'No response extracted'
        
        return response_text
