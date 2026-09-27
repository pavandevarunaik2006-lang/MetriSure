import os
import re

backend_dir = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\backend"

# 1. Create Model
model_code = """
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
"""
with open(os.path.join(backend_dir, "app", "models", "notification.py"), "w") as f:
    f.write(model_code)

# 2. Create Schema
schema_code = """
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
"""
with open(os.path.join(backend_dir, "app", "schemas", "notification.py"), "w") as f:
    f.write(schema_code)

# 3. Create Router
router_code = """
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}
"""
with open(os.path.join(backend_dir, "app", "api", "notifications.py"), "w") as f:
    f.write(router_code)

# 4. Update main.py
main_py_path = os.path.join(backend_dir, "app", "main.py")
with open(main_py_path, "r") as f:
    main_content = f.read()

if "from app.api import notifications" not in main_content:
    main_content = main_content.replace("from app.api import auth, instruments, test_sessions", "from app.api import auth, instruments, test_sessions, notifications")
    main_content = main_content.replace("app.include_router(test_sessions.router)", "app.include_router(test_sessions.router)\napp.include_router(notifications.router)")
    with open(main_py_path, "w") as f:
        f.write(main_content)

print("Backend notifications added.")
