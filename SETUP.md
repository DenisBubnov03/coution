# Настройка Coution для учеников

Пошаговая инструкция для первого запуска.

## 1. Клонировать репозиторий

```bash
git clone https://github.com/ваш-аккаунт/notion.git
cd notion
```

## 2. Создать .env

**Обязательный шаг.** Без `.env` приложение выдаст `RuntimeError: AUTH_DATABASE_URL и COUTION_DATABASE_URL обязательны`.

```bash
cp .env.example .env
```

Открыть `.env` и заполнить:

| Переменная | Что указать |
|------------|-------------|
| `AUTH_DATABASE_URL` | URL БД с mentors. Пример: `postgresql://user:pass@host:5432/test` (выдаёт преподаватель) |
| `POSTGRES_PASSWORD` | Свой пароль для БД coution (придумай, минимум 1 символ) |
| `JWT_SECRET` | Секрет для JWT. Сгенерируй сам: `openssl rand -hex 32` или Python: `python3 -c "import secrets; print(secrets.token_hex(32))"` |

Для Docker: в `AUTH_DATABASE_URL` использовать `host.docker.internal` вместо `localhost`, если mentors на твоей машине.

## 3. Запуск

### Docker (рекомендуется)

```bash
docker compose up -d
```

БД coution и таблицы создаются автоматически.

### Локально (без Docker)

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Создать БД и таблицы
createdb coution
psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql

# Запуск
cd backend && uvicorn main:app --reload --port 8001
```

## 4. Проверка

Открыть http://localhost:8001/docs

- **Логин** — tg-ник + пароль (те же, что в дашборде)
- **Страницы** — после логина в Swagger нажать Authorize, вставить токен

## Если что-то не работает

- `AUTH_DATABASE_URL и COUTION_DATABASE_URL обязательны` — создай `.env` из шаблона: `cp .env.example .env`, затем заполни все переменные
- `Connection refused` — Postgres не запущен или неверный хост/порт
- Подробнее: [DOCS.md](DOCS.md)
