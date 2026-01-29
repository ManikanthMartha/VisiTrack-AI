# Data Flow Documentation - Type Tracing

This document traces data types from database → backend → frontend → UI for each API endpoint.

## 1. GET /categories - Category List

### Database (category_summary view)
```sql
SELECT 
    c.id,                    -- VARCHAR(100)
    c.name,                  -- VARCHAR(255)
    c.description,           -- TEXT (nullable)
    c.created_at,            -- TIMESTAMP WITH TIME ZONE
    COUNT(DISTINCT b.id) as brand_count,      -- BIGINT
    COUNT(DISTINCT p.id) as prompt_count,     -- BIGINT
    COUNT(DISTINCT r.id) as response_count,   -- BIGINT
    COALESCE(
        jsonb_agg(...),      -- JSONB array of objects
        '[]'::jsonb
    ) as top_brands
```

**top_brands structure:**
```json
[
  {
    "id": "uuid-string",           // UUID::text
    "name": "Brand Name",          // VARCHAR(255)
    "logo_url": "https://..." | null,  // TEXT (nullable)
    "visibility_score": 85.50      // NUMERIC (DECIMAL)
  }
]
```

### Backend (database.py)
```python
async def get_categories(self) -> List[Dict[str, Any]]:
    result = self.client.table('category_summary').select('*').execute()
    return result.data if result.data else []
```

**Returns:** List of dicts matching DB structure exactly

### Backend (main.py)
```python
@app.get("/categories")
async def get_categories():
    categories = await db.get_categories()
    return {"success": True, "data": categories}
```

**Response JSON:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crm-software",
      "name": "CRM Software",
      "description": "Customer Relationship Management",
      "brand_count": 10,
      "prompt_count": 25,
      "response_count": 150,
      "top_brands": [
        {
          "id": "uuid-string",
          "name": "Salesforce",
          "logo_url": "https://...",
          "visibility_score": 85.5
        }
      ],
      "created_at": "2024-01-01T00:00:00+00:00"
    }
  ]
}
```

### Frontend (api.ts)
```typescript
export interface TopBrand {
  id: string;
  name: string;
  logo_url: string | null;
  visibility_score: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  brand_count: number;
  prompt_count: number;
  response_count: number;
  top_brands: TopBrand[];
  created_at: string;
}

async getCategories(): Promise<Category[]> {
  return this.fetch<Category[]>('/categories');
}
```

### Frontend (page.tsx)
```typescript
const [categories, setCategories] = useState<Category[]>([]);

// Transform for UI component
const transformedCategories = categories.map(cat => ({
  id: cat.id,                    // string
  name: cat.name,                // string
  description: cat.description || '',  // string (handle null)
  brandCount: cat.brand_count,   // number
  topBrands: (cat.top_brands || []).map(b => ({
    id: b.id,                    // string
    name: b.name,                // string
    logo: b.logo_url || `fallback-url`,  // string (handle null)
    visibilityScore: b.visibility_score  // number
  }))
}));
```

---

## 2. GET /categories/{id}/leaderboard - Brand Rankings

### Database (brand_leaderboard view)
```sql
SELECT 
    b.id::text as id,                    -- UUID → TEXT
    b.name,                              -- VARCHAR(255)
    b.logo_url,                          -- TEXT (nullable)
    b.category_id,                       -- VARCHAR(100)
    COALESCE(ROUND(...), 0) as overall_visibility_score,  -- NUMERIC
    COUNT(...) as total_mentions         -- BIGINT
WHERE category_id = 'crm-software'
ORDER BY overall_visibility_score DESC
```

### Backend (database.py)
```python
async def get_category_leaderboard(self, category_id: str) -> List[Dict[str, Any]]:
    result = self.client.table('brand_leaderboard')\
        .select('id, name, logo_url, overall_visibility_score, total_mentions')\
        .eq('category_id', category_id)\
        .order('overall_visibility_score', desc=True)\
        .execute()
    return result.data if result.data else []
```

### Backend (main.py)
```python
@app.get("/categories/{category_id}/leaderboard")
async def get_category_leaderboard(category_id: str):
    leaderboard = await db.get_category_leaderboard(category_id)
    return {"success": True, "data": leaderboard}
```

**Response JSON:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "Salesforce",
      "logo_url": "https://..." | null,
      "overall_visibility_score": 85.5,
      "total_mentions": 120
    }
  ]
}
```

### Frontend (api.ts)
```typescript
export interface LeaderboardBrand {
  id: string;
  name: string;
  logo_url: string | null;
  overall_visibility_score: number;
  total_mentions: number;
}

async getCategoryLeaderboard(categoryId: string): Promise<LeaderboardBrand[]> {
  return this.fetch<LeaderboardBrand[]>(`/categories/${categoryId}/leaderboard`);
}
```

