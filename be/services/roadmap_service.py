from typing import Optional, Any, Dict, List

# align imports with project style
from sqlalchemy.orm import Session

# add missing stdlib imports
import os
import json
import re
import logging

# project imports (ensure the specific names used below are available)
from repositories import roadmap_repository, sections_repository, course_repository
from schemas import RoadmapCreate, SectionCreate, CourseCreate
import models
from .ai_prompts import generate_learning_roadmap_prompt
from .groq_client import generate_text

DEFAULT_CHAT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> str:
    json_re = re.compile(r"(\{(?:.|\s)*\}|\[(?:.|\s)*\])", re.MULTILINE)
    m = json_re.search(text)
    if not m:
        raise ValueError("No JSON object found in AI response")
    return m.group(1)


def _ai_call_groq(prompt: str, model_name: Optional[str] = None) -> str:
    """
    Call Groq and return the generated JSON text.
    """
    try:
        return generate_text(prompt, model_name=model_name or DEFAULT_CHAT_MODEL, json_mode=True)
    except Exception as e:
        raise RuntimeError(f"Groq call failed: {e}") from e


class RoadmapService:
    """
    Service instance bound to a DB session. Use self.db for all persistence.
    """

    def __init__(self, db: Session):
        self.db = db

    def generate_and_save_roadmap(
        self,
        student_json: Dict[str, Any],
        roadmap_name: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> models.Roadmap:
        """
        Build prompt, call internal GenAI, parse JSON and persist roadmap -> sections -> courses
        using repository functions and the session passed to the service (self.db).
        """
        prompt = generate_learning_roadmap_prompt(student_json)

        print(prompt)

        try:
            ai_text = _ai_call_groq(prompt)
        except Exception as ex:
            raise RuntimeError(f"AI call failed: {ex}") from ex

        # parse JSON (support raw or wrapped)
        try:
            try:
                payload = json.loads(ai_text)
            except Exception:
                json_text = _extract_json(ai_text)
                payload = json.loads(json_text)
        except Exception as ex:
            raise ValueError(f"Failed to parse AI response as JSON: {ex}") from ex

        if "sections" not in payload or not isinstance(payload["sections"], list):
            raise ValueError("AI JSON missing 'sections' list")

        try:
            name = roadmap_name or student_json.get("roadmap", {}).get("name") or f"Roadmap for {student_json.get('personal_info', {}).get('name','user')}"
            # include user_id when creating roadmap so it's associated with the creator
            roadmap_in = RoadmapCreate(
                name=name,
                time_start=student_json.get("roadmap", {}).get("time_start"),
                user_id=user_id,
            )
            roadmap = roadmap_repository.create_roadmap(self.db, roadmap_in)

            for sec in payload["sections"]:
                sec_order = int(sec.get("order", 0))
                sec_name = sec.get("section_name") or sec.get("name") or "Untitled Section"
                sec_est = sec.get("estimated_duration")
                sec_info = sec.get("general_info") or None

                section_in = SectionCreate(
                    roadmap_id=roadmap.id,
                    order=sec_order,
                    name=sec_name,
                    estimated_duration=sec_est,
                    general_info=sec_info,
                )
                section = sections_repository.create_section(self.db, section_in)

                for c in sec.get("courses", []) or []:
                    c_order = int(c.get("order", 0))
                    c_name = c.get("course_name") or c.get("name") or "Untitled Course"
                    c_est = c.get("estimated_duration")
                    c_info = c.get("general_info") or None

                    course_in = CourseCreate(
                        section_id=section.id,
                        order=c_order,
                        name=c_name,
                        estimated_duration=c_est,
                        general_info=c_info,
                    )
                    course_repository.create_course(self.db, course_in)

            # return fresh roadmap
            return roadmap_repository.get_roadmap(self.db, roadmap.id)

        except Exception:
            # let caller handle rollback / session lifecycle
            raise
    
    def list_roadmaps(self, skip: int = 0, limit: int = 100) -> List[models.Roadmap]:
        """
        Return a list of roadmaps (uses repository).
        """
        return roadmap_repository.list_roadmaps(self.db, skip=skip, limit=limit)

    def get_roadmap(self, roadmap_id: int) -> Optional[models.Roadmap]:
        """
        Return single roadmap by id (uses repository).
        """
        return roadmap_repository.get_roadmap(self.db, roadmap_id)

    def delete_roadmap(self, roadmap_id: int) -> None:
        """
        Delete a roadmap and all related content (sections, courses, chapters, lessons, progress).
        Uses direct DB operations to ensure all related rows are removed in correct order.
        Raises ValueError if roadmap not found, re-raises on DB errors.
        """
        roadmap = roadmap_repository.get_roadmap(self.db, roadmap_id)
        if not roadmap:
            raise ValueError("Roadmap not found")

        try:
            # gather related ids
            section_ids = [r[0] for r in self.db.query(models.Section.id).filter(models.Section.roadmap_id == roadmap_id).all()]
            course_ids = []
            if section_ids:
                course_ids = [r[0] for r in self.db.query(models.Course.id).filter(models.Course.section_id.in_(section_ids)).all()]
            chapter_ids = []
            if course_ids:
                chapter_ids = [r[0] for r in self.db.query(models.Chapter.id).filter(models.Chapter.course_id.in_(course_ids)).all()]
            lesson_ids = []
            if chapter_ids:
                lesson_ids = [r[0] for r in self.db.query(models.Lesson.id).filter(models.Lesson.chapter_id.in_(chapter_ids)).all()]

            # delete dependent records in safe order
            if lesson_ids:
                # delete progress related to lessons first
                self.db.query(models.Progress).filter(models.Progress.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
                # delete lessons
                self.db.query(models.Lesson).filter(models.Lesson.id.in_(lesson_ids)).delete(synchronize_session=False)

            if chapter_ids:
                self.db.query(models.Chapter).filter(models.Chapter.id.in_(chapter_ids)).delete(synchronize_session=False)

            if course_ids:
                self.db.query(models.Course).filter(models.Course.id.in_(course_ids)).delete(synchronize_session=False)

            if section_ids:
                self.db.query(models.Section).filter(models.Section.id.in_(section_ids)).delete(synchronize_session=False)

            # finally delete the roadmap record
            # prefer repository delete if available otherwise use ORM
            try:
                # try repository first if it exposes delete_roadmap(db, id)
                deleted = roadmap_repository.delete_roadmap(self.db, roadmap_id)  # type: ignore
                if deleted is None:
                    # some repo methods return None; still commit below
                    pass
            except Exception:
                # fallback to ORM delete
                self.db.delete(roadmap)

            self.db.commit()
            logger.info("Deleted roadmap %s and related content (sections=%s, courses=%s, chapters=%s, lessons=%s)", roadmap_id, len(section_ids), len(course_ids), len(chapter_ids), len(lesson_ids))
        except Exception as ex:
            logger.exception("Failed to delete roadmap %s: %s", roadmap_id, ex)
            self.db.rollback()
            raise
