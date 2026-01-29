-- ============================================================================
-- AI Visibility Tracker - Complete Schema Updates
-- Run this AFTER the main supabase_schema.sql
-- ============================================================================

-- 1. Add logo_url and website to brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Create view for category summary (with brand counts and top brands)
-- Returns: id, name, description, brand_count, prompt_count, response_count, top_brands[]
CREATE OR REPLACE VIEW category_summary AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.created_at,
    COUNT(DISTINCT b.id) as brand_count,
    COUNT(DISTINCT p.id) as prompt_count,
    COUNT(DISTINCT r.id) as response_count,
    -- Top 5 brands by visibility score (returns JSONB array)
    COALESCE(
        (
            SELECT jsonb_agg(brand_data ORDER BY visibility_score DESC)
            FROM (
                SELECT 
                    b2.id::text,
                    b2.name,
                    b2.logo_url,
                    COALESCE(
                        ROUND(
                            (COUNT(DISTINCT CASE WHEN b2.name = ANY(r2.brands_mentioned) THEN r2.id END)::DECIMAL / 
                             NULLIF(COUNT(DISTINCT r2.id), 0)) * 100, 
                            2
                        ),
                        0
                    ) as visibility_score
                FROM brands b2
                LEFT JOIN prompts p2 ON p2.category_id = b2.category_id
                LEFT JOIN responses r2 ON r2.prompt_id = p2.id AND r2.status = 'completed'
                WHERE b2.category_id = c.id
                GROUP BY b2.id, b2.name, b2.logo_url
                ORDER BY visibility_score DESC
                LIMIT 5
            ) brand_data
        ),
        '[]'::jsonb
    ) as top_brands
FROM categories c
LEFT JOIN brands b ON b.category_id = c.id
LEFT JOIN prompts p ON p.category_id = c.id
LEFT JOIN responses r ON r.prompt_id = p.id AND r.status = 'completed'
GROUP BY c.id, c.name, c.description, c.created_at;

-- 3. Create view for brand time-series data (daily aggregation)
-- Returns: brand_id, brand_name, category_id, date, ai_source, mention_count, total_responses, daily_visibility_score
CREATE OR REPLACE VIEW brand_visibility_timeseries AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    DATE(r.created_at) as date,
    r.ai_source,
    COUNT(DISTINCT r.id) FILTER (WHERE b.name = ANY(r.brands_mentioned)) as mention_count,
    COUNT(DISTINCT r.id) as total_responses,
    ROUND(
        (COUNT(DISTINCT r.id) FILTER (WHERE b.name = ANY(r.brands_mentioned))::DECIMAL / 
         NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
        2
    ) as daily_visibility_score
FROM brands b
CROSS JOIN responses r
INNER JOIN prompts p ON r.prompt_id = p.id
WHERE p.category_id = b.category_id
    AND r.status = 'completed'
    AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.name, b.category_id, DATE(r.created_at), r.ai_source;

-- 4. Create view for brand platform breakdown
-- Returns: brand_id, brand_name, category_id, ai_source, mention_count, total_responses, platform_visibility_score
CREATE OR REPLACE VIEW brand_platform_scores AS
SELECT 
    b.id::text as brand_id,
    b.name as brand_name,
    b.category_id,
    r.ai_source,
    COUNT(DISTINCT r.id) FILTER (WHERE b.name = ANY(r.brands_mentioned)) as mention_count,
    COUNT(DISTINCT r.id) as total_responses,
    ROUND(
        (COUNT(DISTINCT r.id) FILTER (WHERE b.name = ANY(r.brands_mentioned))::DECIMAL / 
         NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
        2
    ) as platform_visibility_score
FROM brands b
CROSS JOIN responses r
INNER JOIN prompts p ON r.prompt_id = p.id
WHERE p.category_id = b.category_id
    AND r.status = 'completed'
GROUP BY b.id, b.name, b.category_id, r.ai_source;

-- 5. Create view for brand details (comprehensive brand info)
-- Returns: id, name, category_id, logo_url, website, category_name, overall_visibility_score, total_mentions, total_responses, mention_rate
CREATE OR REPLACE VIEW brand_details AS
SELECT 
    b.id::text as id,
    b.name,
    b.category_id,
    b.logo_url,
    b.website,
    c.name as category_name,
    -- Overall visibility score
    COALESCE(
        ROUND(
            (COUNT(DISTINCT CASE WHEN b.name = ANY(r.brands_mentioned) THEN r.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
            2
        ),
        0
    ) as overall_visibility_score,
    -- Total mentions
    COUNT(DISTINCT CASE WHEN b.name = ANY(r.brands_mentioned) THEN r.id END) as total_mentions,
    -- Total responses in category
    COUNT(DISTINCT r.id) as total_responses,
    -- Mention rate
    ROUND(
        (COUNT(DISTINCT CASE WHEN b.name = ANY(r.brands_mentioned) THEN r.id END)::DECIMAL / 
         NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
        2
    ) as mention_rate
FROM brands b
INNER JOIN categories c ON c.id = b.category_id
LEFT JOIN prompts p ON p.category_id = b.category_id
LEFT JOIN responses r ON r.prompt_id = p.id AND r.status = 'completed'
GROUP BY b.id, b.name, b.category_id, b.logo_url, b.website, c.name;

-- 6. Create view for brand leaderboard (optimized for leaderboard queries)
-- Returns: id, name, logo_url, category_id, overall_visibility_score, total_mentions
CREATE OR REPLACE VIEW brand_leaderboard AS
SELECT 
    b.id::text as id,
    b.name,
    b.logo_url,
    b.category_id,
    COALESCE(
        ROUND(
            (COUNT(DISTINCT CASE WHEN b.name = ANY(r.brands_mentioned) THEN r.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
            2
        ),
        0
    ) as overall_visibility_score,
    COUNT(DISTINCT CASE WHEN b.name = ANY(r.brands_mentioned) THEN r.id END) as total_mentions
FROM brands b
LEFT JOIN prompts p ON p.category_id = b.category_id
LEFT JOIN responses r ON r.prompt_id = p.id AND r.status = 'completed'
GROUP BY b.id, b.name, b.logo_url, b.category_id;

-- 7. Add indexes for performance
-- Note: We use created_at directly instead of DATE(created_at) for the index
-- The query planner can still use this index efficiently for date-based queries
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_prompt_ai_status ON responses(prompt_id, ai_source, status);

-- 8. Comments
COMMENT ON VIEW category_summary IS 'Category overview with brand counts and top 5 brands';
COMMENT ON VIEW brand_visibility_timeseries IS 'Daily brand visibility scores for time-series charts (last 30 days)';
COMMENT ON VIEW brand_platform_scores IS 'Brand visibility scores per AI platform';
COMMENT ON VIEW brand_details IS 'Comprehensive brand information and statistics';
COMMENT ON VIEW brand_leaderboard IS 'Optimized view for brand leaderboard queries';

-- ============================================================================
-- Verification Queries (run these to test the views)
-- ============================================================================

-- Test category_summary
-- SELECT * FROM category_summary LIMIT 1;

-- Test brand_leaderboard
-- SELECT * FROM brand_leaderboard WHERE category_id = 'your-category-id' LIMIT 5;

-- Test brand_details
-- SELECT * FROM brand_details WHERE id = 'your-brand-id';

-- Test brand_visibility_timeseries
-- SELECT * FROM brand_visibility_timeseries WHERE brand_id = 'your-brand-id' ORDER BY date DESC LIMIT 10;

-- Test brand_platform_scores
-- SELECT * FROM brand_platform_scores WHERE brand_id = 'your-brand-id';
