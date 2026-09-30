from fastapi import Depends
from typing import List, Optional, Dict, Any
from repositories.lesson_repository import LessonRepository
from repositories.progress_repository import ProgressRepository
import schemas
from models import Lesson

# AI / parsing helpers
import json
import re
from sqlalchemy.orm import Session
from repositories import chapters_repository
from schemas import LessonCreate
from services.ai_prompts import generate_chapter_lessons_prompt, generate_lesson_content_prompt, generate_lesson_content_with_mermaid_prompt
from services.chatgpt import call_gradio_ai

import logging
import threading

logger = logging.getLogger(__name__)

# try reuse AI helpers from roadmap_service if available
try:
    from services.roadmap_service import _ai_call_groq, _extract_json  # type: ignore
except Exception:
    _ai_call_groq = None
    _extract_json = None

from services.groq_client import generate_text


# process-wide per-chapter generation locks
_generation_locks: Dict[int, threading.Lock] = {}
_generation_locks_lock = threading.Lock()


def _get_generation_lock(chapter_id: int) -> threading.Lock:
    with _generation_locks_lock:
        lock = _generation_locks.get(chapter_id)
        if lock is None:
            lock = threading.Lock()
            _generation_locks[chapter_id] = lock
        return lock


class LessonService:
    def __init__(
        self,
        lesson_repository: LessonRepository = Depends(),
        progress_repository: ProgressRepository = Depends(),
    ):
        self.lesson_repo = lesson_repository
        self.progress_repo = progress_repository

    def get_lesson(self, lesson_id: int):
        return self.lesson_repo.get(lesson_id)

    def list_lessons(self, limit: int = 100):
        return self.lesson_repo.list(limit=limit)

    def create_lesson(self, lesson_in: schemas.LessonCreate):
        return self.lesson_repo.create(lesson_in)

    def update_lesson(self, lesson_id: int, lesson_in: schemas.LessonUpdate):
        return self.lesson_repo.update(lesson_id, lesson_in)

    def delete_lesson(self, lesson_id: int):
        return self.lesson_repo.delete(lesson_id)

    def get_completed_lessons(self, user_id: int) -> int:
        return self.progress_repo.count_completed_by_user(user_id)

    def get_dashboard_lessons(self, user_id: int, limit: int = 5) -> List[dict]:
        progresses = self.progress_repo.list_in_progress_by_user(user_id)

        def build_lesson_with_progress(l: Lesson, prog_data: Optional[dict]) -> dict:
            """Build response matching LessonWithProgress schema"""
            lesson_dict = {
                "id": getattr(l, "id", None),
                "chapter_id": getattr(l, "chapter_id", None),
                "order": getattr(l, "order", 0),
                "name": getattr(l, "name", ""),
                "content": getattr(l, "content", None),
                "detail": getattr(l, "detail", None),
                "estimated_duration": getattr(l, "estimated_duration", None),
                "general_info": getattr(l, "general_info", None),
                "video_url": getattr(l, "video_url", None),
                "user_id": getattr(l, "user_id", None),
                "created_at": getattr(l, "created_at", None),
                "updated_at": getattr(l, "updated_at", None),
            }
            return {
                "lesson": lesson_dict,
                "progress": prog_data
            }

        if progresses:
            seen = []
            for p in progresses:
                if p.lesson_id not in seen:
                    seen.append(p.lesson_id)

            lessons = self.lesson_repo.get_many(seen) if seen else []
            prog_map = {p.lesson_id: p for p in progresses}

            out = []
            for l in lessons:
                p = prog_map.get(l.id)
                prog_data = None
                if p:
                    prog_data = {
                        "id": getattr(p, "id", None),
                        "user_id": getattr(p, "user_id", None),
                        "lesson_id": getattr(p, "lesson_id", None),
                        "progress_percent": float(getattr(p, "progress_percent", 0.0) or 0.0),
                        "score": float(getattr(p, "score", 0.0) or 0.0),
                        "avg_score": float(getattr(p, "avg_score", 0.0) or 0.0),
                        "streak_days": int(getattr(p, "streak_days", 0) or 0),
                        "last_accessed": getattr(p, "last_accessed", None),
                    }
                out.append(build_lesson_with_progress(l, prog_data))
            return out

        newest = self.lesson_repo.list_newest(limit=limit)
        return [build_lesson_with_progress(l, None) for l in newest]


