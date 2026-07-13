-- ==========================================
-- V9__Remove_Submissions_Unique_Constraint.sql
-- Drop the database-level unique constraint on (assignment_id, student_id)
-- to allow students to submit multiple attempts.
-- ==========================================

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS uq_assignment_student;
