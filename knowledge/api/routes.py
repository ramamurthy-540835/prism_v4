from __future__ import annotations

import base64
import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from google.cloud import bigquery, pubsub_v1, run_v2, storage
from pydantic import BaseModel, Field

from ..ingest.config import Settings
from ..retrieval.search import Requester, governed_search
from .auth import CurrentUser, authenticated_user

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
settings = Settings()
bq = bigquery.Client(project=settings.project)
gcs = storage.Client(project=settings.project)
publisher = pubsub_v1.PublisherClient()
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/markdown", "text/plain", "text/html", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
LEVELS = ["public", "internal", "confidential", "critical"]


class DocumentMetadata(BaseModel):
    filename: str = Field(pattern=r"^[^/\\]{1,255}$")
    mime_type: str
    content_sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    title: str | None = None
    project_id: str | None = None
    protection_level: Literal["public", "internal", "confidential", "critical"] = "internal"
    visibility: Literal["private", "project", "org"] = "private"
    tags: list[str] = Field(default_factory=list, max_length=25)


class UploadUrlRequest(DocumentMetadata):
    size_bytes: int = Field(gt=0, le=50 * 1024 * 1024)


class PatchDocument(BaseModel):
    title: str | None = None
    tags: list[str] | None = None
    protection_level: Literal["public", "internal", "confidential", "critical"] | None = None
    visibility: Literal["private", "project", "org"] | None = None


class Grant(BaseModel):
    grantee_type: Literal["user", "project", "agent_role"]
    grantee_id: str
    permission: Literal["read", "retrieve", "admin"]
    expires_at: datetime | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=20_000)
    project_id: str | None = None
    top_k: int = Field(default=8, ge=1, le=100)


def _doc_id(user_id: str, metadata: DocumentMetadata) -> str:
    # gcs_uri contains document_id, so the originally specified self-referential
    # hash cannot be computed. This deterministic pre-upload equivalent includes
    # owner, content digest, and filename.
    return hashlib.sha256(f"{user_id}|{metadata.content_sha256}|{metadata.filename}".encode()).hexdigest()[:32]


def _uri(owner_id: str, document_id: str, filename: str) -> str:
    return f"gs://{settings.bucket}/{owner_id}/{document_id}/{filename}"


def _query(sql: str, params: list[bigquery.QueryParameter]) -> list[dict]:
    return [dict(row) for row in bq.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=params)).result()]


def _document(document_id: str) -> dict:
    rows = _query(f"SELECT * FROM `{settings.table_prefix}.documents` WHERE document_id=@id", [bigquery.ScalarQueryParameter("id", "STRING", document_id)])
    if not rows:
        raise HTTPException(404, "Document not found")
    return rows[0]


def _admin_or_owner(doc: dict, user: CurrentUser) -> None:
    if doc["owner_id"] == user.id:
        return
    rows = _query(f"SELECT 1 FROM `{settings.table_prefix}.document_acl` WHERE document_id=@id AND grantee_type='user' AND grantee_id=@user_id AND permission='admin' AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP()) LIMIT 1", [bigquery.ScalarQueryParameter("id", "STRING", doc["document_id"]), bigquery.ScalarQueryParameter("user_id", "STRING", user.id)])
    if not rows:
        raise HTTPException(403, "Owner or document admin permission required")


def _ensure_project_member(project_id: str | None, user: CurrentUser) -> None:
    if not project_id:
        return
    rows = _query("""SELECT 1 FROM `aidirac-503309.prism.projects` p JOIN `aidirac-503309.prism.organization_members` m ON m.org_id=p.org_id WHERE p.id=@project_id AND m.user_id=@user_id LIMIT 1""", [bigquery.ScalarQueryParameter("project_id", "STRING", project_id), bigquery.ScalarQueryParameter("user_id", "STRING", user.id)])
    if not rows:
        raise HTTPException(403, "Project membership required")


def _approval_required() -> None:
    # No approval_gates table was found in either inspected dataset.
    raise HTTPException(409, "Approval required, but the PRISM approval-gate integration is not configured")


