"""
LLM-powered extraction of structured data from AI responses
Uses Google Gemini API to extract citations, context, sentiment, and keywords
"""
import json
from typing import List, Dict
from loguru import logger
from app.config import settings


class LLMExtractor:
    """
    Use Google Gemini API to extract structured data from AI responses
    
    Single LLM call extracts:
    - Citations per brand (URLs, titles, positions)
    - Context per brand (2-3 sentence summary)
    - Sentiment per brand (positive/neutral/negative)
    - Keywords per brand (key themes/topics)
    """
    
    def __init__(self):
        """Initialize Gemini API client"""
        if not settings.GOOGLE_API_KEY:
            logger.warning("⚠️ GOOGLE_API_KEY not set - LLM extraction disabled")
            self.client = None
            return
        
        try:
            # Use the new google-genai package
            from google import genai
            
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.model_name = settings.LLM_MODEL
            logger.info(f"✅ LLM extractor initialized with model: {self.model_name}")
        except ImportError:
            logger.error("❌ google-genai package not installed. Run: pip install google-genai")
            self.client = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM extractor: {e}")
            self.client = None
    
    def extract_all_data(
        self, 
        response_text: str, 
        brands_mentioned: List[str],
        prompt_text: str
    ) -> Dict:
        """
        Single LLM call to extract all structured data
        
        Args:
            response_text: The AI's response
            brands_mentioned: List of brands that were mentioned
            prompt_text: Original prompt for context
            
        Returns:
            {
                'brands': {
                    'Salesforce': {
                        'citations': [
                            {
                                'url': 'https://salesforce.com',
                                'title': 'Salesforce CRM Platform',
                                'position': 1
                            }
                        ],
                        'context': '2-3 sentence summary of how brand is mentioned',
                        'sentiment': 'positive',
                        'keywords': ['automation', 'enterprise', 'integration']
                    },
                    'HubSpot': { ... }
                }
            }
        """
        if not self.client:
            logger.warning("⚠️ LLM client not initialized - skipping extraction")
            return {'brands': {}}
        
        if not brands_mentioned:
            logger.info("ℹ️ No brands mentioned - skipping LLM extraction")
            return {'brands': {}}
        
        prompt = f"""
Extract structured data from this AI response about brand mentions.

PROMPT: "{prompt_text}"

RESPONSE:
{response_text}

BRANDS: {', '.join(brands_mentioned)}

For each brand, extract:
1. Citations: URLs in format "text (URL)" - extract URL, infer title, note position
2. Context: 2-3 sentence summary of how brand is mentioned
3. Sentiment: positive/neutral/negative
4. Keywords: 3-5 key themes

Return valid JSON only:
{{
  "brands": {{
    "BrandName": {{
      "citations": [{{"url": "https://...", "title": "...", "position": 1}}],
      "context": "2-3 sentence summary",
      "sentiment": "positive",
      "keywords": ["word1", "word2"]
    }}
  }}
}}

Rules:
- Empty citations array if no URLs
- Use "neutral" if sentiment unclear
- Only include actually mentioned brands
- Keep context concise (2-3 sentences max)
"""
        
        try:
            logger.info("🤖 Calling Gemini API for structured extraction...")
            logger.debug(f"Extracting data for brands: {', '.join(brands_mentioned)}")
            
            # Use the new API with response_mime_type for structured output
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    'temperature': 0.1,  # Low temperature for consistency
                    'top_p': 0.95,
                    'top_k': 40,
                    'max_output_tokens': 10000,  # Reduced to stay under free limits
                    'response_mime_type': 'application/json',  # Force JSON output
                }
            )
            
            # Get the text response
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            result = json.loads(result_text.strip())
            
            # Extract domain from URLs
            for brand_name, brand_data in result.get('brands', {}).items():
                for citation in brand_data.get('citations', []):
                    if 'url' in citation and 'domain' not in citation:
                        citation['domain'] = self.extract_domain(citation['url'])
            
            logger.success(f"✅ Extracted data for {len(result.get('brands', {}))} brands")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse LLM response as JSON: {e}")
            if hasattr(response, 'text'):
                logger.error(f"Full response text ({len(response.text)} chars):")
                logger.error(response.text)
            else:
                logger.error("Response text: N/A")
            return {'brands': {}}
            
        except Exception as e:
            logger.error(f"❌ LLM extraction failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {'brands': {}}
    
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            return parsed.netloc.replace('www.', '')
        except:
            return ''
