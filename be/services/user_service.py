from datetime import datetime

from fastapi import Depends
from repositories.user_repository import UserRepository
import schemas


class UserService:
    def __init__(self, repository: UserRepository = Depends()):  
        self.repo = repository

    def get_user(self, user_id: int):
        return self.repo.get(user_id)

    def list_users(self):
        return self.repo.list()

    def create_user(self, user_in: schemas.UserCreate):
        return self.repo.create(user_in)

    def update_user(self, user_id: int, user_in: schemas.UserInDBBase):
        return self.repo.update(user_id, user_in)

    def delete_user(self, user_id: int):
        return self.repo.delete(user_id)

    def update_daily_streaks(self, user_id: int):
        today = datetime.utcnow()
        user = self.repo.get(user_id)
        if not user:
            return None
        last_activity = user.last_activity
        if last_activity:
            delta = today.date() - last_activity.date()
            if delta.days == 1:
                user.daily_streaks += 1
            elif delta.days > 1:
                user.daily_streaks = 0

        # Update last activity date
        user.last_activity = today
        return self.repo.update(user_id, user)
        # today = last_activity + 1 day => daily_streaks + 1

        # today > last_activity + 1 day => daily_streaks = 0

        # last_activity = today

    def get_daily_streaks(self, user_id: int) -> int:
        user = self.repo.get(user_id)
        return user.daily_streaks if user else 0
    
