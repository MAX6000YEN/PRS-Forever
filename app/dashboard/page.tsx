import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  // 🧪 LOGS: Check what Supabase gives back
  console.log('📡 Supabase session:', session)
  console.log('🐛 Supabase error:', error)
  
  if (error) {
    console.error('❌ Supabase session error:', error.message)
    redirect('/login')
  }

  if (!session) {
    console.warn('⚠️ No session found, redirecting to login')
    redirect('/login')
  }

  const userEmail = session.user.email

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
      <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
      <p className="text-gray-600">Logged in as {userEmail}</p>
      <LogoutButton />
    </div>
  )
}