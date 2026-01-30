# Architecture Diagram - AI Visibility Tracker

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                           │  │
│  │                   (TypeScript/React)                          │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │  │  Home Page   │  │ Category Page│  │  Components  │         │  │
│  │  │  page.tsx    │  │  [id]/page   │  │  BrandCard   │         │  │
│  │  └──────┬───────┘  └──────┬───────┘  │  Leaderboard │         │  │
│  │         │                 │          │  Chart       │         │  │
│  │         └────────┬────────┘          └──────────────┘         │  │
│  │                  │                                            │  │
│  │         ┌────────▼────────┐                                   │  │
│  │         │   API Client    │                                   │  │
│  │         │   lib/api.ts    │                                   │  │
│  │         │  (TypeScript)   │                                   │  │
│  │         └────────┬────────┘                                   │  │
│  └──────────────────┼────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     │ HTTP/JSON
                     │ fetch()
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│                    FastAPI Backend                                  │
│                    (Python/Async)                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      main.py                                │    │
│  │                   API Endpoints                             │    │
│  │                                                             │    │
│  │  GET /categories              → List categories             │    │
│  │  GET /categories/{id}         → Category details            │    │
│  │  GET /categories/{id}/leaderboard → Brand rankings          │    │
│  │  GET /brands/{id}             → Brand details               │    │
│  │  GET /brands/{id}/timeseries  → Time-series data            │    │
│  │  GET /brands/{id}/platforms   → Platform scores             │    │
│  │                                                             │    │
│  └────────────────────┬────────────────────────────────────────┘    │
│                       │                                             │
│  ┌────────────────────▼─────────────────────────────────────────┐   │
│  │                   database.py                                │   │
│  │                Database Functions                            │   │
│  │                                                              │   │
│  │  get_categories()                                            │   │
│  │  get_category_leaderboard()                                  │   │
│  │  get_brand_details()                                         │   │
│  │  get_brand_timeseries()                                      │   │
│  │  get_brand_platform_scores()                                 │   │
│  │                                                              │   │
│  └────────────────────┬─────────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────────┘
                         │
                         │ Supabase Client
                         │ (Python SDK)
                         │
┌────────────────────────▼──────────────────────────────────────────────┐
│                    Supabase / PostgreSQL                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Base Tables                              │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │categories│  │  brands  │  │ prompts  │  │responses │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Aggregation Views                          │   │
│  │                                                               │   │
│  │  category_summary          → Categories with top brands      │   │
│  │  brand_leaderboard         → Brand rankings                  │   │
│  │  brand_details             → Comprehensive brand info        │   │
│  │  brand_visibility_timeseries → Daily scores                  │   │
│  │  brand_platform_scores     → Per-platform breakdown          │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow - GET /categories

```
┌──────────┐
│ Browser  │
└────┬─────┘
     │ 1. User visits home page
     │
┌────▼─────────────────────────────────────────────────────────┐
│ page.tsx                                                      │
│                                                               │
│ useEffect(() => {                                             │
│   apiClient.getCategories().then(setCategories);             │
│ }, []);                                                       │
└────┬──────────────────────────────────────────────────────────┘
     │ 2. Call API client
     │
┌────▼─────────────────────────────────────────────────────────┐
│ api.ts                                                        │
│                                                               │
│ async getCategories(): Promise<Category[]> {                 │
│   return this.fetch<Category[]>('/categories');              │
│ }                                                             │
└────┬──────────────────────────────────────────────────────────┘
     │ 3. HTTP GET request
     │    fetch('http://localhost:8000/categories')
     │
┌────▼─────────────────────────────────────────────────────────┐
│ main.py                                                       │
│                                                               │
│ @app.get("/categories")                                       │
│ async def get_categories():                                   │
│     categories = await db.get_categories()                    │
│     return {"success": True, "data": categories}              │
└────┬──────────────────────────────────────────────────────────┘
     │ 4. Call database function
     │
┌────▼─────────────────────────────────────────────────────────┐
│ database.py                                                   │
│                                                               │
│ async def get_categories(self):                               │
│     result = self.client.table('category_summary')           │
│                        .select('*').execute()                 │
│     return result.data if result.data else []                 │
└────┬──────────────────────────────────────────────────────────┘
     │ 5. Query Supabase
     │
┌────▼─────────────────────────────────────────────────────────┐
│ PostgreSQL - category_summary VIEW                           │
│                                                               │
│ SELECT                                                        │
│   c.id,                                                       │
│   c.name,                                                     │
│   COUNT(DISTINCT b.id) as brand_count,                       │
│   COALESCE(jsonb_agg(...), '[]'::jsonb) as top_brands        │
│ FROM categories c                                             │
│ LEFT JOIN brands b ON b.category_id = c.id                   │
│ GROUP BY c.id                                                 │
└────┬──────────────────────────────────────────────────────────┘
     │ 6. Return rows
     │
     │ [
     │   {
     │     "id": "crm-software",
     │     "name": "CRM Software",
     │     "brand_count": 10,
     │     "top_brands": [
     │       {"id": "uuid", "name": "Salesforce", "visibility_score": 85.5}
     │     ]
     │   }
     │ ]
     │
┌────▼─────────────────────────────────────────────────────────┐
│ database.py                                                   │
│                                                               │
│ return result.data  # List[Dict[str, Any]]                   │
└────┬──────────────────────────────────────────────────────────┘
     │ 7. Return to endpoint
     │
┌────▼─────────────────────────────────────────────────────────┐
│ main.py                                                       │
│                                                               │
│ return {"success": True, "data": categories}                 │
└────┬──────────────────────────────────────────────────────────┘
     │ 8. JSON response
     │
     │ {
     │   "success": true,
     │   "data": [...]
     │ }
     │
┌────▼─────────────────────────────────────────────────────────┐
│ api.ts                                                        │
│                                                               │
│ const json = await response.json();                          │
│ return json.data;  // Category[]                             │
└────┬──────────────────────────────────────────────────────────┘
     │ 9. Return typed data
     │
┌────▼─────────────────────────────────────────────────────────┐
│ page.tsx                                                      │
│                                                               │
│ setCategories(data);  // State updated                       │
│                                                               │
│ // Render UI                                                 │
│ {categories.map(cat => (                                     │
│   <CategoryCard category={cat} />                            │
│ ))}                                                           │
└───────────────────────────────────────────────────────────────┘
```

