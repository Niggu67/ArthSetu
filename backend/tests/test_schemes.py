def test_list_schemes_and_disclaimer(client):
    """Test retrieving all government schemes with informational disclaimer."""
    res = client.get("/api/schemes")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5
    assert len(data["schemes"]) >= 5
    assert "disclaimer" in data
    assert "official" in data["disclaimer"].lower() or "guidance" in data["disclaimer"].lower()


def test_filter_and_search_schemes(client):
    """Test category filtering and text search across schemes."""
    # Filter by category
    res_cat = client.get("/api/schemes?category=Credit")
    assert res_cat.status_code == 200
    cat_schemes = res_cat.json()["schemes"]
    assert len(cat_schemes) > 0
    for s in cat_schemes:
        assert "Credit" in s["category"]

    # Search by keyword
    res_search = client.get("/api/schemes?search=Mudra")
    assert res_search.status_code == 200
    search_schemes = res_search.json()["schemes"]
    assert len(search_schemes) >= 1
    assert "Mudra" in search_schemes[0]["name"]


def test_get_scheme_by_id_and_not_found(client):
    """Test retrieving a scheme by ID and handling 404 error."""
    # First get the list to find a valid ID
    res_list = client.get("/api/schemes")
    schemes = res_list.json()["schemes"]
    valid_id = schemes[0]["id"]

    # Valid ID lookup
    res_single = client.get(f"/api/schemes/{valid_id}")
    assert res_single.status_code == 200
    single_data = res_single.json()
    assert single_data["id"] == valid_id
    assert "name" in single_data
    assert "eligibility_criteria" in single_data
    assert "required_documents" in single_data
    assert len(single_data["required_documents"]) > 0

    # Non-existent ID lookup
    res_404 = client.get("/api/schemes/999999")
    assert res_404.status_code == 404
    assert "not found" in res_404.json()["detail"].lower()
