from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import Depends
import uuid
import time
from datetime import datetime

from db import get_db
from models import ChatConversation, ChatMessage

class ChatRepository:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def generate_conversation_id(self) -> str:
        """Generate a unique conversation ID"""
        return f"conv_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    def generate_message_id(self) -> str:
        """Generate a unique message ID"""
        return f"msg_{uuid.uuid4().hex[:8]}"

    def create_conversation(self, user_id: int, title: str = "New Conversation") -> ChatConversation:
        """Create a new conversation"""
        conversation = ChatConversation(
            id=self.generate_conversation_id(),
            user_id=user_id,
            title=title
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation(self, conversation_id: str) -> Optional[ChatConversation]:
        """Get a conversation by ID with messages"""
        return self.db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id
        ).first()

    def get_user_conversations(self, user_id: int) -> List[ChatConversation]:
        """Get all conversations for a user, ordered by most recent"""
        return self.db.query(ChatConversation).filter(
            ChatConversation.user_id == user_id
        ).order_by(desc(ChatConversation.updated_at)).all()

    def update_conversation_title(self, conversation_id: str, title: str) -> Optional[ChatConversation]:
        """Update conversation title"""
        conversation = self.get_conversation(conversation_id)
        if conversation:
            conversation.title = title
            conversation.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(conversation)
        return conversation

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages"""
        conversation = self.get_conversation(conversation_id)
        if conversation:
            self.db.delete(conversation)
            self.db.commit()
            return True
        return False

    def add_message(self, conversation_id: str, role: str, content: str) -> ChatMessage:
        """Add a message to a conversation"""
        message = ChatMessage(
            id=self.generate_message_id(),
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        self.db.add(message)
        
        # Update conversation's updated_at timestamp
        conversation = self.get_conversation(conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation_messages(self, conversation_id: str) -> List[ChatMessage]:
        """Get all messages for a conversation"""
        return self.db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id
        ).order_by(ChatMessage.created_at).all()

    def verify_user_owns_conversation(self, conversation_id: str, user_id: int) -> bool:
        """Verify that a user owns a conversation"""
        conversation = self.db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id
        ).first()
        return conversation is not None

