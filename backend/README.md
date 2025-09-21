## FastAPI Backend

### Setup
1. Create virtualenv and install deps:
```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -U pip setuptools wheel
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp env.example .env
```

### Run (development)
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

### Endpoints
- `GET /` root metadata
- `GET /health` health probe
- `GET /api/ping` ping endpoint