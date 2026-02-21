CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL, -- Managed by @TenantId
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    position_order INTEGER,
    is_secured BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
