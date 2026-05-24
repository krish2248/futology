# Railway-compatible image. Python 3.11 slim keeps the cold-start small
# until v0.2 introduces XGBoost / scikit-learn / pandas (~150-200 MB extra).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install runtime deps first so the layer caches across code-only edits.
COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

COPY app ./app

# Railway injects $PORT at runtime. Default to 8080 for local `docker run`.
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
