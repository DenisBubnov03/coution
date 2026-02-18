# Coution

База знаний (Notion-like) для Coconut.

- **Auth** — mentors из test (дашборд), tg-ник + пароль
- **Данные** — pages, blocks в БД coution

## Быстрый старт

```bash
cp .env.example .env   # обязательно! Без .env будет RuntimeError
# Заполни: AUTH_DATABASE_URL, POSTGRES_PASSWORD, JWT_SECRET

docker compose up -d
```

API: http://localhost:8001/docs

## Документация

| Файл | Описание |
|------|----------|
| [SETUP.md](SETUP.md) | Пошаговая настройка для учеников |
| [DOCS.md](DOCS.md) | Полная документация, Docker, API |

## Локально

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# AUTH_DATABASE_URL, COUTION_DATABASE_URL, JWT_SECRET

createdb coution
psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql

cd backend && uvicorn main:app --reload --port 8001
```
