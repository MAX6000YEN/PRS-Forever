import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ManagementInterface from '../components/ManagementInterface'
import { dbConnection } from '@/app/db-connection'
import { muscleGroups, exercises, workoutSchedule } from '@/database/schema'
import { eq } from 'drizzle-orm'

export default async function Management() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all muscle groups (they are shared across all users)
  const userMuscleGroups = await dbConnection
    .select()
    .from(muscleGroups)

  // Fetch exercises for the user with muscle group info
  const userExercisesRaw = await dbConnection
    .select({
      id: exercises.id,
      name: exercises.name,
      muscle_group_id: exercises.muscleGroupId,
      hidden: exercises.hidden,
      description: exercises.description,
      external_link: exercises.externalLink,
      external_link_name: exercises.externalLinkName,
      rest_time: exercises.restTime,
      muscle_groups: {
        id: muscleGroups.id,
        name: muscleGroups.name
      }
    })
    .from(exercises)
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(eq(exercises.userId, user.id))

  // Filter out exercises without muscle groups and ensure non-nullable types
  const userExercises = userExercisesRaw
    .filter(exercise => exercise.muscle_group_id && exercise.muscle_groups)
    .map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      muscle_group_id: exercise.muscle_group_id!,
      hidden: exercise.hidden,
      description: exercise.description || undefined,
      external_link: exercise.external_link || undefined,
      external_link_name: exercise.external_link_name || undefined,
      rest_time: exercise.rest_time,
      muscle_groups: {
        id: exercise.muscle_groups!.id,
        name: exercise.muscle_groups!.name
      }
    }))

  // Fetch workout schedule for the user
  const userWorkoutScheduleRaw = await dbConnection
    .select({
      id: workoutSchedule.id,
      day_of_week: workoutSchedule.dayOfWeek,
      muscle_group_id: workoutSchedule.muscleGroupId,
      muscle_groups: {
        id: muscleGroups.id,
        name: muscleGroups.name
      }
    })
    .from(workoutSchedule)
    .leftJoin(muscleGroups, eq(workoutSchedule.muscleGroupId, muscleGroups.id))
    .where(eq(workoutSchedule.userId, user.id))

  // Filter out workout schedule items without muscle groups and ensure non-nullable types
  const userWorkoutSchedule = userWorkoutScheduleRaw
    .filter(schedule => schedule.muscle_group_id && schedule.muscle_groups)
    .map(schedule => ({
      id: schedule.id,
      day_of_week: schedule.day_of_week,
      muscle_group_id: schedule.muscle_group_id!,
      muscle_groups: {
        id: schedule.muscle_groups!.id,
        name: schedule.muscle_groups!.name
      }
    }))

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Management</h1>
        <p className="text-lg text-gray-300">Manage your exercises and muscle groups</p>
      </div>
      
      <ManagementInterface 
        userId={user.id}
        muscleGroups={userMuscleGroups}
        exercises={userExercises}
        workoutSchedule={userWorkoutSchedule}
      />
    </div>
  )
}