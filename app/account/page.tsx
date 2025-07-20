'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '../components/UserProvider'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, username, updateUsername } = useUser()
  
  // Form states
  const [localUsername, setLocalUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI states
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'email' | 'data' | 'danger'>('profile')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    setEmail(user.email || '')
    setLocalUsername(username)
  }, [user, username, router])

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsUpdating(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: localUsername }
      })

      if (error) throw error
      
      // Update the global username state
      updateUsername(localUsername)
      setSuccess('Username updated successfully!')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsUpdating(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      })

      if (error) throw error
      
      setSuccess('Email update initiated! Please check your new email for confirmation.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsUpdating(true)

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleExportData = async () => {
    clearMessages()
    setIsUpdating(true)

    try {
      // Get all user data from the database
      const [userExercises, userWorkoutSchedule, userWorkoutSessions] = await Promise.all([
        fetch('/api/user/exercises').then(res => res.json()).catch(() => []),
        fetch('/api/user/workout-schedule').then(res => res.json()).catch(() => []),
        fetch('/api/user/workout-sessions').then(res => res.json()).catch(() => [])
      ])

      const userData = {
        profile: {
          id: user!.id,
          email: user!.email,
          username: user!.user_metadata?.username,
          created_at: user!.created_at
        },
        exercises: userExercises,
        workoutSchedule: userWorkoutSchedule,
        workoutSessions: userWorkoutSessions,
        exportedAt: new Date().toISOString()
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `prs-forever-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess('Data exported successfully!')
    } catch (error: any) {
      setError('Failed to export data: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    clearMessages()
    setIsUpdating(true)

    try {
      // Call the delete account API
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      await supabase.auth.signOut()
      router.push('/login')
    } catch (error: any) {
      setError('Failed to delete account: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return (
      <div className="mobile-container">
        <div className="mobile-content flex items-center justify-center p-4">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container p-4">
      <div className="mobile-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-lg text-gray-300">Manage your account preferences</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'email', label: 'Email' },
            { key: 'password', label: 'Password' },
            { key: 'data', label: 'Data' },
            { key: 'danger', label: 'Danger Zone' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeSection === key
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="block-bg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  placeholder="Enter your username"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-primary disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Email Section */}
        {activeSection === 'email' && (
          <div className="block-bg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Email Address</h2>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Current Email</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-900 text-gray-400 border border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">New Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  placeholder="Enter new email address"
                />
              </div>
              <p className="text-sm text-gray-400">
                You&apos;ll receive a confirmation email at your new address.
              </p>
              <button
                type="submit"
                disabled={isUpdating || email === user?.email}
                className="btn-primary disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        )}

        {/* Password Section */}
        {activeSection === 'password' && (
          <div className="block-bg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Change Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                className="btn-primary disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Data Section */}
        {activeSection === 'data' && (
          <div className="block-bg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Your Data</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                Download all your workout data, including exercises, schedules, and session history.
              </p>
              <button
                onClick={handleExportData}
                disabled={isUpdating}
                className="btn-primary disabled:opacity-50"
              >
                {isUpdating ? 'Exporting...' : 'Export My Data'}
              </button>
              <p className="text-sm text-gray-400">
                Data will be downloaded as a JSON file containing all your information.
              </p>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {activeSection === 'danger' && (
          <div className="block-bg rounded-lg p-6 border-2 border-red-600">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Type "DELETE MY ACCOUNT" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-red-400 focus:outline-none"
                      placeholder="DELETE MY ACCOUNT"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isUpdating || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}