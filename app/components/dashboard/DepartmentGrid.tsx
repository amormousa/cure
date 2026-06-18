// app/components/dashboard/DepartmentGrid.tsx
'use client'

import { cn } from '@/lib/utils'
import { Building2, Users, ClipboardList, TrendingUp } from 'lucide-react'

interface DepartmentItem {
  id: string
  name: string
  userCount: number
  taskCount: number
  activeTaskCount: number
  completionRate: number
}

interface DepartmentGridProps {
  departments: DepartmentItem[]
  loading?: boolean
}

const containerClasses = 'rounded-xl border border-[var(--cure-border)] bg-[var(--cure-bg-card)] backdrop-blur-sm p-5'

export function DepartmentGrid({ departments, loading }: DepartmentGridProps) {
  if (loading) {
    return (
      <div className={containerClasses}>
        <h3 className="text-sm font-semibold text-[var(--cure-text)] mb-4">Departments</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-lg bg-[var(--cure-bg-elevated)] p-4 h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!departments.length) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-[var(--cure-text-dim)]" />
          <h3 className="text-sm font-semibold text-[var(--cure-text)]">Departments</h3>
        </div>
        <p className="text-sm text-[var(--cure-text-dim)] text-center py-6">No departments found</p>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-4 w-4 text-[var(--cure-text-dim)]" />
        <h3 className="text-sm font-semibold text-[var(--cure-text)]">Departments</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map(dept => (
          <div
            key={dept.id}
            className="rounded-lg border border-[var(--cure-border)] bg-[var(--cure-bg-alt)]/40 p-4 transition-colors hover:bg-[var(--cure-border-subtle)]"
          >
            <h4 className="text-sm font-medium text-[var(--cure-text)] mb-3 truncate">{dept.name}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center gap-1 text-[var(--cure-text-dim)] mb-0.5">
                  <Users className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Staff</span>
                </div>
                <span className="text-sm font-semibold text-[var(--cure-text)]">{dept.userCount}</span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--cure-text-dim)] mb-0.5">
                  <ClipboardList className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Tasks</span>
                </div>
                <span className="text-sm font-semibold text-[var(--cure-text)]">{dept.taskCount}</span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--cure-text-dim)] mb-0.5">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Rate</span>
                </div>
                <span className={cn(
                  'text-sm font-semibold',
                  dept.completionRate >= 70 ? 'text-emerald-400' :
                  dept.completionRate >= 40 ? 'text-amber-400' :
                  'text-rose-400'
                )}>
                  {dept.completionRate}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
