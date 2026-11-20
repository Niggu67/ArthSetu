from app.models.user import User


def test_eligibility_evaluation_general(client):
    """Test standard eligibility check returning score, matches, reasons, docs, and disclaimer."""
    payload = {
        "business_type": "Food Processing",
        "annual_income": 300000.0,
        "years_in_business": 2,
        "location": "Nashik, Maharashtra",
        "gender": "female",
        "social_category": "OBC",
    }
    res = client.post("/api/eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "overall_eligibility_score" in data
    assert 0 <= data["overall_eligibility_score"] <= 100
    assert "potentially_eligible_schemes" in data
    assert len(data["potentially_eligible_schemes"]) > 0

    # Verify itemized scheme details
    top_scheme = data["potentially_eligible_schemes"][0]
    assert "scheme_id" in top_scheme
    assert "scheme_name" in top_scheme
    assert "eligibility_score" in top_scheme
    assert "is_eligible" in top_scheme
    assert isinstance(top_scheme["reasons"], list)
    assert isinstance(top_scheme["missing_requirements"], list)
    assert isinstance(top_scheme["required_documents"], list)

    # Check top consolidated sections
    assert isinstance(data["reasons"], list)
    assert len(data["reasons"]) > 0
    assert isinstance(data["required_documents"], list)
    assert len(data["required_documents"]) > 0

    # Ensure statutory informational disclaimer is clearly stated
    assert "disclaimer" in data
    assert "informational" in data["disclaimer"].lower()
    assert "not" in data["disclaimer"].lower() or "guarantee" in data["disclaimer"].lower()


def test_eligibility_with_existing_user_id(client, db):
    """Test eligibility evaluation pulling profile parameters from an existing user."""
    demo_user = db.query(User).filter(User.phone == "9876543210").first()
    assert demo_user is not None

    payload = {
        "user_id": demo_user.id,
    }
    res = client.post("/api/eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_eligibility_score"] > 0
    assert len(data["potentially_eligible_schemes"]) >= 1


def test_eligibility_for_specific_scheme(client):
    """Test evaluating eligibility against one specific scheme ID."""
    res_list = client.get("/api/schemes")
    schemes = res_list.json()["schemes"]
    target_id = schemes[0]["id"]

    payload = {
        "scheme_id": target_id,
        "business_type": "Manufacturing",
        "annual_income": 500000.0,
        "years_in_business": 1,
    }
    res = client.post("/api/eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["potentially_eligible_schemes"]) == 1
    assert data["potentially_eligible_schemes"][0]["scheme_id"] == target_id


def test_eligibility_nonexistent_scheme_id(client):
    """Test that passing a non-existent scheme_id returns HTTP 404."""
    payload = {
        "scheme_id": 999999,
        "business_type": "Retail",
    }
    res = client.post("/api/eligibility", json=payload)
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"]
