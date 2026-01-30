ALTER TABLE config.sections ADD COLUMN parent_id BIGINT REFERENCES config.sections(id) ON DELETE CASCADE;
