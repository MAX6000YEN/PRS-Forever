import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  // If user is logged in, redirect to dashboard
  if (session && !error) {
    redirect('/dashboard')
  } else {
    // If user is not logged in, redirect to login page
    redirect('/login')
  }

  return null
}
