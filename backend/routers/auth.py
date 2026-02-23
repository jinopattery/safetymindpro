"""
Authentication Router - Login, Signup, Token Management, Email Verification
"""

import os
import secrets
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from backend.database import get_db
from backend.models import User, UserActivityLog

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# Whether email verification is required before login.
# Set EMAIL_VERIFICATION_REQUIRED=false in .env to disable (e.g. during development).
EMAIL_VERIFICATION_REQUIRED = os.getenv("EMAIL_VERIFICATION_REQUIRED", "true").lower() == "true"

# SMTP settings (optional – verification e-mails are skipped when not configured)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")

# Password hashing context with bcrypt
# Note: bcrypt >=4.0.0 compatibility - explicitly set default rounds
# 12 rounds is bcrypt's default, providing good balance between security and performance
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12,
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

router = APIRouter(prefix="/auth")

# ── Schemas ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None
    gdpr_consent: bool = False

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    is_active: bool
    is_superuser: bool
    email_verified: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    # Populated only when SMTP is not configured (no-mail-server mode).
    # The frontend uses this to show a clickable verification link on-screen.
    verification_link: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: str  # accepts username or email – backend resolves either

# ── Helpers ──────────────────────────────────────────────────────────────────

def verify_password(plain_password, hashed_password):
    """Verify a plain text password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Hash a password using bcrypt.

    Note: Password must be validated to be <= 72 characters before calling this function.
    Bcrypt will truncate passwords longer than 72 bytes, which can lead to security issues.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_verification_token() -> str:
    """Generate a secure URL-safe verification token."""
    return secrets.token_urlsafe(32)

def send_verification_email(email: str, token: str) -> Optional[str]:
    """
    Send an email-verification message.

    Returns:
      - ``None`` when the email was sent successfully via SMTP.
      - The verification URL string when SMTP is not configured, so the caller
        can surface it directly in the API response (no-mail-server mode).
    """
    verify_url = f"{APP_BASE_URL}/verify-email?token={token}"

    if not SMTP_HOST or not SMTP_USER:
        # SMTP not configured – return the URL so the caller can expose it
        # directly in the signup response.  This makes the feature fully
        # self-contained without any additional server software.
        logger.info(
            "Email verification (SMTP not configured). "
            "Verification link: %s", verify_url
        )
        return verify_url

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "SafetyMindPro – Please verify your email address"
        msg["From"] = SMTP_FROM
        msg["To"] = email

        text_body = (
            f"Welcome to SafetyMindPro!\n\n"
            f"Please verify your email address by clicking the link below:\n\n"
            f"{verify_url}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"If you did not create an account, please ignore this email."
        )
        html_body = (
            f"<p>Welcome to <strong>SafetyMindPro</strong>!</p>"
            f"<p>Please verify your email address by clicking the link below:</p>"
            f'<p><a href="{verify_url}">Verify Email Address</a></p>'
            f"<p>This link expires in 24 hours.</p>"
            f"<p>If you did not create an account, please ignore this email.</p>"
        )

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [email], msg.as_string())

        return None  # email delivered – no in-app link needed
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", email, exc)
        # SMTP is configured but failed – do NOT expose the link in the response.
        # The user should contact support or retry; admins should fix SMTP.
        return None

def log_activity(db: Session, user_id: int, action: str, request: Request = None):
    """Record a privacy-relevant user action in the audit log."""
    ip = None
    ua = None
    if request:
        # X-Forwarded-For is only trusted when the application is deployed behind
        # a known reverse proxy (nginx, Traefik, AWS ALB, etc.).  In direct
        # deployments this header can be spoofed by clients; document this in
        # your deployment configuration and restrict it via your proxy settings.
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else None
        ua = request.headers.get("user-agent")
    entry = UserActivityLog(
        user_id=user_id,
        action=action,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(entry)
    db.commit()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    Create a new user account with validation.

    Password constraints:
    - Minimum 6 characters (basic security requirement)
    - Maximum 72 characters (bcrypt limitation)

    GDPR: users must accept the privacy policy (gdpr_consent=true).
    """
    if not user.gdpr_consent:
        raise HTTPException(
            status_code=400,
            detail="You must accept the Privacy Policy and Terms of Use to create an account."
        )

    # Validate minimum password length first (more common validation failure)
    if len(user.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long."
        )

    # Validate password length before processing
    # Bcrypt has a maximum password length of 72 bytes
    # Reject passwords exceeding this limit to avoid truncation issues
    if len(user.password) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password cannot be longer than 72 characters. Please choose a shorter password."
        )

    # Check if user exists
    db_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Create new user with hashed password
    # Password is safe to hash since it passed length validation
    hashed_password = get_password_hash(user.password)
    verification_token = generate_verification_token()

    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True,
        is_superuser=False,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_sent_at=datetime.utcnow(),
        gdpr_consent_at=datetime.utcnow(),
        gdpr_consent_version="1.0",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email; returns the link when SMTP is not configured
    verification_link = send_verification_email(db_user.email, verification_token)
    log_activity(db, db_user.id, "signup", request)

    # Return token so the frontend can redirect to a "check your inbox" page.
    # If email verification is disabled, the user is effectively logged in immediately.
    # verification_link is None when an email was sent; it is the URL when SMTP
    # is not configured so the frontend can show it as a clickable in-app link.
    access_token = create_access_token(data={"sub": db_user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "verification_link": verification_link,
        "user": UserResponse(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            full_name=db_user.full_name,
            is_active=db_user.is_active,
            is_superuser=db_user.is_superuser,
            email_verified=db_user.email_verified,
        )
    }


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify a user's email address using the token sent on signup."""
    user = db.query(User).filter(
        User.email_verification_token == body.token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    # Token expires after 24 hours
    if user.email_verification_sent_at:
        age = datetime.utcnow() - user.email_verification_sent_at
        if age > timedelta(hours=24):
            raise HTTPException(
                status_code=400,
                detail="Verification token has expired. Please request a new one."
            )

    user.email_verified = True
    user.email_verification_token = None
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}


@router.post("/resend-verification")
async def resend_verification(body: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend the verification email. Accepts the user's email address or username."""
    # Allow callers to pass either the email address or the username
    user = (
        db.query(User)
        .filter((User.email == body.email) | (User.username == body.email))
        .first()
    )

    # Always return the same message to avoid user enumeration
    generic = {"message": "If that address is registered and unverified, a new email has been sent."}

    if not user or user.email_verified:
        return generic

    # Throttle resend requests – at most once per 5 minutes
    if user.email_verification_sent_at:
        age = datetime.utcnow() - user.email_verification_sent_at
        if age < timedelta(minutes=5):
            return generic

    verification_token = generate_verification_token()
    user.email_verification_token = verification_token
    user.email_verification_sent_at = datetime.utcnow()
    db.commit()

    send_verification_email(user.email, verification_token)
    return generic


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Enforce email verification when required
    if EMAIL_VERIFICATION_REQUIRED and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

    # Update last login and audit log
    user.last_login = datetime.utcnow()
    db.commit()
    log_activity(db, user.id, "login", request)

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            email_verified=user.email_verified,
        )
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        email_verified=current_user.email_verified,
    )
