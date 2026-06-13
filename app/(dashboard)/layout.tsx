// app/(dashboard)/layout.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from session by checking a protected route
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.status === 401) {
          router.replace('/login')
          return
        }
        // If we got here, user is authenticated - get their info from localStorage or a session endpoint
        setUser({ id: '1', email: 'admin@cure.com', name: 'Admin User', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/login')
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          {sidebarOpen && <h1 className="text-xl font-bold">CURE</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded hover:bg-gray-800 p-2"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <SidebarLink href="/dashboard" label="Overview" icon="📊" sidebarOpen={sidebarOpen} />
          <SidebarLink href="/dashboard/operations/kanban" label="Kanban" icon="📋" sidebarOpen={sidebarOpen} />
          <SidebarLink href="/dashboard/analytics" label="Analytics" icon="📈" sidebarOpen={sidebarOpen} />
          {user?.role === 'ADMIN' && (
            <SidebarLink href="/dashboard/admin/users" label="Users" icon="👥" sidebarOpen={sidebarOpen} />
          )}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded bg-red-600 px-4 py-2 text-sm hover:bg-red-700 transition"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-300 bg-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">{user?.name}</div>
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full"
              />
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  label,
  icon,
  sidebarOpen,
}: {
  href: string
  label: string
  icon: string
  sidebarOpen: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800 transition"
    >
      <span className="text-xl">{icon}</span>
      {sidebarOpen && <span>{label}</span>}
    </Link>
  )
}
