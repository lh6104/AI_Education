from typing import Optional, List

from fastapi import Depends
from db import get_db
from models import Lesson, Progress
import schemas


class LessonRepository:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def get(self, lesson_id: int) -> Optional[Lesson]:
        return self.db.query(Lesson).filter(Lesson.id == lesson_id).first()

    def list(self):
        return self.db.query(Lesson).all()

    def create(self, lesson_in: schemas.LessonCreate) -> Lesson:
        db_obj = Lesson(**lesson_in.dict())
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, lesson_id: int, lesson_in: schemas.LessonUpdate) -> Optional[Lesson]:
        obj = self.get(lesson_id)
        if not obj:
            return None
        for field, value in lesson_in.dict(exclude_unset=True).items():
            setattr(obj, field, value)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, lesson_id: int) -> bool:
        obj = self.get(lesson_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
    
    def get_many(self, ids: List[int]) -> List[Lesson]:
        if not ids:
            return []
        return self.db.query(Lesson).filter(Lesson.id.in_(ids)).all()

    def list_newest(self, limit: int = 5):
        return self.db.query(Lesson).order_by(Lesson.created_at.desc()).limit(limit).all()
    
