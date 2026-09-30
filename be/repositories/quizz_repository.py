from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from models import Quiz, QuizQuestion, QuizResult
from schemas import (
    QuizResultCreate
)
import json


class QuizRepository:
    """Repository for Quiz operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_quiz_by_id(self, quiz_id: int) -> Optional[Quiz]:
        """Get quiz by ID with questions"""
        return self.db.query(Quiz).options(
            joinedload(Quiz.questions)
        ).filter(Quiz.id == quiz_id).first()

    def get_all_quizzes(self, skip: int = 0, limit: int = 100) -> List[Quiz]:
        """Get all quizzes with pagination"""
        return self.db.query(Quiz).options(
            joinedload(Quiz.questions)
        ).offset(skip).limit(limit).all()
    
    def get_quizzes_by_user_attempts(self, user_id: int) -> List[Quiz]:
        """Get all quizzes that the user has attempted"""
        from sqlalchemy import distinct
        quiz_ids = self.db.query(distinct(QuizResult.quiz_id)).filter(
            QuizResult.user_id == user_id
        ).all()
        quiz_id_list = [qid[0] for qid in quiz_ids]
        if not quiz_id_list:
            return []
        return self.db.query(Quiz).options(
            joinedload(Quiz.questions)
        ).filter(Quiz.id.in_(quiz_id_list)).all()

    def delete_quiz(self, quiz_id: int) -> bool:
        """Delete quiz"""
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            return False
        
        self.db.delete(quiz)
        self.db.commit()
        return True
    
    def create_quiz_from_json(
        self, 
        quiz_data: Dict[str, List[Dict[str, Any]]], 
        lesson_id: Optional[int] = None,
        name: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Quiz:
        # Calculate total score based on questions
        total_mcq = len(quiz_data.get("mcq", []))
        total_essay = len(quiz_data.get("essay", []))
        max_score = (total_mcq * 10) + (total_essay * 20)  # Example scoring: MCQ=10, Essay=20
        
        # Create the Quiz object
        quiz = Quiz(
            lesson_id=lesson_id,
            name=name or f"Generated Quiz",
            max_score=max_score,
            user_id=user_id
        )
        
        self.db.add(quiz)
        self.db.flush()  # Flush to get the quiz.id
        
        order_index = 0
        
        # Add MCQ questions
        for mcq in quiz_data.get("mcq", []):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=mcq.get("question", ""),
                options=json.dumps(mcq.get("options", [])),  # Store options as JSON string
                answer=mcq.get("answer", ""),
                question_type="choice",
                score=10.0,  # Default score for MCQ
                difficulty="medium",  # You can make this dynamic
                order_index=order_index
            )
            self.db.add(question)
            order_index += 1
        
        # Add Essay questions
        for essay in quiz_data.get("essay", []):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=essay.get("question", ""),
                options=None,  # No options for essay questions
                answer=None,  # Essay questions don't have predefined answers
                question_type="essay",
                score=20.0,  # Default score for Essay
                difficulty="medium",  # You can make this dynamic
                order_index=order_index
            )
            self.db.add(question)
            order_index += 1
        
        self.db.commit()
        self.db.refresh(quiz)
        
        return quiz


class QuizQuestionRepository:
    """Repository for QuizQuestion operations"""

    def __init__(self, db: Session):
        self.db = db

class QuizResultRepository:
    """Repository for QuizResult operations"""

    def __init__(self, db: Session):
        self.db = db

    def create_result(self, data: QuizResultCreate) -> QuizResult:
        """Persist a quiz result"""
        result = QuizResult(
            quiz_id=data.quiz_id,
            submitted_answer=data.submitted_answer,  # Match model field name
            ai_feedback=data.ai_feedback,
            is_correct=data.is_correct,
            score=data.score if data.score is not None else 0.0,
            reviewed_by=data.reviewed_by
        )
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result

    def get_by_quiz(self, quiz_id: int) -> List[QuizResult]:
        return self.db.query(QuizResult).filter(QuizResult.quiz_id == quiz_id).all()


    def get_by_user(self, user_id: int, limit: Optional[int] = None) -> List[QuizResult]:
        """Get all quiz results for a user, ordered by most recent"""
        query = (
            self.db.query(QuizResult)
            .join(Quiz, QuizResult.quiz_id == Quiz.id)
            .filter(Quiz.user_id == user_id)
            .order_by(QuizResult.created_at.desc())
        )
        if limit:
            query = query.limit(limit)
        return query.all()


    def get_latest_by_user(self, user_id: int, limit: int = 10) -> List[QuizResult]:
        """Get latest quiz attempts for a user"""
        return self.get_by_user(user_id, limit=limit)
