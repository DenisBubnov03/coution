#!/bin/bash
# Создание таблиц в coution через psql
cd "$(dirname "$0")/.."
COUTION_URL="${COUTION_DATABASE_URL:?COUTION_DATABASE_URL не задан. Заполни .env}"
psql "$COUTION_URL" -f backend/migrations/001_initial.sql
echo "Готово"
