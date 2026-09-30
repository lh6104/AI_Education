from typing import List, Optional

from sqlalchemy.orm import Session

from models import Chapter
from schemas import ChapterCreate, ChapterUpdate


def get_chapter(db: Session, chapter_id: int) -> Optional[Chapter]:
    return db.query(Chapter).filter(Chapter.id == chapter_id).first()


def get_chapter_by_name(db: Session, name: str) -> Optional[Chapter]:
    return db.query(Chapter).filter(Chapter.name == name).first()


def list_chapters(db: Session, course_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Chapter]:
    q = db.query(Chapter)
    if course_id is not None:
        q = q.filter(Chapter.course_id == course_id)
    return q.order_by(Chapter.order.asc(), Chapter.id.asc()).offset(skip).limit(limit).all()


def create_chapter(db: Session, chapter_in: ChapterCreate) -> Chapter:
    obj = Chapter(
        course_id=chapter_in.course_id,
        order=chapter_in.order or 0,
        name=chapter_in.name,
        estimated_duration=chapter_in.estimated_duration,
        general_info=chapter_in.general_info,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_chapter(db: Session, chapter_id: int, chapter_in: ChapterUpdate) -> Optional[Chapter]:
    obj = get_chapter(db, chapter_id)
    if not obj:
        return None
    data = chapter_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_chapter(db: Session, chapter_id: int) -> bool:
    obj = get_chapter(db, chapter_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True