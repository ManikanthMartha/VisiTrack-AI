# Scaling to 1000+ Prompts

Guide for scaling AI Visibility Tracker to handle high-volume scraping without crashes or data loss.

## Current Limitations

**Single Worker Setup**:
- 2-3 prompts/minute per platform
- ~150 prompts/hour
- ~3,600 prompts/day (24/7 operation)

**Bottlenecks**:
1. Browser automation (30-60s per query)
2. LLM API rate limits (15 req/min free tier)
3. Single-threaded worker
4. No failure recovery

## Scaling Strategy

### Phase 1: Parallel Workers (10x throughput)

**Deploy Multiple Workers**:
```bash
# Worker 1 - ChatGPT
python worker.py --ai-source chatgpt --worker-id 1

# Worker 2 - ChatGPT
python worker.py --ai-source chatgpt --worker-id 2

# Worker 3 - Gemini
python worker.py --ai-source gemini --worker-id 3

# Worker 4 - Perplexity
python worker.py --ai-source perplexity --worker-id 4
```

**Benefits**:
- 4 workers = 600 prompts/hour
- Platform isolation (failures don't cascade)
- Better resource utilization

**Implementation**:
```python
# worker.py modifications
import argparse

parser.add_argument('--worker-id', type=int, default=1)
args = parser.parse_args()

# Add worker_id to logs
logger.info(f"Worker {args.worker_id} starting...")

# Lock mechanism to prevent duplicate processing
async def claim_prompt(worker_id):
    # Use database transaction to claim prompt
    result = await db.client.rpc('claim_next_prompt', {
        'worker_id': worker_id,
        'ai_source': args.ai_source
    }).execute()
    return result.data
```

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION claim_next_prompt(
    worker_id INT,
    ai_source TEXT
)
RETURNS TABLE (prompt_id UUID, prompt_text TEXT) AS $$
BEGIN
    RETURN QUERY
    UPDATE prompts p
    SET 
        processing_worker = worker_id,
        processing_started_at = NOW()
    WHERE p.id = (
        SELECT id FROM prompts
        WHERE category_id IN (SELECT id FROM categories)
        AND processing_worker IS NULL
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING p.id, p.text;
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Queue System (Reliability)

**Add Redis Queue**:
```bash
pip install redis rq
```

**Queue Architecture**:
```python
from redis import Redis
from rq import Queue

redis_conn = Redis(host='localhost', port=6379)
scrape_queue = Queue('scraping', connection=redis_conn)

# Producer: Add jobs to queue
for prompt in prompts:
    scrape_queue.enqueue(
        'worker.scrape_prompt',
        prompt_id=prompt['id'],
        ai_source='chatgpt',
        retry=3,
        timeout=300
    )

# Consumer: Process jobs
from rq import Worker
worker = Worker(['scraping'], connection=redis_conn)
worker.work()
```

**Benefits**:
- Automatic retry on failures
- Job persistence (survives crashes)
- Priority queues
- Monitoring dashboard (RQ Dashboard)

### Phase 3: Distributed Architecture

**Infrastructure**:
```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼───┐ ┌──▼──┐ ┌──▼───┐
│ API 1 │ │API 2│ │ API 3│  (FastAPI instances)
└───┬───┘ └──┬──┘ └──┬───┘
    │        │       │
    └────────┼───────┘
             │
    ┌────────▼────────┐
    │  Redis Queue    │
    └────────┬────────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼───┐ ┌──▼──┐ ┌──▼───┐
│Worker1│ │Work2│ │Work3 │  (Scraper workers)
└───────┘ └─────┘ └──────┘
             │
    ┌────────▼────────┐
    │   PostgreSQL    │
    │   (Supabase)    │
    └─────────────────┘
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0
    ports:
      - "8000-8002:8000"
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
  
  worker-chatgpt:
    build: ./backend
    command: python worker.py --ai-source chatgpt
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
  
  worker-gemini:
    build: ./backend
    command: python worker.py --ai-source gemini
    deploy:
      replicas: 2
  
  worker-perplexity:
    build: ./backend
    command: python worker.py --ai-source perplexity
    deploy:
      replicas: 2
```

### Phase 4: Monitoring & Observability

**Metrics to Track**:
```python
from prometheus_client import Counter, Histogram, Gauge

# Counters
prompts_processed = Counter('prompts_processed_total', 'Total prompts processed', ['ai_source', 'status'])
llm_extractions = Counter('llm_extractions_total', 'LLM extraction attempts', ['status'])

# Histograms
scrape_duration = Histogram('scrape_duration_seconds', 'Time to scrape prompt', ['ai_source'])
llm_duration = Histogram('llm_extraction_duration_seconds', 'LLM extraction time')

# Gauges
active_workers = Gauge('active_workers', 'Number of active workers', ['ai_source'])
queue_size = Gauge('queue_size', 'Number of pending jobs')

# Usage
with scrape_duration.labels(ai_source='chatgpt').time():
    result = await scraper.query(prompt, brands)
    
prompts_processed.labels(ai_source='chatgpt', status='success').inc()
```

**Grafana Dashboard**:
- Prompts processed per hour
- Success/failure rates
- Average scrape duration
- Queue depth
- Worker health status

**Alerting**:
```python
# Slack webhook for failures
import requests

def alert_failure(prompt_id, error):
    requests.post(
        'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        json={
            'text': f'🚨 Scrape failed: {prompt_id}\nError: {error}'
        }
    )
```

### Phase 5: Database Optimization

**Connection Pooling**:
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

**Indexing**:
```sql
-- Speed up prompt queries
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_processing ON prompts(processing_worker) WHERE processing_worker IS NULL;

-- Speed up response queries
CREATE INDEX idx_responses_prompt ON responses(prompt_id);
CREATE INDEX idx_responses_created ON responses(created_at DESC);

-- Speed up brand queries
CREATE INDEX idx_brand_mentions_response ON brand_mentions(response_id);
CREATE INDEX idx_citations_brand ON citations(brand_name);
```

**Partitioning** (for large datasets):
```sql
-- Partition responses by month
CREATE TABLE responses_2024_01 PARTITION OF responses
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE responses_2024_02 PARTITION OF responses
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

### Phase 6: Caching Layer

**Redis Caching**:
```python
import redis
import json

cache = redis.Redis(host='localhost', port=6379, decode_responses=True)

async def get_brand_details(brand_id: str):
    # Check cache first
    cached = cache.get(f'brand:{brand_id}')
    if cached:
        return json.loads(cached)
    
    # Fetch from database
    data = await db.get_brand_details(brand_id)
    
    # Cache for 5 minutes
    cache.setex(f'brand:{brand_id}', 300, json.dumps(data))
    
    return data
```

**Cache Invalidation**:
```python
# Invalidate on new data
async def save_response(response_data):
    await db.save_response(response_data)
    
    # Invalidate related caches
    for brand in response_data['brands_mentioned']:
        cache.delete(f'brand:{brand.id}')
        cache.delete(f'brand:{brand.id}:timeseries')
```

## Scaling Checklist

### Infrastructure
- [ ] Deploy 3+ API instances behind load balancer
- [ ] Run 5+ worker instances (2 per platform)
- [ ] Set up Redis for queue management
- [ ] Configure connection pooling (20+ connections)
- [ ] Enable database read replicas

### Monitoring
- [ ] Set up Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Configure Slack/email alerts
- [ ] Enable error tracking (Sentry)
- [ ] Set up uptime monitoring

### Database
- [ ] Add indexes on frequently queried columns
- [ ] Enable query performance insights
- [ ] Set up automated backups
- [ ] Configure connection limits
- [ ] Implement caching layer

### Reliability
- [ ] Implement job queue with retries
- [ ] Add circuit breakers for external APIs
- [ ] Set up health check endpoints
- [ ] Configure graceful shutdown
- [ ] Add request timeouts

### Performance
- [ ] Enable response caching (Redis)
- [ ] Optimize database queries
- [ ] Batch LLM extractions
- [ ] Use CDN for static assets
- [ ] Compress API responses

## Expected Performance

### With 10 Workers
- **Throughput**: 600 prompts/hour
- **Daily Capacity**: 14,400 prompts/day
- **Monthly**: 432,000 prompts/month

### With 20 Workers + Queue
- **Throughput**: 1,200 prompts/hour
- **Daily Capacity**: 28,800 prompts/day
- **Monthly**: 864,000 prompts/month

### With Full Stack (50 workers)
- **Throughput**: 3,000 prompts/hour
- **Daily Capacity**: 72,000 prompts/day
- **Monthly**: 2.16M prompts/month

## Cost Estimates

### Infrastructure (Monthly)
- **API Servers** (3x): $30-50 (Railway/Render)
- **Workers** (10x): $100-150 (Background workers)
- **Redis**: $15-30 (Redis Cloud)
- **Database**: $25 (Supabase Pro)
- **Proxies**: $300-500 (Oxylabs residential)
- **Monitoring**: $0-50 (Grafana Cloud free tier)

**Total**: $470-780/month for 600 prompts/hour

### LLM API Costs
- **Free Tier**: 1,500 requests/day (sufficient for 50 brands/day)
- **Paid Tier**: $0.00025/request (1M requests = $250)

## Failure Recovery

### Automatic Retry
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=60)
)
async def scrape_with_retry(prompt_id):
    return await scraper.query_with_fresh_browser(prompt, brands)
```

### Dead Letter Queue
```python
# Move failed jobs to DLQ after 3 retries
if retry_count >= 3:
    await db.move_to_dlq(prompt_id, error_message)
    await alert_failure(prompt_id, error_message)
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    checks = {
        'database': await check_database(),
        'redis': await check_redis(),
        'llm_api': await check_llm_api(),
        'workers': await check_workers()
    }
    
    healthy = all(checks.values())
    status_code = 200 if healthy else 503
    
    return JSONResponse(
        status_code=status_code,
        content={'status': 'healthy' if healthy else 'unhealthy', 'checks': checks}
    )
```

## Best Practices

1. **Start Small**: Begin with 3-5 workers, scale gradually
2. **Monitor First**: Set up monitoring before scaling
3. **Test Failures**: Simulate failures to verify recovery
4. **Rate Limit**: Respect AI platform rate limits
5. **Rotate Proxies**: Use different IPs per worker
6. **Log Everything**: Centralized logging (ELK stack)
7. **Graceful Degradation**: Continue on non-critical failures
8. **Regular Backups**: Automated daily database backups

---

**Ready to scale?** Start with Phase 1 (parallel workers) and iterate based on metrics.
