-- Create notification preferences table
CREATE TABLE IF NOT EXISTS config.notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES config.users(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL REFERENCES config.groups(id) ON DELETE CASCADE,
    section_type VARCHAR(20) NOT NULL,
    notification_mode VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, group_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_group ON config.notification_preferences(user_id, group_id);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS config.push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES config.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_info VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON config.push_subscriptions(user_id);
