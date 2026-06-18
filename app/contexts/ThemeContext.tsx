// app/contexts/ThemeContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolved: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'cure-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return getSystemTheme()
  return theme
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolved, setResolved] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial = stored || defaultTheme
    setThemeState(initial)
    const r = resolveTheme(initial)
    setResolved(r)
    applyTheme(r)
    setMounted(true)
  }, [defaultTheme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = getSystemTheme()
      setResolved(r)
      applyTheme(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    const r = resolveTheme(newTheme)
    setResolved(r)
    applyTheme(r)
  }, [])

  const toggle = useCallback(() => {
    const order: Theme[] = ['light', 'dark', 'system']
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a <ThemeProvider>')
  return context
}
