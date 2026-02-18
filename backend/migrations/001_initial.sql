-- Coution: pages, blocks (auth — mentors в test)
-- psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql
-- createdb coution

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    icon VARCHAR(50),
    created_by_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    public_slug VARCHAR(64) UNIQUE,
    position INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_public_slug ON pages(public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT,
    props JSONB,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
