-- Additional view for leaderboard (separate from brand_details for performance)
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

COMMENT ON VIEW brand_leaderboard IS 'Optimized view for brand leaderboard queries';
