import { relations } from "drizzle-orm/relations";
import { muscleGroups, exercises, usersInAuth, workoutSchedule, workoutSessions, workoutExercises } from "./schema";

export const exercisesRelations = relations(exercises, ({one, many}) => ({
	muscleGroup: one(muscleGroups, {
		fields: [exercises.muscleGroupId],
		references: [muscleGroups.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [exercises.userId],
		references: [usersInAuth.id]
	}),
	workoutExercises: many(workoutExercises),
}));

export const muscleGroupsRelations = relations(muscleGroups, ({many}) => ({
	exercises: many(exercises),
	workoutSchedules: many(workoutSchedule),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	exercises: many(exercises),
	workoutSchedules: many(workoutSchedule),
	workoutSessions: many(workoutSessions),
}));

export const workoutScheduleRelations = relations(workoutSchedule, ({one}) => ({
	muscleGroup: one(muscleGroups, {
		fields: [workoutSchedule.muscleGroupId],
		references: [muscleGroups.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [workoutSchedule.userId],
		references: [usersInAuth.id]
	}),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [workoutSessions.userId],
		references: [usersInAuth.id]
	}),
	workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({one}) => ({
	exercise: one(exercises, {
		fields: [workoutExercises.exerciseId],
		references: [exercises.id]
	}),
	workoutSession: one(workoutSessions, {
		fields: [workoutExercises.sessionId],
		references: [workoutSessions.id]
	}),
}));