-- Rollback V35: Remove section type notification columns from group_members
ALTER TABLE config.group_members 
DROP COLUMN IF EXISTS notify_notes,
DROP COLUMN IF EXISTS notify_lists,
DROP COLUMN IF EXISTS notify_links,
DROP COLUMN IF EXISTS notify_gallery,
DROP COLUMN IF EXISTS notify_reminders,
DROP COLUMN IF EXISTS notify_payments,
DROP COLUMN IF EXISTS notify_calendar,
DROP COLUMN IF EXISTS notify_folders;

-- Create new table for section notification preferences
CREATE TABLE IF NOT EXISTS config.section_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    group_member_id BIGINT NOT NULL REFERENCES config.group_members(id) ON DELETE CASCADE,
    section_type VARCHAR(20) NOT NULL,
    notification_mode VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(group_member_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_section_notif_prefs_member_type 
ON config.section_notification_preferences(group_member_id, section_type);

-- Valid values for notification_mode: 'BOTH', 'IN_APP_ONLY', 'PUSH_ONLY', 'NONE'
-- Valid values for section_type: 'NOTE', 'LIST', 'LINKS', 'GALLERY', 'REMINDER', 'PAYMENT', 'CALENDAR', 'FOLDER'
