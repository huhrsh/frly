ALTER TABLE sections
    DROP COLUMN IF EXISTS is_secured,
    DROP COLUMN IF EXISTS password_hash;
