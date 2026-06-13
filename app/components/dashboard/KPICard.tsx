'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'warning'
}

export function KPICard({ title, value, description, trend, variant = 'default' }: KPICardProps) {
  const isWarning = variant === 'warning'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md ${
        isWarning
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 text-orange-900'
          : 'bg-white border-gray-150 text-gray-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold tracking-wide uppercase ${isWarning ? 'text-orange-700/80' : 'text-gray-400'}`}>
          {title}
        </span>
        {trend && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm border ${
              trend.isPositive
                ? isWarning
                  ? 'bg-orange-100/50 text-orange-800 border-orange-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight">{value}</span>
      </div>

      <p className={`mt-2 text-sm leading-relaxed ${isWarning ? 'text-orange-800/70' : 'text-gray-500'}`}>
        {description}
      </p>

      {/* Decorative background shape */}
      <div
        className={`absolute -right-4 -bottom-4 h-16 w-16 rounded-full opacity-10 blur-xl ${
          isWarning ? 'bg-orange-500' : 'bg-indigo-600'
        }`}
      />
    </div>
  )
}
export default KPICard
