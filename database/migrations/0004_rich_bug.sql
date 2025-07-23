CREATE TABLE "workout_exercise_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_exercise_id" uuid,
	"set_number" integer NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"reps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workout_exercise_sets_workout_exercise_id_set_number_key" UNIQUE("workout_exercise_id","set_number"),
	CONSTRAINT "workout_exercise_sets_set_number_check" CHECK ((set_number > 0) AND (set_number <= 50)),
	CONSTRAINT "workout_exercise_sets_weight_check" CHECK ((weight > (0)::numeric) AND (weight <= (2900)::numeric)),
	CONSTRAINT "workout_exercise_sets_reps_check" CHECK ((reps > 0) AND (reps <= 2900))
);
--> statement-breakpoint
ALTER TABLE "workout_exercise_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "uses_individual_sets" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_exercise_sets" ADD CONSTRAINT "workout_exercise_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can view their own workout exercise sets" ON "workout_exercise_sets" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM workout_exercises we
   JOIN workout_sessions ws ON we.session_id = ws.id
   WHERE we.id = workout_exercise_sets.workout_exercise_id AND ws.user_id = auth.uid())));--> statement-breakpoint
CREATE POLICY "Users can insert their own workout exercise sets" ON "workout_exercise_sets" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own workout exercise sets" ON "workout_exercise_sets" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own workout exercise sets" ON "workout_exercise_sets" AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM workout_exercises we
   JOIN workout_sessions ws ON we.session_id = ws.id
   WHERE we.id = workout_exercise_sets.workout_exercise_id AND ws.user_id = auth.uid())));