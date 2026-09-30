import os
from typing import Dict, Any
from fastapi import HTTPException, status
import httpx
from urllib.parse import urlencode

from repositories.user_repository import UserRepository
from services.auth_service import AuthService
import schemas
import dotenv

dotenv.load_dotenv()


class OAuthService:
    def __init__(self, user_repo: UserRepository, auth_service: AuthService):
        self.user_repo = user_repo
        self.auth_service = auth_service

        # OAuth Provider Configurations
        self.google_config = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://www.googleapis.com/oauth2/v1/userinfo",
            "scope": "openid email profile",
            "redirect_uri": os.getenv(
                "GOOGLE_REDIRECT_URI",
                "http://localhost:8000/api/v1/auth/google/callback",
            ),
        }

        self.facebook_config = {
            "client_id": os.getenv("FACEBOOK_CLIENT_ID"),
            "client_secret": os.getenv("FACEBOOK_CLIENT_SECRET"),
            "authorization_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "userinfo_url": "https://graph.facebook.com/v18.0/me",
            "scope": "email public_profile",
            "redirect_uri": os.getenv(
                "FACEBOOK_REDIRECT_URI",
                "http://localhost:8000/api/v1/auth/facebook/callback",
            ),
        }

    def get_google_auth_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL"""
        if not self.google_config["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured",
            )

        params = {
            "client_id": self.google_config["client_id"],
            "response_type": "code",
            "scope": self.google_config["scope"],
            "redirect_uri": self.google_config["redirect_uri"],
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        return f"{self.google_config['authorization_url']}?{urlencode(params)}"

    def get_facebook_auth_url(self, state: str) -> str:
        """Generate Facebook OAuth authorization URL"""
        if not self.facebook_config["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Facebook OAuth not configured",
            )

        params = {
            "client_id": self.facebook_config["client_id"],
            "response_type": "code",
            "scope": self.facebook_config["scope"],
            "redirect_uri": self.facebook_config["redirect_uri"],
            "state": state,
        }

        return f"{self.facebook_config['authorization_url']}?{urlencode(params)}"

    async def handle_google_callback(self, code: str, state: str) -> schemas.Token:
        """Handle Google OAuth callback and return JWT tokens"""
        try:
            # Exchange code for access token
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    self.google_config["token_url"],
                    data={
                        "client_id": self.google_config["client_id"],
                        "client_secret": self.google_config["client_secret"],
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.google_config["redirect_uri"],
                    },
                )

                if token_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to exchange code for token",
                    )

                token_data = token_response.json()
                access_token = token_data.get("access_token")

                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token received",
                    )

                # Get user info from Google
                user_response = await client.get(
                    self.google_config["userinfo_url"],
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                if user_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get user info from Google",
                    )

                user_data = user_response.json()
                return await self._create_or_login_user(user_data, "google")

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Network error during OAuth: {str(e)}",
            )

    async def handle_facebook_callback(self, code: str, state: str) -> schemas.Token:
        """Handle Facebook OAuth callback and return JWT tokens"""
        try:
            # Exchange code for access token
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    self.facebook_config["token_url"],
                    data={
                        "client_id": self.facebook_config["client_id"],
                        "client_secret": self.facebook_config["client_secret"],
                        "code": code,
                        "redirect_uri": self.facebook_config["redirect_uri"],
                    },
                )

                if token_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to exchange code for token",
                    )

                token_data = token_response.json()
                access_token = token_data.get("access_token")

                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token received",
                    )

                # Get user info from Facebook
                user_response = await client.get(
                    f"{self.facebook_config['userinfo_url']}?fields=id,name,email&access_token={access_token}"
                )

                if user_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get user info from Facebook",
                    )

                user_data = user_response.json()
                return await self._create_or_login_user(user_data, "facebook")

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Network error during OAuth: {str(e)}",
            )

    async def _create_or_login_user(
        self, user_data: Dict[str, Any], provider: str
    ) -> schemas.Token:
        """Create or login user based on OAuth user data"""

        # Normalize user data based on provider
        if provider == "google":
            email = user_data.get("email")
            full_name = user_data.get("name", f"User {user_data.get('id', 'Unknown')}")
            provider_id = user_data.get("id")
        elif provider == "facebook":
            email = user_data.get("email")
            full_name = user_data.get("name", f"User {user_data.get('id', 'Unknown')}")
            provider_id = user_data.get("id")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider: {provider}",
            )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email not provided by {provider}",
            )

        # Check if user exists
        existing_user = self.user_repo.get_by_email(email)

        if existing_user:
            # User exists, just login
            return self.auth_service.create_tokens(existing_user)
        else:
            # Create new user
            # Generate a random password since OAuth users don't need one
            import secrets

            dummy_password = secrets.token_urlsafe(32)
            hashed_password = self.auth_service.get_password_hash(dummy_password)

            new_user = self.user_repo.create_with_hashed_password(
                full_name=full_name,
                email=email,
                hashed_password=hashed_password,  # They won't use this for login
                role="student",
                status=True,
            )

            return self.auth_service.create_tokens(new_user)
