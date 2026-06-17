import { z } from 'zod'
import { apiCall } from './client'
import * as schemas from './schemas'

// ============= AUTHENTICATION =============

export const authApi = {
  login: async (email: string, password: string) =>
    apiCall('/api/auth/login', schemas.LoginResponseSchema, {
      method: 'POST',
      body: { email, password },
      cache: false,
    }),

  logout: async () =>
    apiCall('/api/auth/logout', z.object({ data: z.null() }), {
      method: 'POST',
      cache: false,
    }),

  getMe: async () =>
    apiCall('/api/auth/me', schemas.AuthMeResponseSchema),

  refreshToken: async () =>
    apiCall('/api/auth/refresh', schemas.RefreshTokenResponseSchema, {
      method: 'POST',
      cache: false,
    }),
}

// ============= DISPATCHES =============

export const dispatchApi = {
  list: async (params?: {
    status?: string
    priority?: string
    nurseId?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.priority) query.append('priority', params.priority)
    if (params?.nurseId) query.append('nurseId', params.nurseId)
    if (params?.search) query.append('search', params.search)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    const endpoint = query.toString() ? `/api/dispatches?${query.toString()}` : '/api/dispatches'
    return apiCall(endpoint, schemas.DispatchListResponseSchema)
  },

  get: async (id: string) =>
    apiCall(`/api/dispatches/${id}`, schemas.DispatchDetailResponseSchema),

  create: async (data: {
    patientId: string
    priority: string
    scheduledFor: string
    notes?: string
  }) =>
    apiCall('/api/dispatches', schemas.DispatchSingleResponseSchema, {
      method: 'POST',
      body: data,
      cache: false,
    }),

  update: async (
    id: string,
    data: {
      status?: string
      nurseId?: string | null
      notes?: string
      completedAt?: string | null
    }
  ) =>
    apiCall(`/api/dispatches/${id}`, schemas.DispatchSingleResponseSchema, {
      method: 'PATCH',
      body: data,
      cache: false,
    }),

  cancel: async (id: string) =>
    apiCall(`/api/dispatches/${id}`, schemas.DispatchSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),

  aiSuggest: async (params?: {
    dispatchId?: string
    patientId?: string
    priority?: string
    scheduledFor?: string
  }) =>
    apiCall('/api/dispatches/ai-suggest', schemas.AISuggestResponseSchema, {
      method: 'POST',
      body: params,
      cache: false,
    }),
}

// ============= PATIENTS =============

export const patientApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)

    const endpoint = query.toString() ? `/api/patients?${query.toString()}` : '/api/patients'
    return apiCall(endpoint, schemas.PatientListResponseSchema)
  },

  get: async (id: string) =>
    apiCall(`/api/patients/${id}`, schemas.PatientSingleResponseSchema),

  create: async (data: {
    name: string
    address: string
    phone: string
    condition: string
    notes?: string
  }) =>
    apiCall('/api/patients', schemas.PatientSingleResponseSchema, {
      method: 'POST',
      body: data,
      cache: false,
    }),

  update: async (
    id: string,
    data: {
      name?: string
      address?: string
      phone?: string
      condition?: string
      notes?: string | null
    }
  ) =>
    apiCall(`/api/patients/${id}`, schemas.PatientSingleResponseSchema, {
      method: 'PATCH',
      body: data,
      cache: false,
    }),

  delete: async (id: string) =>
    apiCall(`/api/patients/${id}`, schemas.PatientSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),
}

// ============= USERS =============

export const userApi = {
  list: async (params?: {
    role?: string
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
    sortBy?: 'name' | 'createdAt' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) => {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive))
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.sortBy) query.append('sortBy', params.sortBy)
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder)

    const endpoint = query.toString() ? `/api/users?${query.toString()}` : '/api/users'
    return apiCall(endpoint, schemas.UserListResponseSchema, { cache: false })
  },

  get: async (id: string) =>
    apiCall(`/api/users/${id}`, schemas.UserSingleResponseSchema),

  create: async (data: {
    email: string
    name: string
    password: string
    role: string
    phone?: string
    departmentId?: string | null
    specializationIds?: string[]
  }) =>
    apiCall('/api/users', schemas.UserSingleResponseSchema, {
      method: 'POST',
      body: data,
      cache: false,
    }),

  update: async (
    id: string,
    data: {
      name?: string
      role?: string
      isActive?: boolean
      phone?: string
      departmentId?: string | null
      specializationIds?: string[]
    }
  ) =>
    apiCall(`/api/users/${id}`, schemas.UserSingleResponseSchema, {
      method: 'PATCH',
      body: data,
      cache: false,
    }),

  delete: async (id: string) =>
    apiCall(`/api/users/${id}`, schemas.UserSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),
}

