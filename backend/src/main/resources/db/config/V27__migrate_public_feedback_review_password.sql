DO $$
BEGIN
    -- Migrate feedback from public to config
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'feedback'
    ) THEN
        INSERT INTO config.feedback (id, user_id, group_id, message, created_at)
        SELECT f.id, f.user_id, f.group_id, f.message, f.created_at
        FROM public.feedback f
        LEFT JOIN config.feedback cf ON cf.id = f.id
        WHERE cf.id IS NULL;

        PERFORM setval(
            pg_get_serial_sequence('config.feedback', 'id'),
            COALESCE((SELECT MAX(id) FROM config.feedback), 1),
            true
        );
    END IF;

    -- Migrate review from public to config
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'review'
    ) THEN
        INSERT INTO config.review (id, user_id, message, rating, show_publicly, created_at)
        SELECT r.id, r.user_id, r.message, r.rating, r.show_publicly, r.created_at
        FROM public.review r
        LEFT JOIN config.review cr ON cr.id = r.id
        WHERE cr.id IS NULL;

        PERFORM setval(
            pg_get_serial_sequence('config.review', 'id'),
            COALESCE((SELECT MAX(id) FROM config.review), 1),
            true
        );
    END IF;

    -- Migrate password_reset_tokens from public to config
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
    ) THEN
        INSERT INTO config.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
        SELECT t.id, t.user_id, t.token_hash, t.expires_at, t.used_at, t.created_at
        FROM public.password_reset_tokens t
        LEFT JOIN config.password_reset_tokens ct ON ct.id = t.id
        WHERE ct.id IS NULL;

        PERFORM setval(
            pg_get_serial_sequence('config.password_reset_tokens', 'id'),
            COALESCE((SELECT MAX(id) FROM config.password_reset_tokens), 1),
            true
        );
    END IF;

    -- Drop legacy tables in public schema after successful migration
    DROP TABLE IF EXISTS public.feedback CASCADE;
    DROP TABLE IF EXISTS public.review CASCADE;
    DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;

    -- Drop legacy sequences in public schema if present
    DROP SEQUENCE IF EXISTS public.feedback_id_seq CASCADE;
    DROP SEQUENCE IF EXISTS public.review_id_seq CASCADE;
    DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq CASCADE;
END
$$;