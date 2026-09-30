from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from repositories.user_repository import UserRepository

from models import User
from services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(),
    user_repo: UserRepository = Depends()
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = auth_service.verify_token(token)
        user = user_repo.get(int(payload.sub))
        if user is None:
            raise credentials_exception
        return user
        
    except JWTError:
        raise credentials_exception

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # Use getattr to avoid SQLAlchemy Column type being seen by static checker
    if not bool(getattr(current_user, "status", False)):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class AuthDependencies:
    get_current_user = get_current_user
    get_current_active_user = get_current_active_user