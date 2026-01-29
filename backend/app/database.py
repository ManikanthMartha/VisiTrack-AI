"""
Supabase database client and operations
"""
from supabase import create_client, Client
from app.config import settings
from typing import Optional, List, Dict, Any
from uuid import UUID
from loguru import logger


class Database:
    """Supabase database wrapper for AI scraping operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        try:
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("✅ Supabase client initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise
    
    # ============= Category Operations =============
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all categories"""
        try:
            result = self.client.table('categories').select('*').execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching categories: {e}")
            return []
    
    async def get_category(self, category_id: str) -> Optional[Dict[str, Any]]:
        """Get a single category by ID"""
        try:
            result = self.client.table('categories').select('*').eq('id', category_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching category {category_id}: {e}")
            return None
    
    # ============= Brand Operations =============
    
    async def get_brands(self, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all brands, optionally filtered by category"""
        try:
            query = self.client.table('brands').select('*')
            if category_id:
                query = query.eq('category_id', category_id)
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching brands: {e}")
            return []
    
    async def get_brand_names(self, category_id: str) -> List[str]:
        """Get all brand names for a category"""
        brands = await self.get_brands(category_id)
        return [brand['name'] for brand in brands]
    
    # ============= Prompt Operations =============
    
    async def get_prompts(self, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all prompts, optionally filtered by category"""
        try:
            query = self.client.table('prompts').select('*')
            if category_id:
                query = query.eq('category_id', category_id)
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching prompts: {e}")
            return []
    
    async def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a single prompt by ID"""
        try:
            result = self.client.table('prompts').select('*').eq('id', prompt_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching prompt {prompt_id}: {e}")
            return None
    
    async def get_pending_prompts(
        self,
        ai_source: str,
        category_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get prompts that haven't been scraped recently by the specified AI source
        
        Args:
            ai_source: AI platform (chatgpt, gemini)
            category_id: Optional category filter
            limit: Maximum number of prompts to return
            
        Returns:
            List of prompts that need scraping
        """
        try:
            from datetime import datetime, timedelta
            
            # Calculate cutoff time (2 hours ago)
            cutoff_time = (datetime.utcnow() - timedelta(hours=2)).isoformat()
            
            # Get all prompts for category
            prompts = await self.get_prompts(category_id)
            
            # For each prompt, check if it has a recent response from this AI source
            pending = []
            for prompt in prompts:
                # Check if scraped in last 2 hours
                result = self.client.table('responses')\
                    .select('id, created_at')\
                    .eq('prompt_id', prompt['id'])\
                    .eq('ai_source', ai_source)\
                    .gte('created_at', cutoff_time)\
                    .execute()
                
                # If no recent scrape, add to pending list
                if not result.data or len(result.data) == 0:
                    pending.append(prompt)
                    
                if len(pending) >= limit:
                    break
            
            return pending
        except Exception as e:
            logger.error(f"❌ Error fetching pending prompts: {e}")
            return []
    
    # ============= Response Operations =============
    
    async def create_response(
        self,
        prompt_id: str,
        prompt_text: str,
        ai_source: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new response record in processing state
        
        Args:
            prompt_id: UUID of the prompt being scraped
            prompt_text: The prompt text
            ai_source: AI platform (chatgpt, gemini, perplexity)
            
        Returns:
            Created response record or None on error
        """
        try:
            result = self.client.table('responses').insert({
                'prompt_id': prompt_id,
                'prompt_text': prompt_text,
                'ai_source': ai_source,
                'brands_mentioned': [],
                'status': 'processing'
            }).execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"✅ Created response record: {result.data[0]['id']}") # type: ignore
                return result.data[0] # type: ignore
            else:
                logger.error("❌ No data returned from insert")
                return None
                
        except Exception as e:
            logger.error(f"❌ Database error creating response: {e}")
            return None
    
    async def update_response(
        self,
        response_id: str,
        response_text: str,
        brands_mentioned: List[str],
        status: str = 'completed',
        error_message: Optional[str] = None,
        raw_html: Optional[str] = None
    ) -> bool:
        """
        Update response with scraping results
        
        Args:
            response_id: UUID of response record
            response_text: The AI's response text
            brands_mentioned: List of brands found in response
            status: 'completed' or 'failed'
            error_message: Error message if failed
            raw_html: Raw HTML for debugging
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                'response_text': response_text,
                'brands_mentioned': brands_mentioned,
                'status': status,
                'completed_at': 'now()'
            }
            
            if error_message:
                update_data['error_message'] = error_message
            
            if raw_html:
                update_data['raw_html'] = raw_html
            
            result = self.client.table('responses').update(update_data).eq(
                'id', response_id
            ).execute()
            
            logger.info(f"✅ Updated response {response_id} with status: {status}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Update error for {response_id}: {e}")
            return False
    
    async def get_response(self, response_id: str) -> Optional[Dict[str, Any]]:
        """
        Get response by ID
        
        Args:
            response_id: UUID of response record
            
        Returns:
            Response record or None if not found
        """
        try:
            result = self.client.table('responses').select('*').eq(
                'id', response_id
            ).execute()
            
            if result.data and len(result.data) > 0:
                return dict(result.data[0])  # type: ignore
            else:
                logger.warning(f"⚠️  Response not found: {response_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Fetch error: {e}")
            return None
    
    async def save_session(
        self,
        ai_source: str,
        cookies: List[Dict[str, Any]]
    ) -> bool:
        """
        Save scraper session cookies to database
        
        Args:
            ai_source: AI platform name
            cookies: List of browser cookies
            
        Returns:
            True if successful
        """
        try:
            # Upsert session (insert or update if exists)
            result = self.client.table('scraper_sessions').upsert({
                'ai_source': ai_source,
                'cookies': cookies,
                'is_logged_in': True,
                'last_used_at': 'now()'
            }).execute()
            
            logger.info(f"✅ Saved session for {ai_source}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Session save error for {ai_source}: {e}")
            return False
    
    async def load_session(self, ai_source: str) -> Optional[List[Dict[str, Any]]]:
        """
        Load scraper session cookies from database
        
        Args:
            ai_source: AI platform name
            
        Returns:
            List of cookies or None if not found
        """
        try:
            result = self.client.table('scraper_sessions').select('cookies').eq(
                'ai_source', ai_source
            ).eq(
                'is_logged_in', True
            ).execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"✅ Loaded session for {ai_source}")
                return result.data[0]['cookies'] # type: ignore
            else:
                logger.info(f"ℹ️  No session found for {ai_source}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Session load error for {ai_source}: {e}")
            return None
    
    # ============= Analytics Operations =============
    
    async def get_visibility_scores(
        self,
        category_id: Optional[str] = None,
        ai_source: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get brand visibility scores
        
        Args:
            category_id: Optional category filter
            ai_source: Optional AI source filter (if None, returns combined scores)
            
        Returns:
            List of visibility scores
        """
        try:
            if ai_source:
                # Per-AI-source scores
                query = self.client.table('brand_visibility_stats').select('*')
                query = query.eq('ai_source', ai_source)
            else:
                # Combined scores across all AI sources
                query = self.client.table('brand_visibility_combined').select('*')
            
            if category_id:
                query = query.eq('category_id', category_id)
            
            result = query.order('visibility_score', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching visibility scores: {e}")
            return []
    
    async def get_category_analytics(self, category_id: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive analytics for a category
        
        Args:
            category_id: Category ID
            
        Returns:
            Analytics data including response counts, completion rates, top brands
        """
        try:
            # Get category info
            category = await self.get_category(category_id)
            if not category:
                return None
            
            # Get brands and prompts count
            brands = await self.get_brands(category_id)
            prompts = await self.get_prompts(category_id)
            
            # Get response counts
            responses = self.client.table('responses')\
                .select('id, ai_source, status')\
                .in_('prompt_id', [p['id'] for p in prompts])\
                .execute()
            
            total_responses = len(responses.data) if responses.data else 0
            chatgpt_responses = len([r for r in (responses.data or []) if r['ai_source'] == 'chatgpt'])
            gemini_responses = len([r for r in (responses.data or []) if r['ai_source'] == 'gemini'])
            completed = len([r for r in (responses.data or []) if r['status'] == 'completed'])
            
            # Calculate completion rate
            expected_responses = len(prompts) * 2  # 2 AI sources
            completion_rate = (completed / expected_responses * 100) if expected_responses > 0 else 0
            
            # Get top brands
            top_brands = await self.get_visibility_scores(category_id)
            
            return {
                'category_id': category_id,
                'category_name': category['name'],
                'total_brands': len(brands),
                'total_prompts': len(prompts),
                'total_responses': total_responses,
                'chatgpt_responses': chatgpt_responses,
                'gemini_responses': gemini_responses,
                'completion_rate': round(completion_rate, 2),
                'top_brands': top_brands[:10]  # Top 10 brands
            }
        except Exception as e:
            logger.error(f"❌ Error fetching category analytics: {e}")
            return None


# Global database instance
db = Database()
