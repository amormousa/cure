// app/components/common/ThemeToggle.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, type Theme } from '@/app/contexts/ThemeContext'

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = options.find(o => o.value === theme) ?? options[1]
  const Icon = current.icon

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
          'bg-[var(--cure-bg-elevated)] text-[var(--cure-text-muted)]',
          'border border-[var(--cure-border)] hover:border-[var(--cure-accent)]/30',
          'hover:text-[var(--cure-text)] shadow-sm'
        )}
        title={`Theme: ${theme}`}
      >
        <span className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          {Icon}
        </span>
        <span className="hidden sm:inline capitalize">{current.label}</span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute bottom-full left-0 mb-2 w-40 rounded-lg border py-1 shadow-xl',
            'bg-[var(--cure-bg-card)] border-[var(--cure-border)]',
            'animate-in fade-in slide-in-from-bottom-1 duration-150'
          )}
        >
          {options.map(opt => {
            const selected = theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                  selected
                    ? 'text-[var(--cure-accent)] bg-[var(--cure-accent-bg)]'
                    : 'text-[var(--cure-text-muted)] hover:bg-[var(--cure-border-subtle)] hover:text-[var(--cure-text)]'
                )}
              >
                <span className="shrink-0">{opt.icon}</span>
                <span>{opt.label}</span>
                {selected && (
                  <Check className="ml-auto h-3.5 w-3.5" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ThemeToggleMinimal() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className={cn(
        'flex items-center justify-center rounded-lg p-2 transition-all duration-200',
        'text-[var(--cure-text-muted)] hover:text-[var(--cure-accent)]',
        'hover:bg-[var(--cure-accent-bg)]'
      )}
      title={`Theme: ${theme} — click to cycle`}
    >
      <span className="transition-transform duration-300 hover:scale-110">
        {theme === 'light' ? <Sun className="h-5 w-5" /> :
         theme === 'dark' ? <Moon className="h-5 w-5" /> :
         <Monitor className="h-5 w-5" />}
      </span>
    </button>
  )
}
