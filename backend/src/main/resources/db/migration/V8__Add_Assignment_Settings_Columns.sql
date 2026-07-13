-- =========================================================
-- V8__Add_Assignment_Settings_Columns.sql
-- Add missing columns to support Phase 2 Assignment Step 3 Settings
-- =========================================================

ALTER TABLE assignments
ADD COLUMN max_attempts INTEGER,
ADD COLUMN auto_submit BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN show_detailed_answers BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN enable_certificates BOOLEAN NOT NULL DEFAULT FALSE;
