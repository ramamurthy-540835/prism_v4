from __future__ import annotations

from dataclasses import dataclass

from fastapi import Header, HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token

from ..ingest.config import Settings


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None


def authenticated_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Firebase ID token")
    try:
        claims = id_token.verify_firebase_token(authorization.removeprefix("Bearer "), requests.Request(), audience=Settings().project)
    except Exception as exc:
        raise HTTPException(401, "Invalid Firebase ID token") from exc
    subject = claims.get("uid") or claims.get("sub")
    if not subject:
        raise HTTPException(401, "Firebase token has no user identity")
    return CurrentUser(str(subject), claims.get("email"))
