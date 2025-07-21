import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user && !error) {
    redirect('/dashboard')
  } else {
    // If user is not logged in, redirect to login page
    redirect('/login')
  }

  return null
}
