from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, status
from fastapi.responses import JSONResponse
import logging

from dependencies.auth import get_current_user
from dependencies.gemini_file_search import get_gemini_file_search
from models import User
from repositories.file_repository import FileRepository
from services.async_file_service import AsyncFileUploadService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["files"])

# Initialize repositories (services use dependency injection)
file_repo = FileRepository()
async_upload_service = AsyncFileUploadService()


def get_gemini_service():
    """Get shared Gemini service instance"""
    service = get_gemini_file_search()
    if not service:
        raise HTTPException(status_code=503, detail="File search service not available")
    return service

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Upload file to conversation's File Search Store"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Check file size (100MB limit for Gemini)
        max_size = 100 * 1024 * 1024  # 100MB
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 100MB")
        
        logger.info(f"📤 User {current_user.id} uploading file: {file.filename} to conversation {conversation_id}")
        
        # Get shared Gemini service
        gemini_search = get_gemini_service()
        
        # Save file locally
        local_result = file_repo.save_file(
            file_content=file_content,
            filename=file.filename,
            conversation_id=conversation_id,
            content_type=file.content_type,
            user_id=current_user.id  # Track file owner
        )
        
        # Upload to Gemini File Search Store immediately  
        gemini_result = gemini_search.upload_file_to_store(
            file_content=file_content,
            filename=file.filename,
            conversation_id=conversation_id,
            display_name=file.filename
        )
        
        if gemini_result and gemini_result.get('success'):
            # Keep the local copy for retrieval; Groq has no hosted file-search store.
            file_repo.update_file_metadata(local_result['file_id'], {
                'file_search_store_name': gemini_result['store_name'],
                'file_search_operation': gemini_result['operation_name'],
                'indexed_locally': True
            })
            
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    "message": "File uploaded successfully",
                    "file_id": local_result['file_id'],
                    "filename": file.filename,
                    "conversation_id": conversation_id,
                    "file_search_store": gemini_result['store_name'],
                    "local_cleaned": False
                }
            )
        else:
            logger.error(f"Failed to index local file for user {current_user.id}: {file.filename}")
            raise HTTPException(status_code=500, detail="Failed to upload file to search service")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}")
async def list_conversation_files(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """List files in a specific conversation"""
    try:
        files = file_repo.get_files_by_conversation(conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "files": files,
            "count": len(files)
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing files for conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversation/{conversation_id}")
async def clear_conversation_files(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear all files for a conversation"""
    try:
        # Get shared Gemini service
        gemini_search = get_gemini_service()
        
        # Get files before deletion for cleanup
        files = file_repo.get_files_by_conversation(conversation_id)
        
        # Delete from Gemini File Search Store
        store_deleted = gemini_search.delete_conversation_store(conversation_id)
        
        # Delete local files and metadata
        deleted_count = 0
        for file_info in files:
            if file_repo.delete_file(file_info['file_id'], current_user.id):
                deleted_count += 1
        
        logger.info(f"Cleared {deleted_count} files for conversation {conversation_id}, store deleted: {store_deleted}")
        
        return {
            "message": "Conversation files cleared",
            "conversation_id": conversation_id,
            "files_deleted": deleted_count,
            "store_deleted": store_deleted
        }
        
    except Exception as e:
        logger.error(f"❌ Error clearing conversation files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cleanup")
async def cleanup_local_files(current_user: User = Depends(get_current_user)):
    """Manually clean up local files that have been uploaded to Gemini"""
    try:
        cleaned_files = file_repo.cleanup_uploaded_files()
        
        return {
            "message": "Local cleanup completed",
            "files_cleaned": cleaned_files
        }
        
    except Exception as e:
        logger.error(f"❌ Error during manual cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/{conversation_id}")
async def debug_conversation_files(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to check file status"""
    try:
        # Get shared Gemini service
        gemini_search = get_gemini_service()
        
        # Get local files
        local_files = file_repo.get_files_by_conversation(conversation_id)
        
        # Get Gemini store info
        stores = gemini_search.list_conversation_stores()
        store_info = next((s for s in stores if s['conversation_id'] == conversation_id), None)
        
        # Get files count
        files_count = gemini_search.get_conversation_files_count(conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "local_files": len(local_files),
            "local_file_details": local_files,
            "gemini_store": store_info,
            "gemini_files_count": files_count,
            "service_status": gemini_search.get_status()
        }
        
    except Exception as e:
        logger.error(f"❌ Debug error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= ASYNC UPLOAD ENDPOINTS =============

@router.post("/upload/async")
async def upload_file_async(
    file: UploadFile = File(...),
    conversation_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """
    Async file upload - returns immediately with task_id
    Use /upload/status/{task_id} to track progress
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Check file size (100MB limit)
        max_size = 100 * 1024 * 1024
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 100MB")
        
        # Submit for background processing
        task_id = await async_upload_service.submit_upload(
            file_content=file_content,
            filename=file.filename,
            conversation_id=conversation_id
        )
        
        logger.info(f"📤 Async upload started for user {current_user.id}: {file.filename} -> task {task_id}")
        
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "message": "Upload started",
                "task_id": task_id,
                "status_url": f"/files/upload/status/{task_id}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error initiating async upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/status/{task_id}")
async def get_upload_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get status of async upload task"""
    task_status = async_upload_service.get_task_status(task_id)
    
    if not task_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task_status


@router.get("/upload/tasks")
async def list_upload_tasks(
    current_user: User = Depends(get_current_user)
):
    """List all upload tasks (admin only in production)"""
    return async_upload_service.get_all_tasks()


@router.get("/stats")
async def get_storage_stats(
    current_user: User = Depends(get_current_user)
):
    """Get storage statistics"""
    try:
        local_stats = file_repo.get_storage_stats()
        
        # Get Gemini stats
        gemini_search = get_gemini_file_search()
        gemini_stats = gemini_search.get_status() if gemini_search else {}
        
        return {
            "local": local_stats,
            "gemini": gemini_stats,
            "summary": {
                "total_files_tracked": local_stats.get("total_files", 0),
                "uploaded_to_gemini": local_stats.get("uploaded_to_gemini", 0),
                "local_cleaned": local_stats.get("local_cleaned", 0),
                "active_conversations": gemini_stats.get("total_conversations", 0)
            }
        }
    except Exception as e:
        logger.error(f"❌ Error getting storage stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