### Frontend (category/[id]/page.tsx)
```typescript
const [leaderboard, setLeaderboard] = useState<LeaderboardBrand[]>([]);

// Transform for UI
const transformedLeaderboard = leaderboard.map(b => ({
  id: b.id,
  name: b.name,
  logo: b.logo_url || `fallback-url`,
  visibilityScore: b.overall_visibility_score,
  change: 0,  // TODO: Calculate from historical data
  rank: leaderboard.findIndex(lb => lb.id === b.id) + 1
}));
```

---

## 3. GET /brands/{id} - Brand Details

### Database (brand_details view)
```sql
SELECT 
    b.id::text as id,                    -- UUID → TEXT
    b.name,                              -- VARCHAR(255)
    b.category_id,                       -- VARCHAR(100)
    b.logo_url,                          -- TEXT (nullable)
    b.website,                           -- TEXT (nullable)
    c.name as category_name,             -- VARCHAR(255)
    COALESCE(ROUND(...), 0) as overall_visibility_score,  -- NUMERIC
    COUNT(...) as total_mentions,        -- BIGINT
    COUNT(...) as total_responses,       -- BIGINT
    ROUND(...) as mention_rate           -- NUMERIC
WHERE b.id = 'uuid'
```

### Backend (database.py)
```python
async def get_brand_details(self, brand_id: str) -> Optional[Dict[str, Any]]:
    result = self.client.table('brand_details')\
        .select('*')\
        .eq('id', brand_id)\
        .single()\
        .execute()
    return result.data if result.data else None
```

### Backend (main.py)
```python
@app.get("/brands/{brand_id}")
async def get_brand_details(brand_id: str):
    brand = await db.get_brand_details(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"success": True, "data": brand}
```

**Response JSON:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "Salesforce",
    "category_id": "crm-software",
    "category_name": "CRM Software",
    "logo_url": "https://..." | null,
    "website": "https://salesforce.com" | null,
    "overall_visibility_score": 85.5,
    "total_mentions": 120,
    "total_responses": 150,
    "mention_rate": 80.0
  }
}
```

### Frontend (api.ts)
```typescript
export interface BrandDetails {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  logo_url: string | null;
  website: string | null;
  overall_visibility_score: number;
  total_mentions: number;
  total_responses: number;
  mention_rate: number;
}

async getBrandDetails(brandId: string): Promise<BrandDetails> {
  return this.fetch<BrandDetails>(`/brands/${brandId}`);
}
```

### Frontend (category/[id]/page.tsx)
```typescript
const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null);

// Use directly in UI
<BrandCard brand={{
  id: brandDetails.id,
  name: brandDetails.name,
  logo: brandDetails.logo_url || `fallback-url`,
  category: brandDetails.category_name,
  visibilityScore: brandDetails.overall_visibility_score,
  totalMentions: brandDetails.total_mentions,
  // ... other fields
}} />
```

---

## 4. GET /brands/{id}/timeseries - Time Series Data

### Database (brand_visibility_timeseries view)
```sql
SELECT 
    b.id::text as brand_id,              -- UUID → TEXT
    b.name as brand_name,                -- VARCHAR(255)
    b.category_id,                       -- VARCHAR(100)
    DATE(r.created_at) as date,          -- DATE
    r.ai_source,                         -- VARCHAR(50)
    COUNT(...) as mention_count,         -- BIGINT
    COUNT(...) as total_responses,       -- BIGINT
    ROUND(...) as daily_visibility_score -- NUMERIC
WHERE b.id = 'uuid'
  AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC
```

### Backend (database.py)
```python
async def get_brand_timeseries(
    self, 
    brand_id: str, 
    days: int = 30,
    ai_source: Optional[str] = None
) -> List[Dict[str, Any]]:
    query = self.client.table('brand_visibility_timeseries')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .order('date', desc=False)
    
    if ai_source:
        query = query.eq('ai_source', ai_source)
    
    result = query.execute()
    return result.data if result.data else []
```

### Backend (main.py)
```python
@app.get("/brands/{brand_id}/timeseries")
async def get_brand_timeseries(
    brand_id: str,
    days: int = 30,
    ai_source: str = None
):
    timeseries = await db.get_brand_timeseries(brand_id, days, ai_source)
    return {"success": True, "data": timeseries}
