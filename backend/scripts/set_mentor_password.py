#!/usr/bin/env python3
"""
Генерирует пароль и bcrypt hash.
Пример: python set_mentor_password.py        — случайный пароль
        python set_mentor_password.py -s     — короткий (8 символов) для теста
        python set_mentor_password.py 12345  — свой пароль
"""
import sys
import secrets
import bcrypt

def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("-s", "--simple"):
        password = secrets.token_hex(4)  # 8 символов, только цифры и a-f
    else:
        password = sys.argv[1] if len(sys.argv) > 1 else secrets.token_urlsafe(12)
    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    print("--- Добавить в БД (mentors.password_hash) ---")
    print(pw_hash)
    print()
    print("--- При авторизации ввести ---")
    print(f"Пароль: {password}")


if __name__ == "__main__":
    main()
