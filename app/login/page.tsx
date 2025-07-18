'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log('📤 Login attempt with:', { email, password })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('📡 Supabase login response:', data, error)

    if (error) {
      setError(error.message)
    } else {
      // Force a page refresh to ensure cookies are properly set
      window.location.href = '/dashboard'
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Login or Sign Up</h1>

      <form className="space-y-4 w-full max-w-sm" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            Log In
          </button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded w-full"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  )
}