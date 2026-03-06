-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    group_id BIGINT,
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Review table
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    message VARCHAR(2000) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    show_publicly BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);
