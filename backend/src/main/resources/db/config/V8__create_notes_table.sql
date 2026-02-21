CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL, -- Managed by @TenantId
    section_id BIGINT NOT NULL UNIQUE REFERENCES sections(id) ON DELETE CASCADE,
    content TEXT,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
