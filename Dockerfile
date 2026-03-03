# ===== Stage 1: Build =====
FROM python:3.12-slim AS builder

# Install uv (fast Python package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (for Docker layer caching)
COPY pyproject.toml uv.lock ./

# Install dependencies (cached unless pyproject.toml changes)
RUN uv sync --frozen --no-dev --no-install-project

# ===== Stage 2: Runtime =====
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY main.py ./

# Expose FastAPI port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "backend.src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
