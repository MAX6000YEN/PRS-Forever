'use client'

import { useUser } from './UserProvider'
import HamburgerMenu from './HamburgerMenu'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, username, loading } = useUser()
  const pathname = usePathname()
  
  // Don't show hamburger menu on login and reset-password pages
  const showHamburgerMenu = user && !loading && pathname !== '/login' && pathname !== '/reset-password'

  return (
    <>
      {showHamburgerMenu && (
        <HamburgerMenu userEmail={user.email || ''} userName={username} />
      )}
      {children}
    </>
  )
}