-- Add rest_time column to exercises table
ALTER TABLE exercises ADD COLUMN rest_time INTEGER DEFAULT 60 NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN exercises.rest_time IS 'Rest time in seconds between sets for this exercise';