from datetime import datetime, timedelta
import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib

import schemas
from repositories.user_repository import UserRepository
from models import User

# Constants
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 30    # 30 days
ALGORITHM = "HS256"
# In production, use a secure secret key from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-at-least-32-chars-long")

# Use pbkdf2_sha256 as a portable, dependency-free hashing scheme for local/dev
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class AuthService:
    def __init__(
        self,
        user_repository: UserRepository = Depends()
    ):
        self.user_repo = user_repository

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def register_user(self, user_create: schemas.UserCreate) -> User:
        # Check if email already exists
        if self.user_repo.get_by_email(user_create.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = self.get_password_hash(user_create.password)
        
        # Create user via repository method
        return self.user_repo.create_with_hashed_password(
            full_name=user_create.full_name,
            email=user_create.email,
            hashed_password=hashed_password,
            role=user_create.role or "student",
            status=user_create.status if user_create.status is not None else True
        )

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        # Use getattr to avoid static typing issues where class attributes are Columns
        stored = getattr(user, "hashed_password", None)
        if stored is None:
            return None
        if not self.verify_password(password, stored):
            return None
        return user

    def create_access_token(self, user: User) -> str:
        claims = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)

    def create_refresh_token(self, user: User) -> str:
        claims = {
            "sub": str(user.id),
            "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        }
        refresh_token = jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)
        # Store only the SHA-256 hash of the refresh token in DB (do not store raw token)
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        # Update refresh token hash using repository
        updated_user = self.user_repo.update_refresh_token_hash(int(getattr(user, "id", 0)), token_hash)
        if not updated_user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to store refresh token")

        return refresh_token

    def create_tokens(self, user: User) -> schemas.Token:
        access_token = self.create_access_token(user)
        refresh_token = self.create_refresh_token(user)
        
        return schemas.Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
        )

    def verify_token(self, token: str) -> schemas.TokenPayload:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return schemas.TokenPayload(
                sub=payload["sub"],
                email=payload["email"],
                role=payload.get("role"),
                exp=datetime.fromtimestamp(payload["exp"])
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def refresh_tokens(self, refresh_token: str) -> schemas.Token:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload["sub"])
            user = self.user_repo.get(user_id)
            # Verify presented refresh token by comparing SHA-256 hash
            presented_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )
            # Get user by refresh token hash to verify
            user_by_hash = self.user_repo.get_by_refresh_token_hash(presented_hash)
            if not user_by_hash or getattr(user_by_hash, "id", None) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )
                
            return self.create_tokens(user)
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

    def revoke_refresh_token(self, user: User) -> None:
        self.user_repo.update_refresh_token_hash(int(getattr(user, "id", 0)), None)

