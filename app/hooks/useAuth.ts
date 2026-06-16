// app/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Role } from '@/types'
import { authApi } from '@/app/lib/api/endpoints'

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
        const result = await authApi.getMe()
        if (result.ok && result.data) {
          const user = {
            ...result.data.data,
            isActive: result.data.data.isActive ?? true,
            isOnline: result.data.data.isOnline ?? false,
          } as User
          setState({ user, role: user.role, isLoading: false })
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
      await authApi.logout()
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
