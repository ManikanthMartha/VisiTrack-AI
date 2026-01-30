# Scaling to 1000+ Prompts - System Design

High-level architecture and strategies for scaling AI Visibility Tracker to handle enterprise-level workloads.

---

## Current System

**Architecture**: Monolithic worker + API server  
**Throughput**: ~150 prompts/hour (single worker)  
**Bottlenecks**: Browser automation, LLM rate limits, single-threaded processing

---

## Scaling Approach

### Phase 1: Scheduled Jobs (Cron-based)

**Simple Cron Setup**
- Run worker script on schedule (every 5 minutes)
- Process batch of pending prompts
- Exit when batch complete
- **Pros**: Simple, no infrastructure changes
- **Cons**: No real-time processing, resource waste during idle

**Managed Cron Services**
- GitHub Actions (free tier: 2000 min/month)
- Render Cron Jobs
- Railway Cron
- **Use case**: Low-volume, periodic scraping

**Limitations**
- No parallelization
- Poor failure recovery
- Difficult to scale beyond 500 prompts/day

---

### Phase 2: Persistent Workers

**Long-running Processes**
- Workers run continuously, polling for new prompts
- Multiple workers per platform (ChatGPT, Gemini, Perplexity)
- Database-based job claiming with row locking
- **Throughput**: 3-5x improvement over cron

**Worker Distribution**
- 2-3 workers per AI platform
- Each worker processes different prompts (no overlap)
- Platform isolation prevents cascading failures

**Job Claiming Strategy**
- Database transaction with `FOR UPDATE SKIP LOCKED`
- Worker claims prompt, processes, marks complete
- Unclaimed prompts remain available for other workers

---

### Phase 3: Message Queue Architecture

**Queue-based System**
- Decouple job creation from execution
- Producers add prompts to queue
- Consumers (workers) process from queue
- **Technologies**: Redis Queue, RabbitMQ, AWS SQS, Google Cloud Tasks

**Benefits**
- Automatic retry on failure
- Job persistence (survives crashes)
- Priority queues (urgent prompts first)
- Rate limiting built-in
- Monitoring and observability

**Queue Patterns**
- **Single Queue**: All prompts in one queue, workers pull by platform
- **Platform Queues**: Separate queue per AI platform
- **Priority Queues**: High-value brands get processed first

---

### Phase 4: Distributed Architecture

**Horizontal Scaling**

```
Load Balancer
    ↓
API Servers (3-5 instances)
    ↓
Message Queue (Redis/RabbitMQ)
    ↓
Worker Pool (10-50 workers)
    ↓
Database (PostgreSQL + Read Replicas)
```

**Components**
- **API Layer**: Stateless, auto-scaling, handles user requests
- **Queue Layer**: Manages job distribution and retry logic
- **Worker Layer**: Processes scraping jobs, scales independently
- **Data Layer**: Primary DB + read replicas for queries

**Scaling Dimensions**
- **API**: Scale based on user traffic
- **Workers**: Scale based on queue depth
- **Database**: Read replicas for analytics queries

---

### Phase 5: Advanced Optimizations

**Database Optimization**
- Connection pooling (20-50 connections)
- Indexing on frequently queried columns
- Partitioning large tables by date
- Materialized views for aggregations
- Read replicas for analytics

**Caching Strategy**
- Redis for frequently accessed data
- Cache brand details, leaderboards, timeseries
- TTL-based invalidation (5-15 minutes)
- Cache-aside pattern

**LLM Optimization**
- Batch processing (3-5 brands per request)
- Response streaming for large outputs
- Fallback to smaller models on rate limits
- Local caching of extraction results

**Browser Optimization**
- Headless browser pool (reuse instances)
- Parallel browser sessions
- Proxy rotation to avoid rate limits
- Session persistence across requests

## Decision Framework

**Choose Cron if:**
- Processing <500 prompts/day
- Budget <$50/month
- Can tolerate delays

**Choose Persistent Workers if:**
- Processing 500-5,000 prompts/day
- Need near real-time processing
- Budget $100-500/month

**Choose Queue System if:**
- Processing 5,000+ prompts/day
- Need reliability and retry logic
- Budget $500+/month

**Choose Kubernetes if:**
- Processing 50,000+ prompts/day
- Need enterprise-grade reliability
- Have DevOps resources

---