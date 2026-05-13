-- Add OWNER role
INSERT INTO config.roles (name, description)
VALUES ('OWNER', 'Group Owner')
ON CONFLICT (name) DO NOTHING;

-- Add default_member_role_id to groups table
ALTER TABLE config.groups
ADD COLUMN IF NOT EXISTS default_member_role_id BIGINT
  REFERENCES config.roles(id);

-- Default existing groups to MEMBER role
UPDATE config.groups
SET default_member_role_id = (SELECT id FROM config.roles WHERE name = 'MEMBER');

ALTER TABLE config.groups
ALTER COLUMN default_member_role_id SET NOT NULL;
