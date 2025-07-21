import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatisticsInterface from '../components/StatisticsInterface'

export default async function Statistics() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Workout Statistics
        </h1>
        <StatisticsInterface userId={session.user.id} />
      </div>
    </div>
  )
}