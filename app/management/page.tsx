import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ManagementInterface from '../components/ManagementInterface'

export default async function Management() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/login')
  }

  const userEmail = session.user.email!

  // Get all muscle groups
  const { data: muscleGroups } = await supabase
    .from('muscle_groups')
    .select('*')
    .order('name')

  // Get user's exercises (including hidden field)
  const { data: exercises } = await supabase
    .from('exercises')
    .select(`
      *,
      muscle_groups (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .order('name')

  // Get user's workout schedule
  const { data: workoutSchedule } = await supabase
    .from('workout_schedule')
    .select(`
      *,
      muscle_groups (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .order('day_of_week')

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Management</h1>
        <p className="text-lg text-gray-300">Manage your exercises and workout schedule</p>
      </div>

      <ManagementInterface 
        muscleGroups={muscleGroups || []}
        exercises={exercises || []}
        workoutSchedule={workoutSchedule || []}
        userId={session.user.id}
      />
    </div>
  )
}