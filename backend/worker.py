"""
Background Worker for Continuous AI Scraping
Runs independently and continuously scrapes pending prompts
"""
import asyncio
from loguru import logger
from datetime import datetime
from typing import Optional
import sys

from app.database import db
from app.scrapers.chatgpt_scraper import ChatGPTScraper
from app.scrapers.gemini_scraper import GeminiScraper
from app.scrapers.perplexity_scraper import PerplexityScraper
from app.config import settings


class ScraperWorker:
    """
    Background worker that continuously scrapes prompts from the queue
    
    Uses fresh browser instances for each prompt to ensure clean state.
    """
    
    def __init__(self, ai_source: str):
        """
        Initialize worker for a specific AI platform
        
        Args:
            ai_source: AI platform name (chatgpt, gemini)
        """
        self.ai_source = ai_source
        self.is_running = False
        self.prompts_completed = 0
        self.errors = 0
        self.last_scrape_at: Optional[datetime] = None
        
        logger.info(f"🤖 Worker initialized for {ai_source}")
    
    async def process_prompt(self, prompt: dict) -> bool:
        """
        Process a single prompt with FRESH browser instance
        
        Args:
            prompt: Prompt dictionary from database
            
        Returns:
            True if successful, False otherwise
        """
        scraper = None
        response_record = None
        
        try:
            logger.info("\n" + "=" * 80)
            logger.info(f"🔄 Processing prompt: {prompt['id']}")
            logger.info(f"📝 Text: {prompt['text'][:80]}...")
            logger.info("=" * 80)
            
            # Get brands for this category
            brands = await db.get_brand_names(prompt['category_id'])
            if not brands:
                logger.warning(f"⚠️ No brands found for category: {prompt['category_id']}")
                return False
            
            logger.info(f"🏷️  Tracking {len(brands)} brands")
            
            # Create response record
            response_record = await db.create_response(
                prompt_id=prompt['id'],
                prompt_text=prompt['text'],
                ai_source=self.ai_source
            )
            
            if not response_record:
                logger.error("❌ Failed to create response record")
                return False
            
            response_id = response_record['id']
            logger.info(f"✅ Created response record: {response_id}")
            
            # Create fresh scraper instance
            logger.info(f"🔧 Creating fresh {self.ai_source} scraper instance...")
            if self.ai_source == 'chatgpt':
                scraper = ChatGPTScraper()
            elif self.ai_source == 'gemini':
                scraper = GeminiScraper()
            elif self.ai_source == 'perplexity':
                scraper = PerplexityScraper()
            else:
                logger.error(f"❌ Unsupported AI source: {self.ai_source}")
                return False
            
            # Execute query with fresh browser (opens, queries, closes automatically)
            logger.info("🔍 Querying AI platform with fresh browser...")
            result = await scraper.query_with_fresh_browser(prompt['text'], brands)
            
            # Update database
            await db.update_response(
                response_id=response_id,
                response_text=result.text,
                brands_mentioned=result.brands_mentioned,
                status='completed',
                raw_html=result.raw_html
            )
            
            logger.success(f"✅ Prompt processed successfully")
            logger.success(f"📊 Response: {len(result.text)} chars")
            logger.success(f"🏷️  Brands mentioned: {', '.join(result.brands_mentioned) if result.brands_mentioned else 'None'}")
            
            self.prompts_completed += 1
            self.last_scrape_at = datetime.now()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error processing prompt: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            self.errors += 1
            
            # Try to update database with error
            try:
                if response_record:
                    await db.update_response(
                        response_id=response_record['id'],
                        response_text="",
                        brands_mentioned=[],
                        status='failed',
                        error_message=str(e)
                    )
            except:
                pass
            
            return False
        
        finally:
            # Ensure browser cleanup even if error occurred
            if scraper:
                try:
                    await scraper.cleanup()
                except:
                    pass
    
    async def run(self, category_id: Optional[str] = None, max_iterations: Optional[int] = None):
        """
        Main worker loop - continuously processes pending prompts
        
        Each prompt is processed with a fresh browser instance.
        
        Args:
            category_id: Optional category filter (None = all categories)
            max_iterations: Max number of iterations (None = run forever)
        """
        logger.info("=" * 80)
        logger.info(f"🚀 Starting {self.ai_source} worker")
        logger.info(f"🌐 Fresh browser per prompt: ENABLED")
        logger.info(f"📂 Category filter: {category_id or 'All categories'}")
        logger.info(f"🔄 Max iterations: {max_iterations or 'Unlimited'}")
        logger.info("=" * 80)
        
        self.is_running = True
        iteration = 0
        
        try:
            while self.is_running:
                iteration += 1
                
                logger.info(f"\n{'='*80}")
                logger.info(f"🔄 Iteration {iteration}")
                logger.info(f"✅ Completed: {self.prompts_completed} | ❌ Errors: {self.errors}")
                logger.info(f"{'='*80}")
                
                # Get pending prompts (haven't been scraped in last 2 hours)
                pending_prompts = await db.get_pending_prompts(
                    ai_source=self.ai_source,
                    category_id=category_id,
                    limit=15  # Process 15 prompts per iteration
                )
                
                if not pending_prompts:
                    logger.info("✨ No pending prompts - waiting 5 minutes before checking again...")
                    await asyncio.sleep(300)  # Wait 5 minutes
                    continue
                
                logger.info(f"📋 Found {len(pending_prompts)} pending prompts")
                
                # Process each prompt
                for prompt in pending_prompts:
                    if not self.is_running:
                        logger.info("🛑 Worker stopped")
                        break
                    
                    success = await self.process_prompt(prompt)
                    
                    if not success:
                        logger.warning("⚠️ Prompt processing failed, continuing...")
                    
                    # Small delay between prompts
                    logger.info("⏳ Waiting 30 seconds before next prompt...")
                    await asyncio.sleep(30)
                
                # Check if we've reached max iterations
                if max_iterations and iteration >= max_iterations:
                    logger.info(f"✅ Reached max iterations ({max_iterations})")
                    break
                
                # Wait before next iteration
                logger.info("⏳ Iteration complete - waiting 1 minute before next cycle...")
                await asyncio.sleep(60)  # 1 minute between iterations
                
        except KeyboardInterrupt:
            logger.info("\n⚠️ Received interrupt signal")
        except Exception as e:
            logger.error(f"❌ Worker error: {e}")
            import traceback
            logger.error(traceback.format_exc())
        finally:
            self.is_running = False
            await self.cleanup()
    
    async def stop(self):
        """Stop the worker gracefully"""
        logger.info(f"🛑 Stopping {self.ai_source} worker...")
        self.is_running = False
    
    async def cleanup(self):
        """Cleanup resources (no persistent scraper to cleanup)"""
        logger.info("=" * 80)
        logger.info(f"📊 WORKER SUMMARY - {self.ai_source}")
        logger.info(f"✅ Prompts completed: {self.prompts_completed}")
        logger.info(f"❌ Errors: {self.errors}")
        logger.info(f"🕐 Last scrape: {self.last_scrape_at}")
        logger.info(f"🌐 Fresh browser used for each prompt")
        logger.info("=" * 80)


