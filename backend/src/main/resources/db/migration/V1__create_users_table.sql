-- Migration V1: create users table
-- Created: 2025-11-10

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Optional index for email lookup
CREATE UNIQUE INDEX IF NOT EXISTS unique_index_users_email ON users(email);

