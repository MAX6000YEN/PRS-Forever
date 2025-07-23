import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { workoutSessions, workoutExercises, workoutExerciseSets } from '@/database/schema'
import { eq, and } from 'drizzle-orm'
import { dbConnection } from '@/app/db-connection'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { exerciseData, currentDate } = await request.json()

    // First, try to get existing workout session
    const existingSession = await dbConnection.select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, user.id),
          eq(workoutSessions.date, currentDate)
        )
      )
      .limit(1)

    let sessionId: string

    if (existingSession.length > 0) {
      // Use existing session
      sessionId = existingSession[0].id
    } else {
      // Create new session if it doesn't exist
      const newSession = await dbConnection.insert(workoutSessions)
        .values({
          userId: user.id,
          date: currentDate
        })
        .returning({ id: workoutSessions.id })

      sessionId = newSession[0].id
    }

    // Delete existing workout exercises for this session
    await dbConnection.delete(workoutExercises)
      .where(eq(workoutExercises.sessionId, sessionId))

    // Insert new workout exercises
    if (Object.keys(exerciseData).length > 0) {
      // Process each exercise
      for (const [exerciseId, data] of Object.entries(exerciseData) as [string, any][]) {
        // Insert the main workout exercise record
        const [insertedExercise] = await dbConnection.insert(workoutExercises)
          .values({
            sessionId: sessionId,
            exerciseId: exerciseId,
            weight: data.weight.toString(),
            reps: data.reps,
            sets: data.sets,
            usesIndividualSets: data.usesIndividualSets || false
          })
          .returning({ id: workoutExercises.id })
        
        // If using individual sets, insert each set
        if (data.usesIndividualSets && Array.isArray(data.individualSets) && data.individualSets.length > 0) {
          const setsData = data.individualSets.map((set: any, index: number) => ({
            workoutExerciseId: insertedExercise.id,
            setNumber: index + 1,
            weight: set.weight.toString(),
            reps: set.reps
          }))
          
          await dbConnection.insert(workoutExerciseSets)
            .values(setsData)
        }
      }
    }

    return NextResponse.json({ message: 'Workout saved successfully!' })
  } catch (error) {
    console.error('Error saving workout:', error)
    return NextResponse.json(
      { error: 'Error saving workout. Please try again.' },
      { status: 500 }
    )
  }
}