# --- New AI-backed lesson generation helpers / service function ---


def _local_ai_call(prompt: str, model_name: Optional[str] = None) -> str:
    """
    Wrapper to call the shared Groq helper.
    """
    if _ai_call_groq:
        return _ai_call_groq(prompt, model_name=model_name)  # type: ignore
    return generate_text(prompt, model_name=model_name, json_mode=True)


def _local_extract_json(text: str) -> str:
    """
    Extract first JSON object/array from text if direct json.loads fails.
    """
    if _extract_json:
        return _extract_json(text)  # type: ignore
    m = re.search(r"(\{(?:.|\s)*\}|\[(?:.|\s)*\])", text, re.MULTILINE)
    if not m:
        raise ValueError("No JSON found in AI response")
    return m.group(1)


def _escape_raw_newlines_in_quoted_strings(s: str) -> str:
    """
    Escape raw newlines inside double-quoted strings so json.loads can accept them.
    """
    out = []
    i = 0
    n = len(s)
    while i < n:
        ch = s[i]
        if ch == '"':
            out.append(ch)
            i += 1
            buf = []
            escaped = False
            while i < n:
                c = s[i]
                if escaped:
                    buf.append(c)
                    escaped = False
                    i += 1
                    continue
                if c == "\\":
                    buf.append(c)
                    escaped = True
                    i += 1
                    continue
                if c == '"':
                    i += 1
                    break
                if c == "\n":
                    buf.append("\\n")
                elif c == "\r":
                    buf.append("\\r")
                else:
                    buf.append(c)
                i += 1
            out.append("".join(buf))
            out.append('"')
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def _extract_fenced_json(text: str) -> Optional[str]:
    """
    If AI returned a fenced block like ```json ... ``` return inner text.
    """
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```", text, re.IGNORECASE)
    if m:
        return m.group(1)
    return None


def _robust_parse_json_from_text(text: str) -> Any:
    """
    Robust JSON parser with mild auto-repair for truncated / noisy AI outputs.
    """
    if not text:
        raise ValueError("Empty AI response")

    def try_json(s: str):
        try:
            return json.loads(s)
        except Exception:
            return None

    out = try_json(text)
    if out is not None:
        return out

    fenced = _extract_fenced_json(text)
    if fenced:
        out = try_json(fenced)
        if out is not None:
            return out

    trace_markers = ("\n\nTraceback", "\nTraceback", "Traceback\n", "\nException", "Traceback (most recent call last):")
    cut_idx = None
    for m in trace_markers:
        i = text.find(m)
        if i != -1:
            cut_idx = i
            break
    candidate = text if cut_idx is None else text[:cut_idx]

    last_pos = max(candidate.rfind("}"), candidate.rfind("]"))
    if last_pos != -1:
        slice1 = candidate[: last_pos + 1]
        out = try_json(slice1)
        if out is not None:
            return out

    def find_first_block(s: str) -> Optional[str]:
        for i, ch in enumerate(s):
            if ch not in "{[":
                continue
            stack = []
            start = i
            for j in range(i, len(s)):
                c = s[j]
                if c in "{[":
                    stack.append(c)
                elif c in "]}":
                    if not stack:
                        break
                    stack.pop()
                if not stack:
                    return s[start:j+1]
        return None

    block = find_first_block(text)
    if block:
        out = try_json(block)
        if out is not None:
            return out
        try:
            repaired = _escape_raw_newlines_in_quoted_strings(block)
            out = try_json(repaired)
            if out is not None:
                return out
        except Exception:
            pass

    s = candidate
    m = re.search(r"```(?:json)?\s*(.*)", s, re.DOTALL | re.IGNORECASE)
    if m:
        s = m.group(1)

    def count_unescaped_quotes(st: str) -> int:
        cnt = 0
        i = 0
        n = len(st)
        while i < n:
            if st[i] == '"':
                back = 0
                j = i - 1
                while j >= 0 and st[j] == "\\":
                    back += 1
                    j -= 1
                if back % 2 == 0:
                    cnt += 1
            i += 1
        return cnt

    try:
        escaped = _escape_raw_newlines_in_quoted_strings(s)
        out = try_json(escaped)
        if out is not None:
            return out
        s = escaped
    except Exception:
        pass

    uq = count_unescaped_quotes(s)
    if uq % 2 == 1:
        s = s + '"'
        out = try_json(s)
        if out is not None:
            return out

    open_braces = s.count("{") - s.count("}")
    open_brackets = s.count("[") - s.count("]")
    if open_braces > 0 or open_brackets > 0:
        s2 = s + ("}" * max(0, open_braces)) + ("]" * max(0, open_brackets))
        s2 = re.sub(r",\s*(?=[}\]])", "", s2)
        out = try_json(s2)
        if out is not None:
            return out
        s = s2

    last_good = None
    mm = re.search(r'(".*?")\s*(?=[\]\}])', s, re.DOTALL)
    if mm:
        last_good = s[: mm.end(1)]
    if not last_good:
        lc = s.rfind(",")
        if lc != -1:
            last_good = s[:lc]
    if last_good:
        try:
            cleaned = last_good.rstrip() + ("]" if open_brackets > 0 else "}")
            cleaned = re.sub(r",\s*(?=[}\]])", "", cleaned)
            out = try_json(cleaned)
            if out is not None:
                return out
        except Exception:
            pass

    mild = s.replace("“", '"').replace("”", '"').replace("’", "'").replace("—", "-")
    mild = re.sub(r"[\x00-\x1f]", " ", mild)
    mild = re.sub(r",\s*(?=[}\]])", "", mild)
    if mild.count("'") > mild.count('"'):
        mild = re.sub(r"(?P<prefix>[:\s,\[{])'(?P<body>[^']*?)'(?P<suffix>[\s,\]}])", r'\1"\2"\3', mild)
    out = try_json(mild)
    if out is not None:
        return out

    if _extract_json:
        try:
            jtxt = _extract_json(text)
            return json.loads(jtxt)
        except Exception:
            logger.debug("Fallback _extract_json failed")

    logger.debug("AI raw response excerpt: %s", (text or "")[:4000])
    raise ValueError("Unable to parse JSON from AI response")


