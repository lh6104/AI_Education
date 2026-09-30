import json
import os
import uuid
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class FileRepository:
    def __init__(self):
        self.upload_dir = "/be/uploads"
        self.metadata_file = os.path.join(self.upload_dir, "files_metadata.json")
        self._ensure_upload_dir()

    def _ensure_upload_dir(self):
        """Ensure upload directory exists"""
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir, exist_ok=True)

    def _load_metadata(self) -> Dict[str, Any]:
        """Load file metadata from JSON file"""
        if not os.path.exists(self.metadata_file):
            return {}

        try:
            with open(self.metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading metadata: {e}")
            return {}

    def _save_metadata(self, metadata: Dict[str, Any]):
        """Save file metadata to JSON file"""
        try:
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    def save_file(
        self, file_content: bytes, filename: str, conversation_id: str, content_type: str = None, user_id: int = None
    ) -> Dict[str, Any]:
        """Save file locally and return file info"""
        try:
            # Generate unique file ID and path
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{file_id}{file_extension}"

            # Create conversation-specific directory
            conversation_dir = os.path.join(self.upload_dir, f"conversation_{conversation_id}")
            os.makedirs(conversation_dir, exist_ok=True)

            file_path = os.path.join(conversation_dir, unique_filename)

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Create metadata entry
            metadata = self._load_metadata()
            metadata[file_id] = {
                "file_id": file_id,
                "original_filename": filename,
                "unique_filename": unique_filename,
                "conversation_id": conversation_id,
                "user_id": user_id,  # Track owner
                "file_path": file_path,
                "upload_time": datetime.now().isoformat(),
                "file_size": len(file_content),
                "content_type": content_type,
                "uploaded_to_gemini": False,
                "local_file_cleaned": False,
                "gemini_store_name": None,
                "gemini_file_count": 0,  # Track file count in store
            }

            self._save_metadata(metadata)

            logger.info(
                f"File saved locally in conversation {conversation_id}: {filename} -> {unique_filename} (user: {conversation_id})"
            )

            return {
                "file_id": file_id,
                "file_path": file_path,
                "filename": filename,
                "conversation_id": conversation_id,
            }

        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise

    def update_file_metadata(self, file_id: str, updates: Dict[str, Any]) -> bool:
        """Update file metadata"""
        try:
            metadata = self._load_metadata()

            if file_id not in metadata:
                logger.warning(f"File {file_id} not found in metadata")
                return False

            # Update metadata
            metadata[file_id].update(updates)
            metadata[file_id]["updated_time"] = datetime.now().isoformat()

            self._save_metadata(metadata)

            logger.info(f"Updated file metadata for {file_id} with Gemini info")
            return True

        except Exception as e:
            logger.error(f"Error updating metadata: {e}")
            return False

    def get_files_by_conversation(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all files for a specific conversation"""
        try:
            metadata = self._load_metadata()

            files = [
                file_info for file_info in metadata.values() if file_info.get("conversation_id") == conversation_id
            ]

            return files

        except Exception as e:
            logger.error(f"Error getting files for conversation {conversation_id}: {e}")
            return []

    def get_file_content(self, file_id: str) -> Optional[bytes]:
        """Get file content by ID"""
        try:
            metadata = self._load_metadata()

            if file_id not in metadata:
                return None

            file_info = metadata[file_id]

            # Check if local file was cleaned up
            if file_info.get("local_file_cleaned", False):
                logger.info(f"Local file {file_id} was cleaned up, content not available locally")
                return None

            file_path = file_info.get("file_path")
            if not file_path or not os.path.exists(file_path):
                return None

            with open(file_path, "rb") as f:
                return f.read()

        except Exception as e:
            logger.error(f"Error getting file content for {file_id}: {e}")
            return None

    def cleanup_local_file(self, file_id: str, user_id: int) -> bool:
        """Clean up local file after successful Gemini upload"""
        try:
            metadata = self._load_metadata()

            if file_id not in metadata:
                return False

            file_info = metadata[file_id]

            # Only clean if uploaded to Gemini
            if not file_info.get("uploaded_to_gemini", False):
                logger.warning(f"⚠️ File {file_id} not yet uploaded to Gemini, skipping cleanup")
                return False

            # Remove physical file
            file_path = file_info.get("file_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)

            # Update metadata
            metadata[file_id].update(
                {
                    "local_file_cleaned": True,
                    "cleanup_timestamp": datetime.now().isoformat(),
                    "local_path": None,  # Clear local path
                }
            )

            self._save_metadata(metadata)

            # logger.info(f"Local file cleaned up: {file_info['original_filename']}")
            return True

        except Exception as e:
            logger.error(f"Error cleaning up file {file_id}: {e}")
            return False

    def cleanup_uploaded_files(self) -> List[str]:
        """Clean up all local files that have been uploaded to Gemini"""
        try:
            metadata = self._load_metadata()
            cleaned_files = []

            for file_id, file_info in metadata.items():
                if file_info.get("uploaded_to_gemini", False) and not file_info.get("local_file_cleaned", False):

                    if self.cleanup_local_file(file_id, 0):  # user_id not needed for this operation
                        cleaned_files.append(file_info["original_filename"])

            logger.info(f"🧹 Cleaned up {len(cleaned_files)} local files")
            return cleaned_files

        except Exception as e:
            logger.error(f"Error during bulk cleanup: {e}")
            return []

    def delete_file(self, file_id: str, user_id: int) -> bool:
        """Delete file completely (both local and metadata)"""
        try:
            metadata = self._load_metadata()

            if file_id not in metadata:
                return False

            file_info = metadata[file_id]

            # Remove physical file if exists
            file_path = file_info.get("file_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)

            # Remove metadata entry
            del metadata[file_id]
            self._save_metadata(metadata)

            logger.info(f"🗑️ File deleted: {file_info['original_filename']}")
            return True

        except Exception as e:
            logger.error(f"Error deleting file {file_id}: {e}")
            return False

    def clear_conversation_files(self, conversation_id: str) -> int:
        """Clear all files for a conversation"""
        try:
            files = self.get_files_by_conversation(conversation_id)
            deleted_count = 0

            for file_info in files:
                if self.delete_file(file_info["file_id"], 0):
                    deleted_count += 1

            # Remove conversation directory if empty
            conversation_dir = os.path.join(self.upload_dir, f"conversation_{conversation_id}")
            if os.path.exists(conversation_dir) and not os.listdir(conversation_dir):
                shutil.rmtree(conversation_dir)
                logger.info(f"📁 Removed empty conversation directory: {conversation_dir}")

            return deleted_count

        except Exception as e:
            logger.error(f"Error clearing conversation files: {e}")
            return 0

    def get_all_files(self) -> List[Dict[str, Any]]:
        """Get all files across all conversations"""
        metadata = self._load_metadata()
        return list(metadata.values())

    def verify_file_ownership(self, file_id: str, user_id: int) -> bool:
        """Verify that user owns the file"""
        try:
            metadata = self._load_metadata()
            if file_id not in metadata:
                return False
            
            file_info = metadata[file_id]
            file_user_id = file_info.get("user_id")
            
            # If user_id not tracked (legacy), allow access
            if file_user_id is None:
                return True
            
            return file_user_id == user_id
        except Exception as e:
            logger.error(f"Error verifying file ownership: {e}")
            return False

    def get_conversation_file_count(self, conversation_id: str) -> int:
        """Get accurate file count for a conversation"""
        try:
            files = self.get_files_by_conversation(conversation_id)
            # Count files that are uploaded to Gemini (not just local)
            uploaded_count = sum(
                1 for f in files 
                if f.get("uploaded_to_gemini", False)
            )
            return uploaded_count
        except Exception as e:
            logger.error(f"Error getting file count: {e}")
            return 0

    def sync_with_gemini_store(self, conversation_id: str, gemini_files_count: int) -> bool:
        """Sync local metadata with Gemini store state"""
        try:
            metadata = self._load_metadata()
            updated = False
            
            for file_id, file_info in metadata.items():
                if file_info.get("conversation_id") == conversation_id:
                    if file_info.get("gemini_file_count") != gemini_files_count:
                        metadata[file_id]["gemini_file_count"] = gemini_files_count
                        metadata[file_id]["last_sync"] = datetime.now().isoformat()
                        updated = True
            
            if updated:
                self._save_metadata(metadata)
                logger.info(f"📊 Synced metadata for conversation {conversation_id}: {gemini_files_count} files")
            
            return True
        except Exception as e:
            logger.error(f"Error syncing with Gemini: {e}")
            return False

    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        try:
            metadata = self._load_metadata()

            total_files = len(metadata)
            uploaded_to_gemini = sum(1 for f in metadata.values() if f.get("uploaded_to_gemini", False))
            local_cleaned = sum(1 for f in metadata.values() if f.get("local_file_cleaned", False))
            total_size = sum(f.get("file_size", 0) for f in metadata.values())

            conversations = set(f.get("conversation_id") for f in metadata.values() if f.get("conversation_id"))

            return {
                "total_files": total_files,
                "uploaded_to_gemini": uploaded_to_gemini,
                "local_cleaned": local_cleaned,
                "total_size_bytes": total_size,
                "total_conversations": len(conversations),
                "conversations": list(conversations),
            }

        except Exception as e:
            logger.error(f"Error getting storage stats: {e}")
            return {}
