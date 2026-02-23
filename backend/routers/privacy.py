"""
Privacy & GDPR Router
=====================
Implements GDPR rights for EU/German users:
  - Right of access   (GET /privacy/my-data)
  - Right to erasure  (DELETE /privacy/delete-account)
  - Activity log      (GET /privacy/activity-log)
  - Admin overview    (GET /privacy/admin/stats) – superusers only
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User, UserActivityLog
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/privacy", tags=["Privacy & GDPR"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ActivityLogEntry(BaseModel):
    id: int
    action: str
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MyDataResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    gdpr_consent_at: Optional[datetime]
    gdpr_consent_version: Optional[str]
    activity_log: List[ActivityLogEntry]


class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    unverified_users: int
    gdpr_consent_given: int
    active_users: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def require_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/my-data", response_model=MyDataResponse, summary="GDPR: Export my personal data")
async def get_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all personal data held about the current user.
    Fulfils the GDPR **right of access** (Article 15 GDPR).
    """
    logs = (
        db.query(UserActivityLog)
        .filter(UserActivityLog.user_id == current_user.id)
        .order_by(UserActivityLog.created_at.desc())
        .limit(200)
        .all()
    )

    return MyDataResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        gdpr_consent_at=current_user.gdpr_consent_at,
        gdpr_consent_version=current_user.gdpr_consent_version,
        activity_log=[ActivityLogEntry.model_validate(log) for log in logs],
    )


@router.delete("/delete-account", status_code=status.HTTP_200_OK, summary="GDPR: Delete my account")
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete the current user and all associated data.
    Fulfils the GDPR **right to erasure** (Article 17 GDPR).
    """
    db.delete(current_user)
    db.commit()
    return {"message": "Your account and all associated data have been permanently deleted."}


@router.get("/activity-log", response_model=List[ActivityLogEntry], summary="View my activity log")
async def get_activity_log(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the audit log of privacy-relevant actions for the current user."""
    logs = (
        db.query(UserActivityLog)
        .filter(UserActivityLog.user_id == current_user.id)
        .order_by(UserActivityLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [ActivityLogEntry.model_validate(log) for log in logs]


@router.get(
    "/admin/stats",
    response_model=AdminStatsResponse,
    summary="Admin: Privacy compliance overview",
)
async def admin_stats(
    _: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """
    Aggregated privacy compliance statistics for administrators.
    No individual PII is returned – counts only.
    """
    total = db.query(User).count()
    verified = db.query(User).filter(User.email_verified == True).count()  # noqa: E712
    consented = db.query(User).filter(User.gdpr_consent_at != None).count()  # noqa: E711
    active = db.query(User).filter(User.is_active == True).count()  # noqa: E712

    return AdminStatsResponse(
        total_users=total,
        verified_users=verified,
        unverified_users=total - verified,
        gdpr_consent_given=consented,
        active_users=active,
    )
