# Feature Implementation Plan - AI Visibility Tracker

Based on analysis of Profound (tryprofound.com) and your requirements.

## Current Status

### ✅ Already Implemented
1. **AI Visibility Score** - Brand mention percentage per category
2. **Platform Scores** - Breakdown by ChatGPT, Gemini, Perplexity
3. **Leaderboard** - Brand rankings by visibility score
4. **Time-series Data** - Daily visibility tracking (last 30 days)
5. **Brand Tracking** - Multiple brands per category
6. **Prompt Tracking** - Store and track prompts

### 🔄 Partially Implemented
1. **Citation Share** - Using mention_rate, but needs refinement
2. **Prompts Tracked** - Data exists but not displayed

### ❌ Not Implemented
1. **Context Analysis** - Where/how brands are mentioned
2. **Prompt Breakdown** - Which prompts mention which brands
3. **Top Cited Pages/Sources** - Source attribution from AI responses
4. **Sentiment Analysis** - How AI describes brands
5. **Keyword Insights** - Key themes and topics

---

## Implementation Plan

## Phase 1: LLM-Powered Context & Citation Analysis (Week 1-2)

### Overview: Using Google Gemini API for Structured Extraction

Instead of manual regex parsing, we'll use Google Gemini API (free tier from AI Studio) to:
1. Extract citations with proper attribution
2. Extract brand mention contexts
3. Analyze sentiment
4. Extract keywords

**Benefits:**
- ✅ More accurate than regex
- ✅ Handles various citation formats
- ✅ Understands context better
- ✅ Can do multiple tasks in one call
- ✅ Easy to fine-tune with prompts
- ✅ Free tier available (Google AI Studio)

---

### 1.1 LLM-Powered Citation & Context Extraction

**Goal:** Single LLM call to extract all structured data from AI response

**Database Changes:**
```sql
-- Add citations table
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL, -- Which brand this citation is for
    url TEXT NOT NULL,
    title TEXT,
    domain TEXT,
    position INTEGER, -- Position in response (1st, 2nd, 3rd citation)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_citation_per_response_brand UNIQUE (response_id, brand_name, url)
);

CREATE INDEX idx_citations_response ON citations(response_id);
CREATE INDEX idx_citations_brand ON citations(brand_name);
CREATE INDEX idx_citations_domain ON citations(domain);

-- Add brand_mentions table for context
CREATE TABLE brand_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    context TEXT NOT NULL, -- 2-3 sentence context from LLM
    full_context TEXT, -- Full paragraph if needed
    position INTEGER, -- Position in response (character offset)
    sentiment VARCHAR(20), -- positive, neutral, negative
    keywords TEXT[], -- Key themes/topics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brand_mentions_response ON brand_mentions(response_id);
CREATE INDEX idx_brand_mentions_brand ON brand_mentions(brand_name);
CREATE INDEX idx_brand_mentions_sentiment ON brand_mentions(sentiment);

-- Add view for top cited sources per brand
CREATE OR REPLACE VIEW brand_top_citations AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    c.url,
    c.title,
    c.domain,
    COUNT(DISTINCT c.id) as citation_count,
    AVG(c.position) as avg_position,
    COUNT(DISTINCT r.id) as response_count
FROM brands b
INNER JOIN prompts p ON p.category_id = b.category_id
INNER JOIN responses r ON r.prompt_id = p.id 
    AND r.status = 'completed'
INNER JOIN citations c ON c.response_id = r.id AND c.brand_name = b.name
GROUP BY b.id, b.name, b.category_id, c.url, c.title, c.domain
ORDER BY citation_count DESC;
```

