-- Add auth_provider column and make encrypted_password nullable for Google OAuth support
ALTER TABLE config.users
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';

ALTER TABLE config.users
    ALTER COLUMN encrypted_password DROP NOT NULL;
