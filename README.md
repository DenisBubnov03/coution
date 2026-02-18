# Coution

База знаний (Notion-like) для Coconut.

- **Auth** — mentors из test (дашборд), tg-ник + пароль
- **Данные** — pages, blocks в БД coution

## Быстрый старт

БД не в Docker — подключаемся к твоему Postgres (локально или на другой VM).

```bash
cp .env.example .env
# Заполни: AUTH_DATABASE_URL, COUTION_DATABASE_URL, JWT_SECRET

docker compose up -d
```

Поднимутся только app + frontend.

- **Фронт:** http://localhost:5173
- **API:** http://localhost:8001/docs

Убедись, что БД coution создана и таблицы применены: `psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql`

## Фронт отдельно (без Docker)

```bash
cd frontend
npm install
npm run dev
```

Откроется http://localhost:5173 — логин, список страниц, просмотр страницы.  
Бэкенд должен быть запущен на порту 8001 (прокси в vite настроен на /api).

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
