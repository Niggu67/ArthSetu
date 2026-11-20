import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base, init_db
from app.models.scheme import GovernmentScheme
from app.models.user import User
from app.models.progress import UserProgress
from app.models.application import Application
from app.models.notification import Notification
from app.services.auth_service import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Verified realistic Indian Government schemes for rural micro-entrepreneurs
SCHEMES_DATA: List[Dict[str, Any]] = [
    {
        "name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "description": (
            "Provides collateral-free institutional credit up to ₹10 Lakhs to micro and small non-farm enterprises "
            "under three categories: Shishu (loans up to ₹50,000), Kishore (₹50,000 to ₹5 Lakhs), and Tarun (₹5 Lakhs to ₹10 Lakhs). "
            "[DEVELOPMENT MOCK NOTICE]: Reference parameters based on official Ministry of Finance guidelines for development testing."
        ),
        "category": "Credit/Loan",
        "eligibility_criteria": {
            "allowed_business_types": ["Manufacturing", "Services", "Retail", "Trading", "Handicrafts", "Food Processing"],
            "min_annual_income": 0,
            "max_annual_income": 5000000,
            "min_years_in_business": 0,
            "target_genders": ["all"],
            "target_social_categories": ["all"],
            "non_farm_activity": True,
        },
        "benefits": "Collateral-free loans up to ₹10,00,000 with low processing fees and competitive interest rates via commercial and regional rural banks.",
        "required_documents": [
            "Aadhaar Card",
            "PAN Card / Form 60",
            "Proof of Business Address",
            "Quotations for machinery or purchase items",
            "Last 6 months Bank Account Statement",
        ],
        "official_link": "https://www.mudra.org.in",
    },
    {
        "name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "description": (
            "A major credit-linked subsidy scheme by the Ministry of MSME implemented by KVIC. "
            "Offers up to 25% subsidy in urban areas and 35% subsidy in rural areas for setting up new micro-enterprises "
            "in manufacturing (project cost up to ₹50 Lakhs) and services (project cost up to ₹20 Lakhs). "
            "[DEVELOPMENT MOCK NOTICE]: Reference parameters based on KVIC guidelines for development testing."
        ),
        "category": "Subsidy & Credit",
        "eligibility_criteria": {
            "allowed_business_types": ["Manufacturing", "Services", "Handicrafts", "Food Processing", "Rural Industry"],
            "min_annual_income": 0,
            "max_annual_income": 2000000,
            "min_years_in_business": 0,
            "max_years_in_business": 1,  # Focused on greenfield / new enterprises
            "min_age": 18,
            "target_genders": ["all"],
            "target_social_categories": ["all"],
        },
        "benefits": "Capital subsidy of 25% to 35% on project costs up to ₹50 Lakhs for manufacturing and ₹20 Lakhs for service sector in rural areas.",
        "required_documents": [
            "Aadhaar Card",
            "Detailed Project Report (DPR)",
            "Educational Qualification Certificate (min 8th pass for projects > ₹10L manufacturing)",
            "Caste/Category Certificate (for Special Category subsidy)",
            "Rural Area Certificate from local authority",
        ],
        "official_link": "https://www.kviconline.gov.in/pmegpeportal/",
    },
    {
        "name": "Stand-Up India Scheme",
        "description": (
            "Facilitates bank loans between ₹10 Lakhs and ₹1 Crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) "
            "borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise. "
            "[DEVELOPMENT MOCK NOTICE]: Reference parameters based on SIDBI/Department of Financial Services guidelines for development testing."
        ),
        "category": "Credit/Loan",
        "eligibility_criteria": {
            "allowed_business_types": ["Manufacturing", "Services", "Trading", "Agri-allied"],
            "min_annual_income": 0,
            "max_annual_income": 10000000,
            "min_years_in_business": 0,
            "target_genders": ["female"],
            "target_social_categories": ["SC", "ST", "Women"],
            "min_shareholding_percentage": 51,
        },
        "benefits": "Composite loan (term loan and working capital) between ₹10 Lakhs and ₹1 Crore covering up to 85% of total project cost.",
        "required_documents": [
            "Aadhaar Card & PAN Card",
            "Caste Certificate (SC/ST) or Proof of Woman Entrepreneurship (min 51% stake)",
            "Detailed Project Profile / Business Plan",
            "Projected Balance Sheet & Cash Flow Statement",
            "Pollution clearance / statutory approvals where applicable",
        ],
        "official_link": "https://www.standupmitra.in",
    },
    {
        "name": "PM Formalisation of Micro food processing Enterprises (PMFME)",
        "description": (
            "Launched under the Ministry of Food Processing Industries (MoFPI) to provide financial, technical and business support "
            "for upgradation and establishment of micro food processing units, self-help groups (SHGs), and Farmer Producer Organizations (FPOs). "
            "[DEVELOPMENT MOCK NOTICE]: Reference parameters based on MoFPI guidelines for development testing."
        ),
        "category": "Subsidy & Food Processing",
        "eligibility_criteria": {
            "allowed_business_types": ["Food Processing", "Agriculture", "Dairy", "Horticulture", "Spices", "Grain Milling"],
            "min_annual_income": 0,
            "max_annual_income": 3000000,
            "min_years_in_business": 1,
            "target_genders": ["all"],
            "target_social_categories": ["all"],
        },
        "benefits": "Credit-linked capital subsidy at 35% of the eligible project cost with a maximum ceiling of ₹10 Lakhs per micro food processing unit.",
        "required_documents": [
            "Aadhaar Card & PAN Card",
            "Proof of Ownership / Lease of business premises",
            "Electricity Bill / Factory License",
            "Basic FSSAI Registration / Undertaking",
            "Bank Statement of the existing enterprise for last 6 months",
        ],
        "official_link": "https://pmfme.mofpi.gov.in/",
    },
    {
        "name": "Agri-Clinics and Agri-Business Centres (ACABC) Scheme",
        "description": (
            "A flagship initiative by the Ministry of Agriculture & Farmers Welfare with MANAGE and NABARD. "
            "Aims to provide self-employment opportunities to agricultural graduates, diploma holders, and rural entrepreneurs "
            "while providing expert advisory and farm-input support to farmers. "
            "[DEVELOPMENT MOCK NOTICE]: Reference parameters based on NABARD/MANAGE guidelines for development testing."
        ),
        "category": "Agriculture & Allied",
        "eligibility_criteria": {
            "allowed_business_types": ["Agriculture", "Dairy", "Poultry", "Fisheries", "Agri-Services", "Custom Hiring"],
            "min_annual_income": 0,
            "max_annual_income": 2500000,
            "min_years_in_business": 0,
            "target_genders": ["all"],
            "target_social_categories": ["all"],
            "requires_agri_training": True,
        },
        "benefits": "Subsidized bank credit up to ₹20 Lakhs for individual projects (₹1 Crore for groups), with 36% composite back-ended subsidy (44% for women, SC/ST, and hilly/NE regions).",
        "required_documents": [
            "Aadhaar Card",
            "Degree/Diploma in Agriculture or Allied Sciences / Certificate of Agri Training",
            "Detailed Agribusiness Project Report",
            "Land/Premises Document or Rent Agreement",
            "Bank Account KYC details",
        ],
        "official_link": "https://www.acabcmis.gov.in/",
    },
]


