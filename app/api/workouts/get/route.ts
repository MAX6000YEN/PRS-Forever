import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { workoutSessions, workoutExercises } from '@/database/schema'
import { eq, and } from 'drizzle-orm'
import { dbConnection } from '@/app/db-connection'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Get existing workout session for the date
    const existingSession = await dbConnection.select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, user.id),
          eq(workoutSessions.date, date)
        )
      )
      .limit(1)

    if (existingSession.length === 0) {
      return NextResponse.json({ exerciseData: null })
    }

    // Get workout exercises for this session
    const exercises = await dbConnection.select()
      .from(workoutExercises)
      .where(eq(workoutExercises.sessionId, existingSession[0].id))

    // Transform the data to match the expected format
    const exerciseData: Record<string, { weight: number; reps: number; sets: number }> = {}
    
    exercises.forEach(exercise => {
      // Only process exercises with valid exerciseId
      if (exercise.exerciseId) {
        exerciseData[exercise.exerciseId] = {
          weight: parseFloat(exercise.weight),
          reps: exercise.reps,
          sets: exercise.sets
        }
      }
    })

    return NextResponse.json({ exerciseData })
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Error fetching workout. Please try again.' },
      { status: 500 }
    )
  }
}