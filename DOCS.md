# Coution — документация

База знаний (Notion-like) для Coconut. Отдельный проект, Docker-ready.

## Архитектура

- **Auth** — менторы из БД дашборда (`test`). Логин: tg-ник + пароль.
- **Данные** — страницы и блоки в БД `coution`.
- **Два Postgres**: дашборд (test) — отдельно; coution — в Docker или свой сервер.

## Безопасность

- Все пароли и секреты — только в `.env`
- `.env` в `.gitignore`, не коммитить
- `JWT_SECRET` — тот же что в дашборде (можно общий токен)

## Docker

### Быстрый старт

```bash
# 1. .env
cp .env.example .env
# Заполнить: AUTH_DATABASE_URL, POSTGRES_PASSWORD, JWT_SECRET

# 2. Запуск
docker compose up -d

# API
open http://localhost:8001/docs
```

### Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `AUTH_DATABASE_URL` | да | postgresql://user:pass@host/test — БД с mentors |
| `POSTGRES_PASSWORD` | да | Пароль Postgres в контейнере coution |
| `JWT_SECRET` | да | Секрет для JWT (32+ символов) |
| `POSTGRES_USER` | нет | Логин Postgres (по умолчанию coution) |
| `POSTGRES_DB` | нет | Имя БД (по умолчанию coution) |
| `CORS_ORIGINS` | нет | Разрешённые origins через запятую |

### Подключение к mentors (дашборд)

Auth читает таблицу `mentors` из БД дашборда. Возможные варианты:

**Вариант A — mentors на хосте, coution в Docker**
```env
AUTH_DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/test
```
`host.docker.internal` — хост-машина (Mac/Windows).

**Вариант B — оба на одном сервере**
```env
AUTH_DATABASE_URL=postgresql://user:pass@postgres_host:5432/test
```

**Вариант C — mentors в другом Docker-контейнере**
```env
AUTH_DATABASE_URL=postgresql://user:pass@dashboard_postgres:5432/test
```
И добавить `dashboard_postgres` в сеть compose или указать внешнюю сеть.

### Создание БД и таблиц

- БД `coution` создаётся Postgres при первом запуске.
- Таблицы `pages`, `blocks` создаются скриптом `001_initial.sql` в `docker-entrypoint-initdb.d/`.
- Повторный `up` не пересоздаёт БД — данные сохраняются в volume `postgres_data`.

### Volumes

- `postgres_data` — данные Postgres. Удаление volume удалит все данные coution.

### Остановка

```bash
docker compose down
# С данными:
# docker compose down -v
```

## Локальный запуск (без Docker)

```bash
# venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# .env (AUTH_DATABASE_URL, COUTION_DATABASE_URL, JWT_SECRET)
cp .env.example .env

# БД
createdb coution
psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql

# Запуск
cd backend && uvicorn main:app --reload --port 8001
```

## API

- `POST /api/auth/login` — логин (username, password)
- `GET /api/auth/me` — текущий пользователь (Bearer)
- `GET/POST /api/kb/pages` — страницы
- `GET /api/kb/public/{slug}` — публичная страница (без авторизации)

Полный список: http://localhost:8001/docs
