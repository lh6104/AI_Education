from db import SessionLocal
from repositories.progress_repository import ProgressRepository
from repositories.lesson_repository import LessonRepository

db = SessionLocal()
p_repo = ProgressRepository(db)
l_repo = LessonRepository(db)
print('in-progress:', p_repo.list_in_progress_by_user(1)[0].__dict__)
print('newest lessons:', l_repo.list_newest(limit=5)[0].__dict__)