#!/bin/bash
# Установка зависимостей Coution
cd "$(dirname "$0")/.."
if [ ! -d .venv ]; then
  python3 -m venv .venv
  echo "venv создан"
fi
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
echo "Готово. Активируй: source .venv/bin/activate"
