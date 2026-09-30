from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.quizz_repository import QuizRepository, QuizQuestionRepository, QuizResultRepository
from schemas import (
    QuizCreate, QuizUpdate, QuizResponse,
    QuizQuestionCreate, QuizQuestionUpdate, QuizQuestionResponse,
    QuizResultCreate, QuizResultUpdate, QuizResultResponse
)
from fastapi import HTTPException, status
import json
import re
import os
from .ai_prompts import generate_quiz_prompt, essay_bulk_prompt, essay_per_question_prompt
from .groq_client import generate_text
from datetime import datetime

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_CHAT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


class QuizService:
    """Service layer for Quiz business logic"""

    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.question_repo = QuizQuestionRepository(db)
        self.result_repo = QuizResultRepository(db)

    # -------------------------
    # Quiz Operations
    # -------------------------

    def get_quiz(self, quiz_id: int) -> QuizResponse:
        """Get quiz by ID (without attempts)"""
        quiz = self.quiz_repo.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with id {quiz_id} not found"
            )
        return QuizResponse.from_orm(quiz)

    def get_all_quizzes(self, skip: int = 0, limit: int = 100, include_attempts: bool = True) -> List[QuizResponse]:
        """Get all quizzes with pagination and optional attempt summaries"""
        quizzes = self.quiz_repo.get_all_quizzes(skip, limit)

        if include_attempts:
            # Add attempts to each quiz
            result = []
            for quiz in quizzes:
                quiz_dict = QuizResponse.from_orm(quiz).dict()
                # Get attempts for this quiz (only score and created_at for performance)
                attempts = self.result_repo.get_by_quiz(quiz.id)
                quiz_dict['attempts'] = [
                    {
                        'id': a.id,
                        'score': a.score,
                        'created_at': a.created_at
                    } for a in attempts
                ]
                result.append(QuizResponse(**quiz_dict))
            return result
        
        return [QuizResponse.from_orm(quiz) for quiz in quizzes]

    def delete_quiz(self, quiz_id: int) -> Dict[str, str]:
        """Delete quiz"""
        success = self.quiz_repo.delete_quiz(quiz_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with id {quiz_id} not found"
            )
        return {"message": "Quiz deleted successfully"}

    def call_ai_service(self, lesson: str, level: str, numMCQ: int, numEssay: int) -> Dict[str, List[Dict]]:
        if not GROQ_API_KEY:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing GROQ_API_KEY for AI generation")

        prompt = generate_quiz_prompt(lesson, level, numMCQ, numEssay)

        try:
            raw = generate_text(prompt, model_name=DEFAULT_CHAT_MODEL, json_mode=True)

            try:
                quiz_data = json.loads(raw)
            except json.JSONDecodeError:
                m = re.search(r"\{.*\}", raw, re.DOTALL)
                if m:
                    quiz_data = json.loads(m.group(0))
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to parse AI response: {raw[:500]}"
                    )

            if not isinstance(quiz_data, dict):
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI returned invalid format")

            # ensure keys exist
            quiz_data.setdefault("mcq", [])
            quiz_data.setdefault("essay", [])

            # optional post-processing: ensure options include prefix like "A. ..."
            for q in quiz_data.get("mcq", []):
                opts = q.get("options", []) or []
                normalized = []
                for idx, o in enumerate(opts):
                    o_str = str(o).strip()
                    if re.match(r'^[A-Za-z]\s*[\.\)]', o_str):
                        normalized.append(o_str)
                    else:
                        key = chr(65 + idx)
                        normalized.append(f"{key}. {o_str}")
                q["options"] = normalized

            return quiz_data
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"AI generation failed: {exc}")

    def generate_quiz_with_ai(
        self,
        lesson: str,
        level: str,
        numMCQ: int,
        numEssay: int,
        lesson_id: Optional[int] = None,
        quiz_name: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> QuizResponse:
        # Call AI service to generate quiz questions
        quiz_data = self.call_ai_service(lesson, level, numMCQ, numEssay)
        
        # Generate quiz name if not provided
        if not quiz_name:
            quiz_name = f"{lesson} - {level.capitalize()} Level"
        
        # Save quiz and questions to database
        quiz = self.quiz_repo.create_quiz_from_json(
            quiz_data=quiz_data,
            lesson_id=lesson_id,
            name=quiz_name,
            user_id=user_id
        )
        
        return QuizResponse.from_orm(quiz)

    # -------------------------
    # Submission Operations
    # -------------------------
    def submit_attempt(
        self,
        quiz_id: int,
        answers: Dict[Any, Any],
        duration_seconds: Optional[int] = None
    ) -> QuizResultResponse:
        """Validate, score and store a quiz attempt"""
        quiz = self.quiz_repo.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        # Normalize answers keys to string for storage
        norm_answers: Dict[str, Any] = {}
        for k, v in (answers or {}).items():
            norm_answers[str(k)] = v

        # Score only MCQs; essays are not auto-graded
        total_score = 0.0
        correct_count = 0
        choice_question_count = 0
        for q in quiz.questions or []:
            q_type = getattr(q, "question_type", "choice") or "choice"
            if q_type == "choice":
                choice_question_count += 1
                user_ans = norm_answers.get(str(q.id))
                if user_ans is not None and str(user_ans).strip() != "":
                    # Extract a single option key (e.g. "A") from user's answer.
                    # User may send either the key ("A") or the full option text ("A. answer")
                    user_raw = str(user_ans).strip()
                    m_user = re.match(r'^\s*([A-Za-z])[\.\)]\s*(.*)$', user_raw)
                    if m_user:
                        user_key = m_user.group(1).upper()
                    else:
                        # fallback: take first alpha char if present, else use entire uppercased string
                        user_key = (user_raw[0].upper() if user_raw and user_raw[0].isalpha() else user_raw.upper())

                    # Extract correct key from q.answer (answer column contains the correct key or text that includes key)
                    ans_raw = str(getattr(q, "answer", "") or "").strip()
                    m_ans = re.search(r'([A-Za-z])', ans_raw)
                    ans_key = m_ans.group(1).upper() if m_ans else ans_raw.upper()

                    if ans_key and user_key and ans_key == user_key:
                        total_score += float(getattr(q, "score", 1.0) or 1.0)
                        correct_count += 1
            else:
                # essay/text question: do not auto-score here
                continue

        # For essay questions: call external AI grading endpoint if any essay answers provided
        ai_feedback_obj = None
        try:
            # collect essay answers
            essay_payload: Dict[str, str] = {}
            for q in quiz.questions or []:
                q_type = getattr(q, "question_type", "choice") or "choice"
                if q_type == "essay":
                    v = norm_answers.get(str(q.id))
                    if v is not None and str(v).strip() != "":
                        essay_payload[str(q.id)] = str(v)

            if essay_payload:
                if not GROQ_API_KEY:
                    # cannot call model without key — skip grading but don't fail submission
                    print("[QuizService] skipping essay grading, GROQ_API_KEY not configured")
                else:
                    prompt = essay_bulk_prompt(essay_payload)
                    raw = generate_text(prompt, model_name=DEFAULT_CHAT_MODEL, json_mode=True)
                    try:
                        ai_feedback_obj = json.loads(raw)
                    except json.JSONDecodeError:
                        m = re.search(r"\{.*\}", raw, re.DOTALL)
                        if m:
                            try:
                                ai_feedback_obj = json.loads(m.group(0))
                            except json.JSONDecodeError:
                                ai_feedback_obj = None
                        else:
                            # fallback to per-question short responses
                            ai_feedback_obj = {}
                            for qid, ans in essay_payload.items():
                                q_prompt = essay_per_question_prompt(qid, ans)
                                ai_feedback_obj[str(qid)] = generate_text(q_prompt, model_name=DEFAULT_CHAT_MODEL).strip()
        except Exception as ex:
            # Do not fail the submission if AI grading fails — log and continue
            print(f"[QuizService] essay AI grading failed: {ex}")
            ai_feedback_obj = None

        result_create = QuizResultCreate(
            quiz_id=quiz_id,
            submitted_answer=json.dumps(norm_answers),
            score=total_score,
            is_correct=(correct_count == choice_question_count if choice_question_count > 0 else False),
            ai_feedback=(json.dumps(ai_feedback_obj) if ai_feedback_obj is not None else None),
            reviewed_by=None
        )

        saved = self.result_repo.create_result(result_create)
        return QuizResultResponse.from_orm(saved)

    def get_quiz_attempts(self, quiz_id: int) -> List[QuizResultResponse]:
        """Get all attempts/results for a specific quiz"""
        # Verify quiz exists
        quiz = self.quiz_repo.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with id {quiz_id} not found"
            )
        
        # Get results
        results = self.result_repo.get_by_quiz(quiz_id)
        return [QuizResultResponse.from_orm(r) for r in results]
