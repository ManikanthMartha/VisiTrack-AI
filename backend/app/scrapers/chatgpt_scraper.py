"""
ChatGPT scraper using undetected-chromedriver for anti-detection
"""
import time
from loguru import logger
from app.scrapers.base_scraper import BaseScraper
from app.config import settings


class ChatGPTScraper(BaseScraper):
    """
    ChatGPT scraper using undetected-chromedriver
    
    Inherits all browser management, cookie handling, and brand detection
    from BaseScraper. Only implements ChatGPT-specific response handling.
    """
    
    # Platform-specific selectors
    URL = 'https://chatgpt.com'
    LOGIN_SELECTOR = 'div[contenteditable="true"][id="prompt-textarea"]'
    INPUT_SELECTOR = 'div[contenteditable="true"][id="prompt-textarea"]'
    SEND_BUTTON_SELECTOR = 'button[data-testid="send-button"]'
    RESPONSE_SELECTOR = '[data-message-author-role="assistant"] .markdown'
    
    def __init__(self):
        super().__init__('chatgpt')
    
    def _wait_for_response(self):
        """Wait for ChatGPT to finish generating response"""
        logger.info("⏳ Waiting for ChatGPT to finish responding...")
        max_wait = 120  # 2 minutes max
        start_time = time.time()
        
        while (time.time() - start_time) < max_wait:
            # Check if "Stop generating" button exists (means still generating)
            stop_buttons = self.driver.find_elements(
                "css selector",
                'button[aria-label="Stop generating"]'
            )
            
            if len(stop_buttons) == 0:
                logger.success("✅ Response generation complete!")
                break
            
            logger.debug("⏳ Still generating... (waiting 1s)")
            self.delay(1)
        else:
            logger.warning("⚠️ Response took too long, extracting what we have...")
        
        self.random_delay(1, 2)
    
    def _extract_response(self) -> str:
        """Extract the full response text from ChatGPT with embedded URLs"""
        logger.info("📊 Extracting response text...")
        
        # Use JavaScript to get text content WITH URLs embedded
        response_text = self.driver.execute_script("""
            // Get all assistant messages
            const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
            
            if (messages.length === 0) {
                return '';
            }
            
            // Get the last (most recent) message
            const lastMessage = messages[messages.length - 1];
            
            // Try to get the markdown content div
            const markdownDiv = lastMessage.querySelector('.markdown');
            if (markdownDiv) {
                // Clone the element to manipulate it
                const clone = markdownDiv.cloneNode(true);
                
                // Replace links with text that includes the URL
                // Format: "link text (URL)"
                clone.querySelectorAll('a').forEach(link => {
                    const text = link.textContent || link.innerText || '';
                    const href = link.getAttribute('href') || '';
                    if (href) {
                        link.replaceWith(document.createTextNode(`${text} (${href})`));
                    }
                });
                
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
            
            // Fallback to full message text
            return lastMessage.textContent || lastMessage.innerText || '';
        """)
        
        if not response_text or response_text.strip() == '':
            logger.warning("⚠️ Could not extract response text. Trying alternative method...")
            
            # Alternative: Find elements directly
            try:
                assistant_messages = self.driver.find_elements(
                    "css selector",
                    '[data-message-author-role="assistant"]'
                )
                if assistant_messages:
                    response_text = assistant_messages[-1].text
                else:
                    response_text = 'No response extracted'
            except Exception as e:
                logger.error(f"Alternative extraction failed: {e}")
                response_text = 'No response extracted'
        
        return response_text
