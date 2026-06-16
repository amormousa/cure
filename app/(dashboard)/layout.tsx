// app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Kanban,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/app/components/common/ErrorBoundary'
import { SocketStatusBanner } from '@/app/components/common/SocketStatusBanner'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  avatar?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const { data } = await res.json()
        setUser(data)
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
      roles: ['ADMIN', 'NURSE'],
    },
    {
      name: 'Operations',
      href: '/dashboard/operations/kanban',
      icon: Kanban,
      exact: false,
      roles: ['ADMIN'],
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      exact: false,
      roles: ['ADMIN'],
    },
    {
      name: 'Users',
      href: '/dashboard/admin/users',
      icon: Users,
      exact: false,
      roles: ['ADMIN'],
    },
  ]

  const filteredItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  )

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-900 border-t-indigo-400" />
            <Activity className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-400">Loading CURE Portal…</p>
        </div>
      </div>
    )
  }

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Mobile Backdrop ─────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/60 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-wide text-white">CURE</span>
                <span className="ml-1.5 text-xs text-slate-400">Command Center</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 mx-auto shadow-lg shadow-indigo-500/30">
              <Shield className="h-4 w-4 text-white" />
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : '')} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User & Logout */}
        <div className="shrink-0 border-t border-slate-700/60 p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                {filteredItems.find((i) => isActive(i.href, i.exact))?.name ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400">CURE Operations Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online badge */}
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </div>
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="h-8 w-8 rounded-full" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <SocketStatusBanner />
      </div>
    </div>
  )
}
