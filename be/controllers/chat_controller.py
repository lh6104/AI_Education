from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from models import ChatRequest, ChatResponse, ConversationSummary, ConversationDetail, User
from pydantic import BaseModel
from dependencies import AuthDependencies
from services.chat_service import ChatService

# Request models
class UpdateTitleRequest(BaseModel):
    title: str

# Create router
router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """Send a message to the chatbot and get a response"""
    try:
        return chat_service.generate_chat_response(
            message=request.message,
            conversation_id=request.conversation_id,
            user_id=current_user.id,
            use_rag=request.use_rag,
            use_student_context=request.use_student_context,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """List all conversations for the current user"""
    try:
        conversations = chat_service.get_user_conversations(current_user.id)
        
        return [
            ConversationSummary(
                id=conv["id"],
                title=conv.get("title", "New Conversation"),
                last_message=conv.get("last_message", ""),
                updated_at=conv.get("updated_at", datetime.now()),
                message_count=conv.get("message_count", 0)
            )
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversations: {str(e)}"
        )

@router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """Get a specific conversation by ID"""
    try:
        conversation = chat_service.get_conversation(conversation_id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if this conversation belongs to this user
        if conversation.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
        
        return ConversationDetail(
            id=conversation["id"],
            title=conversation["title"],
            messages=[
                {
                    "id": msg["id"],
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": msg["timestamp"],
                } for msg in conversation["messages"]
            ],
            created_at=conversation["created_at"],
            updated_at=conversation["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation: {str(e)}"
        )

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """Delete a conversation"""
    try:
        result = chat_service.delete_conversation(conversation_id, current_user.id)
        
        if result:
            return {"message": "Conversation deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete conversation"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting conversation: {str(e)}"
        )

@router.post("/conversation")
async def create_conversation(
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """Create a new conversation"""
    try:
        conversation = chat_service.create_conversation(current_user.id)
        return {
            "conversation_id": conversation["id"],
            "message": "Conversation created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating conversation: {str(e)}"
        )

@router.put("/conversation/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: UpdateTitleRequest,
    chat_service: ChatService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user)
):
    """Update conversation title"""
    try:
        result = chat_service.update_conversation_title(
            conversation_id, current_user.id, request.title
        )
        
        if result:
            return {"message": "Title updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update title"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating title: {str(e)}"
        )