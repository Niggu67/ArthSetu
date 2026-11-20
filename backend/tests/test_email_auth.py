import pytest
from datetime import datetime, timedelta, timezone
from app.models.user import User
from app.models.auth_token import AuthToken
from app.services.auth_service import hash_token_code, hash_password


def test_email_verification_complete_flow(client, monkeypatch):
    """Test register -> unverified 403 -> verify 200 -> login 200."""
    monkeypatch.setattr("app.api.auth.generate_numeric_code", lambda length=6: "654321")

    payload = {
        "name": "Kavita Rao",
        "phone": "9822334455",
        "email": "kavita.rao@example.com",
        "password": "Password@123",
        "language_preference": "hi",
    }
    # 1. Register
    reg_res = client.post("/api/auth/register", json=payload)
    assert reg_res.status_code == 201
    assert reg_res.json()["requires_verification"] is True
    assert reg_res.json()["user"]["is_verified"] is False

    # 2. Login before verification rejected with 403
    login_res = client.post("/api/auth/login", json={"email": "kavita.rao@example.com", "password": "Password@123"})
    assert login_res.status_code == 403
    assert "verify" in login_res.json()["detail"].lower()

    # 3. Wrong code rejected with 400
    wrong_res = client.post("/api/auth/verify-email", json={"email": "kavita.rao@example.com", "code": "111111"})
    assert wrong_res.status_code == 400

    # 4. Correct code succeeds, returns access_token and marks user verified
    verify_res = client.post("/api/auth/verify-email", json={"email": "kavita.rao@example.com", "code": "654321"})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "access_token" in verify_data
    assert verify_data["user"]["is_verified"] is True

    # 5. Subsequent code use fails (single-use)
    reuse_res = client.post("/api/auth/verify-email", json={"email": "kavita.rao@example.com", "code": "654321"})
    assert reuse_res.status_code == 400

    # 6. Login succeeds after verification
    ok_login = client.post("/api/auth/login", json={"email": "kavita.rao@example.com", "password": "Password@123"})
    assert ok_login.status_code == 200
    assert ok_login.json()["user"]["is_verified"] is True


def test_resend_verification_rate_limiting(client, monkeypatch):
    """Test resending verification code has a 60-second cooldown."""
    monkeypatch.setattr("app.api.auth.generate_numeric_code", lambda length=6: "999888")

    payload = {
        "name": "Devendra Patil",
        "phone": "9833445566",
        "email": "devendra.patil@example.com",
        "password": "Password@123",
    }
    client.post("/api/auth/register", json=payload)

    # Immediate resend should trigger 429
    resend_res1 = client.post("/api/auth/resend-verification", json={"email": "devendra.patil@example.com"})
    assert resend_res1.status_code == 429
    assert "wait" in resend_res1.json()["detail"].lower()


def test_password_recovery_flow(client, monkeypatch, db):
    """Test forgot-password anti-enumeration and password reset flow."""
    monkeypatch.setattr("app.api.auth.generate_numeric_code", lambda length=6: "333444")

    # Anti-enumeration test: non-existent email returns generic success message
    ghost_res = client.post("/api/auth/forgot-password", json={"email": "nonexistent.user@example.com"})
    assert ghost_res.status_code == 200
    assert "reset code" in ghost_res.json()["message"].lower()

    # Create a verified user for password reset
    verified_user = User(
        name="Anand Shinde",
        phone="9844556677",
        email="anand.shinde@example.com",
        hashed_password=hash_password("OldPassword@123"),
        is_verified=True,
    )
    db.add(verified_user)
    db.commit()

    # Request password reset
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "anand.shinde@example.com"})
    assert forgot_res.status_code == 200

    # Reset with wrong code fails
    bad_reset = client.post(
        "/api/auth/reset-password",
        json={
            "email": "anand.shinde@example.com",
            "code": "000000",
            "new_password": "NewPassword@123",
        },
    )
    assert bad_reset.status_code == 400

    # Reset with valid code succeeds
    good_reset = client.post(
        "/api/auth/reset-password",
        json={
            "email": "anand.shinde@example.com",
            "code": "333444",
            "new_password": "NewPassword@123",
        },
    )
    assert good_reset.status_code == 200
    assert "success" in good_reset.json()["message"].lower()

    # Old password no longer works
    old_login = client.post("/api/auth/login", json={"email": "anand.shinde@example.com", "password": "OldPassword@123"})
    assert old_login.status_code == 401

    # New password logs in successfully
    new_login = client.post("/api/auth/login", json={"email": "anand.shinde@example.com", "password": "NewPassword@123"})
    assert new_login.status_code == 200


def test_demo_account_access_backwards_compatible(client):
    """Test demo user sunita.devi@example.com / 9876543210 can log in with email or phone."""
    # Login with demo phone
    res_phone = client.post("/api/auth/login", json={"phone": "9876543210", "password": "Devi@12345"})
    assert res_phone.status_code == 200
    assert res_phone.json()["user"]["email"] == "sunita.devi@example.com"
    assert res_phone.json()["user"]["is_verified"] is True

    # Login with demo email
    res_email = client.post("/api/auth/login", json={"email": "sunita.devi@example.com", "password": "Devi@12345"})
    assert res_email.status_code == 200
    assert res_email.json()["user"]["phone"] == "9876543210"