```

**Response JSON:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid-string",
      "brand_name": "Salesforce",
      "category_id": "crm-software",
      "date": "2024-01-15",
      "ai_source": "chatgpt",
      "mention_count": 8,
      "total_responses": 10,
      "daily_visibility_score": 80.0
    }
  ]
}
```

### Frontend (api.ts)
```typescript
export interface TimeSeriesData {
  brand_id: string;
  brand_name: string;
  category_id: string;
  date: string;              // DATE as YYYY-MM-DD string
  ai_source: string;
  mention_count: number;
  total_responses: number;
  daily_visibility_score: number;
}

async getBrandTimeseries(
  brandId: string,
  days: number = 30,
  aiSource?: string
): Promise<TimeSeriesData[]> {
  const params = new URLSearchParams({ days: days.toString() });
  if (aiSource) params.append('ai_source', aiSource);
  
  return this.fetch<TimeSeriesData[]>(`/brands/${brandId}/timeseries?${params}`);
}
```

### Frontend (category/[id]/page.tsx)
```typescript
const [timeseries, setTimeseries] = useState<TimeSeriesData[]>([]);

// Aggregate by date for chart (combine platforms)
const chartData = timeseries.reduce((acc, item) => {
  const existing = acc.find(d => d.date === item.date);
  if (existing) {
    existing.score = Math.max(existing.score, item.daily_visibility_score);
  } else {
    acc.push({
      date: item.date,
      score: item.daily_visibility_score
    });
  }
  return acc;
}, [] as { date: string; score: number }[])
  .sort((a, b) => a.date.localeCompare(b.date));
```

---

## 5. GET /brands/{id}/platforms - Platform Breakdown

### Database (brand_platform_scores view)
```sql
SELECT 
    b.id::text as brand_id,              -- UUID → TEXT
    b.name as brand_name,                -- VARCHAR(255)
    b.category_id,                       -- VARCHAR(100)
    r.ai_source,                         -- VARCHAR(50)
    COUNT(...) as mention_count,         -- BIGINT
    COUNT(...) as total_responses,       -- BIGINT
    ROUND(...) as platform_visibility_score  -- NUMERIC
WHERE b.id = 'uuid'
GROUP BY b.id, r.ai_source
```

### Backend (database.py)
```python
async def get_brand_platform_scores(self, brand_id: str) -> List[Dict[str, Any]]:
    result = self.client.table('brand_platform_scores')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .execute()
    return result.data if result.data else []
```

### Backend (main.py)
```python
@app.get("/brands/{brand_id}/platforms")
async def get_brand_platform_scores(brand_id: str):
    scores = await db.get_brand_platform_scores(brand_id)
    return {"success": True, "data": scores}
```

**Response JSON:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid-string",
      "brand_name": "Salesforce",
      "category_id": "crm-software",
      "ai_source": "chatgpt",
      "mention_count": 45,
      "total_responses": 50,
      "platform_visibility_score": 90.0
    },
    {
      "brand_id": "uuid-string",
      "brand_name": "Salesforce",
      "category_id": "crm-software",
      "ai_source": "gemini",
      "mention_count": 40,
      "total_responses": 50,
      "platform_visibility_score": 80.0
    }
  ]
}
```

### Frontend (api.ts)
```typescript
export interface PlatformScore {
  brand_id: string;
  brand_name: string;
  category_id: string;
  ai_source: string;
  mention_count: number;
  total_responses: number;
  platform_visibility_score: number;
}

async getBrandPlatformScores(brandId: string): Promise<PlatformScore[]> {
  return this.fetch<PlatformScore[]>(`/brands/${brandId}/platforms`);
}
```

### Frontend (category/[id]/page.tsx)
```typescript
const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);

// Transform for UI component
const transformedPlatformScores = platformScores.map(p => ({
  platform: p.ai_source,
  score: p.platform_visibility_score,
  mentions: p.mention_count,
  total: p.total_responses
}));
```

---

## Key Type Conversions

1. **UUID → String**: All UUIDs are cast to TEXT in views using `::text`
2. **BIGINT → Number**: JavaScript numbers (safe for counts < 2^53)
3. **NUMERIC/DECIMAL → Number**: Floating point numbers
4. **TIMESTAMP → String**: ISO 8601 format
5. **DATE → String**: YYYY-MM-DD format
6. **JSONB → Array**: Parsed automatically by Supabase client
7. **NULL handling**: All nullable fields typed as `| null` in TypeScript

## Validation Checklist

- [x] All UUIDs converted to strings in DB views
- [x] All nullable fields handled in frontend
- [x] JSONB arrays properly typed
- [x] Date/timestamp formats consistent
- [x] Number types match (no precision loss)
- [x] API response wrapper consistent
- [x] Error handling for null/undefined
