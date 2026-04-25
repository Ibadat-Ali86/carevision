FROM python:3.12-slim

# Install system dependencies required by asyncpg (PostgreSQL C client)
# and Pillow (libjpeg for JPEG processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libjpeg-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /backend

# Copy and install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose default port — Koyeb injects $PORT at runtime; CMD uses it
EXPOSE 8000

# WHY alembic before uvicorn:
# Migrations must complete before the app starts accepting traffic.
# alembic upgrade head is idempotent — safe to run on every deploy.
CMD alembic upgrade head && \
    uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 1 \
    --loop uvloop \
    --http h11