def create_or_get_lessons(db: Session, chapter_id: int, user_id: Optional[int] = None) -> List:
    """
    If the chapter already has lessons, return them.
    Otherwise call AI to generate lessons for the chapter, persist them and return.
    """
    # repository instance used for creating lessons
    lesson_repo = LessonRepository(db)

    # Acquire per-chapter lock so only one generator runs at a time
    lock = _get_generation_lock(chapter_id)
    lock.acquire()
    try:
        # Re-check inside lock — another request may have finished generation while we waited
        existing = db.query(Lesson).filter(Lesson.chapter_id == chapter_id).order_by(Lesson.order.asc(), Lesson.id.asc()).all()
        if existing:
            return existing

        # load chapter
        chapter = chapters_repository.get_chapter(db, chapter_id)
        if not chapter:
            raise ValueError("Chapter not found")

        payload = {
            "chapter_name": getattr(chapter, "name", "") or "",
            "estimated_duration": getattr(chapter, "estimated_duration", "") or "",
            "general_info_chapter": getattr(chapter, "general_info", "") or "",
        }

        prompt = generate_chapter_lessons_prompt(payload)

        try:
            ai_text = _local_ai_call(prompt)
        except Exception as e:
            raise RuntimeError(f"AI call failed: {e}") from e

        # parse JSON (use robust parser)
        try:
            parsed = _robust_parse_json_from_text(ai_text)
        except Exception as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}") from e

        if "lessons" not in parsed or not isinstance(parsed["lessons"], list):
            raise ValueError("AI JSON missing 'lessons' list")

        created = []
        for l in parsed["lessons"]:
            order = int(l.get("order", 0))
            name = l.get("lesson_name") or l.get("name") or "Untitled Lesson"
            est = l.get("estimated_duration")
            info = l.get("general_info_lesson") or None

            # Final safety check: ensure a lesson with same chapter_id + order doesn't already exist
            exists_similar = db.query(Lesson).filter(
                Lesson.chapter_id == chapter_id,
                Lesson.order == order
            ).first()
            if exists_similar:
                logger.info("Skipping creation of duplicate lesson (chapter=%s order=%s name=%s)", chapter_id, order, name)
                continue

            lesson_in = LessonCreate(
                chapter_id=chapter_id,
                order=order,
                name=name,
                estimated_duration=est,
                general_info=info,
                user_id=user_id,
            )
            created_obj = lesson_repo.create(lesson_in)
            created.append(created_obj)

        # return persisted lessons (ordered)
        return db.query(Lesson).filter(Lesson.chapter_id == chapter_id).order_by(Lesson.order.asc(), Lesson.id.asc()).all()
    finally:
        lock.release()


