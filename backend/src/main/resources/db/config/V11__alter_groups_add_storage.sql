-- Add storage limit and usage columns to groups table
-- Default limit: 100MB (104857600 bytes)
ALTER TABLE config.groups 
ADD COLUMN storage_limit BIGINT NOT NULL DEFAULT 104857600,
ADD COLUMN storage_usage BIGINT NOT NULL DEFAULT 0;
