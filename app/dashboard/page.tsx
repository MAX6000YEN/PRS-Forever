import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function Dashboard() {
  const cookieStore = cookies() // ← this part is now async-compatible
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
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