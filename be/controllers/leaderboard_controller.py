from fastapi import APIRouter, Depends, Query
from services.leaderboard_service import LeaderboardService
from models import User
from dependencies import AuthDependencies

router = APIRouter(prefix="/api/v1/ranking", tags=["ranking"])


@router.get("")  # Changed from "/" to "" to avoid 307 redirect
def get_ranking(
    week: int = Query(..., description="ISO week number"),
    limit: int = Query(5),
    current_user: User = Depends(AuthDependencies.get_current_user),
    leaderboard_service: LeaderboardService = Depends(),
):
    user_id = int(getattr(current_user, "id", 0))
    result = leaderboard_service.get_ranking(week=week, user_id=user_id, limit=limit)
    if not result:
        return {"message": "No ranking data found"}
    return result