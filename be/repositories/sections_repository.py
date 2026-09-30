from typing import List, Optional

from sqlalchemy.orm import Session

from models import Section
from schemas import SectionCreate, SectionUpdate


def get_section(db: Session, section_id: int) -> Optional[Section]:
    return db.query(Section).filter(Section.id == section_id).first()


def get_section_by_name(db: Session, name: str) -> Optional[Section]:
    return db.query(Section).filter(Section.name == name).first()


def list_sections(db: Session, roadmap_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Section]:
    q = db.query(Section)
    if roadmap_id is not None:
        q = q.filter(Section.roadmap_id == roadmap_id)
    return q.order_by(Section.order.asc(), Section.id.asc()).offset(skip).limit(limit).all()


def create_section(db: Session, section_in: SectionCreate) -> Section:
    obj = Section(
        roadmap_id=section_in.roadmap_id,
        order=section_in.order or 0,
        name=section_in.name,
        estimated_duration=section_in.estimated_duration,
        general_info=section_in.general_info,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_section(db: Session, section_id: int, section_in: SectionUpdate) -> Optional[Section]:
    obj = get_section(db, section_id)
    if not obj:
        return None
    data = section_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_section(db: Session, section_id: int) -> bool:
    obj = get_section(db, section_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True