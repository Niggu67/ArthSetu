import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.auth_token import AuthToken
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RegistrationResponse,
    AuthMessageResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    generate_numeric_code,
    hash_token_code,
    verify_token_code,
)
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new rural entrepreneur account with required email.
    Generates a 6-digit email verification code and dispatches verification email.
    """
    # Check email uniqueness
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        if not existing_email.is_verified:
            # User started registration earlier but did not verify. Invalidate old codes and re-send.
            db.query(AuthToken).filter(
                AuthToken.user_id == existing_email.id,
                AuthToken.token_type == "email_verification",
                AuthToken.used_at == None,
            ).update({"used_at": datetime.now(timezone.utc)})

            code = generate_numeric_code(6)
            auth_token = AuthToken(
                user_id=existing_email.id,
                token_type="email_verification",
                code_hash=hash_token_code(code),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            )
            db.add(auth_token)
            db.commit()

            email_service.send_verification_email(existing_email.email, existing_email.name, code)
            return RegistrationResponse(
                message="An unverified account with this email was found. A new 6-digit verification code has been sent.",
                email=existing_email.email,
                is_verified=False,
                user=UserResponse.model_validate(existing_email),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered",
        )

    # Check phone uniqueness if provided
    phone_to_use = user_in.phone
    if phone_to_use:
        existing_phone = db.query(User).filter(User.phone == phone_to_use).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this mobile number is already registered",
            )
    else:
        # Generate safe placeholder phone for SQLite NOT NULL constraint
        phone_to_use = f"9{uuid.uuid4().int % 1000000000:09d}"

    user_dict = user_in.model_dump(exclude={"password", "phone"})
    user_dict["phone"] = phone_to_use
    user_dict["hashed_password"] = hash_password(user_in.password)
    user_dict["is_verified"] = False
    user_dict["verified_at"] = None

    new_user = User(**user_dict)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate 6-digit verification code
    code = generate_numeric_code(6)
    auth_token = AuthToken(
        user_id=new_user.id,
        token_type="email_verification",
        code_hash=hash_token_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(auth_token)
    db.commit()

    email_service.send_verification_email(new_user.email, new_user.name, code)

    return RegistrationResponse(
        message="Registration successful. Please verify your email with the 6-digit code sent to your inbox.",
        email=new_user.email,
        is_verified=False,
        user=UserResponse.model_validate(new_user),
    )


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verify an account using the 6-digit code sent to user's email.
    Upon successful verification, activates account and returns standard JWT TokenResponse.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address",
        )

    now = datetime.now(timezone.utc)

    # If already verified, reject to prevent unauthorized token minting
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified. Please log in directly with your email and password.",
        )

    # Find latest unconsumed verification token
    token_record = (
        db.query(AuthToken)
        .filter(
            AuthToken.user_id == user.id,
            AuthToken.token_type == "email_verification",
            AuthToken.used_at == None,
            AuthToken.expires_at > now,
        )
        .order_by(AuthToken.created_at.desc())
        .first()
    )

    if not token_record or not verify_token_code(payload.code, token_record.code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the code or request a new one.",
        )

    # Mark token used & verify user
    token_record.used_at = now
    user.is_verified = True
    user.verified_at = now
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "phone": user.phone, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/resend-verification", response_model=AuthMessageResponse)
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    """
    Resend a 6-digit verification code to the user's email. Includes cooldown rate-limiting.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.is_verified:
        # Anti-enumeration response
        return AuthMessageResponse(
            message="If an unverified account exists with this email, a new 6-digit code has been sent.",
            email=payload.email,
            pending_verification=False,
        )

    now = datetime.now(timezone.utc)

    # Rate limiting: 60 seconds cooldown between code requests
    recent_token = (
        db.query(AuthToken)
        .filter(
            AuthToken.user_id == user.id,
            AuthToken.token_type == "email_verification",
            AuthToken.created_at > now - timedelta(seconds=60),
        )
        .first()
    )
    if recent_token:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait at least 60 seconds before requesting another verification code.",
        )

    # Invalidate older tokens
    db.query(AuthToken).filter(
        AuthToken.user_id == user.id,
        AuthToken.token_type == "email_verification",
        AuthToken.used_at == None,
    ).update({"used_at": now})

    # Generate new code
    code = generate_numeric_code(6)
    auth_token = AuthToken(
        user_id=user.id,
        token_type="email_verification",
        code_hash=hash_token_code(code),
        expires_at=now + timedelta(minutes=15),
    )
    db.add(auth_token)
    db.commit()

    email_service.send_verification_email(user.email, user.name, code)
    return AuthMessageResponse(
        message="A new 6-digit verification code has been sent to your email.",
        email=user.email,
        pending_verification=True,
    )


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email or registered phone number and password.
    Rejects unverified accounts with HTTP 403 Forbidden.
    """
    # Accept identifier from identifier, email_or_phone, email, or phone field
    target = (login_in.identifier or login_in.email_or_phone or login_in.email or login_in.phone or "").strip()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your registered email address or mobile number",
        )

    user = db.query(User).filter(or_(User.email == target, User.phone == target)).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, mobile number, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check verification status
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account email has not been verified. Please verify your email before signing in.",
        )

    token = create_access_token(data={"sub": str(user.id), "phone": user.phone, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/forgot-password", response_model=AuthMessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password recovery for a registered email.
    Generates a 6-digit reset code and dispatches email.
    Returns consistent response to prevent user enumeration attacks.
    """
    generic_msg = "If an account exists with this email address, a 6-digit password reset code has been sent."

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return AuthMessageResponse(message=generic_msg, email=payload.email)

    now = datetime.now(timezone.utc)

    # Cooldown check: 60s
    recent_token = (
        db.query(AuthToken)
        .filter(
            AuthToken.user_id == user.id,
            AuthToken.token_type == "password_reset",
            AuthToken.created_at > now - timedelta(seconds=60),
        )
        .first()
    )
    if recent_token:
        return AuthMessageResponse(message=generic_msg, email=payload.email)

    # Invalidate older reset tokens
    db.query(AuthToken).filter(
        AuthToken.user_id == user.id,
        AuthToken.token_type == "password_reset",
        AuthToken.used_at == None,
    ).update({"used_at": now})

    # Generate 6-digit reset code
    code = generate_numeric_code(6)
    auth_token = AuthToken(
        user_id=user.id,
        token_type="password_reset",
        code_hash=hash_token_code(code),
        expires_at=now + timedelta(minutes=15),
    )
    db.add(auth_token)
    db.commit()

    email_service.send_password_reset_email(user.email, user.name, code)
    return AuthMessageResponse(message=generic_msg, email=payload.email)


@router.post("/reset-password", response_model=AuthMessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validate 6-digit reset code and update user's password using PBKDF2 hashing.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to reset password. Please verify the email address and code.",
        )

    now = datetime.now(timezone.utc)

    # Find latest unconsumed reset token
    token_record = (
        db.query(AuthToken)
        .filter(
            AuthToken.user_id == user.id,
            AuthToken.token_type == "password_reset",
            AuthToken.used_at == None,
            AuthToken.expires_at > now,
        )
        .order_by(AuthToken.created_at.desc())
        .first()
    )

    if not token_record or not verify_token_code(payload.code, token_record.code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new password reset code.",
        )

    # Update password using existing PBKDF2 hashing
    user.hashed_password = hash_password(payload.new_password)
    user.is_verified = True  # Verified identity via email reset
    if not user.verified_at:
        user.verified_at = now
    token_record.used_at = now
    db.commit()

    return AuthMessageResponse(
        message="Password has been reset successfully. You can now sign in with your new password.",
        email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the profile of currently authenticated user."""
    return current_user
