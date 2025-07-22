-- Remove the existing unique constraint on (name, user_id)
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_name_user_id_key;

-- Add a new unique constraint on (name, user_id, muscle_group_id)
-- This allows the same exercise name for different muscle groups but prevents duplicates within the same muscle group
ALTER TABLE exercises ADD CONSTRAINT exercises_name_user_id_muscle_group_id_key UNIQUE (name, user_id, muscle_group_id);