'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const supabase = createClient()

  // Fix for Firefox autofill detection
  useEffect(() => {
    const handleFormChange = () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
      
      if (emailInput && emailInput.value !== email) {
        setEmail(emailInput.value)
      }
      if (passwordInput && passwordInput.value !== password) {
        setPassword(passwordInput.value)
      }
    }

    // Check for autofilled values periodically
    const interval = setInterval(handleFormChange, 100)
    
    // Also check on focus events
    document.addEventListener('focusin', handleFormChange)
    document.addEventListener('change', handleFormChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('focusin', handleFormChange)
      document.removeEventListener('change', handleFormChange)
    }
  }, [email, password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Get current values from DOM to ensure we have autofilled values
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    
    const currentEmail = emailInput?.value || email
    const currentPassword = passwordInput?.value || password

    console.log('📤 Login attempt with:', { email: currentEmail, password: currentPassword })

    if (!currentEmail || !currentPassword) {
      setError('Please enter both email and password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
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

    // Get current values from DOM
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    
    const currentEmail = emailInput?.value || email
    const currentPassword = passwordInput?.value || password

    if (!currentEmail || !currentPassword) {
      setError('Please enter both email and password')
      return
    }

    const { error } = await supabase.auth.signUp({
      email: currentEmail,
      password: currentPassword,
    })

    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/dashboard'
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const currentEmail = emailInput?.value || email

    if (!currentEmail) {
      setError('Please enter your email address')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(currentEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setResetEmailSent(true)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        
        {resetEmailSent ? (
          <div className="text-center space-y-4 w-full max-w-sm">
            <p className="text-green-600">
              Password reset email sent! Check your inbox and follow the instructions.
            </p>
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="space-y-4 w-full max-w-sm" onSubmit={handleForgotPassword}>
            <p className="text-gray-600 text-sm">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
              >
                Send Reset Email
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-600 hover:text-gray-800 underline w-full"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    )
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
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          autoComplete="current-password"
        />
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800"
          >
            Log In
          </button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded w-full hover:bg-gray-400"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  )
}