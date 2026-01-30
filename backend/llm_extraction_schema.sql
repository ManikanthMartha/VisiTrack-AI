-- ============================================================================
-- LLM-Powered Extraction Schema
-- Tables for storing citations, brand mentions, sentiment, and keywords
-- Run this AFTER supabase_schema.sql and COMPLETE_SCHEMA_UPDATES.sql
-- ============================================================================

-- 1. Citations table - stores URLs/sources cited for each brand
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    domain TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_citation_per_response_brand UNIQUE (response_id, brand_name, url)
);

CREATE INDEX IF NOT EXISTS idx_citations_response ON citations(response_id);
CREATE INDEX IF NOT EXISTS idx_citations_brand ON citations(brand_name);
CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);

COMMENT ON TABLE citations IS 'Citations/sources extracted by LLM for each brand mention';
COMMENT ON COLUMN citations.position IS 'Position of citation in response (1st, 2nd, 3rd, etc.)';

-- 2. Brand mentions table - stores context, sentiment, and keywords
CREATE TABLE IF NOT EXISTS brand_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    context TEXT NOT NULL,
    full_context TEXT,
    position INTEGER DEFAULT 0,
    sentiment VARCHAR(20) DEFAULT 'neutral',
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative'))
);

CREATE INDEX IF NOT EXISTS idx_brand_mentions_response ON brand_mentions(response_id);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_brand ON brand_mentions(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_sentiment ON brand_mentions(sentiment);

COMMENT ON TABLE brand_mentions IS 'Brand mention contexts extracted by LLM with sentiment and keywords';
COMMENT ON COLUMN brand_mentions.context IS '2-3 sentence summary of how brand is mentioned';
COMMENT ON COLUMN brand_mentions.full_context IS 'Full paragraph mentioning the brand';
COMMENT ON COLUMN brand_mentions.sentiment IS 'Sentiment: positive, neutral, or negative';
COMMENT ON COLUMN brand_mentions.keywords IS 'Key themes/topics associated with brand';

-- 3. View for top cited sources per brand
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

COMMENT ON VIEW brand_top_citations IS 'Top cited sources for each brand';

-- 4. View for brand citation share
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

COMMENT ON VIEW brand_citation_share IS 'Citation share percentage for each brand in their category';

-- 5. View for sentiment breakdown per brand
CREATE OR REPLACE VIEW brand_sentiment_breakdown AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'positive') as positive_count,
    COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'neutral') as neutral_count,
    COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'negative') as negative_count,
    COUNT(DISTINCT bm.id) as total_mentions,
    ROUND(
        (COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'positive')::DECIMAL / 
         NULLIF(COUNT(DISTINCT bm.id), 0)) * 100,
        2
    ) as positive_percentage,
    ROUND(
        (COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'neutral')::DECIMAL / 
         NULLIF(COUNT(DISTINCT bm.id), 0)) * 100,
        2
    ) as neutral_percentage,
    ROUND(
        (COUNT(DISTINCT bm.id) FILTER (WHERE bm.sentiment = 'negative')::DECIMAL / 
         NULLIF(COUNT(DISTINCT bm.id), 0)) * 100,
        2
    ) as negative_percentage
FROM brands b
LEFT JOIN brand_mentions bm ON bm.brand_name = b.name
GROUP BY b.id, b.name, b.category_id;

COMMENT ON VIEW brand_sentiment_breakdown IS 'Sentiment distribution for each brand';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Test citations table
-- SELECT * FROM citations LIMIT 5;

-- Test brand_mentions table
-- SELECT * FROM brand_mentions LIMIT 5;

-- Test brand_top_citations view
-- SELECT * FROM brand_top_citations WHERE brand_id = 'your-brand-id' LIMIT 10;

-- Test brand_citation_share view
-- SELECT * FROM brand_citation_share WHERE brand_id = 'your-brand-id';

-- Test brand_sentiment_breakdown view
-- SELECT * FROM brand_sentiment_breakdown WHERE brand_id = 'your-brand-id';
