from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from typing import Optional
import secrets
import os

import schemas
from services.auth_service import AuthService
from services.oauth_service import OAuthService
from repositories.user_repository import UserRepository
from models import User
from dependencies import AuthDependencies

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED
)
async def register(
    user_in: schemas.UserCreate, auth_service: AuthService = Depends()
) -> User:
    """Register a new user with full name, email, and password."""
    return auth_service.register_user(user_in)


# Cookie/refresh settings
REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds


@router.post("/login", response_model=schemas.Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(),
) -> schemas.Token:
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_pair = auth_service.create_tokens(user)

    # Set refresh token in secure HttpOnly cookie. Access token is returned in body.
    # Cookie settings: secure=True in production, samesite and max_age set to refresh expiry.
    refresh_token = token_pair.refresh_token
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # set to True in production (requires HTTPS)
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
            path="/api/v1/auth",
        )

    # Do not return refresh token in response body when using cookie storage
    return schemas.Token(
        access_token=token_pair.access_token, expires_in=token_pair.expires_in
    )


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    request: Request, response: Response, auth_service: AuthService = Depends()
) -> schemas.Token:
    # Read refresh token from HttpOnly cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token"
        )

    token_pair = auth_service.refresh_tokens(refresh_token)

    # Rotate cookie with new refresh token
    new_refresh = token_pair.refresh_token
    if new_refresh:
        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=False,  # set to True in production
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
            path="/api/v1/auth",
        )

    return schemas.Token(
        access_token=token_pair.access_token,
        refresh_token=None,
        expires_in=token_pair.expires_in,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    current_user: User = Depends(AuthDependencies.get_current_user),
    auth_service: AuthService = Depends(),
) -> dict:
    auth_service.revoke_refresh_token(current_user)
    # Delete cookie on logout
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: User = Depends(AuthDependencies.get_current_active_user),
) -> User:
    return current_user


# OAuth Routes


@router.get("/google")
async def google_login(
    request: Request,
    popup: Optional[str] = None,
    user_repo: UserRepository = Depends(),
    auth_service: AuthService = Depends(),
):
    """Initiate Google OAuth login"""
    oauth_service = OAuthService(user_repo, auth_service)

    # Generate a random state parameter for security
    state = secrets.token_urlsafe(32)
    # Store popup preference in state for callback
    if popup:
        state = f"{state}_popup"

    auth_url = oauth_service.get_google_auth_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(
    response: Response,
    code: str,
    state: str,
    popup: Optional[str] = None,
    user_repo: UserRepository = Depends(),
    auth_service: AuthService = Depends(),
):
    """Handle Google OAuth callback"""
    oauth_service = OAuthService(user_repo, auth_service)

    # In production, verify the state parameter

    token_pair = await oauth_service.handle_google_callback(code, state)

    # Set refresh token in cookie like the regular login
    if token_pair.refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            httponly=True,
            secure=False,  # set to True in production
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
            path="/api/v1/auth",
        )

    # Redirect to frontend with access token in URL
    frontend_url = os.getenv("FRONTEND_URL", "https://aitutor.io.vn")
    return RedirectResponse(
        url=f"{frontend_url}/auth/success?token={token_pair.access_token}&expires_in={token_pair.expires_in}"
    )


@router.get("/facebook")
async def facebook_login(
    request: Request,
    user_repo: UserRepository = Depends(),
    auth_service: AuthService = Depends(),
):
    """Initiate Facebook OAuth login"""
    oauth_service = OAuthService(user_repo, auth_service)

    # Generate a random state parameter for security
    state = secrets.token_urlsafe(32)

    auth_url = oauth_service.get_facebook_auth_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/facebook/callback")
async def facebook_callback(
    response: Response,
    code: str,
    state: str,
    user_repo: UserRepository = Depends(),
    auth_service: AuthService = Depends(),
):
    """Handle Facebook OAuth callback"""
    oauth_service = OAuthService(user_repo, auth_service)

    token_pair = await oauth_service.handle_facebook_callback(code, state)

    # Set refresh token in cookie
    if token_pair.refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            httponly=True,
            secure=False,  # set to True in production
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
            path="/api/v1/auth",
        )

    # Redirect to frontend with access token in URL
    frontend_url = os.getenv("FRONTEND_URL", "https://aitutor.io.vn")
    return RedirectResponse(
        url=f"{frontend_url}/auth/success?token={token_pair.access_token}&expires_in={token_pair.expires_in}"
    )