// ============= ADMIN ENTITIES =============

export const departmentApi = {
  list: async (params?: { includeInactive?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.includeInactive !== undefined) query.append('includeInactive', String(params.includeInactive))
    const endpoint = query.toString() ? `/api/departments?${query.toString()}` : '/api/departments'
    return apiCall(endpoint, schemas.DepartmentListResponseSchema, { cache: false })
  },

  get: async (id: string) =>
    apiCall(`/api/departments/${id}`, schemas.DepartmentSingleResponseSchema, { cache: false }),

  create: async (data: { name: string; description?: string | null; isActive?: boolean }) =>
    apiCall('/api/departments', schemas.DepartmentSingleResponseSchema, {
      method: 'POST',
      body: data,
      cache: false,
    }),

  update: async (id: string, data: { name?: string; description?: string | null; isActive?: boolean }) =>
    apiCall(`/api/departments/${id}`, schemas.DepartmentSingleResponseSchema, {
      method: 'PATCH',
      body: data,
      cache: false,
    }),

  delete: async (id: string) =>
    apiCall(`/api/departments/${id}`, schemas.DepartmentSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),
}

export const specializationApi = {
  list: async (params?: { includeInactive?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.includeInactive !== undefined) query.append('includeInactive', String(params.includeInactive))
    const endpoint = query.toString() ? `/api/specializations?${query.toString()}` : '/api/specializations'
    return apiCall(endpoint, schemas.SpecializationListResponseSchema, { cache: false })
  },

  get: async (id: string) =>
    apiCall(`/api/specializations/${id}`, schemas.SpecializationSingleResponseSchema, { cache: false }),

  create: async (data: { name: string; description?: string | null; isActive?: boolean }) =>
    apiCall('/api/specializations', schemas.SpecializationSingleResponseSchema, {
      method: 'POST',
      body: data,
      cache: false,
    }),

  update: async (id: string, data: { name?: string; description?: string | null; isActive?: boolean }) =>
    apiCall(`/api/specializations/${id}`, schemas.SpecializationSingleResponseSchema, {
      method: 'PATCH',
      body: data,
      cache: false,
    }),

  delete: async (id: string) =>
    apiCall(`/api/specializations/${id}`, schemas.SpecializationSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),
}

// ============= NOTIFICATIONS =============

export const notificationApi = {
  list: async (params?: { unreadOnly?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.unreadOnly !== undefined) query.append('unreadOnly', String(params.unreadOnly))
    const endpoint = query.toString() ? `/api/notifications?${query.toString()}` : '/api/notifications'
    return apiCall(endpoint, schemas.NotificationListResponseSchema)
  },

  markRead: async (id: string) =>
    apiCall(`/api/notifications/${id}`, schemas.NotificationSingleResponseSchema, {
      method: 'PATCH',
      cache: false,
    }),

  delete: async (id: string) =>
    apiCall(`/api/notifications/${id}`, schemas.NotificationSingleResponseSchema, {
      method: 'DELETE',
      cache: false,
    }),
}

// ============= ANALYTICS =============

export const analyticsApi = {
  // Legacy analytics API
  get: async (params?: { range?: '7d' | '30d' | '90d' }) => {
    const query = new URLSearchParams()
    if (params?.range) query.append('range', params.range)

    const endpoint = query.toString() ? `/api/analytics?${query.toString()}` : '/api/analytics'
    return apiCall(endpoint, schemas.AnalyticsResponseSchema)
  },
  // Full premium analytics API
  getFull: async () => {
    return apiCall('/api/analytics', schemas.FullAnalyticsResponseSchema, { cache: false })
  },
}

// ============= EXPORT TYPES =============
export type {
  User,
  Patient,
  Dispatch,
  DispatchDetail,
  Priority,
  DispatchStatus,
  NurseSuggestion,
  Analytics,
  Department,
  Specialization,
  Notification,
  FullAnalytics,
} from './schemas'
