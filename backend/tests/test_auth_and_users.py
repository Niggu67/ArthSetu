def test_user_registration_and_login(client, monkeypatch):
    """Test full registration, email verification, and login flow for a new rural entrepreneur."""
    # Ensure generated numeric code is predictable in tests
    monkeypatch.setattr("app.api.auth.generate_numeric_code", lambda length=6: "123456")

    reg_payload = {
        "name": "Ramesh Patil",
        "phone": "9811223344",
        "email": "ramesh.patil@example.com",
        "password": "Password@123",
        "language_preference": "mr",
        "business_name": "Patil Dairy & Cattle Feed",
        "business_type": "Agriculture",
        "location": "Kolhapur, Maharashtra",
        "annual_income": 350000.0,
        "years_in_business": 3,
        "financial_goals": "Expand chilling unit capacity",
    }
    # Register
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["requires_verification"] is True
    assert data["email"] == "ramesh.patil@example.com"
    assert data["user"]["name"] == "Ramesh Patil"
    assert data["user"]["phone"] == "9811223344"
    assert data["user"]["is_verified"] is False
    assert "hashed_password" not in data["user"]
    user_id = data["user"]["id"]

    # Test duplicate registration with same phone but different email
    dup_phone_payload = reg_payload.copy()
    dup_phone_payload["email"] = "other.patil@example.com"
    res_dup = client.post("/api/auth/register", json=dup_phone_payload)
    assert res_dup.status_code == 400
    assert "already registered" in res_dup.json()["detail"]

    # Unverified login attempt should fail with 403
    unverified_login = {"email_or_phone": "ramesh.patil@example.com", "password": "Password@123"}
    res_unverified = client.post("/api/auth/login", json=unverified_login)
    assert res_unverified.status_code == 403
    assert "verify your email" in res_unverified.json()["detail"].lower()

    # Invalid verification code should fail with 400
    res_bad_code = client.post("/api/auth/verify-email", json={"email": "ramesh.patil@example.com", "code": "000000"})
    assert res_bad_code.status_code == 400

    # Valid verification code activates account and returns JWT token
    res_verify = client.post("/api/auth/verify-email", json={"email": "ramesh.patil@example.com", "code": "123456"})
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert "access_token" in verify_data
    assert verify_data["user"]["is_verified"] is True

    # Test duplicate registration with same email after being verified fails
    res_dup_email = client.post("/api/auth/register", json=reg_payload)
    assert res_dup_email.status_code == 400
    assert "already registered" in res_dup_email.json()["detail"]

    # Test Login with verified email
    res_login_email = client.post("/api/auth/login", json={"email_or_phone": "ramesh.patil@example.com", "password": "Password@123"})
    assert res_login_email.status_code == 200
    token = res_login_email.json()["access_token"]
    assert token

    # Test Login with verified phone backwards compatibility
    res_login_phone = client.post("/api/auth/login", json={"phone": "9811223344", "password": "Password@123"})
    assert res_login_phone.status_code == 200

    # Test Login with invalid password
    bad_login = {"email_or_phone": "ramesh.patil@example.com", "password": "WrongPassword"}
    res_bad = client.post("/api/auth/login", json=bad_login)
    assert res_bad.status_code == 401

    # Test GET /api/auth/me with valid Bearer token
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["id"] == user_id
    assert res_me.json()["email"] == "ramesh.patil@example.com"

    # Test GET /api/auth/me without token
    res_me_unauth = client.get("/api/auth/me")
    assert res_me_unauth.status_code == 401

    # Test GET /api/users/{id}
    res_get_user = client.get(f"/api/users/{user_id}")
    assert res_get_user.status_code == 200
    assert res_get_user.json()["name"] == "Ramesh Patil"

    # Test PATCH /api/users/{id}
    patch_payload = {
        "annual_income": 420000.0,
        "financial_goals": "Upgraded goal: Solar refrigeration installation",
    }
    res_patch = client.patch(f"/api/users/{user_id}", json=patch_payload)
    assert res_patch.status_code == 200
    assert res_patch.json()["annual_income"] == 420000.0
    assert "Solar refrigeration" in res_patch.json()["financial_goals"]


def test_user_not_found_and_validation(client):
    """Test error handling for non-existent users and invalid inputs."""
    res_404 = client.get("/api/users/999999")
    assert res_404.status_code == 404

    # Invalid phone format / short password
    invalid_reg = {
        "name": "A",  # Min length is 2
        "phone": "123",  # Min length is 10
        "password": "12",  # Min length is 6
    }
    res_val = client.post("/api/auth/register", json=invalid_reg)
    assert res_val.status_code == 422
