CREATE TABLE config.activity_log (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    actor_id BIGINT,
    actor_name VARCHAR(255),
    action_type VARCHAR(60) NOT NULL,
    entity_name VARCHAR(255),
    section_id BIGINT,
    section_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_group_id ON config.activity_log(group_id, created_at DESC);