async def main():
    """
    Run workers for both ChatGPT, Gemini and Perplexity based on command-line args
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Scraping Background Worker')
    parser.add_argument(
        '--ai-source',
        choices=['chatgpt', 'gemini', 'perplexity', 'all'],
        default='all',
        help='Which AI platform to scrape'
    )
    parser.add_argument(
        '--category',
        type=str,
        help='Category ID to scrape (optional)'
    )
    parser.add_argument(
        '--max-iterations',
        type=int,
        help='Maximum number of iterations (optional, default: unlimited)'
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 80)
    logger.info("🤖 AI SCRAPING BACKGROUND WORKER")
    logger.info("=" * 80)
    logger.info(f"AI Source: {args.ai_source}")
    logger.info(f"Category: {args.category or 'All'}")
    logger.info(f"Max Iterations: {args.max_iterations or 'Unlimited'}")
    logger.info("=" * 80)
    
    workers = []
    
    try:
        if args.ai_source in ['chatgpt', 'all']:
            worker = ScraperWorker('chatgpt')
            workers.append(worker.run(args.category, args.max_iterations))
        
        if args.ai_source in ['gemini', 'all']:
            worker = ScraperWorker('gemini')
            workers.append(worker.run(args.category, args.max_iterations))
        
        if args.ai_source in ['perplexity', 'all']:
            worker = ScraperWorker('perplexity')
            workers.append(worker.run(args.category, args.max_iterations))
        
        # Run all workers concurrently
        await asyncio.gather(*workers)
        
    except KeyboardInterrupt:
        logger.info("\n⚠️ Shutting down workers...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        import traceback
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
