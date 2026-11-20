def test_health_endpoint(client):
    """Test the GET /health endpoint returns HTTP 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ArthSetu" in data["service"]
    assert data["version"] == "1.0.0"
    assert "timestamp" in data
