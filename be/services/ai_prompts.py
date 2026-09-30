"""
Centralized prompt templates for AI-related workflows.
Keep prompts here so you can swap strategies / pipeline later.
"""
from typing import Dict
import json

def generate_quiz_prompt(lesson: str, level: str, numMCQ: int, numEssay: int) -> str:
    return f"""
Bạn là giáo viên giỏi. Tạo đề kiểm tra Python:
- Bài học: {lesson}
- Trình độ: {level}
- {numMCQ} câu trắc nghiệm và {numEssay} câu tự luận
- Trả về **JSON chuẩn** theo cấu trúc:
{{
  "mcq": [
    {{"question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "answer": "A" }},
    ...
  ],
  "essay": [
    {{"question": "..."}}
  ]
}}
Với mỗi đáp án trong options, luôn chèn ký tự đáp án vào trước với format ví dụ "A. Câu trả lời" và answers sẽ chứa ký tự đáp án đúng.
**Chỉ trả JSON, không thêm chữ nào khác.**
""".strip()

def essay_bulk_prompt(answers: Dict[str, str]) -> str:
    prompt = (
        "Bạn là giáo viên. Đọc các câu tự luận sau và đưa ra gợi ý đáp án ngắn, chính xác cho từng câu.\n"
        "Trả về **JSON thuần** theo định dạng {\"<id>\": \"<feedback>\", ...} và không thêm chữ nào khác.\n"
    )
    for qid, ans in answers.items():
        prompt += f"{qid}: {ans}\n"
    return prompt

def essay_per_question_prompt(qid: str, answer: str) -> str:
    return (
        "Bạn là giáo viên. Đưa ra gợi ý đáp án ngắn và cụ thể cho câu tự luận sau. "
        "Trả về **chỉ** nội dung gợi ý (không JSON, không tiêu đề):\n\n"
        f"Question ID: {qid}\nAnswer: {answer}\n"
    )

def generate_learning_roadmap_prompt(student_json: Dict) -> str:
    
    student_str = json.dumps(student_json, ensure_ascii=False, indent=2)
    return (
        "Bạn là chuyên gia thiết kế roadmap học tập text-based.\n\n"
        "Thông tin học sinh (dạng JSON):\n"
        f"{student_str}\n\n"
        "Yêu cầu:\n"
        "1. Sinh các Học phần (Sections) chính cho roadmap, dựa trên mục tiêu, nền tảng, điểm mạnh/yếu, thời gian và sở thích học.\n"
        "2. Mỗi Học phần gồm 1-5 Course (Khóa học) bên trong.\n"
        "3. Đảm bảo **trình tự học logic**: học phần sau cần kiến thức từ học phần trước, khóa học trong phần cũng theo thứ tự.\n"
        "4. Thêm **thứ tự học** (order) cho Sections và Courses.\n"
        "5. Xác định **thời lượng học ước lượng** cho mỗi Section và mỗi Course (phút hoặc giờ).\n"
        "6. Thêm trường **general_info** cho mỗi Course, chứa ghi chú / mục tiêu / bối cảnh tổng quát của khóa học, phục vụ cho việc sinh tên các Chương và Bài học sau này.\n"
        "7. Trả về **chỉ JSON duy nhất**, không thêm bất kỳ lời dẫn, giải thích hay kết luận nào.\n"
        "8. JSON phải valid, với cấu trúc:\n\n"
        "{\n"
        '  "total_sections": <số lượng học phần>,\n'
        '  "sections": [\n'
        '    {\n'
        '      "order": <thứ tự học phần>,\n'
        '      "section_name": "<tên học phần>",\n'
        '      "estimated_duration": "<thời lượng học ước lượng của học phần>",\n'
        '      "courses": [\n'
        '        {\n'
        '          "order": <thứ tự khóa trong phần>,\n'
        '          "course_name": "<tên course/khóa học>",\n'
        '          "estimated_duration": "<thời lượng học ước lượng của khóa học>",\n'
        '          "general_info": "<ghi chú / bối cảnh tổng quát / mục tiêu khóa học>"\n'
        '        }\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        "LƯU Ý: Chỉ trả về đúng JSON như trên, đảm bảo các trường order là số nguyên, estimated_duration có đơn vị rõ ràng (ví dụ '10 giờ' hoặc '600 phút'), "
        "và tổng số học phần phù hợp với nội dung học sinh cung cấp. Không thêm bất kỳ văn bản nào khác."
    )