@router.post("/internal/ingest-event", include_in_schema=False)
async def dispatch_ingest_event(request: Request):
    """Eventarc target; Cloud Run IAM limits invocation to its dispatcher SA."""
    event = await request.json()
    try:
        encoded = event["data"]["message"]["data"]
        document_id = json.loads(base64.b64decode(encoded).decode("utf-8"))["document_id"]
    except Exception as exc:
        raise HTTPException(400, "Invalid Pub/Sub CloudEvent") from exc
    job_name = f"projects/{settings.project}/locations/{settings.location}/jobs/{__import__('os').environ.get('INGEST_JOB_NAME', 'prism-ingest')}"
    overrides = run_v2.RunJobRequest.Overrides(container_overrides=[run_v2.RunJobRequest.Overrides.ContainerOverride(args=[document_id])])
    run_v2.JobsClient().run_job(request=run_v2.RunJobRequest(name=job_name, overrides=overrides))
    return {"accepted": True, "document_id": document_id}


@router.post("/documents/upload-url")
def upload_url(request: UploadUrlRequest, user: CurrentUser = Depends(authenticated_user)):
    if request.mime_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Unsupported document type")
    _ensure_project_member(request.project_id, user)
    document_id = _doc_id(user.id, request)
    blob = gcs.bucket(settings.bucket).blob(f"{user.id}/{document_id}/{request.filename}")
    blob.metadata = {"content-sha256": request.content_sha256, "owner-id": user.id}
    try:
        url = blob.generate_signed_url(version="v4", expiration=900, method="PUT", content_type=request.mime_type)
    except Exception as exc:
        raise HTTPException(503, "Unable to create signed upload URL; service account needs blob-signing permission") from exc
    return {"document_id": document_id, "gcs_uri": _uri(user.id, document_id, request.filename), "upload_url": url, "expires_in_seconds": 900}


@router.post("/documents/{document_id}/finalize")
def finalize(document_id: str, request: DocumentMetadata, user: CurrentUser = Depends(authenticated_user)):
    _ensure_project_member(request.project_id, user)
    if document_id != _doc_id(user.id, request):
        raise HTTPException(400, "document_id does not match upload metadata")
    blob = gcs.bucket(settings.bucket).blob(f"{user.id}/{document_id}/{request.filename}")
    if not blob.exists():
        raise HTTPException(404, "Uploaded object not found")
    if blob.size is not None and blob.size > 50 * 1024 * 1024:
        raise HTTPException(413, "Document exceeds 50 MB")
    now = datetime.now(timezone.utc)
    row = {"document_id": document_id, "owner_id": user.id, "project_id": request.project_id, "title": request.title or request.filename, "filename": request.filename, "mime_type": request.mime_type, "size_bytes": blob.size, "content_sha256": request.content_sha256.lower(), "gcs_uri": _uri(user.id, document_id, request.filename), "protection_level": request.protection_level, "visibility": request.visibility, "status": "uploaded", "tags": request.tags, "created_at": now.isoformat()}
    errors = bq.insert_rows_json(f"{settings.table_prefix}.documents", [row])
    if errors:
        raise HTTPException(409, f"Document already finalized or metadata rejected: {errors}")
    publisher.publish(publisher.topic_path(settings.project, __import__("os").environ.get("INGEST_TOPIC", "prism-knowledge-ingest")), json.dumps({"document_id": document_id}).encode(), document_id=document_id).result()
    return {"document_id": document_id, "status": "uploaded"}


@router.get("/documents")
def list_documents(project_id: str | None = None, status: str | None = None, q: str | None = None, user: CurrentUser = Depends(authenticated_user)):
    _ensure_project_member(project_id, user)
    clauses = ["(owner_id=@user_id OR (visibility IN ('project','org') AND project_id=@project_id))", "deleted_at IS NULL"]
    params: list[bigquery.QueryParameter] = [bigquery.ScalarQueryParameter("user_id", "STRING", user.id), bigquery.ScalarQueryParameter("project_id", "STRING", project_id)]
    if status:
        clauses.append("status=@status"); params.append(bigquery.ScalarQueryParameter("status", "STRING", status))
    if q:
        clauses.append("(LOWER(title) LIKE @q OR LOWER(filename) LIKE @q)"); params.append(bigquery.ScalarQueryParameter("q", "STRING", f"%{q.lower()}%"))
    return _query(f"SELECT * FROM `{settings.table_prefix}.v_document_status` WHERE {' AND '.join(clauses)} ORDER BY created_at DESC", params)


