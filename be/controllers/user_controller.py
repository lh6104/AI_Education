from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

import schemas
from services.user_service import UserService
from models import User
from dependencies import AuthDependencies

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user_in: schemas.UserCreate, service: UserService = Depends()):
    obj = service.create_user(user_in)
    return obj


@router.get("/me", response_model=schemas.User)
def read_user(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: UserService = Depends(),
):
    obj = service.get_user(int(getattr(current_user, "id", 0)))
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj


@router.get("", response_model=List[schemas.User])  # Changed from "/" to ""
def list_users(service: UserService = Depends()):
    return service.list_users()


@router.put("/me", response_model=schemas.User)
def update_user(
    user_in: schemas.UserInDBBase,
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: UserService = Depends(),
):
    obj = service.update_user(int(getattr(current_user, "id", 0)), user_in)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: UserService = Depends(),
):
    ok = service.delete_user(int(getattr(current_user, "id", 0)))
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return None


@router.put("/me/daily_streaks", response_model=schemas.User)
def update_daily_streaks(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: UserService = Depends(),
):
    obj = service.update_daily_streaks(int(getattr(current_user, "id", 0)))
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj


@router.get("/me/daily_streaks", response_model=int)
def get_daily_streaks(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: UserService = Depends(),
):
    streaks = service.get_daily_streaks(int(getattr(current_user, "id", 0)))
    return streaks