def generate_course_chapters_prompt(course: Dict) -> str:
    """
    Build a prompt asking the model to split a course into 3-6 chapters.
    Expects `course` to be a dict with keys: course_name, estimated_duration, general_info.
    """
    course_str = json.dumps(course, ensure_ascii=False, indent=2)
    return (
        "Bạn là chuyên gia thiết kế roadmap học tập text-based.\n\n"
        "Thông tin khóa học (dạng JSON):\n"
        f"{course_str}\n\n"
        "Yêu cầu:\n"
        "1. Dựa trên thông tin khóa học, sinh danh sách các **Chương (Chapters)** trong khóa học.\n"
        "2. Mỗi Chương gồm các trường:\n"
        "   - `order`: thứ tự học (1, 2, 3…)\n"
        "   - `chapter_name`: tên Chương\n"
        "   - `estimated_duration`: thời lượng học ước lượng (phút hoặc giờ), sao cho tổng thời lượng tất cả Chương = `estimated_duration` của khóa học\n"
        "   - `general_info_chapter`: thông tin chung phục vụ cho việc sinh danh sách tên Bài học tương ứng sau này\n"
        "3. Sinh từ 3–6 Chương, tùy độ dài khóa, đảm bảo thứ tự học logic.\n"
        "4. Trả về **chỉ JSON duy nhất**, không thêm bất kỳ lời dẫn hay giải thích nào.\n"
        "5. JSON phải valid, với cấu trúc:\n\n"
        "{\n"
        '  "course_name": "<tên course/khóa học>",\n'
        '  "estimated_duration": "<thời lượng học ước lượng của khóa học>",\n'
        '  "chapters": [\n'
        '    {\n'
        '      "order": 1,\n'
        '      "chapter_name": "<tên Chương>",\n'
        '      "estimated_duration": "<thời lượng học ước lượng của Chương>",\n'
        '      "general_info_chapter": "<thông tin chung dùng cho việc sinh Bài học>"\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        "LƯU Ý: Chỉ trả về đúng JSON như trên, không thêm văn bản khác."
    ).strip()

def generate_chapter_lessons_prompt(chapter: Dict) -> str:
    """
    Prompt builder to split a chapter into 3-6 lessons.
    Expects chapter dict with keys: chapter_name, estimated_duration, general_info_chapter.
    """
    chapter_str = json.dumps(chapter, ensure_ascii=False, indent=2)
    return (
        "Bạn là chuyên gia thiết kế roadmap học tập text-based.\n\n"
        "Thông tin Chương học (dạng JSON):\n"
        f"{chapter_str}\n\n"
        "Yêu cầu:\n"
        "1. Dựa trên thông tin Chương, sinh danh sách các **Bài học (Lessons)** trong Chương.\n"
        "2. Mỗi Bài học gồm các trường:\n"
        "   - `order`: thứ tự học (1, 2, 3…)\n"
        "   - `lesson_name`: tên Bài học\n"
        "   - `estimated_duration`: thời lượng học ước lượng (phút hoặc giờ), sao cho tổng thời lượng tất cả Bài học = `estimated_duration` của Chương\n"
        "   - `general_info_lesson`: thông tin chung dùng để sinh nội dung chi tiết của Bài học, đảm bảo tính mạch lạc và logic của chương trình\n"
        "3. Sinh từ 3–6 Bài học, tùy độ dài Chương, đảm bảo thứ tự học logic.\n"
        "4. Trả về **chỉ JSON duy nhất**, không thêm bất kỳ lời dẫn hay giải thích nào.\n"
        "5. JSON phải valid, với cấu trúc:\n\n"
        "{\n"
        '  "chapter_name": "<tên Chương>",\n'
        '  "estimated_duration": "<thời lượng học ước lượng của Chương>",\n'
        '  "lessons": [\n'
        '    {\n'
        '      "order": 1,\n'
        '      "lesson_name": "<Tên Bài học>",\n'
        '      "estimated_duration": "<thời lượng học ước lượng của Bài học>",\n'
        '      "general_info_lesson": "<Thông tin chung dùng để sinh nội dung bài học chi tiết>"\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        "LƯU Ý: Chỉ trả về đúng JSON như trên, không thêm văn bản khác."
    ).strip()

