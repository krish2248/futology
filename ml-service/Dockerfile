# Railway-compatible image. Python 3.11 slim plus the runtime-model
# extra so the deployed service can load a trained pickle if one is
# baked in or mounted. The `train` extra (xgboost-build-time-only) is
# not installed in the runtime image; train locally and either commit
# trained_models/ or upload via Railway's filesystem.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install runtime deps first so the layer caches across code-only edits.
COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install ".[runtime-model]"

COPY app ./app
# Optional — copy the trained pickle into the image if present. The
# Dockerfile copy is safe even when `trained_models/` is empty.
COPY trained_models ./trained_models

# HF Spaces expects 7860; Railway injects $PORT at runtime.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
