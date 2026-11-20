from app.models.user import User
from app.models.scheme import GovernmentScheme


def test_applications_workflow(client, db):
    """Test full scheme application lifecycle: create, list, patch status and notes."""
    user = db.query(User).filter(User.phone == "9876543210").first()
    scheme = db.query(GovernmentScheme).first()
    assert user is not None
    assert scheme is not None

    # Step 1: Create an application in 'draft' status
    app_payload = {
        "user_id": user.id,
        "scheme_id": scheme.id,
        "status": "draft",
        "notes": "Collected initial quotation for grinding machinery.",
    }
    res_post = client.post("/api/applications", json=app_payload)
    assert res_post.status_code == 201
    app_data = res_post.json()
    app_id = app_data["id"]
    assert app_data["status"] == "draft"
    assert app_data["scheme_id"] == scheme.id

    # Step 2: List user applications
    res_list = client.get(f"/api/applications/{user.id}")
    assert res_list.status_code == 200
    user_apps = res_list.json()
    assert any(a["id"] == app_id for a in user_apps)

    # Step 3: Patch application status to 'submitted'
    patch_payload = {
        "status": "submitted",
        "notes": "Application DPR and Aadhaar submitted to regional branch.",
    }
    res_patch = client.patch(f"/api/applications/{app_id}", json=patch_payload)
    assert res_patch.status_code == 200
    updated_data = res_patch.json()
    assert updated_data["status"] == "submitted"
    assert "DPR and Aadhaar" in updated_data["notes"]


def test_applications_validation_and_errors(client, db):
    """Test validation errors for invalid status, user, or scheme IDs."""
    user = db.query(User).filter(User.phone == "9876543210").first()
    scheme = db.query(GovernmentScheme).first()

    # Invalid status
    invalid_status_payload = {
        "user_id": user.id,
        "scheme_id": scheme.id,
        "status": "invalid_status_xyz",
    }
    res_bad_status = client.post("/api/applications", json=invalid_status_payload)
    assert res_bad_status.status_code == 400

    # Non-existent user
    res_bad_user = client.post("/api/applications", json={
        "user_id": 999999,
        "scheme_id": scheme.id,
        "status": "draft",
    })
    assert res_bad_user.status_code == 404

    # Non-existent scheme
    res_bad_scheme = client.post("/api/applications", json={
        "user_id": user.id,
        "scheme_id": 999999,
        "status": "draft",
    })
    assert res_bad_scheme.status_code == 404

    # Patch non-existent application
    res_patch_404 = client.patch("/api/applications/999999", json={"status": "approved"})
    assert res_patch_404.status_code == 404