**Backend Changes:**
```python
# app/utils/llm_extractor.py
import google.generativeai as genai
from typing import List, Dict
import json
from loguru import logger
from app.config import settings

class LLMExtractor:
    """
    Use Google Gemini API to extract structured data from AI responses
    
    Single LLM call extracts:
    - Citations per brand
    - Context per brand
    - Sentiment per brand
    - Keywords per brand
    """
    
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')  # Fast & free
    
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
                        'full_context': 'Full paragraph mentioning the brand',
                        'sentiment': 'positive',
                        'keywords': ['automation', 'enterprise', 'integration']
                    },
                    'HubSpot': { ... }
                }
            }
        """
        
        prompt = f"""
You are analyzing an AI response to extract structured information about brand mentions.

ORIGINAL PROMPT: "{prompt_text}"

AI RESPONSE:
{response_text}

BRANDS MENTIONED: {', '.join(brands_mentioned)}

For EACH brand mentioned, extract the following information and return as JSON:

1. **Citations**: All URLs/sources cited in relation to this brand
   - Extract the URL
   - Extract or infer the title
   - Note the position (1st, 2nd, 3rd citation in the response)

2. **Context**: 
   - A 2-3 sentence summary of HOW and WHERE the brand is mentioned
   - The full paragraph or section mentioning the brand

3. **Sentiment**: How the brand is described
   - "positive" (recommended, praised, highlighted benefits)
   - "neutral" (just mentioned, factual)
   - "negative" (criticized, limitations mentioned)

4. **Keywords**: 3-5 key themes/topics associated with this brand in the response
   - e.g., ["automation", "enterprise", "integration"]

Return ONLY valid JSON in this exact format:
{{
  "brands": {{
    "BrandName": {{
      "citations": [
        {{
          "url": "https://example.com",
          "title": "Page Title",
          "position": 1
        }}
      ],
      "context": "2-3 sentence summary",
      "full_context": "Full paragraph mentioning the brand",
      "sentiment": "positive|neutral|negative",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }}
  }}
}}

IMPORTANT:
- If a brand has no citations, use empty array: "citations": []
- If you can't determine sentiment, use "neutral"
- Extract actual URLs from the response, don't make them up
- Be concise but accurate
"""
        
        try:
            logger.info("🤖 Calling Gemini API for structured extraction...")
            
            response = self.model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.1,  # Low temperature for consistency
                    'top_p': 0.95,
                    'top_k': 40,
                    'max_output_tokens': 2048,
                }
            )
            
            # Parse JSON response
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            result = json.loads(result_text.strip())
            
            logger.success(f"✅ Extracted data for {len(result.get('brands', {}))} brands")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response text: {response.text[:500]}")
            return {'brands': {}}
            
        except Exception as e:
            logger.error(f"❌ LLM extraction failed: {e}")
            return {'brands': {}}
    
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            return parsed.netloc.replace('www.', '')
        except:
            return ''


# app/database.py - Add new methods
class Database:
    # ... existing methods ...
    
    async def save_citations(
        self, 
        response_id: str, 
        brand_name: str,
        citations: List[Dict]
    ) -> bool:
        """
        Save citations for a brand in a response
        
        Args:
            response_id: UUID of response
            brand_name: Name of brand
            citations: List of citation dicts from LLM
        """
        try:
            for citation in citations:
                self.client.table('citations').insert({
                    'response_id': response_id,
                    'brand_name': brand_name,
                    'url': citation['url'],
                    'title': citation.get('title'),
                    'domain': citation.get('domain', ''),
                    'position': citation.get('position', 0)
                }).execute()
            
            logger.info(f"✅ Saved {len(citations)} citations for {brand_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving citations: {e}")
            return False
    
    async def save_brand_mention(
        self,
        response_id: str,
        brand_name: str,
        mention_data: Dict
    ) -> bool:
        """
        Save brand mention context from LLM
        
        Args:
            response_id: UUID of response
            brand_name: Name of brand
            mention_data: Dict with context, sentiment, keywords from LLM
        """
        try:
            self.client.table('brand_mentions').insert({
                'response_id': response_id,
                'brand_name': brand_name,
                'context': mention_data.get('context', ''),
                'full_context': mention_data.get('full_context', ''),
                'position': 0,  # Can be calculated if needed
                'sentiment': mention_data.get('sentiment', 'neutral'),
                'keywords': mention_data.get('keywords', [])
            }).execute()
            
            logger.info(f"✅ Saved mention context for {brand_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving brand mention: {e}")
            return False
    
    async def get_brand_citations(
        self, 
        brand_id: str, 
        limit: int = 10
    ) -> List[Dict]:
        """Get top citations for a brand"""
        try:
            # Get brand name first
            brand = await self.get_brand_details(brand_id)
            if not brand:
                return []
            
            result = self.client.table('brand_top_citations')\
                .select('*')\
                .eq('brand_id', brand_id)\
                .order('citation_count', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Error fetching brand citations: {e}")
            return []
    
    async def get_brand_contexts(
        self,
        brand_id: str,
        limit: int = 20
    ) -> List[Dict]:
        """Get example contexts where brand is mentioned"""
        try:
            # Get brand name first
            brand = await self.get_brand_details(brand_id)
            if not brand:
                return []
            
            result = self.client.table('brand_mentions')\
                .select('*')\
                .eq('brand_name', brand['name'])\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Error fetching brand contexts: {e}")
            return []


# In base_scraper.py or worker.py - After scraping response
from app.utils.llm_extractor import LLMExtractor

# After getting response and brands_mentioned
if result.brands_mentioned:
    extractor = LLMExtractor()
    
    # Single LLM call to extract everything
    extracted_data = extractor.extract_all_data(
        response_text=result.text,
        brands_mentioned=result.brands_mentioned,
        prompt_text=prompt_text
    )
    
    # Process each brand's data
    for brand_name, brand_data in extracted_data.get('brands', {}).items():
        # Save citations
        if brand_data.get('citations'):
            await db.save_citations(
                response_id=response_id,
                brand_name=brand_name,
                citations=brand_data['citations']
            )
        
        # Save mention context
        await db.save_brand_mention(
            response_id=response_id,
            brand_name=brand_name,
            mention_data=brand_data
        )
```

