import schemas
from repositories.progress_repository import ProgressRepository
from fastapi import Depends


class ProgressService:
    def __init__(self, repository: ProgressRepository = Depends()):
        self.repo = repository

    def get_progress(self, progress_id: int):
        return self.repo.get(progress_id)

    def list_by_user(self, user_id: int):
        return self.repo.list_by_user(user_id)

    def list_by_lesson(self, lesson_id: int):
        return self.repo.list_by_lesson(lesson_id)

    def create_progress(self, progress_in: schemas.ProgressCreate):
        return self.repo.create(progress_in)

    def update_progress(self, progress_id: int, progress_in: schemas.ProgressUpdate):
        return self.repo.update(progress_id, progress_in)

    def delete_progress(self, progress_id: int):
        return self.repo.delete(progress_id)

    def sum_total_score_by_user(self, user_id: int) -> int:
        print("Calculating total score for user_id:", user_id)
        return self.repo.sum_total_score_by_user(user_id)