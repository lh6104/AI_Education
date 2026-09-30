from sqlalchemy.orm import Session
from models import FlashcardGroup, Flashcard

# ---------- FLASHCARD GROUP ----------
# def get_groups_by_user(db: Session, user_id: int):
#     return db.query(FlashcardGroup).filter(FlashcardGroup.user_id == user_id).all()

def get_group(db: Session, group_id: int):
    return db.query(FlashcardGroup).filter(FlashcardGroup.id == group_id).first()

def create_group(db: Session, group_data):
    group = FlashcardGroup(**group_data.dict())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

def update_group(db: Session, group: FlashcardGroup, update_data):
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(group, key, value)
    db.commit()
    db.refresh(group)
    return group

def delete_group(db: Session, group: FlashcardGroup):
    db.delete(group)
    db.commit()


# ---------- FLASHCARD ----------
def get_flashcards_by_group(db: Session, group_id: int):
    return db.query(Flashcard).filter(Flashcard.group_id == group_id).all()

def get_flashcard(db: Session, flashcard_id: int):
    return db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()

def create_flashcard(db: Session, flashcard_data):
    flashcard = Flashcard(**flashcard_data.dict())
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard

def update_flashcard(db: Session, flashcard: Flashcard, update_data):
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(flashcard, key, value)
    db.commit()
    db.refresh(flashcard)
    return flashcard

def delete_flashcard(db: Session, flashcard: Flashcard):
    db.delete(flashcard)
    db.commit()


from sqlalchemy.orm import joinedload

def get_groups_by_user(db: Session, user_id: int):
    groups = (
        db.query(FlashcardGroup)
        .options(joinedload(FlashcardGroup.flashcards))  # 🔥 load luôn flashcards
        .filter(FlashcardGroup.user_id == user_id)
        .all()
    )
    return groups
