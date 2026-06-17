// app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  HeartPulse,
  Users,
  Building2,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  Search,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/app/components/common/ErrorBoundary'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { SocketStatusBanner } from '@/app/components/common/SocketStatusBanner'
import { ThemeProvider } from '@/app/contexts/ThemeContext'
import { ThemeToggle } from '@/app/components/common/ThemeToggle'
import { authApi } from '@/app/lib/api/endpoints'

const SIDEBAR_LS_KEY = 'cure_sidebar_collapsed'
const ACTIVE_TAB_LS_KEY = 'cure_active_tab'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true, roles: ['ADMIN', 'NURSE', 'DISPATCHER'] },
  { name: 'Tasks', href: '/operations/kanban', icon: ClipboardList, exact: false, roles: ['ADMIN', 'DISPATCHER', 'NURSE'] },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, exact: false, roles: ['ADMIN', 'DISPATCHER'] },
  { name: 'Nurses', href: '/admin/nurses', icon: HeartPulse, exact: false, roles: ['ADMIN', 'DISPATCHER'] },
  { name: 'Users', href: '/admin/users', icon: Users, exact: false, roles: ['ADMIN'] },
  { name: 'Departments', href: '/admin/departments', icon: Building2, exact: false, roles: ['ADMIN'] },
  { name: 'Specializations', href: '/admin/specializations', icon: Stethoscope, exact: false, roles: ['ADMIN'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, exact: false, roles: ['ADMIN'] },
]

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  avatar?: string | null
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTabInitialized, setActiveTabInitialized] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_LS_KEY)
    if (stored !== null) setSidebarCollapsed(stored === 'true')
  }, [])

  useEffect(() => {
    const savedTabHref = localStorage.getItem(ACTIVE_TAB_LS_KEY)
    const isValidTab = navItems.some(item => item.href === savedTabHref)
    if (savedTabHref && isValidTab && savedTabHref !== pathname) {
      router.replace(savedTabHref)
    }
    setActiveTabInitialized(true)
  }, [])

  useEffect(() => {
    if (activeTabInitialized) {
      localStorage.setItem(ACTIVE_TAB_LS_KEY, pathname)
    }
  }, [pathname, activeTabInitialized])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_LS_KEY, String(next))
      return next
    })
  }, [])

  const handleNavClick = useCallback((href: string) => {
    localStorage.setItem(ACTIVE_TAB_LS_KEY, href)
    setMobileSidebarOpen(false)
    if (href === pathname) router.refresh()
  }, [pathname, router])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await authApi.getMe()
        if (!result.ok || !result.data) { router.replace('/login'); return }
        setUser(result.data.data)
      } catch { router.replace('/login') }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [router])

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const filteredItems = navItems.filter(item => !user || item.roles.includes(user.role))
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const currentPageName = filteredItems.find(i => isActive(i.href, i.exact))?.name ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--cure-bg)] text-[var(--cure-text)]">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-[var(--cure-bg-sidebar)] backdrop-blur-xl border-r border-[var(--cure-border)]',
          'transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-16 shrink-0 items-center border-b border-[var(--cure-border)]',
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--cure-accent)' }}>
                  <Shield className="h-4 w-4" style={{ color: 'var(--cure-accent-fg)' }} />
                </div>
                <div>
                  <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--cure-accent-fg)' }}>CURE</span>
                  <span className="ml-1.5 text-xs" style={{ color: 'var(--cure-text-dim)' }}>Command Center</span>
                </div>
              </div>
              <button onClick={toggleSidebar} className="rounded-lg p-1.5 hidden lg:block" style={{ color: 'var(--cure-text-dim)' }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg mx-auto" style={{ backgroundColor: 'var(--cure-accent)' }}>
                <Shield className="h-4 w-4" style={{ color: 'var(--cure-accent-fg)' }} />
              </div>
              <button onClick={toggleSidebar} className="rounded-lg p-1.5 hidden lg:block absolute -right-10" style={{ color: 'var(--cure-text-dim)' }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-1.5 lg:hidden" style={{ color: 'var(--cure-text-dim)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {filteredItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'border shadow-sm'
                    : 'hover:bg-[var(--cure-border-subtle)]'
                )}
                style={active ? {
                  backgroundColor: 'var(--cure-accent-bg)',
                  color: 'var(--cure-text)',
                  borderColor: 'var(--cure-accent)',
                  borderOpacity: 0.3,
                  boxShadow: '0 1px 3px rgba(91,62,255,0.08)',
                } : {
                  color: 'var(--cure-text-muted)',
                }}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r-full" style={{ backgroundColor: 'var(--cure-accent)' }} />
                )}
                <Icon className={cn('h-5 w-5 shrink-0 transition-all duration-150')}
                  style={{ color: active ? 'var(--cure-accent)' : 'var(--cure-text-dim)' }}
                />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {sidebarCollapsed && active && (
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--cure-accent)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t border-[var(--cure-border)]">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* User & Logout */}
        <div className="shrink-0 border-t border-[var(--cure-border)] p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                style={{ backgroundColor: 'var(--cure-accent)', color: 'var(--cure-accent-fg)' }}>
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" /> : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--cure-text)' }}>{user?.name ?? 'Loading...'}</p>
                <p className="text-xs" style={{ color: 'var(--cure-text-dim)' }}>{user?.role ?? '—'}</p>
              </div>
              <button onClick={async () => { await authApi.logout(); router.replace('/login') }} title="Logout"
                className="rounded-lg p-1.5 transition" style={{ color: 'var(--cure-text-dim)' }}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                style={{ backgroundColor: 'var(--cure-accent)', color: 'var(--cure-accent-fg)' }}>
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" /> : initials}
              </div>
              <button onClick={async () => { await authApi.logout(); router.replace('/login') }} title="Logout"
                className="rounded-lg p-2 transition" style={{ color: 'var(--cure-text-dim)' }}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6"
          style={{
            backgroundColor: 'var(--cure-bg-elevated)',
            borderColor: 'var(--cure-border)',
            backdropFilter: 'blur(12px)',
          }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 lg:hidden transition" style={{ color: 'var(--cure-text-muted)' }}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--cure-text)' }}>{currentPageName}</h1>
              <p className="text-xs" style={{ color: 'var(--cure-text-dim)' }}>CURE Operations Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--cure-bg-elevated)',
                borderColor: 'var(--cure-border)',
                color: 'var(--cure-text-muted)',
              }}>
              <Search className="h-4 w-4" />
              <input type="text" placeholder="Search..."
                className="bg-transparent border-none outline-none w-32 lg:w-48"
                style={{ color: 'var(--cure-text)', '--tw-placeholder-color': 'var(--cure-text-dim)' } as React.CSSProperties}
              />
              <kbd className="hidden lg:inline-flex items-center rounded border px-1.5 py-0.5 text-[10px]"
                style={{ borderColor: 'var(--cure-border)', backgroundColor: 'var(--cure-bg-elevated)', color: 'var(--cure-text-dim)' }}>
                ⌘K
              </kbd>
            </div>

            <button className="relative rounded-lg p-2 transition" style={{ color: 'var(--cure-text-muted)' }}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2"
                style={{ backgroundColor: 'var(--cure-accent)', ringColor: 'var(--cure-bg)' }} />
            </button>

            <div className="hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:flex"
              style={{
                borderColor: 'rgba(16,185,129,0.2)',
                backgroundColor: 'rgba(16,185,129,0.1)',
                color: 'rgb(52,211,153)',
              }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm"
              style={{ backgroundColor: 'var(--cure-accent)', color: 'var(--cure-accent-fg)' }}>
              {user?.avatar ? <img src={user.avatar} alt={user?.name} className="h-8 w-8 rounded-full object-cover" /> : initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--cure-bg)' }}>
          <ErrorBoundary>
            {loading ? (
              <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>
            ) : children}
          </ErrorBoundary>
        </main>
        <SocketStatusBanner />
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  )
}
