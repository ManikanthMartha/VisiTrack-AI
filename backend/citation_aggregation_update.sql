-- ============================================================================
-- Citation Aggregation Update
-- Removes unique constraint and aggregates duplicate citations
-- ============================================================================

-- 1. Drop the unique constraint that causes primary key errors
ALTER TABLE citations 
DROP CONSTRAINT IF EXISTS unique_citation_per_response_brand;

-- 2. Add index for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_citations_brand_url ON citations(brand_name, url);

-- 3. Updated view for aggregated citations with mention count
DROP VIEW IF EXISTS brand_top_citations;

CREATE OR REPLACE VIEW brand_top_citations AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    c.url,
    MAX(c.title) as title,  -- Take any title (they should be the same)
    MAX(c.domain) as domain,
    COUNT(*) as citation_count,  -- Count all occurrences (including duplicates)
    AVG(c.position) as avg_position,
    COUNT(DISTINCT c.response_id) as response_count,  -- Number of unique responses
    MIN(c.created_at) as first_cited,
    MAX(c.created_at) as last_cited
FROM brands b
INNER JOIN prompts p ON p.category_id = b.category_id
INNER JOIN responses r ON r.prompt_id = p.id 
    AND r.status = 'completed'
INNER JOIN citations c ON c.response_id = r.id AND c.brand_name = b.name
GROUP BY b.id, b.name, b.category_id, c.url
ORDER BY citation_count DESC;

COMMENT ON VIEW brand_top_citations IS 'Aggregated citations showing total mention count per URL';

-- 4. View for citation frequency analysis
CREATE OR REPLACE VIEW citation_frequency AS
SELECT 
    url,
    MAX(title) as title,
    MAX(domain) as domain,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT brand_name) as brands_citing,
    COUNT(DISTINCT response_id) as responses_citing,
    ARRAY_AGG(DISTINCT brand_name ORDER BY brand_name) as citing_brands,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
FROM citations
GROUP BY url
ORDER BY total_mentions DESC;

COMMENT ON VIEW citation_frequency IS 'Overall citation frequency across all brands';

-- 5. View for trending citations (last 7 days)
CREATE OR REPLACE VIEW trending_citations AS
SELECT 
    url,
    MAX(title) as title,
    MAX(domain) as domain,
    COUNT(*) as recent_mentions,
    COUNT(DISTINCT brand_name) as brands_citing,
    ARRAY_AGG(DISTINCT brand_name ORDER BY brand_name) as citing_brands
FROM citations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY url
HAVING COUNT(*) >= 2  -- Only show citations mentioned 2+ times
ORDER BY recent_mentions DESC
LIMIT 50;

COMMENT ON VIEW trending_citations IS 'Most frequently cited sources in the last 7 days';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check citation counts per URL
-- SELECT url, title, COUNT(*) as mentions 
-- FROM citations 
-- GROUP BY url, title 
-- ORDER BY mentions DESC 
-- LIMIT 10;

-- Check brand top citations
-- SELECT * FROM brand_top_citations 
-- WHERE brand_name = 'HubSpot' 
-- LIMIT 10;

-- Check overall citation frequency
-- SELECT * FROM citation_frequency LIMIT 20;

-- Check trending citations
-- SELECT * FROM trending_citations;