**Configuration:**
```python
# app/config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Google AI Studio API Key (free tier)
    GOOGLE_API_KEY: str = ""
    
    # LLM settings
    LLM_ENABLED: bool = True  # Toggle LLM extraction
    LLM_MODEL: str = "gemini-1.5-flash"  # Fast & free model
```

**Environment Variables:**
```bash
# backend/.env
GOOGLE_API_KEY=your_google_ai_studio_api_key_here
LLM_ENABLED=true
```

**API Endpoints:**
```python
@app.get("/brands/{brand_id}/citations")
async def get_brand_citations(brand_id: str, limit: int = 10):
    """Get top cited sources for a brand"""
    citations = await db.get_brand_citations(brand_id, limit)
    return {"success": True, "data": citations}

@app.get("/brands/{brand_id}/contexts")
async def get_brand_contexts(brand_id: str, limit: int = 20):
    """Get example contexts where brand is mentioned"""
    contexts = await db.get_brand_contexts(brand_id, limit)
    return {"success": True, "data": contexts}

@app.get("/brands/{brand_id}/sentiment")
async def get_brand_sentiment(brand_id: str):
    """Get sentiment breakdown for brand mentions"""
    # Get brand name
    brand = await db.get_brand_details(brand_id)
    if not brand:
        raise HTTPException(404, "Brand not found")
    
    # Query sentiment distribution
    result = db.client.table('brand_mentions')\
        .select('sentiment')\
        .eq('brand_name', brand['name'])\
        .execute()
    
    # Count sentiments
    from collections import Counter
    sentiments = Counter([m['sentiment'] for m in result.data])
    
    return {
        "success": True,
        "data": {
            "positive": sentiments.get('positive', 0),
            "neutral": sentiments.get('neutral', 0),
            "negative": sentiments.get('negative', 0),
            "total": len(result.data)
        }
    }

@app.get("/brands/{brand_id}/keywords")
async def get_brand_keywords(brand_id: str):
    """Get top keywords associated with brand"""
    # Get brand name
    brand = await db.get_brand_details(brand_id)
    if not brand:
        raise HTTPException(404, "Brand not found")
    
    # Get all keywords
    result = db.client.table('brand_mentions')\
        .select('keywords')\
        .eq('brand_name', brand['name'])\
        .execute()
    
    # Flatten and count
    from collections import Counter
    all_keywords = []
    for mention in result.data:
        if mention.get('keywords'):
            all_keywords.extend(mention['keywords'])
    
    keyword_counts = Counter(all_keywords)
    
    return {
        "success": True,
        "data": [
            {"keyword": k, "count": v}
            for k, v in keyword_counts.most_common(20)
        ]
    }
```

