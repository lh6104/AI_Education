from fastapi import Depends
from sqlalchemy.orm import Session
from db import get_db
from models import Leaderboard, User
from typing import List, Optional, Tuple


class LeaderboardRepository:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_top_by_week(self, week: int, limit: int = 5):
        """Get top users for a week with their full names."""
        return (
            self.db.query(Leaderboard, User.full_name)
            .join(User, Leaderboard.user_id == User.id)
            .filter(Leaderboard.week == week)
            .order_by(Leaderboard.total_score.desc())
            .limit(limit)
            .all()
        )

    def get_user_position(self, week: int, user_id: int) -> Optional[Tuple[int, float, str]]:
        """Get the user's position, score, and full name for the week."""
        # Get the user's score and name for the week
        user_row = (
            self.db.query(Leaderboard, User.full_name)
            .join(User, Leaderboard.user_id == User.id)
            .filter(Leaderboard.week == week, Leaderboard.user_id == user_id)
            .first()
        )
        if not user_row:
            return None

        leaderboard, full_name = user_row
        # Count how many have strictly greater score to determine position
        higher_count = (
            self.db.query(Leaderboard)
            .filter(Leaderboard.week == week, Leaderboard.total_score > leaderboard.total_score)
            .count()
        )
        position = higher_count + 1
        return position, float(getattr(leaderboard, "total_score", 0.0) or 0.0), full_name
