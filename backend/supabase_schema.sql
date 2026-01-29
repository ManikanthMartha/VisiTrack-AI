-- AI Visibility Tracker - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Better Auth Tables
-- User table (Better Auth format)
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    image TEXT
);

-- Session table (Better Auth format)
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Account table (Better Auth format - for OAuth and password)
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table (Better Auth format)
CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
);

-- Indexes for Better Auth tables
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"("userId");
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);

-- 3. Categories Table
-- Stores product categories (e.g., CRM Software, Project Management)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Brands Table
-- Stores brands within each category
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_brand_per_category UNIQUE (name, category_id)
);

-- Index for brand lookups
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- 5. Prompts Table
-- Stores prompts to be scraped for each category
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_prompt_per_category UNIQUE (text, category_id)
);

-- Index for prompt lookups
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);

-- 6. Responses Table
-- Stores all AI platform responses and brand mentions
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    ai_source VARCHAR(50) NOT NULL CHECK (ai_source IN ('chatgpt', 'gemini', 'perplexity')),
    brands_mentioned TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    raw_html TEXT,
    
    -- Indexes for faster queries
    CONSTRAINT valid_ai_source CHECK (ai_source IN ('chatgpt', 'gemini', 'perplexity')),
    CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_responses_prompt ON responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_responses_ai_source ON responses(ai_source);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_brands ON responses USING GIN(brands_mentioned);

-- Composite index for score calculations (prompt + ai_source)
CREATE INDEX IF NOT EXISTS idx_responses_prompt_ai ON responses(prompt_id, ai_source);

-- 7. Scraper Sessions Table
-- Stores authentication cookies and session data
CREATE TABLE IF NOT EXISTS scraper_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_source VARCHAR(50) NOT NULL UNIQUE,
    cookies JSONB NOT NULL,
    is_logged_in BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_ai_source UNIQUE (ai_source)
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_ai_source ON scraper_sessions(ai_source);

-- 8. Brand Mentions Analytics View (materialized for performance)
-- Aggregates brand mentions per category, AI source, and combined
CREATE OR REPLACE VIEW brand_visibility_stats AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.category_id,
    c.name as category_name,
    r.ai_source,
    COUNT(DISTINCT r.id) as mention_count,
    COUNT(DISTINCT p.id) as total_prompts_in_category,
    ROUND(
        (COUNT(DISTINCT r.id)::DECIMAL / NULLIF(COUNT(DISTINCT p.id), 0)) * 100, 
        2
    ) as visibility_score
FROM brands b
CROSS JOIN prompts p
LEFT JOIN responses r ON 
    p.id = r.prompt_id 
    AND b.name = ANY(r.brands_mentioned)
    AND r.status = 'completed'
INNER JOIN categories c ON b.category_id = c.id
WHERE p.category_id = b.category_id
GROUP BY b.id, b.name, b.category_id, c.name, r.ai_source;

-- Combined visibility (across all AI sources)
CREATE OR REPLACE VIEW brand_visibility_combined AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.category_id,
    c.name as category_name,
    COUNT(DISTINCT r.id) as total_mentions,
    COUNT(DISTINCT p.id) as total_prompts,
    ROUND(
        (COUNT(DISTINCT r.id)::DECIMAL / NULLIF(COUNT(DISTINCT p.id), 0)) * 100, 
        2
    ) as combined_visibility_score
FROM brands b
CROSS JOIN prompts p
LEFT JOIN responses r ON 
    p.id = r.prompt_id 
    AND b.name = ANY(r.brands_mentioned)
    AND r.status = 'completed'
INNER JOIN categories c ON b.category_id = c.id
WHERE p.category_id = b.category_id
GROUP BY b.id, b.name, b.category_id, c.name;

-- 9. Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scraper_sessions
CREATE TRIGGER update_scraper_sessions_updated_at
    BEFORE UPDATE ON scraper_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE "user" IS 'Better Auth user table';
COMMENT ON TABLE "session" IS 'Better Auth session table';
COMMENT ON TABLE "account" IS 'Better Auth account table (OAuth + password)';
COMMENT ON TABLE "verification" IS 'Better Auth verification table';
COMMENT ON TABLE categories IS 'Product categories (e.g., CRM Software, Project Management)';
COMMENT ON TABLE brands IS 'Brands within each category';
COMMENT ON TABLE prompts IS 'Prompts to be scraped for each category';
COMMENT ON TABLE responses IS 'AI platform responses and brand mentions';
COMMENT ON TABLE scraper_sessions IS 'Authentication cookies for browser automation';
COMMENT ON VIEW brand_visibility_stats IS 'Brand visibility scores per AI source';
COMMENT ON VIEW brand_visibility_combined IS 'Combined brand visibility scores across all AI sources';
