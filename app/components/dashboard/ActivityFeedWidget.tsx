// app/components/dashboard/ActivityFeedWidget.tsx
'use client'

import { cn } from '@/lib/utils'
import { Clock, UserPlus, CheckCircle2, ArrowRightCircle, AlertCircle } from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  userId?: string
  userName?: string
  entityId?: string
}

interface ActivityFeedWidgetProps {
  items: ActivityItem[]
  loading?: boolean
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  TASK_CREATED: { icon: <ArrowRightCircle className="h-3.5 w-3.5" />, color: 'text-indigo-400 bg-indigo-500/10' },
  TASK_COMPLETED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-400 bg-emerald-500/10' },
  TASK_ASSIGNED: { icon: <ArrowRightCircle className="h-3.5 w-3.5" />, color: 'text-amber-400 bg-amber-500/10' },
  USER_CREATED: { icon: <UserPlus className="h-3.5 w-3.5" />, color: 'text-sky-400 bg-sky-500/10' },
  USER_UPDATED: { icon: <UserPlus className="h-3.5 w-3.5" />, color: 'text-violet-400 bg-violet-500/10' },
  DEPARTMENT_UPDATED: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-rose-400 bg-rose-500/10' },
}

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const containerClasses = 'rounded-xl border border-[var(--cure-border)] bg-[var(--cure-bg-card)] backdrop-blur-sm p-5'

export function ActivityFeedWidget({ items, loading }: ActivityFeedWidgetProps) {
  if (loading) {
    return (
      <div className={containerClasses}>
        <h3 className="text-sm font-semibold text-[var(--cure-text)] mb-4">Activity Feed</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-[var(--cure-bg-elevated)]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 rounded bg-[var(--cure-bg-elevated)]" />
                <div className="h-2 w-1/4 rounded bg-[var(--cure-bg-elevated)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className={containerClasses}>
        <h3 className="text-sm font-semibold text-[var(--cure-text)] mb-4">Activity Feed</h3>
        <p className="text-sm text-[var(--cure-text-dim)] text-center py-6">No recent activity</p>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--cure-text)]">Activity Feed</h3>
        <Clock className="h-3.5 w-3.5 text-[var(--cure-text-dim)]" />
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const config = typeConfig[item.type] || typeConfig.TASK_CREATED
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--cure-border-subtle)]"
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', config.color)}>
                {config.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--cure-text)] leading-snug">{item.message}</p>
                <p className="text-[11px] text-[var(--cure-text-dim)] mt-0.5">{getRelativeTime(item.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
