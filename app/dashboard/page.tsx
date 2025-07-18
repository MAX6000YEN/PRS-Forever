import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HamburgerMenu from '../components/HamburgerMenu'
import WorkoutInterface from '../components/WorkoutInterface'
import { dbConnection } from '@/app/db-connection'
import { muscleGroups, workoutSchedule, exercises, workoutSessions, workoutExercises } from '@/database/schema'
import { and, eq, isNull } from 'drizzle-orm'

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

  // Get user's workout schedule for today using Drizzle
  const getTodaysWorkout = await dbConnection.select({
    id: workoutSchedule.id,
    muscleGroupId: workoutSchedule.muscleGroupId,
    muscleGroupName: muscleGroups.name,
    muscleGroupIdFromTable: muscleGroups.id
  })
    .from(workoutSchedule)
    .leftJoin(
      muscleGroups,
      eq(muscleGroups.id, workoutSchedule.muscleGroupId)
    )
    .where(
      and(
        eq(workoutSchedule.userId, session.user.id),
        eq(workoutSchedule.dayOfWeek, dayOfWeek)
      )
    );

  // Check if this is explicitly a "no workout" day (has entry but no muscle groups)
  const noWorkoutEntry = await dbConnection.select({
    id: workoutSchedule.id
  })
    .from(workoutSchedule)
    .where(
      and(
        eq(workoutSchedule.userId, session.user.id),
        eq(workoutSchedule.dayOfWeek, dayOfWeek),
        isNull(workoutSchedule.muscleGroupId)
      )
    );

  const isNoWorkoutDay = noWorkoutEntry.length > 0;

  // Get exercises for today's muscle groups using Drizzle
  const muscleGroupIds = getTodaysWorkout
    .filter(entry => entry.muscleGroupId !== null)
    .map(entry => entry.muscleGroupId!);
  
  let todaysExercises: typeof exercises.$inferSelect[] = [];
  if (muscleGroupIds.length > 0) {
    todaysExercises = await dbConnection.query.exercises
      .findMany({
        where: (exercises, { eq, inArray }) => and(
          eq(exercises.userId, session.user.id),
          inArray(exercises.muscleGroupId, muscleGroupIds)
        )
      });
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
      <HamburgerMenu userEmail={userEmail} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{currentDay}</h1>
        <p className="text-lg text-gray-300">{formattedDate}</p>
      </div>

      {/* Workout Content */}
      {isNoWorkoutDay ? (
        <div className="block-bg rounded-lg p-8 text-center">
          <h2 className="text-2xl text-white mb-4">No training scheduled today!</h2>
          <p className="text-lg text-gray-300">
            It's the perfect time for optimal muscle recovery. Take care of yourself!
          </p>
        </div>
      ) : workoutData.length > 0 ? (
        <WorkoutInterface 
          workoutData={workoutData}
          userId={session.user.id}
          currentDate={today.toISOString().split('T')[0]}
        />
      ) : (
        <div className="block-bg rounded-lg p-8 text-center">
          <h2 className="text-xl text-white mb-4">No workout scheduled for today</h2>
          <p className="text-gray-300 mb-6">
            Set up your workout schedule in the Management page to get started.
          </p>
          <a 
            href="/management" 
            className="btn-primary inline-block"
          >
            Go to Management
          </a>
        </div>
      )}
    </div>
  )
}