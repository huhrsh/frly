-- Add notification preference columns to group_members table
ALTER TABLE config.group_members 
ADD COLUMN IF NOT EXISTS in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for notification preference queries
CREATE INDEX IF NOT EXISTS idx_group_members_notifications 
ON config.group_members(group_id, in_app_notifications_enabled, push_notifications_enabled);
