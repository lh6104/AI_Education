"""
Script to create chat-related tables in the database
"""
import sys
import os

# Add the parent directory to Python path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from models import Base
from db import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_chat_tables():
    """Create chat tables if they don't exist"""
    try:
        engine = create_engine(DATABASE_URL)
        
        # Create all tables (this will only create missing ones)
        Base.metadata.create_all(bind=engine)
        
        logger.info("Chat tables created successfully!")
        
        # Verify tables exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('chat_conversations', 'chat_messages')
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if 'chat_conversations' in tables:
                logger.info("✓ chat_conversations table exists")
            else:
                logger.error("✗ chat_conversations table not found")
                
            if 'chat_messages' in tables:
                logger.info("✓ chat_messages table exists")
            else:
                logger.error("✗ chat_messages table not found")
                
        logger.info("Database migration completed!")
        
    except Exception as e:
        logger.error(f"Error creating chat tables: {str(e)}")
        raise

if __name__ == "__main__":
    create_chat_tables()


