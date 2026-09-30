"""
File Context Service backed by local conversation-file retrieval.
"""

import logging
from typing import List, Tuple
from repositories.file_repository import FileRepository
from models import Source

logger = logging.getLogger(__name__)


class FileContextService:
    def __init__(self, gemini_search=None):
        self.file_repo = FileRepository()
        # Use dependency injection or lazy loading
        self._gemini_search = gemini_search
    
    @property
    def gemini_search(self):
        """Lazy load the shared file-search service to avoid circular imports."""
        if self._gemini_search is None:
            from dependencies.gemini_file_search import get_gemini_file_search
            self._gemini_search = get_gemini_file_search()
        return self._gemini_search

    def has_user_files(self, user_id: int, conversation_id: str) -> bool:
        """Check if user has files in the conversation"""
        try:
            files = self.file_repo.get_files_by_conversation(conversation_id)
            return len(files) > 0
        except Exception as e:
            logger.error(f"Error checking user files: {e}")
            return False

    def get_file_context(self, user_id: int, conversation_id: str, user_query: str) -> Tuple[str, List[Source]]:
        """Get file context from locally stored conversation files."""
        try:
            logger.info(f"🔍 FileContextService: Checking files for user {user_id}, conversation {conversation_id}")

            # Check if conversation has files
            files = self.file_repo.get_files_by_conversation(conversation_id)
            if not files:
                logger.info(f"📄 No files found in conversation {conversation_id}")
                return "", []

            logger.info(
                f"📊 Searching {len(files)} files in conversation {conversation_id} with query: {user_query[:50]}..."
            )
            
            # Check if the file search service is available.
            if not self.gemini_search:
                logger.warning(f"⚠️ File search service not available")
                return "", []

            # Search locally stored files for relevant context.
            context_text, sources = self.gemini_search.search_in_conversation(conversation_id, user_query)

            if context_text:
                logger.info(
                    f"✅ Found relevant context from File Search Store for conversation {conversation_id}: {len(context_text)} chars, {len(sources)} sources"
                )
                return context_text, sources
            else:
                logger.info(f"ℹ️ No relevant context found for query in conversation {conversation_id}")
                return "", []

        except Exception as e:
            logger.error(f"❌ Error getting file context: {e}")
            return "", []
