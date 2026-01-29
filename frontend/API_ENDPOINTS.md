# API Endpoints Documentation

Complete list of API endpoints needed for the AI Visibility Tracker dashboard.

## Authentication Endpoints

### Better Auth (Already Implemented)
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-up` - Create new account
- `POST /api/auth/sign-out` - Sign out user
- `GET /api/auth/session` - Get current session

---

## Categories Endpoints

### GET `/api/categories`
Get all categories with summary data.

**Query Parameters:**
- `search` (optional) - Search query for filtering categories
- `sortBy` (optional) - Sort by: `name`, `brands`, `score` (default: `score`)
- `limit` (optional) - Number of results (default: all)

**Response:**
```json
{
  "categories": [
    {
      "id": "crm-software",
      "name": "CRM Software",
      "description": "Customer relationship management platforms",
      "icon": "Users",
      "brandCount": 24,
      "topBrands": [
        {
          "id": "salesforce",
          "name": "Salesforce",
          "logo": "https://...",
          "visibilityScore": 94.2,
          "changePercent": 2.3,
          "rank": 1,
          "platformScores": {
            "chatgpt": 96.5,
            "perplexity": 93.2,
            "claude": 94.8,
            "gemini": 92.1
          }
        }
      ],
      "sparklineData": [75, 78, 76, 80, 82, 79, 81]
    }
  ],
  "total": 6
}
```

### GET `/api/categories/:id`
Get detailed information about a specific category.

**Response:**
```json
{
  "id": "crm-software",
  "name": "CRM Software",
  "description": "Customer relationship management platforms",
  "icon": "Users",
  "brandCount": 24,
  "topBrands": [...],
  "sparklineData": [...],
  "metadata": {
    "lastUpdated": "2024-01-28T10:00:00Z",
    "totalPrompts": 1234,
    "avgVisibilityScore": 78.5
  }
}
```

---

## Brands Endpoints

### GET `/api/brands`
Get all brands with optional filtering.

**Query Parameters:**
- `categoryId` (optional) - Filter by category
- `search` (optional) - Search query
- `sortBy` (optional) - Sort by: `name`, `score`, `rank` (default: `score`)
- `limit` (optional) - Number of results
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "brands": [
    {
      "id": "salesforce",
      "name": "Salesforce",
      "logo": "https://...",
      "categoryId": "crm-software",
      "visibilityScore": 94.2,
      "changePercent": 2.3,
      "rank": 1
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### GET `/api/brands/:id`
Get detailed information about a specific brand.

**Response:**
```json
{
  "id": "salesforce",
  "name": "Salesforce",
  "logo": "https://...",
  "description": "World's leading CRM platform...",
  "categoryId": "crm-software",
  "visibilityScore": 94.2,
  "citationShare": 32.1,
  "promptCoverage": 91.5,
  "changePercent": 2.3,
  "rank": 1,
  "topSources": [...],
  "timeSeriesData": [...],
  "promptBreakdown": [...],
  "metadata": {
    "website": "https://salesforce.com",
    "founded": "1999",
    "lastUpdated": "2024-01-28T10:00:00Z"
  }
}
```

### GET `/api/brands/:id/timeseries`
Get time series data for a brand's visibility.

**Query Parameters:**
- `dateRange` - `24h`, `7d`, `30d`, `90d`, `custom`
- `startDate` (if custom) - ISO date string
- `endDate` (if custom) - ISO date string
- `platforms` (optional) - Comma-separated: `chatgpt,perplexity,claude,gemini`
- `region` (optional) - Region filter: `global`, `us`, `eu`, etc.

**Response:**
```json
{
  "brandId": "salesforce",
  "dateRange": "30d",
  "data": [
    {
      "date": "2024-01-01",
      "score": 92.5,
      "mentions": 145,
      "promptCoverage": 89.2,
      "platformBreakdown": {
        "chatgpt": 94.2,
        "perplexity": 91.5,
        "claude": 93.1,
        "gemini": 90.8
      }
    }
  ]
}
```

### GET `/api/brands/:id/sources`
Get top sources citing the brand.

**Query Parameters:**
- `limit` (optional) - Number of sources (default: 10)
- `sortBy` (optional) - `mentions`, `recent` (default: `mentions`)

**Response:**
```json
{
  "brandId": "salesforce",
  "sources": [
    {
      "id": "s1",
      "url": "https://www.salesforce.com/products",
      "title": "Salesforce Products",
      "snippet": "Leading CRM platform...",
      "favicon": "https://...",
      "mentionCount": 342,
      "lastMentioned": "2024-01-28T10:00:00Z",
      "platforms": ["chatgpt", "perplexity", "claude"]
    }
  ],
  "total": 156
}
```

### GET `/api/brands/:id/prompts`
Get prompt breakdown for a brand.

**Query Parameters:**
- `limit` (optional) - Number of prompts (default: 20)
- `category` (optional) - Filter by category

**Response:**
```json
{
  "brandId": "salesforce",
  "prompts": [
    {
      "prompt": "Best CRM software for small business",
      "category": "Recommendations",
      "models": {
        "chatgpt": true,
        "perplexity": true,
        "claude": true,
        "gemini": false
      },
      "mentionCount": 89,
      "sampleResponse": "Salesforce is frequently recommended...",
      "topCitedPages": [...]
    }
  ],
  "total": 234
}
```

### GET `/api/brands/:id/competitors`
Get competitor comparison data.

**Response:**
```json
{
  "brandId": "salesforce",
  "competitors": [
    {
      "id": "hubspot",
      "name": "HubSpot",
      "visibilityScore": 89.7,
      "changePercent": 1.5,
      "rank": 2,
      "scoreDifference": -4.5
    }
  ]
}
```

---

## Analytics Endpoints

### GET `/api/analytics/leaderboard`
Get leaderboard for a category.

**Query Parameters:**
- `categoryId` (required) - Category to get leaderboard for
- `dateRange` (optional) - Time period
- `platforms` (optional) - Filter by platforms
- `region` (optional) - Region filter

**Response:**
```json
{
  "categoryId": "crm-software",
  "dateRange": "7d",
  "leaderboard": [
    {
      "rank": 1,
      "previousRank": 1,
      "brand": {
        "id": "salesforce",
        "name": "Salesforce",
        "logo": "https://...",
        "visibilityScore": 94.2,
        "changePercent": 2.3
      }
    }
  ],
  "lastUpdated": "2024-01-28T10:00:00Z"
}
```

### GET `/api/analytics/platform-breakdown`
Get platform-specific visibility breakdown.

**Query Parameters:**
- `brandId` (required) - Brand to analyze
- `dateRange` (optional) - Time period

**Response:**
```json
{
  "brandId": "salesforce",
  "platforms": [
    {
      "name": "chatgpt",
      "score": 96.5,
      "mentions": 234,
      "changePercent": 3.2,
      "marketShare": 28.5
    },
    {
      "name": "perplexity",
      "score": 93.2,
      "mentions": 189,
      "changePercent": 1.8,
      "marketShare": 24.1
    }
  ]
}
```

### GET `/api/analytics/heatmap`
Get prompt heatmap data for visualization.

**Query Parameters:**
- `brandId` (required) - Brand to analyze
- `categoryId` (optional) - Filter by category
- `limit` (optional) - Number of prompts

**Response:**
```json
{
  "brandId": "salesforce",
  "heatmap": [
    {
      "prompt": "Best CRM software",
      "category": "Recommendations",
      "intensity": 89,
      "platforms": {
        "chatgpt": 95,
        "perplexity": 87,
        "claude": 92,
        "gemini": 82
      }
    }
  ]
}
```

### GET `/api/analytics/trends`
Get trending topics and prompts.

**Query Parameters:**
- `categoryId` (optional) - Filter by category
- `timeframe` (optional) - `24h`, `7d`, `30d`
- `limit` (optional) - Number of trends

**Response:**
```json
{
  "trends": [
    {
      "prompt": "AI-powered CRM features",
      "category": "Features",
      "frequency": 234,
      "growth": 45.2,
      "topBrands": ["salesforce", "hubspot"]
    }
  ],
  "timeframe": "7d"
}
```

---

## Search Endpoints

### GET `/api/search`
Global search across categories, brands, and prompts.

**Query Parameters:**
- `q` (required) - Search query
- `type` (optional) - Filter by: `categories`, `brands`, `prompts`, `all` (default: `all`)
- `limit` (optional) - Results per type

**Response:**
```json
{
  "query": "CRM",
  "results": {
    "categories": [
      {
        "id": "crm-software",
        "name": "CRM Software",
        "relevance": 0.95
      }
    ],
    "brands": [
      {
        "id": "salesforce",
        "name": "Salesforce",
        "categoryId": "crm-software",
        "relevance": 0.92
      }
    ],
    "prompts": [
      {
        "id": "p1",
        "text": "Best CRM software",
        "frequency": 923,
        "relevance": 0.88
      }
    ]
  },
  "total": 45
}
```

---

## Prompts Endpoints

### GET `/api/prompts`
Get all prompts with filtering.

**Query Parameters:**
- `category` (optional) - Filter by category
- `search` (optional) - Search query
- `sortBy` (optional) - `frequency`, `recent` (default: `frequency`)
- `limit` (optional) - Number of results

**Response:**
```json
{
  "prompts": [
    {
      "id": "p1",
      "text": "Best CRM software for small business",
      "category": "Recommendations",
      "frequency": 923,
      "topBrands": ["salesforce", "hubspot"],
      "lastSeen": "2024-01-28T10:00:00Z"
    }
  ],
  "total": 1234
}
```

### GET `/api/prompts/:id`
Get detailed information about a specific prompt.

**Response:**
```json
{
  "id": "p1",
  "text": "Best CRM software for small business",
  "category": "Recommendations",
  "frequency": 923,
  "brandMentions": [
    {
      "brandId": "salesforce",
      "brandName": "Salesforce",
      "mentionCount": 234,
      "platforms": ["chatgpt", "perplexity", "claude"]
    }
  ],
  "platformBreakdown": {
    "chatgpt": 345,
    "perplexity": 289,
    "claude": 198,
    "gemini": 91
  },
  "relatedPrompts": [...]
}
```

---

## User/Dashboard Endpoints

### GET `/api/dashboard/overview`
Get dashboard overview data for authenticated user.

**Response:**
```json
{
  "summary": {
    "totalCategories": 6,
    "totalBrands": 150,
    "avgVisibilityScore": 78.5,
    "topPerformingCategory": "crm-software"
  },
  "recentActivity": [...],
  "alerts": [
    {
      "type": "spike",
      "message": "Visibility increased by 12%",
      "brandId": "salesforce",
      "timestamp": "2024-01-28T10:00:00Z"
    }
  ]
}
```

### GET `/api/notifications`
Get user notifications.

**Query Parameters:**
- `unreadOnly` (optional) - Boolean
- `limit` (optional) - Number of notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": "n1",
      "type": "visibility_spike",
      "title": "Visibility spike detected",
      "message": "Your brand visibility increased by 12%",
      "brandId": "salesforce",
      "read": false,
      "timestamp": "2024-01-28T10:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### POST `/api/notifications/:id/read`
Mark notification as read.

**Response:**
```json
{
  "success": true,
  "notificationId": "n1"
}
```

---

## Export Endpoints

### GET `/api/export/brands/:id`
Export brand data in various formats.

**Query Parameters:**
- `format` - `json`, `csv`, `pdf`
- `dateRange` (optional) - Time period to export
- `includeRawData` (optional) - Boolean

**Response:**
File download or JSON with download URL

### GET `/api/export/category/:id`
Export category data.

**Query Parameters:**
- `format` - `json`, `csv`, `pdf`
- `includeAllBrands` (optional) - Boolean

**Response:**
File download or JSON with download URL

---

## Admin Endpoints (Optional)

### POST `/api/admin/sync`
Trigger data synchronization from AI platforms.

**Body:**
```json
{
  "platforms": ["chatgpt", "perplexity"],
  "categories": ["crm-software"]
}
```

### GET `/api/admin/stats`
Get system statistics.

**Response:**
```json
{
  "totalRequests": 12345,
  "lastSync": "2024-01-28T10:00:00Z",
  "dataFreshness": "5 minutes",
  "systemHealth": "healthy"
}
```

---

## Filters & Metadata

### GET `/api/filters/regions`
Get available regions for filtering.

**Response:**
```json
{
  "regions": [
    { "code": "global", "name": "Global" },
    { "code": "us", "name": "United States" },
    { "code": "eu", "name": "Europe" }
  ]
}
```

### GET `/api/filters/platforms`
Get available AI platforms.

**Response:**
```json
{
  "platforms": [
    { "id": "chatgpt", "name": "ChatGPT", "enabled": true },
    { "id": "perplexity", "name": "Perplexity", "enabled": true },
    { "id": "claude", "name": "Claude", "enabled": true },
    { "id": "gemini", "name": "Gemini", "enabled": true }
  ]
}
```

---

## Notes

### Authentication
All endpoints except `/api/auth/*` require authentication via Better Auth session.

### Rate Limiting
- Standard endpoints: 100 requests/minute
- Export endpoints: 10 requests/minute
- Admin endpoints: 50 requests/minute

### Pagination
Endpoints returning lists support pagination:
- `limit` - Number of items per page (default: 20, max: 100)
- `offset` - Number of items to skip
- Response includes `total` and `hasMore` fields

### Date Formats
All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

### Error Responses
```json
{
  "error": {
    "code": "BRAND_NOT_FOUND",
    "message": "Brand with id 'xyz' not found",
    "statusCode": 404
  }
}
```
