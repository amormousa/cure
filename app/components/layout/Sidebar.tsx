// app/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, BarChart3, Users, Building2, Stethoscope, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  userRole: string
}

export function Sidebar({ isOpen = true, onClose, userRole }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'NURSE', 'DISPATCHER'],
    },
    {
      name: 'Tasks',
      href: '/operations/kanban',
      icon: ClipboardList,
      roles: ['ADMIN', 'DISPATCHER', 'NURSE'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'DISPATCHER'],
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      name: 'Departments',
      href: '/admin/departments',
      icon: Building2,
      roles: ['ADMIN'],
    },
    {
      name: 'Specializations',
      href: '/admin/specializations',
      icon: Stethoscope,
      roles: ['ADMIN'],
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ]

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  const isActive = (href: string) => {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white pt-16 transition-transform duration-300 lg:relative lg:top-auto lg:translate-x-0 lg:pt-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 lg:hidden">
          <span className="font-semibold text-gray-900">Menu</span>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-2 py-6">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