def seed_database(db: Session = None) -> None:
    """Seeds the database with verified reference schemes and initial demo user for testing."""
    close_at_end = False
    init_db()
    if db is None:
        db = SessionLocal()
        close_at_end = True

    try:
        logger.info("Checking and seeding government schemes...")
        for scheme_dict in SCHEMES_DATA:
            existing = db.query(GovernmentScheme).filter(GovernmentScheme.name == scheme_dict["name"]).first()
            if not existing:
                scheme = GovernmentScheme(**scheme_dict)
                db.add(scheme)
                logger.info(f"Added scheme: {scheme_dict['name']}")

        db.commit()

        # Seed sample demo rural entrepreneur if not present
        demo_phone = "9876543210"
        demo_user = db.query(User).filter(User.phone == demo_phone).first()
        if not demo_user:
            demo_user = User(
                name="Sunita Devi",
                phone=demo_phone,
                email="sunita.devi@example.com",
                hashed_password=hash_password("Devi@12345"),
                language_preference="hi",
                business_name="Devi Organic Spices & Grinding",
                business_type="Food Processing",
                location="Nashik, Maharashtra",
                annual_income=280000.0,
                years_in_business=2,
                financial_goals="Purchase modern pulverizer machinery and apply for working capital subsidy",
                is_verified=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info(f"Added demo entrepreneur: {demo_user.name}")
        else:
            if not demo_user.is_verified:
                demo_user.is_verified = True
                db.commit()
                db.refresh(demo_user)

        # Seed missing progress record for demo user (idempotent)
        existing_progress = db.query(UserProgress).filter(
            UserProgress.user_id == demo_user.id,
            UserProgress.module_id == "learn-loan-basics",
        ).first()
        if not existing_progress:
            sample_progress = UserProgress(
                user_id=demo_user.id,
                module_id="learn-loan-basics",
                completion_status="completed",
                completion_percentage=100.0,
            )
            db.add(sample_progress)
            logger.info("Seeded demo progress: learn-loan-basics (completed, 100%)")

        # Seed missing welcome notification for demo user (idempotent)
        existing_notif = db.query(Notification).filter(
            Notification.user_id == demo_user.id,
            Notification.title == "Welcome to ArthSetu",
        ).first()
        if not existing_notif:
            sample_notif = Notification(
                user_id=demo_user.id,
                title="Welcome to ArthSetu",
                message="Welcome Sunita! Start exploring government schemes suitable for your food processing enterprise.",
                read_status=False,
            )
            db.add(sample_notif)
            logger.info("Seeded demo welcome notification")

        # Seed one sample demo application for the demo user (idempotent).
        # Uses PMMY (first scheme by name) as it fits Food Processing.
        # Status: draft — clearly a planning/demo entry, not a government submission.
        pmmy_scheme = db.query(GovernmentScheme).filter(
            GovernmentScheme.name == "Pradhan Mantri Mudra Yojana (PMMY)"
        ).first()
        if pmmy_scheme:
            existing_app = db.query(Application).filter(
                Application.user_id == demo_user.id,
                Application.scheme_id == pmmy_scheme.id,
            ).first()
            if not existing_app:
                demo_app = Application(
                    user_id=demo_user.id,
                    scheme_id=pmmy_scheme.id,
                    status="draft",
                    notes=(
                        "[DEMO SAMPLE] This is a demonstration entry for self-tracking purposes only. "
                        "Visited local SBI branch to enquire about Kishore loan category. "
                        "Collecting quotation for pulverizer machinery. No official submission made."
                    ),
                )
                db.add(demo_app)
                logger.info("Seeded demo application: PMMY (draft)")

        db.commit()
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seeding: {e}")
        raise
    finally:
        if close_at_end:
            db.close()


if __name__ == "__main__":
    seed_database()
