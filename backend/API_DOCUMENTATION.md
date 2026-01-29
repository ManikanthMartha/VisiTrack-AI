# AI Visibility Tracker - API Documentation

Base URL: `http://localhost:8000`

## Category Endpoints

### GET /categories
Get all categories with summary data including brand counts and top 5 brands.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crm-software",
      "name": "CRM Software",
      "description": "Customer Relationship Management platforms",
      "brand_count": 10,
      "prompt_count": 25,
      "response_count": 150,
      "top_brands": [
        {
          "id": "uuid",
          "name": "Salesforce",
          "logo_url": "https://...",
          "visibility_score": 85.5
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /categories/{category_id}
Get a single category with summary data.

**Response:** Same structure as single category above.

### GET /categories/{category_id}/leaderboard
Get brand leaderboard for a category, sorted by visibility score.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Salesforce",
      "logo_url": "https://...",
      "overall_visibility_score": 85.5,
      "total_mentions": 120
    }
  ]
}
```

## Brand Endpoints

### GET /brands/{brand_id}
Get comprehensive brand details including visibility metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Salesforce",
    "category_id": "crm-software",
    "category_name": "CRM Software",
    "logo_url": "https://...",
    "website": "https://salesforce.com",
    "overall_visibility_score": 85.5,
    "total_mentions": 120,
    "total_responses": 150,
    "mention_rate": 80.0
  }
}
```

### GET /brands/{brand_id}/timeseries
Get brand visibility time-series data for charting.

**Query Parameters:**
- `days` (optional): Number of days to fetch (default: 30)
- `ai_source` (optional): Filter by AI platform (chatgpt, gemini, perplexity)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid",
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

### GET /brands/{brand_id}/platforms
Get brand visibility scores per AI platform.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": "uuid",
      "brand_name": "Salesforce",
      "category_id": "crm-software",
      "ai_source": "chatgpt",
      "mention_count": 45,
      "total_responses": 50,
      "platform_visibility_score": 90.0
    },
    {
      "ai_source": "gemini",
      "mention_count": 40,
      "total_responses": 50,
      "platform_visibility_score": 80.0
    }
  ]
}
```

## Scraping Endpoints

### POST /scrape/prompt
Scrape a specific prompt by ID.

**Request:**
```json
{
  "prompt_id": "uuid",
  "ai_source": "chatgpt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "response-uuid",
    "prompt_id": "prompt-uuid",
    "prompt": "What's the best CRM software?",
    "ai_source": "chatgpt",
    "response": "Here are some great CRM options...",
    "brands_mentioned": ["Salesforce", "HubSpot"]
  }
}
```

## Health Check

### GET /health
Check service health and status.

**Response:**
```json
{
  "status": "healthy",
  "scrapers": ["chatgpt", "gemini"],
  "environment": "development"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Resource not found
- `500`: Internal server error
