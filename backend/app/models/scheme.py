from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    eligibility_criteria = Column(JSON, nullable=False, default=dict)
    benefits = Column(Text, nullable=False)
    required_documents = Column(JSON, nullable=False, default=list)
    official_link = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="scheme", cascade="all, delete-orphan")
