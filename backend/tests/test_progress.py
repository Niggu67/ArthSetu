from app.models.user import User


def test_progress_lifecycle(client, db):
    """Test getting, creating, and updating educational module progress."""
    user = db.query(User).filter(User.phone == "9876543210").first()
    assert user is not None

    # Retrieve existing progress
    res_get = client.get(f"/api/progress/{user.id}")
    assert res_get.status_code == 200
    records = res_get.json()
    assert len(records) >= 1

    # Record progress for a new module
    create_payload = {
        "user_id": user.id,
        "module_id": "budgeting-and-cashflow-201",
        "completion_status": "in_progress",
        "completion_percentage": 40.0,
    }
    res_post = client.post("/api/progress", json=create_payload)
    assert res_post.status_code == 201
    record_id = res_post.json()["id"]
    assert res_post.json()["completion_percentage"] == 40.0

    # Update the module to completed
    update_payload = {
        "user_id": user.id,
        "module_id": "budgeting-and-cashflow-201",
        "completion_status": "completed",
        "completion_percentage": 100.0,
    }
    res_update = client.post("/api/progress", json=update_payload)
    assert res_update.status_code == 201
    assert res_update.json()["id"] == record_id
    assert res_update.json()["completion_status"] == "completed"
    assert res_update.json()["completion_percentage"] == 100.0
    assert res_update.json()["completed_at"] is not None

    # Verify via GET
    res_verify = client.get(f"/api/progress/{user.id}")
    assert res_verify.status_code == 200
    module_ids = [r["module_id"] for r in res_verify.json()]
    assert "budgeting-and-cashflow-201" in module_ids


def test_progress_user_not_found(client):
    """Test progress endpoints return 404 for invalid user IDs."""
    res_get = client.get("/api/progress/999999")
    assert res_get.status_code == 404

    res_post = client.post("/api/progress", json={
        "user_id": 999999,
        "module_id": "mod-1",
        "completion_percentage": 50.0,
    })
    assert res_post.status_code == 404
