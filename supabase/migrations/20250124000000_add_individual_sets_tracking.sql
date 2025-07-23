-- Add individual sets tracking table
CREATE TABLE IF NOT EXISTS workout_exercise_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    reps INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT workout_exercise_sets_set_number_check CHECK (set_number > 0 AND set_number <= 50),
    CONSTRAINT workout_exercise_sets_weight_check CHECK (weight > 0 AND weight <= 2900),
    CONSTRAINT workout_exercise_sets_reps_check CHECK (reps > 0 AND reps <= 2900),
    UNIQUE(workout_exercise_id, set_number)
);

-- Add RLS policies for workout_exercise_sets
ALTER TABLE workout_exercise_sets ENABLE ROW LEVEL SECURITY;

-- Users can view their own workout exercise sets
CREATE POLICY "Users can view their own workout exercise sets" ON workout_exercise_sets
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM workout_exercises we
            JOIN workout_sessions ws ON we.session_id = ws.id
            WHERE we.id = workout_exercise_sets.workout_exercise_id
            AND ws.user_id = auth.uid()
        )
    );

-- Users can insert their own workout exercise sets
CREATE POLICY "Users can insert their own workout exercise sets" ON workout_exercise_sets
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_exercises we
            JOIN workout_sessions ws ON we.session_id = ws.id
            WHERE we.id = workout_exercise_sets.workout_exercise_id
            AND ws.user_id = auth.uid()
        )
    );

-- Users can update their own workout exercise sets
CREATE POLICY "Users can update their own workout exercise sets" ON workout_exercise_sets
    FOR UPDATE TO public
    USING (
        EXISTS (
            SELECT 1 FROM workout_exercises we
            JOIN workout_sessions ws ON we.session_id = ws.id
            WHERE we.id = workout_exercise_sets.workout_exercise_id
            AND ws.user_id = auth.uid()
        )
    );

-- Users can delete their own workout exercise sets
CREATE POLICY "Users can delete their own workout exercise sets" ON workout_exercise_sets
    FOR DELETE TO public
    USING (
        EXISTS (
            SELECT 1 FROM workout_exercises we
            JOIN workout_sessions ws ON we.session_id = ws.id
            WHERE we.id = workout_exercise_sets.workout_exercise_id
            AND ws.user_id = auth.uid()
        )
    );

-- Add a column to workout_exercises to track if individual sets are being used
ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS uses_individual_sets BOOLEAN DEFAULT FALSE;