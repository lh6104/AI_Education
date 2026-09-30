"""
Dependency injection for shared services
Ensures single instances of expensive services like GeminiFileSearchService
"""

from functools import lru_cache
import logging
from typing import Optional
from services.gemini_file_search import GeminiFileSearchService

logger = logging.getLogger(__name__)

# Global instance storage
_gemini_file_search_instance: Optional[GeminiFileSearchService] = None

@lru_cache()
def get_gemini_file_search() -> Optional[GeminiFileSearchService]:
    """
    Get shared GeminiFileSearchService instance (singleton pattern)
    
    Returns:
        Shared GeminiFileSearchService instance or None if initialization fails
    """
    global _gemini_file_search_instance
    
    if _gemini_file_search_instance is None:
        try:
            logger.info("Initializing shared GeminiFileSearchService instance")
            _gemini_file_search_instance = GeminiFileSearchService()
            logger.info("✅ Shared GeminiFileSearchService initialized successfully")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize GeminiFileSearchService: {e}")
            _gemini_file_search_instance = None
    
    return _gemini_file_search_instance

def reset_gemini_file_search():
    """Reset the singleton instance (useful for testing)"""
    global _gemini_file_search_instance
    _gemini_file_search_instance = None
    get_gemini_file_search.cache_clear()  # Clear lru_cache