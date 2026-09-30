from typing import List, Optional

from sqlalchemy.orm import Session

import models, schemas


def get_course(db: Session, course_id: int) -> Optional[models.Course]:
    return db.query(models.Course).filter(models.Course.id == course_id).first()


def get_course_by_name(db: Session, name: str) -> Optional[models.Course]:
    return db.query(models.Course).filter(models.Course.name == name).first()


def list_courses(db: Session, skip: int = 0, limit: int = 100) -> List[models.Course]:
    return (
        db.query(models.Course)
        .order_by(models.Course.order.asc(), models.Course.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_courses_by_section(db: Session, section_id: int, skip: int = 0, limit: int = 100) -> List[models.Course]:
    return (
        db.query(models.Course)
        .filter(models.Course.section_id == section_id)
        .order_by(models.Course.order.asc(), models.Course.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_course(db: Session, course_in: schemas.CourseCreate) -> models.Course:
    obj = models.Course(
        section_id=course_in.section_id,
        order=course_in.order or 0,
        name=course_in.name,
        estimated_duration=course_in.estimated_duration,
        general_info=course_in.general_info,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_course(db: Session, course_id: int, course_in: schemas.CourseUpdate) -> Optional[models.Course]:
    obj = get_course(db, course_id)
    if not obj:
        return None
    data = course_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_course(db: Session, course_id: int) -> bool:
    obj = get_course(db, course_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True