from typing import List, Optional
import json
import re

from sqlalchemy.orm import Session

from repositories import chapters_repository, course_repository
from schemas import ChapterCreate
from .ai_prompts import generate_course_chapters_prompt

# Reuse the shared Groq caller and JSON extractor.
try:
    from .roadmap_service import _ai_call_groq, _extract_json
except Exception:
    from .groq_client import generate_text
    DEFAULT_CHAT_MODEL = "openai/gpt-oss-120b"

    def _ai_call_groq(prompt: str, model_name: Optional[str] = None) -> str:
        return generate_text(prompt, model_name=model_name or DEFAULT_CHAT_MODEL, json_mode=True)

    def _extract_json(text: str) -> str:
        m = re.search(r"(\{(?:.|\s)*\}|\[(?:.|\s)*\])", text, re.MULTILINE)
        if not m:
            raise ValueError("No JSON found in AI response")
        return m.group(1)


def create_or_get_chapters(db: Session, course_id: int) -> List:
    """
    If the course already has chapters, return them. Otherwise call AI using
    generate_course_chapters_prompt to produce chapters JSON, persist chapters
    via chapters_repository and return the created list.
    """
    # check existing
    existing = chapters_repository.list_chapters(db, course_id=course_id, skip=0, limit=1000)
    if existing:
        return existing

    # load course
    course = course_repository.get_course(db, course_id)
    if not course:
        raise ValueError("Course not found")

    course_payload = {
        "course_name": getattr(course, "name", "") or "",
        "estimated_duration": getattr(course, "estimated_duration", "") or "",
        "general_info": getattr(course, "general_info", "") or "",
    }

    prompt = generate_course_chapters_prompt(course_payload)

    # call AI
    try:
        ai_text = _ai_call_groq(prompt)
    except Exception as e:
        raise RuntimeError(f"AI call failed: {e}") from e

    # parse JSON (try direct parse then extract)
    try:
        try:
            payload = json.loads(ai_text)
        except Exception:
            json_text = _extract_json(ai_text)
            payload = json.loads(json_text)
    except Exception as e:
        raise ValueError(f"Failed to parse AI response as JSON: {e}") from e

    if "chapters" not in payload or not isinstance(payload["chapters"], list):
        raise ValueError("AI JSON missing 'chapters' list")

    created = []
    for ch in payload["chapters"]:
        order = int(ch.get("order", 0))
        name = ch.get("chapter_name") or ch.get("name") or "Untitled Chapter"
        est = ch.get("estimated_duration")
        info = ch.get("general_info_chapter") or None

        chapter_in = ChapterCreate(
            course_id=course_id,
            order=order,
            name=name,
            estimated_duration=est,
            general_info=info,
        )
        created_obj = chapters_repository.create_chapter(db, chapter_in)
        created.append(created_obj)

    # return persisted chapters (ordered)
    return chapters_repository.list_chapters(db, course_id=course_id, skip=0, limit=1000)
