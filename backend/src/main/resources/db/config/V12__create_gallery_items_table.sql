CREATE TABLE IF NOT EXISTS gallery_items (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL, -- Managed by @TenantId
    section_id BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_filename VARCHAR(255) NOT NULL,
    
    url VARCHAR(512) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
