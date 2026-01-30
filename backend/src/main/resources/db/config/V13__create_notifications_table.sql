-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS config.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES config.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON config.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON config.notifications(user_id, is_read);
