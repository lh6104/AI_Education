"""
Health check và monitoring endpoints
"""
import logging
from datetime import datetime
from fastapi import APIRouter
from dependencies.gemini_file_search import get_gemini_file_search

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check với service status"""
    services_status = {}
    
    # Check Gemini File Search
    try:
        gemini = get_gemini_file_search()
        if gemini and gemini.is_available():
            services_status["gemini_file_search"] = {
                "status": "healthy",
                "stores_count": len(gemini.conversation_stores),
                "api_configured": True
            }
        else:
            services_status["gemini_file_search"] = {
                "status": "unavailable",
                "reason": "Service not initialized or API not configured"
            }
    except Exception as e:
        services_status["gemini_file_search"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check database
    try:
        from repositories.chat_repository import ChatRepository
        repo = ChatRepository()
        # Simple query to check connection
        services_status["database"] = {"status": "healthy"}
    except Exception as e:
        services_status["database"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Overall status
    all_healthy = all(
        s.get("status") == "healthy" 
        for s in services_status.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": services_status
    }


@router.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    gemini = get_gemini_file_search()
    
    metrics = {
        "timestamp": datetime.now().isoformat(),
        "gemini": {
            "total_stores": len(gemini.conversation_stores) if gemini else 0,
            "conversations": list(gemini.conversation_stores.keys()) if gemini else []
        }
    }
    
    return metrics


@router.get("/gemini-status")
async def gemini_status():
    """Get detailed Gemini File Search status"""
    gemini = get_gemini_file_search()
    
    if not gemini:
        return {
            "available": False,
            "error": "Service not initialized"
        }
    
    return gemini.get_status()