**Frontend:**
- Update SourcesList component to show real citations
- Add BrandContexts component to show example mentions
- Add sentiment pie chart
- Add keyword tag cloud

---

## Phase 2: Prompt Breakdown (Week 2-3)

### 2.1 Prompt-Level Visibility Matrix

**Goal:** Show which prompts mention which brands (heatmap)

**Database View:**
```sql
CREATE OR REPLACE VIEW prompt_brand_matrix AS
SELECT 
    p.id::text as prompt_id,
    p.text as prompt_text,
    p.category_id,
    b.id::text as brand_id,
    b.name as brand_name,
    r.ai_source,
    BOOL_OR(b.name = ANY(r.brands_mentioned)) as is_mentioned,
    COUNT(DISTINCT r.id) FILTER (WHERE b.name = ANY(r.brands_mentioned)) as mention_count,
    COUNT(DISTINCT r.id) as total_responses
FROM prompts p
CROSS JOIN brands b
LEFT JOIN responses r ON r.prompt_id = p.id 
    AND r.status = 'completed'
WHERE b.category_id = p.category_id
GROUP BY p.id, p.text, p.category_id, b.id, b.name, r.ai_source;
```

**API Endpoints:**
```python
@app.get("/brands/{brand_id}/prompt-breakdown")
async def get_brand_prompt_breakdown(brand_id: str):
    """
    Get breakdown of which prompts mention this brand
    
    Returns:
        [
            {
                'prompt_id': 'uuid',
                'prompt_text': 'What is the best CRM?',
                'mentioned': true,
                'platforms': {
                    'chatgpt': true,
                    'gemini': false,
                    'perplexity': true
                }
            }
        ]
    """
    breakdown = await db.get_brand_prompt_breakdown(brand_id)
    return {"success": True, "data": breakdown}

@app.get("/categories/{category_id}/prompt-matrix")
async def get_prompt_matrix(category_id: str):
    """
    Get full prompt x brand matrix for heatmap
    
    Returns matrix showing which brands are mentioned in which prompts
    """
    matrix = await db.get_prompt_brand_matrix(category_id)
    return {"success": True, "data": matrix}
```

**Frontend:**
- Update `PromptHeatmap.tsx` to use real data
- Show grid: Prompts (rows) x Brands (columns)
- Color intensity = mention frequency
- Click to see response details

---

### 2.2 Prompts Tracked Metric

**Goal:** Display total prompts tracked per category/brand

**API Endpoint:**
```python
@app.get("/brands/{brand_id}/metrics")
async def get_brand_metrics(brand_id: str):
    """
    Get comprehensive brand metrics
    
    Returns:
        {
            'visibility_score': 85.5,
            'total_mentions': 120,
            'prompts_tracked': 50,
            'prompts_mentioned_in': 43,
            'coverage_rate': 86.0,  # % of prompts where brand appears
            'avg_position': 2.3,  # Average position in responses
            'citation_count': 45,
            'sentiment_breakdown': {
                'positive': 30,
                'neutral': 10,
                'negative': 3
            }
        }
    """
    metrics = await db.get_brand_comprehensive_metrics(brand_id)
    return {"success": True, "data": metrics}
```

