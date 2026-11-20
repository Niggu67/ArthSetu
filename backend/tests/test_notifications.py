from app.models.user import User


def test_notifications_workflow(client, db):
    """Test retrieving notifications, creating a new alert, and marking as read."""
    user = db.query(User).filter(User.phone == "9876543210").first()
    assert user is not None

    # Step 1: Check existing notifications
    res_list = client.get(f"/api/notifications/{user.id}")
    assert res_list.status_code == 200
    notifs = res_list.json()
    assert len(notifs) >= 1
    existing_id = notifs[0]["id"]
    assert notifs[0]["read_status"] is False

    # Step 2: Mark notification as read
    res_read = client.patch(f"/api/notifications/{existing_id}/read")
    assert res_read.status_code == 200
    assert res_read.json()["id"] == existing_id
    assert res_read.json()["read_status"] is True

    # Step 3: Create a new notification
    create_payload = {
        "user_id": user.id,
        "title": "Subsidy Window Open",
        "message": "Applications for PMFME food processing subsidies are open for this quarter.",
    }
    res_create = client.post("/api/notifications", json=create_payload)
    assert res_create.status_code == 201
    new_notif = res_create.json()
    assert new_notif["title"] == "Subsidy Window Open"
    assert new_notif["read_status"] is False

    # Step 4: Verify in user's list
    res_updated_list = client.get(f"/api/notifications/{user.id}")
    assert res_updated_list.status_code == 200
    assert len(res_updated_list.json()) >= 2


def test_notifications_errors(client):
    """Test 404 error responses for invalid user or notification IDs."""
    res_user_404 = client.get("/api/notifications/999999")
    assert res_user_404.status_code == 404

    res_patch_404 = client.patch("/api/notifications/999999/read")
    assert res_patch_404.status_code == 404
