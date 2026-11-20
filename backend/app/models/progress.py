from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String(100), nullable=False, index=True)
    completion_status = Column(String(50), nullable=False, default="in_progress")
    completion_percentage = Column(Float, nullable=False, default=0.0)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="progress")
