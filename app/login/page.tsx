'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Firefox autofill detection
  useEffect(() => {
    const timer = setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
      
      if (emailInput?.value) {
        setEmail(emailInput.value)
      }
      if (passwordInput?.value) {
        setPassword(passwordInput.value)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email for the confirmation link!')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetMessage('Check your email for the password reset link!')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-extrabold">RPS</CardTitle>
            <CardDescription className="text-lg font-light">Forever</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              
              {resetMessage && (
                <div className="text-green-400 text-sm text-center">{resetMessage}</div>
              )}
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsResetMode(false)}
                className="w-full"
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-extrabold">RPS</CardTitle>
          <CardDescription className="text-lg font-light">Forever</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-white/80 hover:text-white underline"
                >
                  Forgot password
                </button>
              </div>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full"
            >
              {isLogin ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}