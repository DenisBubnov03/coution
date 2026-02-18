-- Блоки: props (emoji, bg_color, text_color) для callout и прочих
-- psql $COUTION_DATABASE_URL -f backend/migrations/002_blocks_props.sql

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS props JSONB;
