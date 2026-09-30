from fastapi import Depends
from repositories.leaderboard_repository import LeaderboardRepository


class LeaderboardService:
    def __init__(self, repo: LeaderboardRepository = Depends()):
        # repository expects a Session, so construct it here
        self.repo = repo

    def get_ranking(self, week: int, user_id: int, limit: int = 5):
        top = self.repo.get_top_by_week(week, limit=limit)
        top_list = [
            {
                "user_id": leaderboard.user_id,
                "full_name": full_name,
                "total_score": float(getattr(leaderboard, "total_score", 0.0) or 0.0)
            }
            for leaderboard, full_name in top
        ]

        user_info = self.repo.get_user_position(week, user_id)
        if user_info is None:
            user_position = None
            user_score = None
            user_full_name = None
        else:
            user_position, user_score, user_full_name = user_info

        return {
            "week": week,
            "top": top_list,
            "user": {
                "user_id": user_id,
                "full_name": user_full_name,
                "position": user_position,
                "total_score": user_score
            },
        }
