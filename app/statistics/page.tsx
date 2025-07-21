import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatisticsInterface from '../components/StatisticsInterface'

export default async function Statistics() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Statistics</h1>
        <p className="text-lg text-gray-300">View your workout statistics and progress</p>
      </div>
      
      <StatisticsInterface userId={user.id} />
    </div>
  )
}