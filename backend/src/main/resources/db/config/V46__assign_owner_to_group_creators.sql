-- Assign OWNER role to the earliest approved member of each group (the original creator)
UPDATE config.group_members gm
SET role_id = (SELECT id FROM config.roles WHERE name = 'OWNER')
WHERE gm.id IN (
  SELECT DISTINCT ON (group_id) id
  FROM config.group_members
  WHERE status = 'APPROVED'
  ORDER BY group_id, created_at ASC
)
AND gm.role_id = (SELECT id FROM config.roles WHERE name = 'ADMIN');
