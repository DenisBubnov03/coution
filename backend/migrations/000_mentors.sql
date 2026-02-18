-- Таблица менторов для авторизации (БД test или отдельная для auth).
-- Выполнить: psql $AUTH_DATABASE_URL -f backend/migrations/000_mentors.sql

CREATE TABLE IF NOT EXISTS mentors (
    id SERIAL PRIMARY KEY,
    telegram VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    chat_id VARCHAR(255),
    direction VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    password_hash VARCHAR(255)
);
