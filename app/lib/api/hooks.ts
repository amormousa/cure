'use client'

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import * as api from './endpoints'
import type * as Types from './schemas'

// ============= QUERY KEYS =============

export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    all: ['auth'] as const,
  },

  // Dispatches
  dispatches: {
    all: ['dispatches'] as const,
    list: (params?: Record<string, unknown>) => ['dispatches', 'list', params] as const,
    detail: (id: string) => ['dispatches', id] as const,
  },

  // Patients
  patients: {
    all: ['patients'] as const,
    list: (params?: Record<string, unknown>) => ['patients', 'list', params] as const,
    detail: (id: string) => ['patients', id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: ['analytics', 'dashboard'] as const,
  },
}

// ============= AUTH HOOKS =============

export function useAuthMe(): UseQueryResult<Types.User> {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const result = await api.authApi.getMe()
      if (!result.ok) throw new Error(result.error?.message)
      return result.data!.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await api.authApi.logout()
      if (!result.ok) throw new Error(result.error?.message)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      queryClient.clear()
    },
  })
}

// ============= DISPATCH HOOKS =============

export function useDispatches(
  params?: Parameters<typeof api.dispatchApi.list>[0]
): UseQueryResult<Types.Dispatch[]> {
  return useQuery({
    queryKey: queryKeys.dispatches.list(params),
    queryFn: async () => {
      const result = await api.dispatchApi.list(params)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data?.data || []
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useDispatch(id: string): UseQueryResult<Types.DispatchDetail> {
  return useQuery({
    queryKey: queryKeys.dispatches.detail(id),
    queryFn: async () => {
      const result = await api.dispatchApi.get(id)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data!.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useCreateDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof api.dispatchApi.create>[0]) =>
      api.dispatchApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
    },
  })
}

export function useUpdateDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; updates: Parameters<typeof api.dispatchApi.update>[1] }) =>
      api.dispatchApi.update(data.id, data.updates),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
    },
  })
}

export function useCancelDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.dispatchApi.cancel(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
    },
  })
}

export function useAiSuggestNurses() {
  return useMutation({
    mutationFn: (params?: Parameters<typeof api.dispatchApi.aiSuggest>[0]) =>
      api.dispatchApi.aiSuggest(params),
  })
}

// ============= PATIENT HOOKS =============

export function usePatients(
  params?: Parameters<typeof api.patientApi.list>[0]
): UseQueryResult<Types.Patient[]> {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: async () => {
      const result = await api.patientApi.list(params)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data?.data || []
    },
    staleTime: 30 * 1000,
  })
}

export function usePatient(id: string): UseQueryResult<Types.Patient> {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: async () => {
      const result = await api.patientApi.get(id)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data!.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof api.patientApi.create>[0]) =>
      api.patientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; updates: Parameters<typeof api.patientApi.update>[1] }) =>
      api.patientApi.update(data.id, data.updates),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.patientApi.delete(id),
    onSuccess: (result, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.patients.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

// ============= USER HOOKS =============

export function useUsers(
  params?: Parameters<typeof api.userApi.list>[0]
): UseQueryResult<Types.User[]> {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const result = await api.userApi.list(params)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data?.data || []
    },
    staleTime: 30 * 1000,
  })
}

export function useUser(id: string): UseQueryResult<Types.User> {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const result = await api.userApi.get(id)
      if (!result.ok) throw new Error(result.error?.message)
      return result.data!.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof api.userApi.create>[0]) => api.userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; updates: Parameters<typeof api.userApi.update>[1] }) =>
      api.userApi.update(data.id, data.updates),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.userApi.delete(id),
    onSuccess: (result, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ============= ANALYTICS HOOKS =============

export function useAnalytics(): UseQueryResult<Types.Analytics> {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: async () => {
      const result = await api.analyticsApi.get()
      if (!result.ok) throw new Error(result.error?.message)
      return result.data!.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