@router.get("/documents/{document_id}")
def get_document(document_id: str, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    doc["acl"] = _query(f"SELECT * FROM `{settings.table_prefix}.document_acl` WHERE document_id=@id", [bigquery.ScalarQueryParameter("id", "STRING", document_id)])
    return doc


@router.patch("/documents/{document_id}")
def patch_document(document_id: str, request: PatchDocument, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    if request.protection_level and LEVELS.index(request.protection_level) < LEVELS.index(doc["protection_level"]):
        _approval_required()
    if request.visibility and request.visibility != "private" and doc.get("project_id") is None:
        raise HTTPException(400, "project_id is required for project or org visibility")
    if request.visibility and request.visibility != doc["visibility"] and request.visibility != "private":
        _approval_required()
    fields = {k: v for k, v in request.model_dump().items() if v is not None}
    if not fields:
        return doc
    assignments = ", ".join(f"{key}=@{key}" for key in fields)
    params = [bigquery.ScalarQueryParameter(k, "STRING" if k != "tags" else "STRING", v) if k != "tags" else bigquery.ArrayQueryParameter(k, "STRING", v) for k, v in fields.items()] + [bigquery.ScalarQueryParameter("id", "STRING", document_id)]
    bq.query(f"UPDATE `{settings.table_prefix}.documents` SET {assignments} WHERE document_id=@id", job_config=bigquery.QueryJobConfig(query_parameters=params)).result()
    return _document(document_id)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: str, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    bq.query(f"UPDATE `{settings.table_prefix}.documents` SET status='deleted', deleted_at=CURRENT_TIMESTAMP(), status_detail='deleted_by_owner' WHERE document_id=@id", job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("id", "STRING", document_id)])).result()
    return Response(status_code=204)


@router.post("/documents/{document_id}/reingest")
def reingest(document_id: str, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    bq.query(f"UPDATE `{settings.table_prefix}.documents` SET status='uploaded', status_detail=NULL WHERE document_id=@id AND deleted_at IS NULL", job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("id", "STRING", document_id)])).result()
    publisher.publish(publisher.topic_path(settings.project, __import__("os").environ.get("INGEST_TOPIC", "prism-knowledge-ingest")), json.dumps({"document_id": document_id}).encode(), document_id=document_id).result()
    return {"document_id": document_id, "status": "uploaded"}


@router.post("/documents/{document_id}/acl")
def grant(document_id: str, request: Grant, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    if request.grantee_type == "project" and request.grantee_id != doc.get("project_id"):
        _approval_required()
    errors = bq.insert_rows_json(f"{settings.table_prefix}.document_acl", [{"document_id": document_id, **request.model_dump(), "granted_by": user.id, "granted_at": datetime.now(timezone.utc).isoformat()}])
    if errors: raise HTTPException(400, str(errors))
    return {"status": "granted"}


@router.delete("/documents/{document_id}/acl/{grantee}", status_code=204)
def revoke(document_id: str, grantee: str, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    bq.query(f"DELETE FROM `{settings.table_prefix}.document_acl` WHERE document_id=@id AND grantee_id=@grantee", job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("id", "STRING", document_id), bigquery.ScalarQueryParameter("grantee", "STRING", grantee)])).result()
    return Response(status_code=204)


@router.post("/search")
def search(request: SearchRequest, user: CurrentUser = Depends(authenticated_user)):
    _ensure_project_member(request.project_id, user)
    result = governed_search(request.query, Requester(id=user.id, type="user", project_id=request.project_id), top_k=request.top_k, project_scope=request.project_id)
    return {"results": [chunk.__dict__ for chunk in result.context.chunks], "citations": result.context.citations, "filtered_by_acl": result.filtered_by_acl, "filtered_by_level": result.filtered_by_level}


@router.get("/budgets/{scope_type}/{scope_id}")
def budgets(scope_type: Literal["owner", "project"], scope_id: str, user: CurrentUser = Depends(authenticated_user)):
    if scope_type == "owner" and scope_id != user.id: raise HTTPException(403, "Can only read your own budget")
    if scope_type == "project": _ensure_project_member(scope_id, user)
    return _query(f"SELECT * FROM `{settings.table_prefix}.knowledge_budgets` WHERE scope_type=@type AND scope_id=@id", [bigquery.ScalarQueryParameter("type", "STRING", scope_type), bigquery.ScalarQueryParameter("id", "STRING", scope_id)])


@router.get("/logs/retrieval")
def retrieval_logs(document_id: str, since: datetime | None = None, user: CurrentUser = Depends(authenticated_user)):
    doc = _document(document_id); _admin_or_owner(doc, user)
    since = since or datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return _query(f"SELECT * FROM `{settings.table_prefix}.retrieval_logs` WHERE @document_id IN UNNEST(document_ids_hit) AND created_at>=@since ORDER BY created_at DESC", [bigquery.ScalarQueryParameter("document_id", "STRING", document_id), bigquery.ScalarQueryParameter("since", "TIMESTAMP", since)])