def update_lesson_content_with_ai(db: Session, lesson_id: int):
    """
    Generate detailed lesson content via AI and update the lesson record.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise ValueError("Lesson not found")

    # If lesson already has content/detail, return existing content (no AI call)
    has_content = bool(getattr(lesson, "content", None) and str(lesson.content).strip())
    has_detail = bool(getattr(lesson, "detail", None) and str(lesson.detail).strip())
    if has_content or has_detail:
        logger.info("Lesson %s already has content/detail — skipping AI update", lesson_id)
        return lesson

    payload = {
        "lesson_name": getattr(lesson, "name", "") or "",
        "estimated_duration": getattr(lesson, "estimated_duration", "") or "",
        "general_info_lesson": getattr(lesson, "general_info", "") or "",
    }

    #prompt = generate_lesson_content_prompt(payload)
    prompt = generate_lesson_content_with_mermaid_prompt(payload)
    try:
        ai_text = _local_ai_call(prompt)

    except Exception as e:
        logger.exception("AI call failed for lesson_id=%s", lesson_id)
        raise RuntimeError(f"AI call failed: {e}") from e

    # parse AI response (robust)
    try:
        parsed = _robust_parse_json_from_text(ai_text)
    except Exception as e:
        logger.exception("Failed to parse AI response for lesson_id=%s: %s\nAI raw response: %s", lesson_id, e, (ai_text or "")[:4000])
        raise RuntimeError("Failed to parse AI response as JSON") from e

    # Validate expected fields
    text_content = parsed.get("text_content")
    practice_questions = parsed.get("practice_questions", [])
    guidance = parsed.get("guidance", [])
    reference_materials = parsed.get("reference_materials", [])

    if text_content is None:
        logger.warning("AI response missing text_content for lesson_id=%s", lesson_id)

    # update fields
    try:
        lesson.content = text_content or lesson.content
        detail_obj = {
            "practice_questions": practice_questions,
            "guidance": guidance,
            "reference_materials": reference_materials,
        }
        lesson.detail = json.dumps(detail_obj, ensure_ascii=False)
        # optional: update estimated_duration if provided
        if parsed.get("estimated_duration"):
            lesson.estimated_duration = parsed.get("estimated_duration")
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
    except Exception as e:
        logger.exception("Failed to persist lesson update for lesson_id=%s", lesson_id)
        db.rollback()
        raise RuntimeError("Failed to update lesson in database") from e

    return lesson
