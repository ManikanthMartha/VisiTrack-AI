# Quick Reference - Type-Safe API Integration

## 🚀 Quick Start

### 1. Database Setup
```bash
# Copy and run in Supabase SQL Editor
backend/COMPLETE_SCHEMA_UPDATES.sql
```

### 2. Backend Setup
```bash
cd backend
python -m uvicorn app.main:app --reload
# Server runs on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## 📊 Data Flow Cheat Sheet

```
PostgreSQL → Supabase Client → FastAPI → JSON → Fetch API → TypeScript
   VIEW          Python Dict      Dict    Object    Promise    Interface
```

## 🔍 Type Conversions

| Database | Python | JSON | TypeScript |
|----------|--------|------|------------|
| UUID | str | string | string |
| VARCHAR | str | string | string |
| TEXT | str | string | string |
| BIGINT | int | number | number |
| NUMERIC | Decimal | number | number |
| TIMESTAMP | str | string | string |
| DATE | str | string | string |
| JSONB | dict/list | object/array | object/array |
| TEXT[] | list | array | string[] |
| NULL | None | null | null |

## 📝 Common Patterns

### Database View Pattern
```sql
CREATE OR REPLACE VIEW my_view AS
SELECT 
    id::text,              -- Always cast UUID to text
    name,
    COALESCE(score, 0),    -- Handle nulls
    COUNT(*) as count      -- Aggregations
FROM table
GROUP BY id, name;
```

### Backend Function Pattern
```python
async def get_data(self, id: str) -> Optional[Dict[str, Any]]:
    try:
        result = self.client.table('view_name')\
            .select('*')\
            .eq('id', id)\
            .execute()
        return result.data if result.data else None
    except Exception as e:
        logger.error(f"Error: {e}")
        return None
```

### API Endpoint Pattern
```python
@app.get("/endpoint/{id}")
async def get_endpoint(id: str):
    data = await db.get_data(id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, "data": data}
```

### TypeScript Interface Pattern
```typescript
export interface MyData {
  id: string;              // UUID as string
  name: string;
  score: number;           // NUMERIC
  items: Item[];           // JSONB array
  created_at: string;      // TIMESTAMP as ISO string
  optional_field: string | null;  // Nullable field
}
```

### API Client Pattern
```typescript
async getData(id: string): Promise<MyData> {
  return this.fetch<MyData>(`/endpoint/${id}`);
}
```

### React Component Pattern
```typescript
const [data, setData] = useState<MyData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getData(id);
      setData(result);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [id]);
```

## 🛡️ Null Safety Patterns

### SQL
```sql
-- Return empty array instead of null
COALESCE(jsonb_agg(...), '[]'::jsonb)

-- Return 0 instead of null
COALESCE(COUNT(*), 0)

-- Return empty string instead of null
COALESCE(description, '')
```

### TypeScript
```typescript
// Default value
const value = data.field || 'default';

// Optional chaining
const lower = data.field?.toLowerCase();

// Nullish coalescing
const value = data.field ?? 'default';

// Type guard
if (data.field !== null) {
  // TypeScript knows field is not null here
  const lower = data.field.toLowerCase();
}
```

## 🔧 Debugging Commands

### Check Database View
```sql
SELECT * FROM view_name LIMIT 1;
```

### Test Backend Endpoint
```bash
curl http://localhost:8000/endpoint
```

### Check TypeScript Types
```bash
cd frontend
npm run build
```

### View API Response in Browser
```javascript
// In browser console
fetch('http://localhost:8000/endpoint')
  .then(r => r.json())
  .then(console.log);
```

## 📋 API Endpoints Quick Reference

| Endpoint | Returns | Use Case |
|----------|---------|----------|
| `GET /categories` | `Category[]` | Home page list |
| `GET /categories/{id}` | `Category` | Category details |
| `GET /categories/{id}/leaderboard` | `LeaderboardBrand[]` | Rankings |
| `GET /brands/{id}` | `BrandDetails` | Brand info |
| `GET /brands/{id}/timeseries` | `TimeSeriesData[]` | Chart data |
| `GET /brands/{id}/platforms` | `PlatformScore[]` | Platform breakdown |

## 🎯 Common Tasks

### Add New Category
```sql
INSERT INTO categories (id, name, description) 
VALUES ('my-category', 'My Category', 'Description');
```

### Add New Brand
```sql
INSERT INTO brands (name, category_id, logo_url, website) 
VALUES ('Brand Name', 'category-id', 'https://...', 'https://...');
```

### Add New Prompt
```sql
INSERT INTO prompts (text, category_id) 
VALUES ('What is the best product?', 'category-id');
```

### Record Response
```sql
INSERT INTO responses (
  prompt_id, 
  prompt_text, 
  response_text, 
  ai_source, 
  brands_mentioned, 
  status
) VALUES (
  'prompt-uuid',
  'What is the best product?',
  'Brand A is great. Brand B is also good.',
  'chatgpt',
  ARRAY['Brand A', 'Brand B'],
  'completed'
);
```

## 🐛 Troubleshooting

### "Cannot read property of null"
```typescript
// ❌ Wrong
const value = data.field.toLowerCase();

// ✅ Correct
const value = data.field?.toLowerCase() ?? 'default';
```

### "Type 'number' is not assignable to type 'string'"
```typescript
// ❌ Wrong
const id: string = category.brand_count;

// ✅ Correct
const count: number = category.brand_count;
```

### "UUID type mismatch"
```sql
-- ❌ Wrong
SELECT id FROM brands;  -- Returns UUID object

-- ✅ Correct
SELECT id::text FROM brands;  -- Returns string
```

### "top_brands is null"
```sql
-- ❌ Wrong
SELECT jsonb_agg(...) as top_brands;  -- Can be null

-- ✅ Correct
SELECT COALESCE(jsonb_agg(...), '[]'::jsonb) as top_brands;
```

## 📚 Documentation Files

- `COMPLETE_SCHEMA_UPDATES.sql` - Database schema
- `DATA_FLOW_DOCUMENTATION.md` - Type tracing
- `API_DOCUMENTATION.md` - API reference
- `TESTING_GUIDE.md` - Testing steps
- `IMPLEMENTATION_SUMMARY.md` - Overview
- `QUICK_REFERENCE.md` - This file

## 🎓 Learning Path

1. ✅ Understand database views → `COMPLETE_SCHEMA_UPDATES.sql`
2. ✅ Trace data flow → `DATA_FLOW_DOCUMENTATION.md`
3. ✅ Test endpoints → `TESTING_GUIDE.md`
4. ✅ Review patterns → `IMPLEMENTATION_SUMMARY.md`
5. ✅ Use quick reference → This file