def generate_lesson_content_prompt(lesson: Dict) -> str:
    """
    Build a prompt asking the model to generate detailed lesson content (Markdown + optional LaTeX),
    practice questions, guidance, references, and metadata. Expects lesson dict with keys:
    lesson_name, estimated_duration, general_info_lesson.
    """
    lesson_str = json.dumps(lesson, ensure_ascii=False, indent=2)
    return (
        "Bạn là chuyên gia thiết kế roadmap học tập text-based, hỗ trợ học sinh học qua text, bài tập và hướng dẫn.\n\n"
        "Thông tin Bài học (dạng JSON):\n"
        f"{lesson_str}\n\n"
        "Yêu cầu:\n"
        "1. Dựa trên thông tin Bài học, sinh nội dung chi tiết, gồm:\n"
        "   - `text_content`: kiến thức lý thuyết chi tiết, viết Markdown, có thể dùng LaTeX cho công thức toán học.\n"
        "   - `practice_questions`: danh sách câu hỏi hoặc bài tập liên quan (chỉ đọc, không cần tương tác học sinh)\n"
        "   - `guidance`: hướng dẫn giải / đáp án cho các câu hỏi/bài tập\n"
        "   - `reference_materials`: tài liệu, link tham khảo nếu có\n"
        "   - `estimated_duration`: giữ nguyên từ thông tin đầu vào\n"
        "   - `status`: \"Chưa hoàn thành\"\n"
        "2. Nội dung phải logic, mạch lạc, liên kết với `general_info_lesson`.\n"
        "3. Trả về **chỉ JSON duy nhất**, không thêm bất kỳ lời dẫn hay giải thích nào.\n"
        "4. JSON phải valid, với cấu trúc:\n\n"
        "{\n"
        '  "lesson_name": "<Tên Bài học>",\n'
        '  "estimated_duration": "<thời lượng học ước lượng của Bài học>",\n'
        '  "text_content": "<Nội dung kiến thức Markdown + LaTeX nếu có>",\n'
        '  "practice_questions": [\n'
        '    "<Câu hỏi/bài tập 1>",\n'
        '    "<Câu hỏi/bài tập 2>",\n'
        '    "..."\n'
        '  ],\n'
        '  "guidance": [\n'
        '    "<Hướng dẫn/đáp án cho câu hỏi 1>",\n'
        '    "<Hướng dẫn/đáp án cho câu hỏi 2>",\n'
        '    "..." \n'
        '  ],\n'
        '  "reference_materials": [\n'
        '    "<Link hoặc tài liệu tham khảo 1>",\n'
        '    "..." \n'
        '  ],\n'
        '  "status": "Chưa hoàn thành"\n'
        "}\n\n"
        "LƯU Ý: Chỉ trả về đúng JSON như trên, không thêm văn bản khác. Đảm bảo JSON valid và trường `estimated_duration` giữ nguyên."
    ).strip()


