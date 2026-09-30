"""Run the SQLite seed SQL safely from Python.

This script will:
- import the SQLAlchemy models and create tables (if missing)
- run the SQL statements in sql/seed_data.sql against the configured DATABASE_URL (defaults to dev.db)

Usage: python scripts/run_seed.py
"""
from pathlib import Path
import sqlite3
import os
import sys

# Ensure we can import project modules
HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from db import DATABASE_URL, engine, Base


def run():
    # Ensure tables exist (uses SQLAlchemy models and engine)
    print("Creating tables (if missing) using SQLAlchemy...")
    Base.metadata.create_all(bind=engine)

    seed_file = HERE / "sql" / "seed_data.sql"
    if not seed_file.exists():
        print(f"Seed file not found: {seed_file}")
        return

    # Only handling sqlite:/// local files
    if not DATABASE_URL.startswith("sqlite"):
        print("This runner only supports sqlite DATABASE_URL. Re-run the seed manually for other DBs.")
        return

    # Extract path like sqlite:///./dev.db -> ./dev.db or sqlite:///:memory:
    db_path = DATABASE_URL.replace("sqlite:///", "")
    print(f"Running seed script against {db_path}")

    sql = seed_file.read_text()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(sql)
        conn.commit()
        print("Seeding completed")
    finally:
        conn.close()


if __name__ == "__main__":
    run()
