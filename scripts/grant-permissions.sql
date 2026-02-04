-- Run this as the RDS admin user (postgres or master user)
-- Connect to: fomo-engine-db.cpomi62aqgc5.us-west-2.rds.amazonaws.com:5432/fomo_engine

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE fomo_engine TO fomoengine;

-- Grant schema usage and creation
GRANT USAGE, CREATE ON SCHEMA public TO fomoengine;

-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fomoengine;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fomoengine;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO fomoengine;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO fomoengine;

-- Verify permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'fomoengine'
LIMIT 10;
