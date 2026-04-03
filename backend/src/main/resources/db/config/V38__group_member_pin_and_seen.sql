ALTER TABLE config.group_members ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE config.group_members ADD COLUMN last_seen_at TIMESTAMP;