**Frontend:**
- Add to BrandCard component
- Show "Tracked in X prompts"
- Show "Mentioned in Y prompts (Z%)"
- Show sentiment pie chart

---

## Phase 3: Enhanced Analytics (Week 3-4)

### 3.1 Citation Share (Refined)

**Current:** Using `mention_rate` as proxy
**Goal:** Calculate actual citation share from LLM-extracted citations

**Formula:**
```
Citation Share = (Brand's Citations / Total Citations in Category) * 100
```

**Database View:**
```sql
CREATE OR REPLACE VIEW brand_citation_share AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    COUNT(DISTINCT c.id) as brand_citations,
    (
        SELECT COUNT(DISTINCT c2.id)
        FROM citations c2
        INNER JOIN responses r2 ON r2.id = c2.response_id
        INNER JOIN prompts p2 ON p2.id = r2.prompt_id
        WHERE p2.category_id = b.category_id
    ) as total_category_citations,
    ROUND(
        (COUNT(DISTINCT c.id)::DECIMAL / NULLIF(
            (SELECT COUNT(DISTINCT c2.id)
             FROM citations c2
             INNER JOIN responses r2 ON r2.id = c2.response_id
             INNER JOIN prompts p2 ON p2.id = r2.prompt_id
             WHERE p2.category_id = b.category_id
            ), 0
        )) * 100,
        2
    ) as citation_share
FROM brands b
LEFT JOIN citations c ON c.brand_name = b.name
GROUP BY b.id, b.name, b.category_id;
```

---

### 3.2 Sentiment & Keyword Analysis (Already Done by LLM!)

**Goal:** Display sentiment and keywords extracted by LLM

Since the LLM already extracts sentiment and keywords in Phase 1, we just need to:

1. **Display sentiment breakdown** - Already have API endpoint
2. **Display keyword cloud** - Already have API endpoint
3. **Add filtering** - Filter contexts by sentiment/keyword

**Frontend Components:**
```typescript
// BrandSentiment.tsx - Pie chart showing sentiment distribution
// BrandKeywords.tsx - Tag cloud or bar chart
// BrandContexts.tsx - List of contexts, filterable by sentiment
```

---

## Phase 4: Advanced Features (Week 4+)

### 4.1 LLM-Powered Competitive Analysis

**Goal:** Use LLM to compare brands and identify gaps

**New LLM Prompt:**
```python
def analyze_competitive_gaps(
    brand_name: str,
    competitor_name: str,
    category_id: str
) -> Dict:
    """
    Use LLM to analyze competitive gaps
    
    Returns:
        {
            'strengths': ['What your brand does better'],
            'weaknesses': ['Where competitor is stronger'],
            'opportunities': ['Prompts where you could improve'],
            'threats': ['Areas where losing visibility']
        }
    """
    # Get all contexts for both brands
    # Send to LLM for SWOT analysis
    # Return structured insights
```

### 4.2 LLM-Powered Recommendations

**Goal:** Use LLM to suggest content improvements

**New LLM Prompt:**
```python
def generate_recommendations(brand_id: str) -> List[Dict]:
    """
    Use LLM to generate actionable recommendations
    
    Returns:
        [
            {
                'type': 'content_gap',
                'priority': 'high',
                'title': 'Not mentioned in pricing prompts',
                'description': 'Your brand rarely appears when users ask about pricing...',
                'action': 'Create content highlighting pricing transparency'
            }
        ]
    """
```

### 4.3 Trend Analysis

**Features:**
- Week-over-week sentiment changes
- Emerging keywords
- Declining visibility alerts
- Seasonal patterns

---

## Implementation Priority

