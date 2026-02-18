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

**БД и таблицы создаются автоматически** — ничего дополнительно делать не нужно.

---

### Локально (без Docker)

Если не используешь Docker, нужно вручную создать базу и таблицы.

#### 3.1. Установить PostgreSQL

- Mac: `brew install postgresql` и `brew services start postgresql`
- Windows: скачать с https://www.postgresql.org/download/
- Linux: `sudo apt install postgresql` или `sudo yum install postgresql`

#### 3.2. Создать базу данных coution

Открой терминал и выполни:

```bash
createdb coution
```

Если команда не найдена — добавь Postgres в PATH или используй полный путь.  
Проверить, что база создалась: `psql -l` (в списке должна быть coution).

#### 3.3. Создать таблицы

Выполни миграцию (подставь свои user и password из COUTION_DATABASE_URL):

```bash
psql postgresql://твой_user:твой_password@localhost/coution -f backend/migrations/001_initial.sql
```

Или через переменную из .env:

```bash
source .env   # загрузить переменные (Mac/Linux)
psql "$COUTION_DATABASE_URL" -f backend/migrations/001_initial.sql
```

Должно вывести `CREATE TABLE` — значит таблицы созданы.

#### 3.4. Запустить приложение

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cd backend && uvicorn main:app --reload --port 8001
```

## 4. Проверка

Открыть http://localhost:8001/docs

- **Логин** — tg-ник + пароль (те же, что в дашборде)
- **Страницы** — после логина в Swagger нажать Authorize, вставить токен

## Если что-то не работает

- `AUTH_DATABASE_URL и COUTION_DATABASE_URL обязательны` — создай `.env`: `cp .env.example .env`, заполни переменные
- `Connection refused` — Postgres не запущен или неверный хост/порт
- `relation "pages" does not exist` — **таблицы не созданы**. Выполни `psql $COUTION_DATABASE_URL -f backend/migrations/001_initial.sql`
- `database "coution" does not exist` — **база не создана**. Выполни `createdb coution`
- Подробнее: [DOCS.md](DOCS.md)
