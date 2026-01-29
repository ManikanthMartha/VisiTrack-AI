"""
AI Visibility Tracker - FastAPI Scraping Service
Main application entry point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys
from app.models.schemas import (
    QueryRequest, QueryResponse, HealthResponse,
    PromptScrapeRequest, Category, Brand, Prompt,
    VisibilityScore, CategoryAnalytics
)
from app.scrapers.chatgpt_scraper import ChatGPTScraper
from app.scrapers.gemini_scraper import GeminiScraper
from app.scrapers.perplexity_scraper import PerplexityScraper
from app.database import db
from app.config import settings

# Configure logging
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO",
    colorize=True
)
logger.add(
    f"{settings.LOG_PATH}/app.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}"
)

# Initialize FastAPI application
app = FastAPI(
    title="AI Visibility Tracker - Scraping Service",
    description="Python backend for browser automation and AI scraping with anti-detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - allows Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global scraper instances (reused for performance)
# Key: ai_source, Value: scraper instance
scrapers = {}


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("=" * 80)
    logger.info("🚀 Starting AI Visibility Tracker Scraping Service")
    logger.info("=" * 80)
    logger.info(f"📍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"👁️  Headless mode: {settings.HEADLESS}")
    logger.info(f"🔒 Anti-detection enabled: {settings.USE_STEALTH}")
    logger.info(f"⏱️  Rate limit delay: {settings.RATE_LIMIT_DELAY}s")
    logger.info(f"💾 Storage path: {settings.STORAGE_PATH}")
    logger.info(f"📝 Log path: {settings.LOG_PATH}")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("=" * 80)
    logger.info("👋 Shutting down scrapers...")
    logger.info("=" * 80)
    
    for source, scraper in scrapers.items():
        try:
            logger.info(f"Closing {source} scraper...")
            await scraper.cleanup()
        except Exception as e:
            logger.error(f"Error cleaning up {source}: {e}")
    
    logger.info("✅ Shutdown complete")


@app.get("/")
async def root():
    """Root endpoint - service information"""
    return {
        "service": "AI Visibility Tracker - Scraping Service",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        scrapers=list(scrapers.keys()),
        environment=settings.ENVIRONMENT
    )


@app.post("/scrape", response_model=QueryResponse)
async def scrape_endpoint(request: QueryRequest):
    """
    Main scraping endpoint - queries AI platform and extracts brand mentions
    
    Request body:
    ```json
    {
        "prompt": "What's the best CRM software for startups?",
        "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho"],
        "ai_source": "chatgpt"
    }
    ```
    
    Response:
    ```json
    {
        "success": true,
        "data": {
            "id": "uuid",
            "prompt": "What's the best CRM software?",
            "ai_source": "chatgpt",
            "response": "Here are some great CRM options...",
            "brands_mentioned": ["HubSpot", "Pipedrive"]
        }
    }
    ```
    """
    logger.info("\n" + "=" * 80)
    logger.info(f"📥 NEW SCRAPE REQUEST")
    logger.info(f"🤖 AI Source: {request.ai_source}")
    logger.info(f"📝 Prompt: {request.prompt[:100]}{'...' if len(request.prompt) > 100 else ''}")
    logger.info(f"🏷️  Tracking brands: {', '.join(request.brands)}")
    logger.info("=" * 80)
    
    try:
        # Create database record in 'processing' state
        # Note: For legacy endpoint, we create a response without linking to a prompt
        # The new /scrape/prompt endpoint should be used for proper tracking
        logger.info("💾 Creating database record (legacy mode - no prompt_id)...")
        
        # For backward compatibility, create a temporary prompt
        # In production, use /scrape/prompt endpoint instead
        temp_prompt = {
            'id': None,  # No prompt ID for legacy requests
            'text': request.prompt
        }
        
        # Create response without prompt_id (will fail if schema enforces it)
        # We'll need to handle this differently
        logger.warning("⚠️ Using legacy scrape endpoint - consider using /scrape/prompt instead")
        
        # Try to create response - this will fail with new schema that requires prompt_id
        # For now, skip database creation for legacy endpoint
        response_id = None
        logger.warning("⚠️ Database storage skipped for legacy endpoint")
        
        # For legacy mode, still allow scraping but without database tracking
        # In production, this endpoint should be deprecated in favor of /scrape/prompt
        
        # Get or create scraper instance
        scraper = None
        
        try:
            # Check if we already have a scraper for this AI source
            if request.ai_source not in scrapers:
                logger.info(f"🔧 Creating new {request.ai_source} scraper instance...")
                
                if request.ai_source == 'chatgpt':
                    scraper = ChatGPTScraper()
                elif request.ai_source == 'gemini':
                    scraper = GeminiScraper()
                elif request.ai_source == 'perplexity':
                    scraper = PerplexityScraper()
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported AI source: {request.ai_source}"
                    )
                
                # Initialize the scraper
                logger.info("🚀 Initializing scraper...")
                success = await scraper.initialize()
                
                if not success:
                    raise RuntimeError("Scraper initialization failed")
                
                # Cache the scraper for reuse
                scrapers[request.ai_source] = scraper
                logger.success(f"✅ {request.ai_source} scraper initialized and cached")
            else:
                # Reuse existing scraper
                logger.info(f"♻️  Reusing existing {request.ai_source} scraper")
                scraper = scrapers[request.ai_source]
            
            # Execute the query
            logger.info("🔍 Executing query...")
            result = await scraper.query(request.prompt, request.brands)
            
            # Skip database update for legacy endpoint
            logger.warning("⚠️ Database update skipped - use /scrape/prompt for full tracking")
            
            logger.success("=" * 80)
            logger.success("✅ SCRAPE REQUEST COMPLETED SUCCESSFULLY")
            logger.success(f"📊 Response length: {len(result.text)} chars")
            logger.success(f"🏷️  Brands found: {len(result.brands_mentioned)}")
            logger.success("=" * 80 + "\n")
            
            import uuid
            return QueryResponse(
                success=True,
                data={
                    "id": str(uuid.uuid4()),  # Generate a temporary ID for legacy endpoint
                    "prompt": request.prompt,
                    "ai_source": request.ai_source,
                    "response": result.text,
                    "brands_mentioned": result.brands_mentioned
                }
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
            
        except Exception as scraper_error:
            logger.error("=" * 80)
            logger.error(f"❌ SCRAPER ERROR: {scraper_error}")
            logger.error("=" * 80)
            
            # Skip database update for legacy endpoint
            logger.warning("⚠️ Database error tracking skipped for legacy endpoint")
            
            # Remove failed scraper from cache
            if request.ai_source in scrapers:
                try:
                    logger.info(f"🧹 Cleaning up failed {request.ai_source} scraper...")
                    await scrapers[request.ai_source].cleanup()
                except:
                    pass
                del scrapers[request.ai_source]
                logger.info(f"🗑️  Removed {request.ai_source} scraper from cache")
            
            raise HTTPException(
                status_code=500,
                detail=f"Scraping failed: {str(scraper_error)}"
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/responses/{response_id}")
async def get_response(response_id: str):
    """
    Get a specific response by ID
    
    Args:
        response_id: UUID of the response record
        
    Returns:
        Response data including prompt, AI response, and brand mentions
    """
    logger.info(f"📖 Fetching response: {response_id}")
    
    result = await db.get_response(response_id)
    
    if not result:
        logger.warning(f"⚠️  Response not found: {response_id}")
        raise HTTPException(status_code=404, detail="Response not found")
    
    logger.info(f"✅ Response found: {response_id}")
    return {"success": True, "data": result}


# ============= CATEGORY/BRAND/PROMPT ENDPOINTS =============

@app.get("/categories")
async def get_categories():
    """Get all categories"""
    categories = await db.get_categories()
    return {"success": True, "data": categories}


@app.get("/categories/{category_id}")
async def get_category(category_id: str):
    """Get a single category by ID"""
    logger.info(f"📂 Fetching category: {category_id}")
    category = await db.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "data": category}


@app.get("/categories/{category_id}/brands")
async def get_category_brands(category_id: str):
    """Get all brands in a category"""
    logger.info(f"🏷️  Fetching brands for category: {category_id}")
    brands = await db.get_brands(category_id)
    return {"success": True, "count": len(brands), "data": brands}


@app.get("/categories/{category_id}/prompts")
async def get_category_prompts(category_id: str):
    """Get all prompts in a category"""
    logger.info(f"📝 Fetching prompts for category: {category_id}")
    prompts = await db.get_prompts(category_id)
    return {"success": True, "count": len(prompts), "data": prompts}


@app.get("/categories/{category_id}/analytics")
async def get_category_analytics(category_id: str):
    """Get comprehensive analytics for a category"""
    logger.info(f"📊 Fetching analytics for category: {category_id}")
    analytics = await db.get_category_analytics(category_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "data": analytics}


@app.post("/scrape/prompt", response_model=QueryResponse)
async def scrape_prompt(request: PromptScrapeRequest):
    """
    Scrape a specific prompt by ID
    
    This endpoint fetches the prompt from the database,
    gets the brands for its category, and scrapes the AI platform.
    
    Request body:
    ```json
    {
        "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
        "ai_source": "chatgpt"
    }
    ```
    """
    logger.info("\n" + "=" * 80)
    logger.info(f"📥 NEW PROMPT SCRAPE REQUEST")
    logger.info(f"🆔 Prompt ID: {request.prompt_id}")
    logger.info(f"🤖 AI Source: {request.ai_source}")
    logger.info("=" * 80)
    
    try:
        # Fetch prompt from database
        prompt = await db.get_prompt(str(request.prompt_id))
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Get brands for this category
        brands = await db.get_brand_names(prompt['category_id'])
        if not brands:
            raise HTTPException(status_code=400, detail="No brands found for this category")
        
        logger.info(f"📝 Prompt: {prompt['text'][:100]}...")
        logger.info(f"🏷️  Tracking {len(brands)} brands in category: {prompt['category_id']}")
        
        # Create database record
        logger.info("💾 Creating database record...")
        response_record = await db.create_response(
            prompt_id=str(request.prompt_id),
            prompt_text=prompt['text'],
            ai_source=request.ai_source
        )
        
        if not response_record:
            raise HTTPException(status_code=500, detail="Database error creating record")
        
        response_id = response_record['id']
        logger.info(f"✅ Record created with ID: {response_id}")
        
        # Create fresh scraper instance (will be auto-cleaned after query)
        logger.info(f"🔧 Creating fresh {request.ai_source} scraper instance...")
        
        if request.ai_source == 'chatgpt':
            scraper = ChatGPTScraper()
        elif request.ai_source == 'gemini':
            scraper = GeminiScraper()
        elif request.ai_source == 'perplexity':
            scraper = PerplexityScraper()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported AI source: {request.ai_source}")
        
        # Execute query with fresh browser (opens, queries, closes)
        logger.info("🔍 Executing query with fresh browser...")
        result = await scraper.query_with_fresh_browser(prompt['text'], brands)
        
        # Update database
        await db.update_response(
            response_id=response_id,
            response_text=result.text,
            brands_mentioned=result.brands_mentioned,
            status='completed',
            raw_html=result.raw_html
        )
        
        logger.success("✅ PROMPT SCRAPE COMPLETED")
        
        return QueryResponse(
            success=True,
            data={
                "id": response_id,
                "prompt_id": str(request.prompt_id),
                "prompt": prompt['text'],
                "ai_source": request.ai_source,
                "response": result.text,
                "brands_mentioned": result.brands_mentioned
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/visibility/scores")
async def get_visibility_scores(category_id: str = None, ai_source: str = None): # type: ignore
    """
    Get brand visibility scores
    
    Query Parameters:
        category_id: Filter by category (optional)
        ai_source: Filter by AI source - chatgpt/gemini (optional, if None returns combined)
    """
    logger.info(f"📊 Fetching visibility scores (category={category_id}, ai_source={ai_source})")
    scores = await db.get_visibility_scores(category_id, ai_source)
    return {"success": True, "count": len(scores), "data": scores}


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting server with uvicorn...")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
