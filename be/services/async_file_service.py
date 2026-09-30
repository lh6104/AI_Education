"""
Async File Upload Service với background processing
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid

logger = logging.getLogger(__name__)


class UploadStatus(Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class UploadTask:
    task_id: str
    conversation_id: str
    filename: str
    status: UploadStatus = UploadStatus.PENDING
    progress: int = 0
    error_message: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None


class AsyncFileUploadService:
    """
    Background file upload service
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._tasks: Dict[str, UploadTask] = {}
        from repositories.file_repository import FileRepository
        self.file_repo = FileRepository()
        self._initialized = True
        logger.info("🚀 AsyncFileUploadService initialized")
    
    async def submit_upload(
        self,
        file_content: bytes,
        filename: str,
        conversation_id: str
    ) -> str:
        """
        Submit file for background upload
        Returns task_id for tracking
        """
        task_id = str(uuid.uuid4())
        
        task = UploadTask(
            task_id=task_id,
            conversation_id=conversation_id,
            filename=filename
        )
        
        self._tasks[task_id] = task
        
        # Start background task
        asyncio.create_task(
            self._process_upload(task_id, file_content, filename, conversation_id)
        )
        
        logger.info(f"📤 Upload task submitted: {task_id} for {filename}")
        return task_id
    
    async def _process_upload(
        self,
        task_id: str,
        file_content: bytes,
        filename: str,
        conversation_id: str
    ):
        """Background upload processing"""
        from dependencies.gemini_file_search import get_gemini_file_search
        
        task = self._tasks.get(task_id)
        if not task:
            return
        
        try:
            task.status = UploadStatus.UPLOADING
            task.progress = 10
            
            gemini_search = get_gemini_file_search()
            if not gemini_search:
                raise Exception("File search service not available")
            
            task.progress = 30
            
            self.file_repo.save_file(
                file_content=file_content,
                filename=filename,
                conversation_id=conversation_id,
            )

            # Index the locally stored file.
            result = gemini_search.upload_file_to_store(
                file_content=file_content,
                filename=filename,
                conversation_id=conversation_id
            )
            
            task.progress = 90
            
            if result and result.get('success'):
                task.status = UploadStatus.COMPLETED
                task.result = result
                task.progress = 100
                logger.info(f"✅ Upload completed: {task_id}")
            else:
                task.status = UploadStatus.FAILED
                task.error_message = "Upload failed"
                logger.error(f"❌ Upload failed: {task_id}")
            
        except Exception as e:
            task.status = UploadStatus.FAILED
            task.error_message = str(e)
            logger.error(f"❌ Upload error: {task_id} - {e}")
        
        finally:
            task.completed_at = datetime.now()
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get upload task status"""
        task = self._tasks.get(task_id)
        if not task:
            return None
        
        return {
            'task_id': task.task_id,
            'conversation_id': task.conversation_id,
            'filename': task.filename,
            'status': task.status.value,
            'progress': task.progress,
            'error_message': task.error_message,
            'created_at': task.created_at.isoformat(),
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'result': task.result
        }
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Clean up old completed tasks"""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        old_tasks = [
            task_id for task_id, task in self._tasks.items()
            if task.completed_at and task.completed_at < cutoff
        ]
        
        for task_id in old_tasks:
            del self._tasks[task_id]
        
        if old_tasks:
            logger.info(f"🧹 Cleaned up {len(old_tasks)} old upload tasks")
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get all tasks status"""
        return {
            task_id: self.get_task_status(task_id)
            for task_id in self._tasks.keys()
        }