## Type Transformations

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Types                          │
├─────────────────────────────────────────────────────────────┤
│ UUID          → Cast to TEXT in view (::text)               │
│ VARCHAR(100)  → No transformation                            │
│ BIGINT        → No transformation                            │
│ NUMERIC(5,2)  → No transformation                            │
│ JSONB         → No transformation                            │
│ TIMESTAMP     → No transformation                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Python Client                      │
├─────────────────────────────────────────────────────────────┤
│ TEXT          → str                                          │
│ VARCHAR       → str                                          │
│ BIGINT        → int                                          │
│ NUMERIC       → Decimal → float                              │
│ JSONB         → dict/list                                    │
│ TIMESTAMP     → str (ISO 8601)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Python Dict/List                          │
├─────────────────────────────────────────────────────────────┤
│ Dict[str, Any]                                               │
│ List[Dict[str, Any]]                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI JSON Response                     │
├─────────────────────────────────────────────────────────────┤
│ str           → JSON string                                  │
│ int           → JSON number                                  │
│ float         → JSON number                                  │
│ dict          → JSON object                                  │
│ list          → JSON array                                   │
│ None          → JSON null                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    JavaScript/TypeScript                     │
├─────────────────────────────────────────────────────────────┤
│ JSON string   → string                                       │
│ JSON number   → number                                       │
│ JSON object   → object (typed as interface)                 │
│ JSON array    → array (typed as Type[])                     │
│ JSON null     → null                                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── Sidebar (navigation)
├── Topbar (breadcrumbs)
└── Pages
    ├── Home Page (/)
    │   ├── FilterBar
    │   ├── SearchInput
    │   └── CategoryCard[] (grid)
    │       ├── Category name
    │       ├── Brand count
    │       └── Top 5 brand logos
    │
    └── Category Page (/category/[id])
        ├── FilterBar
        ├── CompetitorToggle (brand selector)
        ├── Left Column (2/3)
        │   ├── BrandCard
        │   │   ├── Logo
        │   │   ├── Visibility score
        │   │   ├── Rank
        │   │   └── Stats
        │   ├── VisibilityChart (time-series)
        │   └── PromptHeatmap (optional)
        │
        └── Right Column (1/3)
            ├── Leaderboard
            │   └── Brand rankings
            ├── PlatformBreakdown
            │   ├── ChatGPT score
            │   ├── Gemini score
            │   └── Perplexity score
            └── SourcesList (citations)
```

## Database Schema Relationships

```
┌──────────────┐
│  categories  │
│──────────────│
│ id (PK)      │◄─────┐
│ name         │      │
│ description  │      │
└──────────────┘      │
                      │
                      │ category_id (FK)
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼──────┐            ┌────────▼─────┐
│   brands     │            │   prompts    │
│──────────────│            │──────────────│
│ id (PK)      │            │ id (PK)      │
│ name         │            │ text         │
│ category_id  │            │ category_id  │
│ logo_url     │            └────────┬─────┘
│ website      │                     │
└──────────────┘                     │ prompt_id (FK)
                                     │
                            ┌────────▼─────────┐
                            │    responses     │
                            │──────────────────│
                            │ id (PK)          │
                            │ prompt_id        │
                            │ response_text    │
                            │ ai_source        │
                            │ brands_mentioned │◄─── TEXT[] array
                            │ status           │
                            │ created_at       │
                            └──────────────────┘
```

## View Dependencies

```
Base Tables
    │
    ├─► category_summary
    │   (aggregates categories + brands + responses)
    │
    ├─► brand_leaderboard
    │   (aggregates brands + responses by category)
    │
    ├─► brand_details
    │   (comprehensive brand info)
    │
    ├─► brand_visibility_timeseries
    │   (daily aggregation, last 30 days)
    │
    └─► brand_platform_scores
        (per-platform aggregation)
```

## Request/Response Flow

```
User Action → Component → API Client → Backend → Database → View
                                                              │
User sees ← Component ← API Client ← Backend ← Database ← ───┘
```

## Error Handling Flow

```
Database Error
    │
    ├─► Caught in database.py
    │   └─► Log error
    │       └─► Return None or []
    │
    ├─► Checked in main.py
    │   └─► Raise HTTPException(404/500)
    │
    ├─► Caught in api.ts
    │   └─► Throw Error
    │
    └─► Caught in component
        └─► Set error state
            └─► Display error message
```
