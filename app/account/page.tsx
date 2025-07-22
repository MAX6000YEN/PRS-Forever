'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI states
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setEmail(user.email || '')
        setUsername(user.user_metadata?.username || '')
      }
      setLoading(false)
    }

    getUser()
  }, [supabase.auth])

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const updateProfile = async () => {
    if (!user) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username }
      })

      if (error) throw error
      showMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      showMessage('Error updating profile', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateEmail = async () => {
    if (!user) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({ email })
      
      if (error) throw error
      showMessage('Email update initiated! Check your new email for confirmation.')
    } catch (error) {
      console.error('Error updating email:', error)
      showMessage('Error updating email', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error')
      return
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error')
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password updated successfully!')
    } catch (error) {
      console.error('Error updating password:', error)
      showMessage('Error updating password', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    setIsExporting(true)
    try {
      const response = await fetch('/api/export-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showMessage('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      showMessage('Error exporting data', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      showMessage('Error deleting account', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Please log in to access your account settings.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
        
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-0 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-100' 
              : 'bg-red-500/20 border border-red-500/30 text-red-100'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input"
                  placeholder="Enter your username"
                />
              </div>
              <Button 
                onClick={updateProfile}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Email Card */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  placeholder="Enter your email"
                />
              </div>
              <Button 
                onClick={updateEmail}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'Updating...' : 'Update Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-white">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="glass-input"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input"
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={updatePassword}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Your Data Card */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Your data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80">
                Export all your workout data, including exercises, muscle groups, and workout history.
              </p>
              <Button 
                onClick={exportData}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Card */}
          <Card className="glass-card border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Delete account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button 
                onClick={deleteAccount}
                disabled={isDeleting}
                variant="destructive"
                className="w-full"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}