CREATE TABLE IF NOT EXISTS list_items (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL, -- Managed by @TenantId
    section_id BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP,
    position_order INTEGER,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
