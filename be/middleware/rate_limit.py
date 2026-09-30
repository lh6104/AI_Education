"""
Rate limiting middleware
"""
import time
import logging
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Token bucket rate limiter
    """
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000
    ):
        self.rpm = requests_per_minute
        self.rph = requests_per_hour
        
        # Track requests: user_id -> [(timestamp, count)]
        self._minute_buckets: Dict[str, list] = defaultdict(list)
        self._hour_buckets: Dict[str, list] = defaultdict(list)
    
    def _cleanup_old_entries(self, bucket: list, max_age: float) -> list:
        """Remove entries older than max_age"""
        current_time = time.time()
        return [entry for entry in bucket if current_time - entry[0] < max_age]
    
    def is_allowed(self, user_id: str) -> Tuple[bool, str]:
        """
        Check if request is allowed
        Returns (is_allowed, reason)
        """
        current_time = time.time()
        
        # Cleanup and check minute bucket
        self._minute_buckets[user_id] = self._cleanup_old_entries(
            self._minute_buckets[user_id], 60
        )
        
        minute_count = sum(entry[1] for entry in self._minute_buckets[user_id])
        if minute_count >= self.rpm:
            return False, f"Rate limit exceeded: {self.rpm} requests/minute"
        
        # Cleanup and check hour bucket
        self._hour_buckets[user_id] = self._cleanup_old_entries(
            self._hour_buckets[user_id], 3600
        )
        
        hour_count = sum(entry[1] for entry in self._hour_buckets[user_id])
        if hour_count >= self.rph:
            return False, f"Rate limit exceeded: {self.rph} requests/hour"
        
        # Record this request
        self._minute_buckets[user_id].append((current_time, 1))
        self._hour_buckets[user_id].append((current_time, 1))
        
        return True, ""


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting
    """
    def __init__(self, app, rate_limiter: RateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        skip_paths = ["/docs", "/health", "/openapi.json", "/redoc"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Get user identifier (from JWT token or IP)
        user_id = self._get_user_identifier(request)
        
        is_allowed, reason = self.rate_limiter.is_allowed(user_id)
        
        if not is_allowed:
            logger.warning(f"⚠️ Rate limit exceeded for {user_id}: {reason}")
            raise HTTPException(status_code=429, detail=reason)
        
        return await call_next(request)
    
    def _get_user_identifier(self, request: Request) -> str:
        """Extract user identifier from request"""
        # Try to get from auth header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # In production, decode JWT to get user_id
            return auth_header[7:27]  # Use part of token as identifier
        
        # Fallback to IP
        return request.client.host if request.client else "unknown"
