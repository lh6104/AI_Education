# FastAPI Learning Progress API

Template FastAPI project implementing CRUD for a `progress` bridge table between `users` and `lessons`.

Key features:
- SQLAlchemy models for `users`, `lessons`, `progress` (includes `score` field)
- Pydantic schemas
- Repository, Service, Controller layers with dependency injection
- Simple tests using pytest and httpx

Run locally (install dependencies first):

```powershell
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Notes:
- By default the project uses a local SQLite database file `dev.db`. You can override the `DATABASE_URL` environment variable to point elsewhere if needed.

- This template creates tables at startup using SQLAlchemy's `create_all`. For production use Alembic migrations instead.
