#!/usr/bin/env python3
"""
Создание таблиц в coution.
Запуск: из notion/ — python backend/scripts/create_tables.py
       или: cd backend && python scripts/create_tables.py
"""
import subprocess
import sys
from pathlib import Path

# .env
root = Path(__file__).resolve().parent.parent.parent
_env = root / ".env"
if _env.exists():
    from dotenv import load_dotenv
    load_dotenv(_env)

import os
url = os.getenv("COUTION_DATABASE_URL")
if not url:
    print("COUTION_DATABASE_URL не задан в .env")
    sys.exit(1)
migration = root / "backend" / "migrations" / "001_initial.sql"

if not migration.exists():
    print("Файл не найден:", migration)
    sys.exit(1)

r = subprocess.run(["psql", url, "-f", str(migration)], capture_output=True, text=True)
if r.returncode != 0:
    print(r.stderr or r.stdout or "Ошибка psql")
    sys.exit(1)
print("OK: таблицы созданы в coution")