# def generate_lesson_content_with_mermaid_prompt(lesson: Dict) -> str:
#     """
#     Build a prompt asking the model to generate detailed lesson content (Markdown + LaTeX + Mermaid),
#     practice questions, guidance, references, and metadata.
#     """
#     lesson_str = json.dumps(lesson, ensure_ascii=False, indent=2)
#     return (
#         "Bạn là chuyên gia thiết kế roadmap học tập text-based, hỗ trợ học sinh học qua text, bài tập, sơ đồ trực quan.\n\n"
#         "Thông tin Bài học (dạng JSON):\n"
#         f"{lesson_str}\n\n"
#         "Yêu cầu:\n"
#         "1. Dựa trên thông tin Bài học, sinh nội dung chi tiết, gồm:\n"
#         "   - `text_content`: kiến thức lý thuyết chi tiết, viết Markdown, có thể dùng LaTeX cho công thức toán học.\n"
#         "   - Nếu có thể, **tạo thêm các sơ đồ minh họa trực quan** bằng Mermaid (flowchart, sequence, graph...) để giải thích ý tưởng hoặc thuật toán.\n"
#         "   - `practice_questions`: danh sách câu hỏi hoặc bài tập liên quan (chỉ đọc, không cần tương tác học sinh)\n"
#         "   - `guidance`: hướng dẫn giải / đáp án cho các câu hỏi/bài tập\n"
#         "   - `reference_materials`: tài liệu, link tham khảo nếu có\n"
#         "   - `estimated_duration`: giữ nguyên từ thông tin đầu vào\n"
#         "   - `status`: \"Chưa hoàn thành\"\n"
#         "2. Nội dung phải logic, mạch lạc, liên kết với `general_info_lesson`.\n"
#         "3. Trả về **chỉ JSON duy nhất**, không thêm bất kỳ lời dẫn hay giải thích nào.\n"
#         "4. JSON phải valid, với cấu trúc:\n\n"
#         "{\n"
#         '  "lesson_name": "<Tên Bài học>",\n'
#         '  "estimated_duration": "<thời lượng học ước lượng của Bài học>",\n'
#         '  "text_content": "<Nội dung kiến thức Markdown + LaTeX + Mermaid nếu có>",\n'
#         '  "practice_questions": [\n'
#         '    "<Câu hỏi/bài tập 1>",\n'
#         '    "<Câu hỏi/bài tập 2>",\n'
#         '    "..."\n'
#         '  ],\n'
#         '  "guidance": [\n'
#         '    "<Hướng dẫn/đáp án cho câu hỏi 1>",\n'
#         '    "<Hướng dẫn/đáp án cho câu hỏi 2>",\n'
#         '    "..." \n'
#         '  ],\n'
#         '  "reference_materials": [\n'
#         '    "<Link hoặc tài liệu tham khảo 1>",\n'
#         '    "..." \n'
#         '  ],\n'
#         '  "status": "Chưa hoàn thành"\n'
#         "}\n\n"
#         "LƯU Ý: Chỉ trả về đúng JSON như trên, không thêm văn bản khác. "
#         "Đảm bảo JSON valid, `estimated_duration` giữ nguyên, và nếu có sơ đồ thì dùng cú pháp Mermaid chuẩn."
#     ).strip()

