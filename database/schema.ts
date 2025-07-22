import { pgTable, unique, pgPolicy, uuid, varchar, timestamp, foreignKey, check, integer, date, numeric, boolean, pgSchema, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Create auth schema reference
const authSchema = pgSchema("auth");

// Auth users table (from Supabase auth schema)
export const usersInAuth = authSchema.table("users", {
	id: uuid().primaryKey().notNull(),
}, (table) => [
	// This table is managed by Supabase auth, so we only define the id field we need
]);

export const muscleGroups = pgTable("muscle_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("muscle_groups_name_key").on(table.name),
	pgPolicy("Muscle groups are viewable by everyone", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const exercises = pgTable("exercises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	muscleGroupId: uuid("muscle_group_id"),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	hidden: boolean().default(false).notNull(),
	description: varchar({ length: 300 }),
	externalLink: varchar("external_link", { length: 150 }),
	externalLinkName: varchar("external_link_name", { length: 100 }),
}, (table) => [
	foreignKey({
		columns: [table.muscleGroupId],
		foreignColumns: [muscleGroups.id],
		name: "exercises_muscle_group_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [usersInAuth.id],
		name: "exercises_user_id_fkey"
	}).onDelete("cascade"),
	unique("exercises_name_user_id_muscle_group_id_key").on(table.name, table.userId, table.muscleGroupId),
	pgPolicy("Users can delete their own exercises", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can update their own exercises", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert their own exercises", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view their own exercises", { as: "permissive", for: "select", to: ["public"] }),
]);

export const workoutSchedule = pgTable("workout_schedule", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	muscleGroupId: uuid("muscle_group_id"),
	dayOfWeek: integer("day_of_week").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.muscleGroupId],
			foreignColumns: [muscleGroups.id],
			name: "workout_schedule_muscle_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "workout_schedule_user_id_fkey"
		}).onDelete("cascade"),
	unique("workout_schedule_user_id_muscle_group_id_day_of_week_key").on(table.userId, table.muscleGroupId, table.dayOfWeek),
	pgPolicy("Users can delete their own workout schedule", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can update their own workout schedule", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert their own workout schedule", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view their own workout schedule", { as: "permissive", for: "select", to: ["public"] }),
	check("workout_schedule_day_of_week_check", sql`(day_of_week >= 0) AND (day_of_week <= 6)`),
]);

export const workoutSessions = pgTable("workout_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	date: date().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "workout_sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("workout_sessions_user_id_date_key").on(table.userId, table.date),
	pgPolicy("Users can delete their own workout sessions", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can update their own workout sessions", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert their own workout sessions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view their own workout sessions", { as: "permissive", for: "select", to: ["public"] }),
]);

export const workoutExercises = pgTable("workout_exercises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id"),
	exerciseId: uuid("exercise_id"),
	weight: numeric({ precision: 5, scale:  2 }).notNull(),
	reps: integer().notNull(),
	sets: integer().notNull(),
	totalWeight: numeric("total_weight", { precision: 8, scale:  2 }).generatedAlwaysAs(sql`((weight * (reps)::numeric) * (sets)::numeric)`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercises.id],
			name: "workout_exercises_exercise_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [workoutSessions.id],
			name: "workout_exercises_session_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete their own workout exercises", { as: "permissive", for: "delete", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM workout_sessions
  WHERE ((workout_sessions.id = workout_exercises.session_id) AND (workout_sessions.user_id = auth.uid()))))` }),
	pgPolicy("Users can update their own workout exercises", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert their own workout exercises", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view their own workout exercises", { as: "permissive", for: "select", to: ["public"] }),
	check("workout_exercises_reps_check", sql`(reps > 0) AND (reps <= 2900)`),
	check("workout_exercises_sets_check", sql`(sets > 0) AND (sets <= 2900)`),
	check("workout_exercises_weight_check", sql`(weight > (0)::numeric) AND (weight <= (2900)::numeric)`),
]);
