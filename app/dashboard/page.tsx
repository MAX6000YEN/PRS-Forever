import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkoutInterface from '../components/WorkoutInterface'
import { dbConnection } from '@/app/db-connection'
import { muscleGroups, workoutSchedule, exercises, workoutSessions, workoutExercises } from '@/database/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/login')
  }

  const userEmail = session.user.email!

  // Get current date info
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const currentDay = dayNames[dayOfWeek]
  
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Use basic select with join instead of relational query
  const getTodaysWorkout = await dbConnection
    .select({
      id: workoutSchedule.id,
      userId: workoutSchedule.userId,
      muscleGroupId: workoutSchedule.muscleGroupId,
      dayOfWeek: workoutSchedule.dayOfWeek,
      createdAt: workoutSchedule.createdAt,
      muscleGroupName: muscleGroups.name,
    })
    .from(workoutSchedule)
    .leftJoin(muscleGroups, eq(workoutSchedule.muscleGroupId, muscleGroups.id))
    .where(
      and(
        eq(workoutSchedule.userId, session.user.id),
        eq(workoutSchedule.dayOfWeek, dayOfWeek)
      )
    );

  // Check if this is explicitly a "no workout" day (has entry but no muscle groups)
  const noWorkoutEntry = getTodaysWorkout.filter(entry => entry.muscleGroupId === null);
  const isNoWorkoutDay = noWorkoutEntry.length > 0;

  // Get muscle group IDs for today's workout
  const muscleGroupIds = getTodaysWorkout
    .filter(entry => entry.muscleGroupId !== null)
    .map(entry => entry.muscleGroupId!);

  // Get exercises for today's muscle groups using basic select
  let todaysExercises: typeof exercises.$inferSelect[] = [];
  if (muscleGroupIds.length > 0) {
    todaysExercises = await dbConnection
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.userId, session.user.id),
          inArray(exercises.muscleGroupId, muscleGroupIds),
          eq(exercises.hidden, false)
        )
      );
  }

  // Get previous week's data for auto-population using Drizzle
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastWeekDate = lastWeek.toISOString().split('T')[0]
  const todayWeekDate = (new Date()).toISOString().split('T')[0]  
  const lastWeekSessionData = await dbConnection.select({
    sessionId: workoutSessions.id,
    exerciseId: workoutExercises.exerciseId,
    weight: workoutExercises.weight,
    reps: workoutExercises.reps,
    sets: workoutExercises.sets
  })
    .from(workoutSessions)
    .leftJoin(workoutExercises, eq(workoutExercises.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, session.user.id),
        eq(workoutSessions.date, lastWeekDate)
      )
    );

  const todaySessionData = await dbConnection.select({
    sessionId: workoutSessions.id,
    exerciseId: workoutExercises.exerciseId,
    weight: workoutExercises.weight,
    reps: workoutExercises.reps,
    sets: workoutExercises.sets
  })
    .from(workoutSessions)
    .leftJoin(workoutExercises, eq(workoutExercises.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, session.user.id),
        eq(workoutSessions.date, todayWeekDate)
      )
    );

  const previousData = [...lastWeekSessionData, ...todaySessionData]

  // Organize data by muscle groups
  const workoutData = getTodaysWorkout
    .filter(workout => workout.muscleGroupId !== null)
    .map(workout => {
      const muscleGroupExercises = todaysExercises.filter(ex => ex.muscleGroupId === workout.muscleGroupId) || []

      return {
        muscleGroup: workout.muscleGroupName!,
        exercises: muscleGroupExercises.map(exercise => {
          const previousExerciseData = previousData.find(data => data.exerciseId === exercise.id)
          
          return {
            id: exercise.id,
            name: exercise.name,
            description: exercise.description || undefined,
            external_link: exercise.externalLink || undefined,
            external_link_name: exercise.externalLinkName || undefined,
            previousData: !!previousExerciseData ? {
              weight: Number(previousExerciseData?.weight || 0),
              reps: previousExerciseData?.reps || 0,
              sets: previousExerciseData?.sets || 0
            } : undefined
          }
        })
      }
    });

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{currentDay}</h1>
        <p className="text-lg text-white/70">{formattedDate}</p>
      </div>

      {/* Workout Content */}
      {isNoWorkoutDay ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>No training scheduled today!</CardTitle>
            <CardDescription>
              It&apos;s the perfect time for optimal muscle recovery. Take care of yourself!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : workoutData.length > 0 ? (
        <WorkoutInterface 
          workoutData={workoutData}
          userId={session.user.id}
          currentDate={today.toISOString().split('T')[0]}
        />
      ) : (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>No workout scheduled for today</CardTitle>
            <CardDescription>
              Set up your workout schedule in the Management page to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/management">Go to Management</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}