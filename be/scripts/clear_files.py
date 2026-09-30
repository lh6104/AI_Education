#!/usr/bin/env python3
"""
Script to clean up all uploaded files in the system
Usage: python clear_all_files.py
"""

import os
import sys
import json
import shutil

# Add the parent directory to path to import from be
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def clear_all_files():
    """Clear all uploaded files and metadata"""
    
    upload_dir = "/be/uploads"
    
    # If running outside docker, use local path
    if not os.path.exists(upload_dir):
        upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    
    if not os.path.exists(upload_dir):
        print(f"❌ Upload directory not found: {upload_dir}")
        return
    
    try:
        # Count files before deletion
        file_count = 0
        if os.path.exists(upload_dir):
            file_count = len([f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))])
        
        print(f"📁 Found upload directory: {upload_dir}")
        print(f"📄 Files to delete: {file_count}")
        
        # Confirm deletion
        confirm = input("⚠️  Are you sure you want to delete ALL files? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Operation cancelled")
            return
        
        # Remove entire upload directory
        if os.path.exists(upload_dir):
            shutil.rmtree(upload_dir)
            print(f"🗑️  Deleted upload directory: {upload_dir}")
        
        # Recreate empty upload directory
        os.makedirs(upload_dir, exist_ok=True)
        
        # Create empty metadata file
        metadata_file = os.path.join(upload_dir, "files_metadata.json")
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump({}, f, indent=2)
        
        print("✅ All files cleared successfully!")
        print(f"📁 Recreated empty upload directory")
        print(f"📋 Reset metadata file")
        
    except Exception as e:
        print(f"❌ Error clearing files: {e}")

def show_file_stats():
    """Show current file statistics"""
    
    upload_dir = "/be/uploads"
    
    # If running outside docker, use local path
    if not os.path.exists(upload_dir):
        upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    
    if not os.path.exists(upload_dir):
        print(f"❌ Upload directory not found: {upload_dir}")
        return
    
    # Count files
    files = [f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))]
    total_files = len(files)
    
    # Calculate total size
    total_size = 0
    for filename in files:
        filepath = os.path.join(upload_dir, filename)
        total_size += os.path.getsize(filepath)
    
    # Convert bytes to MB
    total_size_mb = total_size / (1024 * 1024)
    
    print("📊 File Statistics:")
    print(f"   📁 Directory: {upload_dir}")
    print(f"   📄 Total files: {total_files}")
    print(f"   💾 Total size: {total_size_mb:.2f} MB")
    
    # Show metadata info
    metadata_file = os.path.join(upload_dir, "files_metadata.json")
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"   📋 Tracked files: {len(metadata)}")
        except Exception as e:
            print(f"   ⚠️  Error reading metadata: {e}")

if __name__ == "__main__":
    print("🧹 File Cleanup Script")
    print("=" * 30)
    
    # Show current stats
    show_file_stats()
    print()
    
    # Ask what to do
    action = input("What would you like to do? (stats/clear/exit): ").lower()
    
    if action == "stats":
        show_file_stats()
    elif action == "clear":
        clear_all_files()
    elif action == "exit":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid option. Use 'stats', 'clear', or 'exit'")