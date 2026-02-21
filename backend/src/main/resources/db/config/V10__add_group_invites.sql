-- Add invite_code to groups
ALTER TABLE config.groups ADD COLUMN invite_code VARCHAR(10) UNIQUE;

-- Add status to group_members (PENDING, APPROVED)
ALTER TABLE config.group_members ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';

-- Generate unique codes for existing groups (simple fallback)
UPDATE config.groups SET invite_code = SUBSTRING(MD5(id::text) FROM 1 FOR 8) WHERE invite_code IS NULL;

-- Make invite_code not null after backfill
ALTER TABLE config.groups ALTER COLUMN invite_code SET NOT NULL;
