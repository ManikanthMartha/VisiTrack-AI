-- Cleanup Script: Drop Old Auth Tables
-- Run this FIRST in Supabase SQL Editor before running the main schema

-- Drop old tables if they exist (from previous setup)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify they're gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions');

-- This should return 0 rows if cleanup was successful
