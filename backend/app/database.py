from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# Engine configuration: SQLite needs check_same_thread=False for multithreaded FastAPI requests
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """Ensure all tables exist and run safe, idempotent SQLite column additions."""
    import app.models  # noqa: F401 - Register models with Base.metadata
    Base.metadata.create_all(bind=engine)
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in res.fetchall()]
                if columns:
                    if "is_verified" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
                        conn.commit()
                    if "verified_at" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN verified_at DATETIME"))
                        conn.commit()
                    # Ensure pre-existing accounts (including demo user) remain verified and functional
                    conn.execute(text("UPDATE users SET is_verified = 1 WHERE is_verified IS NULL OR is_verified = 0"))
                    conn.commit()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("SQLite init_db migration warning: %s", e)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

