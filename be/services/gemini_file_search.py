"""Local conversation-file retrieval used by the Groq-backed chat service.

The module name and class name are retained for compatibility with existing imports.
Groq does not offer Gemini's hosted File Search API, so files stay in local storage
and relevant readable text is supplied to the chat prompt as context.
"""

import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

from models import Source
from repositories.file_repository import FileRepository


class GeminiFileSearchService:
    """Compatibility wrapper that performs local file retrieval without an API key."""

    MAX_SEARCH_RESULTS = 10

    def __init__(self):
        self.file_repo = FileRepository()

    @property
    def conversation_stores(self) -> Dict[str, Dict[str, Any]]:
        """Expose the legacy store shape from the locally stored file metadata."""
        stores: Dict[str, Dict[str, Any]] = {}
        for file_info in self.file_repo.get_all_files():
            conversation_id = file_info.get("conversation_id")
            if not conversation_id:
                continue
            store = stores.setdefault(
                conversation_id,
                {
                    "name": f"local:{conversation_id}",
                    "display_name": f"conversation_{conversation_id}",
                    "create_time": file_info.get("upload_time"),
                    "files_count": 0,
                },
            )
            store["files_count"] += 1
        return stores

    def get_or_create_store(self, conversation_id: str) -> Dict[str, Any]:
        return self.conversation_stores.get(
            conversation_id,
            {
                "name": f"local:{conversation_id}",
                "display_name": f"conversation_{conversation_id}",
                "create_time": None,
                "files_count": 0,
            },
        )

    def upload_file_to_store(
        self,
        file_content: bytes,
        filename: str,
        conversation_id: str,
        display_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Acknowledge a file already persisted by FileRepository."""
        store = self.get_or_create_store(conversation_id)
        return {
            "success": True,
            "store_name": store["name"],
            "display_name": display_name or filename,
            "operation_name": "local-storage",
            "conversation_id": conversation_id,
            "files_count": store["files_count"],
        }

    @staticmethod
    def _query_terms(query: str) -> List[str]:
        return [term.lower() for term in re.findall(r"[\\w'-]+", query) if len(term) > 1]

    @staticmethod
    def _decode_file(content: bytes) -> str:
        """Return text from a locally stored, text-readable file."""
        return content.decode("utf-8", errors="ignore").strip()

    def search_in_conversation(
        self, conversation_id: str, query: str, max_retries: Optional[int] = None
    ) -> Tuple[str, List[Source]]:
        del max_retries
        terms = self._query_terms(query)
        ranked_chunks: List[Tuple[int, str, Dict[str, Any]]] = []

        for file_info in self.file_repo.get_files_by_conversation(conversation_id):
            content = self.file_repo.get_file_content(file_info["file_id"])
            if not content:
                continue
            text = self._decode_file(content)
            if not text:
                continue

            for chunk in (text[i : i + 1600] for i in range(0, len(text), 1400)):
                normalized_chunk = chunk.lower()
                score = sum(normalized_chunk.count(term) for term in terms)
                if score:
                    ranked_chunks.append((score, chunk, file_info))

        ranked_chunks.sort(key=lambda item: item[0], reverse=True)
        selected = ranked_chunks[: self.MAX_SEARCH_RESULTS]
        if not selected:
            return "", []

        context_parts: List[str] = []
        source_scores: Counter[str] = Counter()
        source_files: Dict[str, Dict[str, Any]] = {}
        for score, chunk, file_info in selected:
            file_id = file_info["file_id"]
            source_scores[file_id] += score
            source_files[file_id] = file_info
            context_parts.append(f"Source: {file_info['original_filename']}\n{chunk}")

        total_score = sum(source_scores.values()) or 1
        sources = [
            Source(
                title=file_info["original_filename"],
                source=f"local_file:{file_id}",
                content_preview=(self._decode_file(self.file_repo.get_file_content(file_id) or b"")[:300]),
                similarity=round(score / total_score, 3),
            )
            for file_id, score in source_scores.items()
            for file_info in [source_files[file_id]]
        ]
        return "\n\n".join(context_parts), sources

    def list_conversation_stores(self) -> List[Dict[str, Any]]:
        return [
            {
                "conversation_id": conversation_id,
                "store_name": store["name"],
                "display_name": store["display_name"],
                "create_time": store["create_time"],
            }
            for conversation_id, store in self.conversation_stores.items()
        ]

    def delete_conversation_store(self, conversation_id: str) -> bool:
        """Local files are deleted by FileRepository after this compatibility call."""
        return bool(self.file_repo.get_files_by_conversation(conversation_id))

    def get_conversation_files_count(self, conversation_id: str) -> int:
        return len(self.file_repo.get_files_by_conversation(conversation_id))

    def increment_file_count(self, conversation_id: str) -> None:
        del conversation_id

    def clear_all_stores(self) -> Dict[str, Any]:
        return {"success": True, "deleted_count": 0, "errors": []}

    def is_available(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        stores = self.conversation_stores
        return {
            "available": True,
            "provider": "local",
            "total_conversations": len(stores),
            "conversation_stores": list(stores.keys()),
            "api_configured": False,
        }
