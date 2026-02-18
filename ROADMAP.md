# Coution — план реализации

Отдельный проект, БД **coution** (отдельно от дашборда).

---

## Сделано

### Backend (notion/backend/)

- **models.py** — User, Page, Block
- **auth.py** — логин/пароль + JWT (как в дашборде)
- **routers/kb.py** — API страниц и блоков
- **migrations/001_initial.sql** — таблицы users, pages, blocks
- **scripts/set_user_password.py** — создание пользователя и пароля

### Запуск

```bash
# 1. Создать БД
createdb coution

# 2. .env (скопировать из .env.example)
# DATABASE_URL=postgresql://user:pass@localhost/coution
# JWT_SECRET=...

# 3. Миграция или create_all при старте
psql $DATABASE_URL -f backend/migrations/001_initial.sql

# 4. Создать админа
cd notion && python backend/scripts/set_user_password.py admin

# 5. Запуск
uvicorn backend.main:app --reload
```

---

## Дальнейшие шаги

1. **Фронт** — React, логин, сайдбар, редактор
2. **Редактор** — Tiptap, блоки
3. **Публичные страницы** — роут /p/{slug}
