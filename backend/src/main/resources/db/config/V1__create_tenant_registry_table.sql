CREATE TABLE IF NOT EXISTS tenant_registry (
    id BIGSERIAL PRIMARY KEY,
    tenant_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT now()
);
