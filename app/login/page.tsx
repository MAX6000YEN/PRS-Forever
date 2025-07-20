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

    if (!currentEmail || !currentPassword) {
      setError('Please enter both email and password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })

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
              className="login-input"
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
      {/* Updated title with RPS and Forever */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-extrabold text-black mb-2" style={{ fontWeight: 800 }}>RPS</h1>
        <h3 className="text-3xl font-light text-black" style={{ fontWeight: 300 }}>Forever</h3>
      </div>

      <form className="space-y-4 w-full max-w-sm" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="login-input"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="login-input"
          autoComplete="current-password"
        />
        
        {/* Forgot password link moved below password field, right-aligned */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-black hover:text-gray-700 underline text-sm"
          >
            Forgot password
          </button>
        </div>
        
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
            className="bg-black px-4 py-2 rounded w-full hover:bg-gray-400"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  )
}