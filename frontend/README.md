# Coution — фронт

React + Vite. Тёмная тема.

## Запуск

```bash
npm install
npm run dev
```

Откроется http://localhost:5173. Запросы к API идут на бэкенд (прокси `/api` → localhost:8001).

## Сборка

```bash
npm run build
```

Статика в `dist/`. Раздавать через nginx или поднять `npm run preview`.
