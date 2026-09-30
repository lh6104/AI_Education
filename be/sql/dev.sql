BEGIN TRANSACTION;

-- Roadmap: groups many sections
DROP TABLE IF EXISTS "roadmap";
CREATE TABLE IF NOT EXISTS "roadmap" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,                                    -- added user reference
    "name" TEXT NOT NULL,
    "time_start" DATETIME,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ix_roadmap_user_id" ON "roadmap" ("user_id");

-- Sections (belongs to roadmap). Fields replaced with order/name/estimated_duration/general_info
DROP TABLE IF EXISTS "sections";
CREATE TABLE IF NOT EXISTS "sections" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "roadmap_id" INTEGER,
    "order" INTEGER DEFAULT 0,
    "name" TEXT NOT NULL,
    "estimated_duration" TEXT,
    "general_info" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("roadmap_id") REFERENCES "roadmap"("id") ON DELETE CASCADE
);

-- Courses (belongs to section). Fields replaced with order/name/estimated_duration/general_info
DROP TABLE IF EXISTS "courses";
CREATE TABLE IF NOT EXISTS "courses" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "section_id" INTEGER,
    "order" INTEGER DEFAULT 0,
    "name" TEXT NOT NULL,
    "estimated_duration" TEXT,
    "general_info" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("section_id") REFERENCES "sections"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ix_courses_section_id" ON "courses" ("section_id");

-- Chapters (belongs to course). Fields replaced with order/name/estimated_duration/general_info
DROP TABLE IF EXISTS "chapters";
CREATE TABLE IF NOT EXISTS "chapters" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "course_id" INTEGER NOT NULL,
    "order" INTEGER DEFAULT 0,
    "name" TEXT NOT NULL,
    "estimated_duration" TEXT,
    "general_info" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ix_chapters_course_id" ON "chapters" ("course_id");

-- Lessons (belongs to chapter). Keep content/detail and add order/name/estimated_duration/general_info
DROP TABLE IF EXISTS "lessons";
CREATE TABLE IF NOT EXISTS "lessons" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "chapter_id" INTEGER,
    "user_id" INTEGER,                                    -- added user reference
    "order" INTEGER DEFAULT 0,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "detail" TEXT,                 -- detailed lesson content
    "estimated_duration" TEXT,
    "general_info" TEXT,
    "video_url" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ix_lessons_chapter_id" ON "lessons" ("chapter_id");
CREATE INDEX IF NOT EXISTS "ix_lessons_user_id" ON "lessons" ("user_id");

CREATE TABLE IF NOT EXISTS "chat_conversations" (
    "id"	VARCHAR(255) NOT NULL,
    "user_id"	INTEGER NOT NULL,
    "title"	VARCHAR(255) NOT NULL,
    "created_at"	DATETIME,
    "updated_at"	DATETIME,
    PRIMARY KEY("id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "chat_histories" (
    "id"	INTEGER,
    "user_id"	INTEGER,
    "lesson_id"	INTEGER,
    "message_user"	TEXT,
    "message_ai"	TEXT,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id"	VARCHAR(255) NOT NULL,
    "conversation_id"	VARCHAR(255) NOT NULL,
    "role"	VARCHAR(20) NOT NULL,
    "content"	TEXT NOT NULL,
    "created_at"	DATETIME,
    PRIMARY KEY("id"),
    FOREIGN KEY("conversation_id") REFERENCES "chat_conversations"("id")
);

CREATE TABLE IF NOT EXISTS "flashcard_groups" (
    "id"	INTEGER,
    "user_id"	INTEGER,
    "lesson_id"	INTEGER,
    "title"	TEXT,
    "description"	TEXT,
    "is_system_created"	INTEGER DEFAULT 0,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "flashcards" (
    "id"	INTEGER,
    "group_id"	INTEGER,
    "title"	TEXT,
    "content"	TEXT,
    "example"	TEXT,
    "note"	TEXT,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("group_id") REFERENCES "flashcard_groups"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "leaderboard" (
    "id"	INTEGER,
    "user_id"	INTEGER NOT NULL,
    "total_score"	REAL DEFAULT 0.0,
    "week"	INTEGER,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- removed "modules" table per request

CREATE TABLE IF NOT EXISTS "notifications" (
    "id"	INTEGER,
    "user_id"	INTEGER,
    "title"	TEXT,
    "content"	TEXT,
    "is_read"	INTEGER DEFAULT 0,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "progress" (
    "id"	INTEGER,
    "user_id"	INTEGER NOT NULL,
    "lesson_id"	INTEGER NOT NULL,
    "progress_percent"	REAL DEFAULT 0.0,
    "avg_score"	REAL DEFAULT 0.0,
    "streak_days"	INTEGER DEFAULT 0,
    "last_accessed"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "score"	INTEGER DEFAULT 0,
    PRIMARY KEY("id"),
    FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "quiz" (
    "id"	INTEGER,
    "lesson_id"	INTEGER,
    "name"	TEXT,
    "max_score"	REAL,
    "created_at"	DATETIME DEFAULT (CURRENT_TIMESTAMP),
    "updated_at"	DATETIME DEFAULT (CURRENT_TIMESTAMP),
    "user_id"	INTEGER,
    CONSTRAINT "QUIZ_PK" PRIMARY KEY("id"),
    CONSTRAINT "FK_quiz_lessons" FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL,
    CONSTRAINT "quiz_users_FK" FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "quiz_questions" (
    "id"	INTEGER,
    "quiz_id"	INTEGER NOT NULL,
    "question"	TEXT NOT NULL,
    "options"	TEXT,
    "answer"	TEXT,
    "question_type"	TEXT NOT NULL CHECK("question_type" IN ('choice', 'essay', 'code')),
    "score"	REAL,
    "difficulty"	TEXT CHECK("difficulty" IN ('easy', 'medium', 'hard')),
    "order_index"	INTEGER DEFAULT 0,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "quiz_result" (
    "id"	INTEGER,
    "user_id"	INTEGER,
    "quiz_id"	INTEGER,
    "submitted_answer"	TEXT,
    "ai_feedback"	TEXT,
    "is_correct"	BOOLEAN,
    "score"	REAL,
    "reviewed_by"	INTEGER,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "users" (
    "id"	INTEGER,
    "full_name"	TEXT NOT NULL,
    "email"	TEXT NOT NULL UNIQUE,
    "hashed_password"	TEXT NOT NULL,
    "refresh_token_hash"	TEXT,
    "role"	TEXT NOT NULL,
    "status"	BOOLEAN NOT NULL,
    "daily_streaks"	INTEGER,
    "last_activity"	DATETIME,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "quiz_options" (
    "id"	INTEGER PRIMARY KEY AUTOINCREMENT,
    "content"	TEXT NOT NULL,
    "is_correct"	INTEGER DEFAULT 0,
    "type"	TEXT DEFAULT 'text',
    "meta"	TEXT,
    "created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ix_quiz_options_id" ON "quiz_options" ("id");
CREATE TABLE IF NOT EXISTS "quiz_question_options" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "quiz_question_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    FOREIGN KEY("quiz_question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE,
    FOREIGN KEY("option_id") REFERENCES "quiz_options"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ix_qqo_quiz_question_id" ON "quiz_question_options" ("quiz_question_id");
CREATE INDEX IF NOT EXISTS "ix_qqo_option_id" ON "quiz_question_options" ("option_id");

COMMIT;
