"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


# ============= Category Models =============

class CategoryBase(BaseModel):
    """Base category model"""
    id: str
    name: str
    description: Optional[str] = None


class Category(CategoryBase):
    """Category with timestamps"""
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryWithCounts(Category):
    """Category with brand and prompt counts"""
    brand_count: int
    prompt_count: int


# ============= Brand Models =============

class BrandBase(BaseModel):
    """Base brand model"""
    name: str
    category_id: str


class Brand(BrandBase):
    """Brand with ID"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class BrandWithStats(Brand):
    """Brand with visibility statistics"""
    category_name: str
    chatgpt_score: Optional[float] = None
    gemini_score: Optional[float] = None
    combined_score: Optional[float] = None
    total_mentions: int = 0


# ============= Prompt Models =============

class PromptBase(BaseModel):
    """Base prompt model"""
    text: str
    category_id: str


class Prompt(PromptBase):
    """Prompt with ID"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class PromptWithStatus(Prompt):
    """Prompt with scraping status"""
    chatgpt_scraped: bool = False
    gemini_scraped: bool = False
    last_scraped_at: Optional[datetime] = None


# ============= Scraping Models =============

class QueryRequest(BaseModel):
    """Request model for scraping endpoint"""
    prompt: str = Field(..., min_length=1, max_length=1000, description="The query to send to AI platform")
    brands: List[str] = Field(..., min_items=1, max_items=20, description="List of brands to track") # type: ignore
    ai_source: str = Field(..., pattern="^(chatgpt|gemini|perplexity)$", description="AI platform to query")
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "What's the best CRM software for startups?",
                "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho"],
                "ai_source": "chatgpt"
            }
        }


class PromptScrapeRequest(BaseModel):
    """Request to scrape a specific prompt by ID"""
    prompt_id: UUID
    ai_source: str = Field(..., pattern="^(chatgpt|gemini|perplexity)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
                "ai_source": "chatgpt"
            }
        }


class QueryResponse(BaseModel):
    """Response model for scraping endpoint"""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


class ResponseData(BaseModel):
    """Detailed response data from database"""
    id: UUID
    prompt_id: UUID
    prompt_text: str
    response_text: Optional[str] = None
    ai_source: str
    brands_mentioned: List[str] = []
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============= Analytics Models =============

class VisibilityScore(BaseModel):
    """Visibility score for a brand in a category"""
    brand_id: UUID
    brand_name: str
    category_id: str
    category_name: str
    ai_source: Optional[str] = None  # None for combined scores
    mention_count: int
    total_prompts: int
    visibility_score: float


class CategoryAnalytics(BaseModel):
    """Analytics for an entire category"""
    category_id: str
    category_name: str
    total_brands: int
    total_prompts: int
    total_responses: int
    chatgpt_responses: int
    gemini_responses: int
    completion_rate: float
    top_brands: List[BrandWithStats]


# ============= Worker Models =============

class WorkerStatus(BaseModel):
    """Background worker status"""
    worker_id: str
    ai_source: str
    status: str  # running, stopped, error
    prompts_pending: int
    prompts_completed: int
    last_scrape_at: Optional[datetime] = None
    error_message: Optional[str] = None


class WorkerControl(BaseModel):
    """Worker control request"""
    action: str = Field(..., pattern="^(start|stop|restart)$")
    ai_source: Optional[str] = Field(None, pattern="^(chatgpt|gemini|all)$")


# ============= Health Models =============

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    scrapers: List[str] = []
    environment: str
