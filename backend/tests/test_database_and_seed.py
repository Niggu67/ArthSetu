from app.models.scheme import GovernmentScheme
from app.models.user import User
from app.models.progress import UserProgress
from app.models.notification import Notification
from app.services.auth_service import verify_password


def test_seed_schemes_loaded(db):
    """Verify that at least 5 verified reference schemes are loaded with complete metadata."""
    schemes = db.query(GovernmentScheme).all()
    assert len(schemes) >= 5

    for s in schemes:
        assert s.name
        assert s.description
        assert s.category
        assert isinstance(s.eligibility_criteria, dict)
        assert s.benefits
        assert isinstance(s.required_documents, list)
        assert len(s.required_documents) > 0
        assert s.official_link.startswith("http")
        # Ensure official government links are verified domains
        assert any(
            domain in s.official_link
            for domain in ["mudra.org.in", "kviconline.gov.in", "standupmitra.in", "mofpi.gov.in", "acabcmis.gov.in"]
        )


def test_seed_demo_user_exists(db):
    """Verify that demo user is seeded securely with hashed password."""
    user = db.query(User).filter(User.phone == "9876543210").first()
    assert user is not None
    assert user.name == "Sunita Devi"
    assert user.business_type == "Food Processing"
    # Verify password is not plain text
    assert user.hashed_password != "Devi@12345"
    assert verify_password("Devi@12345", user.hashed_password) is True

    # Verify associated seed progress and notifications
    progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    assert len(progress) >= 1

    notifs = db.query(Notification).filter(Notification.user_id == user.id).all()
    assert len(notifs) >= 1
