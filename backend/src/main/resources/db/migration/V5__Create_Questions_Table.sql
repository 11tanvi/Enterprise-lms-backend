-- ==========================================
-- V5__Create_Questions_Table.sql
-- Create questions and question_options tables
-- ==========================================

CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    question_type VARCHAR(50) NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    negative_marks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes for performance optimization on common query fields
CREATE INDEX IF NOT EXISTS idx_questions_assignment ON questions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_questions_display_order ON questions(display_order);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_display_order ON question_options(display_order);
