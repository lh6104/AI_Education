from typing import Any, Dict
import json

from fastapi import Depends
from sqlalchemy.orm import Session
from db import get_db

from repositories.user_repository import UserRepository
from repositories.progress_repository import ProgressRepository
from repositories.quizz_repository import QuizRepository, QuizResultRepository


class StudentContextService:
    """Aggregate student-related data for personalization/tools."""

    def __init__(
        self,
        user_repo: UserRepository = Depends(),
        progress_repo: ProgressRepository = Depends(),
        db: Session = Depends(get_db),
    ) -> None:
        self.user_repo = user_repo
        self.progress_repo = progress_repo
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.quiz_result_repo = QuizResultRepository(db)

    def build_context(self, user_id: int) -> Dict[str, Any]:
        user = self.user_repo.get(user_id)

        # Progress overview
        in_progress = self.progress_repo.list_in_progress_by_user(user_id, limit=5)
        total_score = self.progress_repo.sum_total_score_by_user(user_id)
        completed_count = self.progress_repo.count_completed_by_user(user_id)

        # Quiz/Test data
        quiz_results = self.quiz_result_repo.get_latest_by_user(user_id, limit=10)
        
        # Get quiz details for each result
        quizzes_attempted = []
        for result in quiz_results:
            quiz = self.quiz_repo.get_quiz_by_id(result.quiz_id)
            if quiz:
                # Parse submitted answers if JSON
                submitted_answers = {}
                try:
                    if result.submitted_answer:
                        submitted_answers = json.loads(result.submitted_answer)
                except (json.JSONDecodeError, TypeError):
                    pass
                
                # Parse AI feedback if JSON
                ai_feedback = result.ai_feedback
                try:
                    if ai_feedback:
                        ai_feedback = json.loads(ai_feedback)
                except (json.JSONDecodeError, TypeError):
                    pass
                
                quizzes_attempted.append({
                    "quiz_id": quiz.id,
                    "quiz_name": quiz.name or "Unnamed Quiz",
                    "max_score": float(quiz.max_score or 0.0),
                    "score": float(result.score or 0.0),
                    "is_correct": result.is_correct,
                    "attempted_at": result.created_at.isoformat() if result.created_at else None,
                    "ai_feedback": ai_feedback,
                    "question_count": len(quiz.questions) if quiz.questions else 0,
                })
        
        # Get all available quizzes (for reference)
        all_quizzes = self.quiz_repo.get_all_quizzes(skip=0, limit=50)
        available_quizzes = [
            {
                "quiz_id": q.id,
                "quiz_name": q.name or "Unnamed Quiz",
                "max_score": float(q.max_score or 0.0),
                "question_count": len(q.questions) if q.questions else 0,
                "lesson_id": q.lesson_id,
            }
            for q in all_quizzes
        ]

        return {
            "user": {
                "id": user.id if user else user_id,
                "name": getattr(user, "full_name", None),
                "email": getattr(user, "email", None),
                "daily_streaks": getattr(user, "daily_streaks", 0),
            },
            "learning": {
                "completed_lessons": int(completed_count or 0),
                "total_score": int(total_score or 0),
                "in_progress": [
                    {
                        "lesson_id": p.lesson_id,
                        "progress_percent": float(p.progress_percent or 0.0),
                        "last_accessed": p.last_accessed.isoformat() if getattr(p, "last_accessed", None) else None,
                        "avg_score": float(p.avg_score or 0.0),
                    }
                    for p in (in_progress or [])
                ],
            },
            "quizzes": {
                "attempts": quizzes_attempted,
                "total_attempts": len(quiz_results),
                "available_quizzes": available_quizzes[:10],  # Limit to 10 for context size
            },
        }


