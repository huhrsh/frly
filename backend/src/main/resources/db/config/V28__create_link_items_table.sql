CREATE TABLE IF NOT EXISTS link_items (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    section_id BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    link_key TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    position_order INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);