### High Priority (Do First)
1. ✅ **LLM-powered extraction** (Phase 1.1) - Single call extracts everything
2. ✅ **Prompt breakdown matrix** (Phase 2.1)
3. ✅ **Comprehensive metrics** (Phase 2.2)
4. ✅ **Citation share** (Phase 3.1)

### Medium Priority
5. Frontend components for sentiment/keywords (Phase 3.2)
6. Competitive comparison UI
7. Enhanced metrics dashboard

### Low Priority (Nice to Have)
8. LLM-powered recommendations (Phase 4.2)
9. Trend analysis (Phase 4.3)
10. Alert system
11. Export/reporting

---

## Technical Architecture

### LLM-Enhanced Data Flow
```
Scraper → Extract Response
    ↓
Single LLM API Call (Gemini)
    ↓
Structured JSON Response:
  - Citations per brand
  - Context per brand
  - Sentiment per brand
  - Keywords per brand
    ↓
Parse JSON → Store in Database:
  - citations table
  - brand_mentions table
    ↓
Update Aggregated Views
    ↓
API → Frontend Dashboard
```

### Cost Considerations

**Google AI Studio (Gemini API):**
- ✅ **Free Tier:** 15 requests/minute, 1500 requests/day
- ✅ **Gemini 1.5 Flash:** Fast, efficient, perfect for extraction
- ✅ **Cost:** FREE for your use case (< 1500 responses/day)

**Estimated Usage:**
- 30 responses/day (15 prompts × 2 AI sources) = **30 LLM calls/day**
- Well within free tier limits!

### Performance Considerations
- LLM call adds ~2-3 seconds per response
- Run asynchronously (don't block scraping)
- Can batch process old responses
- Cache results (no need to re-extract)
- Use fast model (gemini-1.5-flash)

---

## Estimated Timeline

- **Week 1:** LLM extraction setup + database schema (Phase 1)
- **Week 2:** Prompt breakdown + metrics (Phase 2)
- **Week 3:** Frontend components + citation share (Phase 3)
- **Week 4:** Polish, testing, optimization
- **Week 5+:** Advanced features (Phase 4)

---

## Success Metrics

After implementation, you should be able to answer:

1. ✅ Which brands are mentioned? (Already done)
2. ✅ How often? (Visibility scores - done)
3. ✅ In what context? (LLM extracts 2-3 sentence summary)
4. ✅ Which prompts mention which brands? (Prompt matrix)
5. ✅ What sources are cited? (LLM extracts all citations)
6. ✅ How is sentiment? (LLM analyzes: positive/neutral/negative)
7. ✅ What keywords are associated? (LLM extracts key themes)
8. ✅ How do competitors compare? (Phase 4)

---

## Advantages of LLM Approach

### vs. Regex/Manual Parsing:
- ✅ **More Accurate:** Understands context, not just patterns
- ✅ **Flexible:** Handles various citation formats
- ✅ **Multi-task:** One call extracts everything
- ✅ **Easy to Improve:** Just update the prompt
- ✅ **Sentiment Built-in:** No separate analysis needed
- ✅ **Keywords Built-in:** No NLP library needed
- ✅ **Free:** Google AI Studio free tier is generous

### Potential Issues & Solutions:
- ❌ **Rate Limits:** Use free tier (1500/day) - plenty for your use case
- ❌ **Latency:** Run async, don't block scraping
- ❌ **JSON Parsing:** Add retry logic, validate schema
- ❌ **Hallucinations:** Use low temperature (0.1), validate URLs exist in response

---

## Next Steps

1. **Get Google AI Studio API Key** - https://aistudio.google.com/app/apikey
2. **Add to .env:** `GOOGLE_API_KEY=your_key_here`
3. **Install SDK:** `pip install google-generativeai`
4. **Test LLM extraction** - Run on existing responses
5. **Integrate into worker** - Add LLM call after scraping
6. **Build frontend components** - Display extracted data

Would you like me to start implementing Phase 1.1 (LLM-powered extraction)?
