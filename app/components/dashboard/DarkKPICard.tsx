// app/components/dashboard/DarkKPICard.tsx
'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DarkKPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  variant?: 'default' | 'warning' | 'success' | 'danger'
}

const variantStyles = {
  default: 'border-[var(--cure-accent)]/20 bg-[var(--cure-accent-bg)]',
  warning: 'border-amber-500/20 bg-amber-500/5',
  success: 'border-emerald-500/20 bg-emerald-500/5',
  danger: 'border-rose-500/20 bg-rose-500/5',
}

const iconBgStyles = {
  default: 'bg-[var(--cure-accent-bg)] text-[var(--cure-accent)]',
  warning: 'bg-amber-500/20 text-amber-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  danger: 'bg-rose-500/20 text-rose-400',
}

export function DarkKPICard({ title, value, subtitle, icon, trend, variant = 'default' }: DarkKPICardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border bg-[var(--cure-bg-card)] backdrop-blur-sm p-5 transition-all duration-200',
      'hover:bg-[var(--cure-bg-elevated)]',
      variantStyles[variant]
    )}>
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
        style={{ background: variant === 'warning' ? '#f59e0b' : variant === 'success' ? '#10b981' : variant === 'danger' ? '#f43f5e' : 'var(--cure-accent)' }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--cure-text-dim)]">{title}</span>
          {icon && (
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBgStyles[variant])}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[var(--cure-text)]">{value}</span>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive && trend.value > 0 ? 'text-emerald-400' :
              !trend.isPositive && trend.value > 0 ? 'text-rose-400' :
              'text-[var(--cure-text-dim)]'
            )}>
              {trend.value > 0 ? (
                trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="mt-1.5 text-xs text-[var(--cure-text-dim)]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