def generate_lesson_content_with_mermaid_prompt(lesson: Dict) -> str:
    """
    Build a prompt asking the model to generate detailed lesson content (Markdown + LaTeX + Mermaid),
    practice questions, guidance, references, and metadata.
    """
    lesson_str = json.dumps(lesson, ensure_ascii=False, indent=2)

    return (
        "Bạn là chuyên gia thiết kế bài học, hỗ trợ học sinh bằng nội dung text, bài tập và sơ đồ trực quan.\n\n"
        "Thông tin Bài học (JSON):\n"
        f"{lesson_str}\n\n"

        "YÊU CẦU NỘI DUNG:\n"
        "1. Sinh nội dung chi tiết gồm:\n"
        "   - `text_content`: kiến thức lý thuyết (Markdown), có thể dùng LaTeX.\n"
        "   - Nếu phù hợp, tạo sơ đồ bằng **Mermaid** để minh họa quy trình, kiến trúc, thuật toán...\n"
        "   - `practice_questions`: danh sách câu hỏi/bài tập\n"
        "   - `guidance`: hướng dẫn giải cho từng câu hỏi\n"
        "   - `reference_materials`: tài liệu hoặc liên kết tham khảo\n"
        "   - `estimated_duration`: giữ nguyên\n"
        "   - `status`: \"Chưa hoàn thành\"\n\n"

        "2. Nội dung phải logic, rõ ràng, liên kết với `general_info_lesson`.\n\n"

        "3. Trả về **chỉ JSON duy nhất**, không thêm văn bản ngoài JSON.\n\n"

        "4. JSON phải theo cấu trúc:\n"
        "{\n"
        '  "lesson_name": "<Tên Bài học>",\n'
        '  "estimated_duration": "<thời lượng>",\n'
        '  "text_content": "<Markdown + LaTeX + Mermaid nếu có>",\n'
        '  "practice_questions": ["<Câu hỏi 1>", "<Câu hỏi 2>", "..."],\n'
        '  "guidance": ["<Hướng dẫn 1>", "<Hướng dẫn 2>", "..."],\n'
        '  "reference_materials": ["<Tài liệu 1>", "..."],\n'
        '  "status": "Chưa hoàn thành"\n'
        "}\n\n"

        "LƯU Ý QUAN TRỌNG (TRÁNH LỖI MERMAID - Version 11.12.2):\n"
        "- Mọi sơ đồ Mermaid **phải tương thích với Mermaid version 11.12.2**.\n"
        "- Mọi block phải theo chuẩn:\n"
        "  ```mermaid\n"
        "  flowchart TD\n"
        "      A --> B\n"
        "  ```\n"
        "- Chỉ dùng các loại sơ đồ ổn định: `flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `stateDiagram`.\n"
        "- **Không dùng các tính năng experimental của Mermaid v11** (mindmap, timeline…).\n"
        "- Arrow label phải dùng dạng `A -->|label| B`.\n"
        "- Node chỉ dùng chữ, số, `_`, không dùng ký tự đặc biệt.\n"
        "- Không đặt node rỗng.\n"
        "- Không sinh cú pháp deprecated.\n"
        "- Đảm bảo sơ đồ Mermaid luôn hợp lệ, không để lỗi cú pháp dẫn tới: \"Syntax error in text (mermaid version 11.12.2)\".\n\n"
        "- Trong text_content, các ký tự xuống dòng phải được giữ nguyên nguyên gốc \\n thay vì gộp dòng."
        "Chỉ trả về JSON, không thêm giải thích."
    ).strip()

def score(lesson_content: str) -> str:
    prompt = f"""
Bạn là hệ thống đánh giá chất lượng nội dung bài học. Hãy chấm điểm theo thang 0–10.

TIÊU CHÍ & THANG ĐIỂM CHI TIẾT:

1. **Độ chính xác kiến thức (Accuracy) – 0 đến 2 điểm**
   - 2: Kiến thức chính xác, không sai sót.
   - 1: Có vài điểm chưa chính xác nhưng không nghiêm trọng.
   - 0: Nhiều thông tin sai hoặc gây hiểu lầm.

2. **Độ mạch lạc & rõ ràng (Clarity & Coherence) – 0 đến 2 điểm**
   - 2: Trình bày mạch lạc, dễ hiểu.
   - 1: Tương đối rõ ràng nhưng đôi lúc rối.
   - 0: Khó đọc, thiếu mạch lạc.

3. **Cấu trúc hợp lý (Structure) – 0 đến 2 điểm**
   - 2: Cấu trúc logic, có mở–thân–kết.
   - 1: Có bố cục nhưng chưa rõ ràng.
   - 0: Lộn xộn, thiếu tổ chức.

4. **Mức độ phù hợp mục tiêu bài học (Relevance) – 0 đến 2 điểm**
   - 2: Rất bám sát chủ đề và mục tiêu.
   - 1: Tương đối phù hợp nhưng có lan man.
   - 0: Không liên quan hoặc lệch hướng.

5. **Mức độ hữu ích cho người học (Usefulness) – 0 đến 2 điểm**
   - 2: Cung cấp thông tin hữu ích, giúp hiểu sâu/ứng dụng.
   - 1: Có hữu ích ở mức cơ bản.
   - 0: Không mang lại giá trị cho người học.

Tổng điểm tối đa = 10.

YÊU CẦU:
- Không phân tích, không giải thích, không ghi lại phân điểm từng mục.
- Chỉ trả về duy nhất 1 số (0–10), có thể là số thập phân.
- Định dạng đầu ra: chỉ 1 số. Ví dụ: 8.3

Nội dung bài học:
{lesson_content}

Trả về:
- Chỉ 1 số duy nhất.
"""
    return prompt

