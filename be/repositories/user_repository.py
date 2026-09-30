from typing import Optional
from models import User
import schemas
from fastapi import Depends
from db import get_db

class UserRepository:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def get(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def list(self):
        return self.db.query(User).all()

    def create(self, user_in: schemas.UserCreate) -> User:
        db_obj = User(**user_in.dict())
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, user_id: int, user_in: schemas.UserInDBBase) -> Optional[schemas.UserInDBBase]:
        obj = self.get(user_id)
        if not obj:
            return None
        for field, value in user_in.dict(exclude_unset=True).items():
            setattr(obj, field, value)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, user_id: int) -> bool:
        obj = self.get(user_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
    
    def update_refresh_token_hash(self, user_id: int, refresh_token_hash: Optional[str]) -> Optional[User]:
        """Update user's refresh token hash."""
        user = self.get(user_id)
        if not user:
            return None
        setattr(user, "refresh_token_hash", refresh_token_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_refresh_token_hash(self, refresh_token_hash: str) -> Optional[User]:
        """Get user by refresh token hash."""
        return self.db.query(User).filter(User.refresh_token_hash == refresh_token_hash).first()
    
    def create_with_hashed_password(self, full_name: str, email: str, hashed_password: str, role: str = "student", status: bool = True) -> User:
        """Create a new user with an already-hashed password."""
        db_user = User(
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
            role=role,
            status=status,
            daily_streaks=0
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    