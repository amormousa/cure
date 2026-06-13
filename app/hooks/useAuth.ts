// app/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Role } from '@/types'

interface AuthState {
  user: User | null
  role: Role | null
  isLoading: boolean
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
  })

  useEffect(() => {
    // Get user from API on mount
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const { data } = await res.json()
          setState({ user: data, role: data.role, isLoading: false })
        } else {
          setState({ user: null, role: null, isLoading: false })
        }
      } catch (error) {
        setState({ user: null, role: null, isLoading: false })
      }
    }

    fetchUser()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setState({ user: null, role: null, isLoading: false })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user: state.user,
    role: state.role,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    logout,
  }
}
