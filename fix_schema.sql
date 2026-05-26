-- Fix schema mismatches
ALTER TABLE star_forumPosts ADD COLUMN isPrivate INTEGER DEFAULT 0;
ALTER TABLE star_schoolProfile ADD COLUMN lastUpdated TEXT;

-- For students, we can't easily remove NOT NULL in SQLite without recreation.
-- But we can try to rename and recreate if needed. 
-- However, let's see if the user can just ensure NIS is provided or we can try this:
-- PRAGMA ignore_check_constraints = ON; -- Not supported in D1
