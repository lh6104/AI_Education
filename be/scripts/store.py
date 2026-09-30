#!/usr/bin/env python3
"""Inspect files used by the local conversation-file search service."""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from repositories.file_repository import FileRepository


def check_file_search_stores() -> bool:
    """Show locally stored files grouped by conversation."""
    repository = FileRepository()
    files = repository.get_all_files()
    conversations = {}
    for file_info in files:
        conversations.setdefault(file_info.get("conversation_id", "unknown"), []).append(file_info)

    if not conversations:
        print("No local conversation files found")
        return True

    for conversation_id, conversation_files in conversations.items():
        print(f"Conversation {conversation_id}: {len(conversation_files)} file(s)")
        for file_info in conversation_files:
            print(f"  - {file_info.get('original_filename', 'unnamed')}")
    return True


if __name__ == "__main__":
    check_file_search_stores()
