from fastapi import APIRouter, Depends

from dependencies import AuthDependencies
from models import User
from services.student_context_service import StudentContextService


router = APIRouter(prefix="/api/v1/students", tags=["students"])


@router.get("/me/context")
def get_my_context(
    service: StudentContextService = Depends(),
    current_user: User = Depends(AuthDependencies.get_current_active_user),
):
    """Return an aggregated, safe view of the current student's data."""
    return service.build_context(current_user.id)


