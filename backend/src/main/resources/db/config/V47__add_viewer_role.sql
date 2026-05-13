INSERT INTO config.roles (name, description)
VALUES ('VIEWER', 'Group Viewer — read-only access to all sections')
ON CONFLICT (name) DO NOTHING;
