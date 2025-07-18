'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HamburgerMenuProps {
  userEmail: string
  userName?: string
}

export default function HamburgerMenu({ userEmail, userName }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = userName || userEmail.split('@')[0]

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 text-white"
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 mt-1 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 mt-1 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </div>
      </button>

      {/* Full Screen Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-40 flex flex-col items-center justify-center">
          <div className="text-center space-y-8">
            {/* User Info */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">{displayName}</h2>
              
              {/* Dashboard Button */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard')
                }}
                className="block w-full text-xl text-white hover:text-gray-300 transition-colors py-3 mb-4"
              >
                Dashboard
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-6">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/statistics')
                }}
                className="block w-full text-xl text-white hover:text-gray-300 transition-colors py-3"
              >
                Statistics
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/management')
                }}
                className="block w-full text-xl text-white hover:text-gray-300 transition-colors py-3"
              >
                Management
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account')
                }}
                className="block w-full text-xl text-white hover:text-gray-300 transition-colors py-3"
              >
                Account Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="block w-full text-xl text-red-400 hover:text-red-300 transition-colors py-3"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}