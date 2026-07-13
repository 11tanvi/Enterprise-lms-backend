-- ==========================================
-- V3__Create_Batches_Table.sql
-- Create batches and batch_students tables
-- ==========================================

CREATE TABLE IF NOT EXISTS batches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    batch_code VARCHAR(100) NOT NULL,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uq_course_batch_name UNIQUE (course_id, name),
    CONSTRAINT uq_batch_code UNIQUE (batch_code)
);

CREATE TABLE IF NOT EXISTS batch_students (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_batch_student UNIQUE (batch_id, student_id)
);

-- Indexes for performance optimization on common query fields
CREATE INDEX IF NOT EXISTS idx_batches_course ON batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);
