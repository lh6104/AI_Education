#!/usr/bin/env python3
"""
Script to read and display all user records from the dev.db database
"""

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any


def connect_to_db(db_path: str = None) -> sqlite3.Connection:
    """Connect to the SQLite database"""
    if db_path is None:
        # Get the script directory and go up one level to find dev.db in be folder
        script_dir = os.path.dirname(os.path.abspath(__file__))
        be_dir = os.path.dirname(script_dir)
        db_path = os.path.join(be_dir, "dev.db")

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        print(f"Database path: {db_path}")
        raise


def get_all_users(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieve all user records from the database"""
    cursor = conn.cursor()

    query = """
    SELECT 
        id,
        full_name,
        email,
        role,
        status,
        daily_streaks,
        last_activity,
        created_at,
        updated_at
    FROM users
    ORDER BY id
    """

    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        # Convert rows to list of dictionaries
        users = []
        for row in rows:
            user = {
                "id": row["id"],
                "full_name": row["full_name"],
                "email": row["email"],
                "role": row["role"],
                "status": bool(row["status"]),
                "daily_streaks": row["daily_streaks"],
                "last_activity": row["last_activity"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            users.append(user)

        return users

    except sqlite3.Error as e:
        print(f"Error querying users: {e}")
        return []
    finally:
        cursor.close()


def format_datetime(dt_string: str) -> str:
    """Format datetime string for better display"""
    if not dt_string:
        return "N/A"

    try:
        # Try to parse the datetime string
        dt = datetime.fromisoformat(dt_string.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, AttributeError):
        return dt_string or "N/A"


def display_users(users: List[Dict[str, Any]]) -> None:
    """Display user records in a formatted table"""
    if not users:
        print("No users found in the database.")
        return

    print(f"\n{'=' * 120}")
    print(f"{'USER RECORDS':^120}")
    print(f"{'=' * 120}")
    print(f"Found {len(users)} user(s) in the database\n")

    # Header
    header = f"{'ID':<4} {'Name':<25} {'Email':<35} {'Role':<10} {'Status':<8} {'Streaks':<8} {'Last Activity':<20}"
    print(header)
    print("-" * len(header))

    # User rows
    for user in users:
        last_activity = format_datetime(user["last_activity"])
        status_str = "Active" if user["status"] else "Inactive"

        row = (
            f"{user['id']:<4} {user['full_name'][:24]:<25} {user['email'][:34]:<35} "
            f"{user['role']:<10} {status_str:<8} {user['daily_streaks']:<8} {last_activity:<20}"
        )
        print(row)

    print(f"\n{'=' * 120}")


def display_detailed_user(user: Dict[str, Any]) -> None:
    """Display detailed information for a single user"""
    print(f"\n{'=' * 60}")
    print(f"USER DETAILS - ID: {user['id']}")
    print(f"{'=' * 60}")
    print(f"Full Name:      {user['full_name']}")
    print(f"Email:          {user['email']}")
    print(f"Role:           {user['role']}")
    print(f"Status:         {'Active' if user['status'] else 'Inactive'}")
    print(f"Daily Streaks:  {user['daily_streaks']}")
    print(f"Last Activity:  {format_datetime(user['last_activity'])}")
    print(f"Created At:     {format_datetime(user['created_at'])}")
    print(f"Updated At:     {format_datetime(user['updated_at'])}")
    print(f"{'=' * 60}")


def main():
    """Main function to run the script"""
    print("🔍 Reading user records from dev.db...")

    try:
        # Connect to database
        conn = connect_to_db()

        # Get all users
        users = get_all_users(conn)

        # Display users in table format
        display_users(users)

        # Interactive mode - show detailed view
        if users:
            while True:
                try:
                    print(f"\nOptions:")
                    print(f"- Enter user ID (1-{len(users)}) for detailed view")
                    print(f"- Press Enter to exit")

                    choice = input("Your choice: ").strip()

                    if not choice:  # Empty input - exit
                        break

                    user_id = int(choice)
                    user = next((u for u in users if u["id"] == user_id), None)

                    if user:
                        display_detailed_user(user)
                    else:
                        print(f"❌ User with ID {user_id} not found!")

                except ValueError:
                    print("❌ Please enter a valid number!")
                except KeyboardInterrupt:
                    print("\n👋 Exiting...")
                    break

        conn.close()
        print("\n✅ Database connection closed.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")


if __name__ == "__main__":
    main()
