CREATE TABLE IF NOT EXISTS user_tenant_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    CONSTRAINT uq_user_tenant_role UNIQUE (user_id, tenant_id, role_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant_registry(id),
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id)
);
