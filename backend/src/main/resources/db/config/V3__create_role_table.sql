-- Create Roles Table (if not exists)
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Insert Default Roles
INSERT INTO roles (name, description) VALUES ('ADMIN', 'Group Administrator') ON CONFLICT DO NOTHING;
INSERT INTO roles (name, description) VALUES ('MEMBER', 'Group Member') ON CONFLICT DO NOTHING;
