-- ==========================================
-- V7__Add_Teacher_To_Batches.sql
-- Add teacher_id column to batches
-- ==========================================

-- Add teacher_id column to batches
ALTER TABLE batches ADD COLUMN teacher_id BIGINT;

-- Assign a default teacher/admin for existing batches
DO $$
DECLARE
    default_teacher_id BIGINT;
BEGIN
    -- 1. Try to find a user with role 'teacher'
    SELECT id INTO default_teacher_id FROM users WHERE LOWER(role) = 'teacher' LIMIT 1;
    
    -- 2. If not found, try to find a user with role 'admin'
    IF default_teacher_id IS NULL THEN
        SELECT id INTO default_teacher_id FROM users WHERE LOWER(role) = 'admin' LIMIT 1;
    END IF;
    
    -- 3. If still not found, find any user
    IF default_teacher_id IS NULL THEN
        SELECT id INTO default_teacher_id FROM users LIMIT 1;
    END IF;
    
    -- 4. If a user exists, update existing batches
    IF default_teacher_id IS NOT NULL THEN
        UPDATE batches SET teacher_id = default_teacher_id WHERE teacher_id IS NULL;
    END IF;
END $$;

-- Add the foreign key reference
ALTER TABLE batches ADD CONSTRAINT fk_batches_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add NOT NULL constraint on teacher_id
ALTER TABLE batches ALTER COLUMN teacher_id SET NOT NULL;

-- Index for performance optimization on teacher_id
CREATE INDEX IF NOT EXISTS idx_batches_teacher ON batches(teacher_id);
