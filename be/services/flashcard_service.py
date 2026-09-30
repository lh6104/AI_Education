from sqlalchemy.orm import Session
import repositories.flashcard_repository as repo
import schemas


# ---------- FLASHCARD GROUP ----------
def list_groups(db: Session, user_id: int):
    return repo.get_groups_by_user(db, user_id)

def create_group(db: Session, group_data: schemas.FlashcardGroupCreate):
    return repo.create_group(db, group_data)

def update_group(db: Session, group_id: int, update_data: schemas.FlashcardGroupUpdate):
    group = repo.get_group(db, group_id)
    if not group:
        return None
    return repo.update_group(db, group, update_data)

def delete_group(db: Session, group_id: int):
    group = repo.get_group(db, group_id)
    if not group:
        return False
    repo.delete_group(db, group)
    return True


# ---------- FLASHCARD ----------
def list_flashcards(db: Session, group_id: int):
    return repo.get_flashcards_by_group(db, group_id)

def create_flashcard(db: Session, flashcard_data: schemas.FlashcardCreate):
    return repo.create_flashcard(db, flashcard_data)

def update_flashcard(db: Session, flashcard_id: int, update_data: schemas.FlashcardUpdate):
    flashcard = repo.get_flashcard(db, flashcard_id)
    if not flashcard:
        return None
    return repo.update_flashcard(db, flashcard, update_data)

def delete_flashcard(db: Session, flashcard_id: int):
    flashcard = repo.get_flashcard(db, flashcard_id)
    if not flashcard:
        return False
    repo.delete_flashcard(db, flashcard)
    return True
