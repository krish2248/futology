"""Bearer-token auth for the ML service.

When `ML_SERVICE_TOKEN` is unset (local dev), auth is bypassed so curl/
uvicorn iteration stays friction-free. In production the env var MUST be
set; an empty value disables every protected route via a 401.
"""

from __future__ import annotations

import os
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status


def _expected_token() -> str | None:
    raw = os.environ.get("ML_SERVICE_TOKEN")
    return raw if raw else None


def require_bearer(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """FastAPI dependency that 401s when the token is missing or wrong.

    Skips entirely when `ML_SERVICE_TOKEN` is not configured — that's the
    local-dev signal. Configure the env var on Railway to enforce.
    """
    expected = _expected_token()
    if expected is None:
        return  # local dev — auth disabled

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    provided = authorization.split(" ", 1)[1].strip()
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


RequireBearer = Annotated[None, Depends(require_bearer)]
