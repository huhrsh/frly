CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL, -- Managed by @TenantId
    section_id BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_time TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
