-- Seed Data for AI Visibility Tracker
-- Run this AFTER supabase_schema.sql

-- Insert Categories
INSERT INTO categories (id, name, description) VALUES
('crm_software', 'CRM Software', 'Customer relationship management tools for startups and small to mid-sized businesses'),
('project_management', 'Project Management Tools', 'Project and task management software used by startups, teams, and enterprises')
ON CONFLICT (id) DO NOTHING;

-- Insert Brands for CRM Software
INSERT INTO brands (name, category_id) VALUES
('Salesforce', 'crm_software'),
('HubSpot', 'crm_software'),
('Zoho CRM', 'crm_software'),
('Pipedrive', 'crm_software'),
('Freshsales', 'crm_software'),
('Monday CRM', 'crm_software'),
('Copper', 'crm_software'),
('Close', 'crm_software'),
('Insightly', 'crm_software'),
('SugarCRM', 'crm_software')
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Brands for Project Management
INSERT INTO brands (name, category_id) VALUES
('Jira', 'project_management'),
('Asana', 'project_management'),
('Trello', 'project_management'),
('ClickUp', 'project_management'),
('Notion', 'project_management'),
('Monday.com', 'project_management'),
('Linear', 'project_management'),
('Basecamp', 'project_management'),
('Smartsheet', 'project_management'),
('Wrike', 'project_management')
ON CONFLICT (name, category_id) DO NOTHING;

-- Insert Prompts for CRM Software
INSERT INTO prompts (text, category_id) VALUES
('What is the best CRM for startups?', 'crm_software'),
('Best CRM software for small businesses in 2026', 'crm_software'),
('Top CRM tools for early-stage startups', 'crm_software'),
('Salesforce vs HubSpot for startups', 'crm_software'),
('Best Salesforce alternatives for small teams', 'crm_software'),
('HubSpot competitors for SMBs', 'crm_software'),
('Affordable CRM software for startups', 'crm_software'),
('Free CRM tools worth using for small businesses', 'crm_software'),
('Cheap CRM with good integrations', 'crm_software'),
('CRM for sales teams under 20 people', 'crm_software'),
('Best CRM for B2B SaaS startups', 'crm_software'),
('CRM software with strong email automation', 'crm_software'),
('What CRM do startups commonly use?', 'crm_software'),
('CRM tools founders actually recommend', 'crm_software'),
('Which CRM scales best as a startup grows?', 'crm_software')
ON CONFLICT (text, category_id) DO NOTHING;

-- Insert Prompts for Project Management
INSERT INTO prompts (text, category_id) VALUES
('What is the best project management tool for startups?', 'project_management'),
('Best project management software in 2026', 'project_management'),
('Top project management tools for small teams', 'project_management'),
('Jira vs Asana for software teams', 'project_management'),
('Best Jira alternatives for startups', 'project_management'),
('ClickUp vs Notion for project management', 'project_management'),
('Affordable project management tools for startups', 'project_management'),
('Free project management software worth using', 'project_management'),
('Project management tools for remote teams', 'project_management'),
('Best project management software for developers', 'project_management'),
('Project management tools for cross-functional teams', 'project_management'),
('Simple project management tools for non-technical teams', 'project_management'),
('What project management tools do startups use?', 'project_management'),
('Project management tools founders recommend', 'project_management'),
('Which project management tool scales best as teams grow?', 'project_management')
ON CONFLICT (text, category_id) DO NOTHING;

-- Verify seed data
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Prompts', COUNT(*) FROM prompts;
