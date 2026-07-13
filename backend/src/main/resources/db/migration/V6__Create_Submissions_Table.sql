-- ==========================================
-- V6__Create_Submissions_Table.sql
-- Create submissions and student_answers tables
-- ==========================================

CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    total_marks INTEGER,
    obtained_marks INTEGER,
    percentage DECIMAL(5,2),
    time_taken_minutes INTEGER,
    is_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_answers (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id BIGINT REFERENCES question_options(id) ON DELETE SET NULL,
    answer_text TEXT,
    uploaded_file_url VARCHAR(512),
    obtained_marks INTEGER,
    teacher_feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Indexes for performance optimization on common query fields
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_student_answers_submission ON student_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question ON student_answers(question_id);
