-- Enhance notifications table with additional context
ALTER TABLE config.notifications
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES config.groups(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES config.sections(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_notifications_group_id ON config.notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_section_id ON config.notifications(section_id);
