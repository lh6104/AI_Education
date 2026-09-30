from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import services.flashcard_service as service
import schemas

router = APIRouter(prefix="/api/v1/flashcards", tags=["Flashcards"])

# ---------- FLASHCARD GROUP ----------
@router.get("/groups/{user_id}", response_model=list[schemas.FlashcardGroupResponse])
def list_groups(user_id: int, db: Session = Depends(get_db)):
    return service.list_groups(db, user_id)

@router.post("/groups", response_model=schemas.FlashcardGroupResponse)
def create_group(group_data: schemas.FlashcardGroupCreate, db: Session = Depends(get_db)):
    return service.create_group(db, group_data)

@router.put("/groups/{group_id}", response_model=schemas.FlashcardGroupResponse)
def update_group(group_id: int, update_data: schemas.FlashcardGroupUpdate, db: Session = Depends(get_db)):
    group = service.update_group(db, group_id, update_data)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    ok = service.delete_group(db, group_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Deleted successfully"}


# ---------- FLASHCARD ----------
@router.get("/{group_id}", response_model=list[schemas.FlashcardResponse])
def list_flashcards(group_id: int, db: Session = Depends(get_db)):
    return service.list_flashcards(db, group_id)

@router.post("/", response_model=schemas.FlashcardResponse)
def create_flashcard(flashcard_data: schemas.FlashcardCreate, db: Session = Depends(get_db)):
    return service.create_flashcard(db, flashcard_data)

@router.put("/{flashcard_id}", response_model=schemas.FlashcardResponse)
def update_flashcard(flashcard_id: int, update_data: schemas.FlashcardUpdate, db: Session = Depends(get_db)):
    flashcard = service.update_flashcard(db, flashcard_id, update_data)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return flashcard

@router.delete("/{flashcard_id}")
def delete_flashcard(flashcard_id: int, db: Session = Depends(get_db)):
    ok = service.delete_flashcard(db, flashcard_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return {"message": "Deleted successfully"}
