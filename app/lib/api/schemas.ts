import { z } from 'zod'

// ============= SHARED SCHEMAS =============
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
})

// ============= DOMAIN SCHEMAS =============

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['ADMIN', 'NURSE', 'DISPATCHER']),
  isActive: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  _count: z.object({ dispatches: z.number() }).optional(),
})

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({ users: z.number() }).optional(),
})

export const SpecializationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({ users: z.number() }).optional(),
})

export const UserSpecializationSchema = z.object({
  userId: z.string(),
  specializationId: z.string(),
  yearsExperience: z.number(),
  createdAt: z.string(),
  specialization: SpecializationSchema.optional(),
})

export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  condition: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const DispatchStatusEnum = z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const DispatchSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patient: PatientSchema,
  status: DispatchStatusEnum,
  priority: PriorityEnum,
  scheduledFor: z.string(),
  nurseId: z.string().nullable().optional(),
  nurse: UserSchema.pick({ id: true, name: true, avatar: true }).nullable().optional(),
  notes: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  dispatchId: z.string().nullable().optional(),
})

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
  title: z.string(),
  message: z.string(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const DispatchDetailSchema = DispatchSchema.extend({
  auditLogs: z.array(AuditLogSchema),
})

// ============= RESPONSE SCHEMAS =============

export const LoginResponseSchema = z.object({
  data: z.object({
    user: UserSchema,
  }),
  message: z.string().optional(),
})

export const AuthMeResponseSchema = z.object({
  data: UserSchema,
  message: z.string().optional(),
})

export const RefreshTokenResponseSchema = z.object({
  data: z.unknown().optional(),
  message: z.string().optional(),
})

export const DispatchListResponseSchema = z.object({
  data: z.array(DispatchSchema),
  pagination: PaginationSchema.optional(),
  message: z.string().optional(),
})

export const DispatchSingleResponseSchema = z.object({
  data: DispatchSchema,
  message: z.string().optional(),
})

export const DispatchDetailResponseSchema = z.object({
  data: DispatchDetailSchema,
  message: z.string().optional(),
})

export const PatientListResponseSchema = z.object({
  data: z.array(PatientSchema),
  pagination: PaginationSchema.optional(),
  message: z.string().optional(),
})

export const PatientSingleResponseSchema = z.object({
  data: PatientSchema,
  message: z.string().optional(),
})

export const UserListResponseSchema = z.object({
  data: z.array(UserSchema.extend({
    department: DepartmentSchema.nullable().optional(),
    specializations: z.array(UserSpecializationSchema).optional(),
    _count: z.object({
      dispatches: z.number(),
    }).optional(),
  })),
  pagination: PaginationSchema.optional(),
  message: z.string().optional(),
})

export const UserSingleResponseSchema = z.object({
  data: UserSchema.extend({
    department: DepartmentSchema.nullable().optional(),
    specializations: z.array(UserSpecializationSchema).optional(),
    dispatches: z.array(
      DispatchSchema.extend({
        patient: PatientSchema,
      })
    ).optional(),
  }),
  message: z.string().optional(),
})

export const AnalyticsResponseSchema = z.object({
  data: z.object({
    dispatchesToday: z.number(),
    completionRate: z.number(),
    activeNurses: z.number(),
    urgentDispatches: z.number(),
    trends: z.array(
      z.object({
        date: z.string(),
        created: z.number(),
        completed: z.number(),
      })
    ),
    completedToday: z.number(),
    createdToday: z.number(),
    availableNurses: z.number(),
    onlineNurses: z.number(),
    urgentPending: z.number(),
    dailySeries: z.array(
      z.object({
        date: z.string(),
        created: z.number(),
        completed: z.number(),
      })
    ),
    statusBreakdown: z.record(z.string(), z.number()),
    priorityBreakdown: z.record(z.string(), z.number()),
    nursePerformance: z.array(
      z.object({
        nurseId: z.string(),
        name: z.string(),
        completed: z.number(),
      })
    ),
    kpiTrends: z.object({
      createdToday: z.number(),
      completionRate: z.number(),
      onlineNurses: z.number(),
      availableNurses: z.number(),
      urgentPending: z.number(),
    }),
  }),
  message: z.string().optional(),
})

// Full Premium Analytics Schema
export const ExecutiveKPIsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  onlineUsers: z.number(),
  totalDepartments: z.number(),
  totalSpecializations: z.number(),
  totalTasks: z.number(),
  activeTasks: z.number(),
  completedTasks: z.number(),
  completionRate: z.number(),
  systemHealthScore: z.number(),
  previousPeriod: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalTasks: z.number(),
    completedTasks: z.number(),
  }),
  changes: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalTasks: z.number(),
    completionRate: z.number(),
  }),
})

export const RealTimeDataSchema = z.object({
  activeUsersNow: z.number(),
  onlineNurses: z.number(),
  onlineDispatchers: z.number(),
  currentActiveTasks: z.number(),
  urgentTasks: z.number(),
  recentlyCompleted: z.number(),
  lastUpdate: z.string(),
})

export const UserAnalyticsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  online: z.number(),
  byRole: z.array(z.object({ role: z.string(), count: z.number() })),
  growthTrend: z.array(z.object({ date: z.string(), created: z.number(), active: z.number() })),
})

export const TaskAnalyticsSchema = z.object({
  total: z.number(),
  completed: z.number(),
  pending: z.number(),
  inProgress: z.number(),
  assigned: z.number(),
  cancelled: z.number(),
  byPriority: z.array(z.object({ priority: z.string(), count: z.number() })),
  byStatus: z.array(z.object({ status: z.string(), count: z.number() })),
  dailyTrend: z.array(z.object({ date: z.string(), created: z.number(), completed: z.number() })),
  completionRate: z.number(),
  avgCompletionTime: z.number(),
})

export const DepartmentAnalyticsSchema = z.object({
  departments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    userCount: z.number(),
    taskCount: z.number(),
    activeTaskCount: z.number(),
    completionRate: z.number(),
  })),
})

export const SpecializationAnalyticsSchema = z.object({
  specializations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    userCount: z.number(),
    activeCount: z.number(),
  })),
})

export const ActivityFeedItemSchema = z.object({
  id: z.string(),
  type: z.enum(['USER_CREATED', 'USER_UPDATED', 'TASK_CREATED', 'TASK_COMPLETED', 'TASK_ASSIGNED', 'DEPARTMENT_UPDATED']),
  message: z.string(),
  timestamp: z.string(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  entityId: z.string().optional(),
})

export const SmartInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['positive', 'negative', 'neutral']),
  title: z.string(),
  description: z.string(),
  metric: z.number().optional(),
})

export const PredictionDataSchema = z.object({
  expectedTasksNextWeek: z.number(),
  expectedActiveUsers: z.number(),
  growthForecast: z.number(),
  taskLoadPrediction: z.array(z.object({ date: z.string(), predicted: z.number() })),
})

export const DashboardDataSchema = z.object({
  createdToday: z.number(),
  completedToday: z.number(),
  onlineNurses: z.number(),
  availableNurses: z.number(),
  urgentPending: z.number(),
  completionRate: z.number(),
  dailySeries: z.array(z.object({ date: z.string(), created: z.number(), completed: z.number() })),
  statusBreakdown: z.object({ PENDING: z.number(), ASSIGNED: z.number(), IN_PROGRESS: z.number(), COMPLETED: z.number(), CANCELLED: z.number() }),
  priorityBreakdown: z.object({ LOW: z.number(), MEDIUM: z.number(), HIGH: z.number(), URGENT: z.number() }),
  nursePerformance: z.array(z.object({ nurseId: z.string(), nurseName: z.string(), completed: z.number(), avgTime: z.number() })),
})

export const FullAnalyticsResponseSchema = z.object({
  data: z.object({
    executive: ExecutiveKPIsSchema,
    realTime: RealTimeDataSchema,
    users: UserAnalyticsSchema,
    tasks: TaskAnalyticsSchema,
    departments: DepartmentAnalyticsSchema,
    specializations: SpecializationAnalyticsSchema,
    activityFeed: z.array(ActivityFeedItemSchema),
    insights: z.array(SmartInsightSchema),
    predictions: PredictionDataSchema,
    dashboard: DashboardDataSchema,
  }),
  message: z.string().optional(),
})

export type FullAnalytics = z.infer<typeof FullAnalyticsResponseSchema>['data']

export const NurseSuggestionSchema = z.object({
  nurse: UserSchema.pick({ id: true, name: true, email: true, avatar: true, phone: true, isOnline: true }),
  score: z.number(),
  activeDispatchesCount: z.number(),
  reasons: z.array(z.string()),
})

export const AISuggestResponseSchema = z.object({
  data: z.array(NurseSuggestionSchema),
  message: z.string().optional(),
})

export const DepartmentListResponseSchema = z.object({
  data: z.array(DepartmentSchema),
  message: z.string().optional(),
})

export const DepartmentSingleResponseSchema = z.object({
  data: DepartmentSchema,
  message: z.string().optional(),
})

export const SpecializationListResponseSchema = z.object({
  data: z.array(SpecializationSchema),
  message: z.string().optional(),
})

export const SpecializationSingleResponseSchema = z.object({
  data: SpecializationSchema,
  message: z.string().optional(),
})

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationSchema),
  message: z.string().optional(),
})

export const NotificationSingleResponseSchema = z.object({
  data: NotificationSchema,
  message: z.string().optional(),
})

// ============= TYPE EXPORTS =============
export type User = z.infer<typeof UserSchema>
export type Department = z.infer<typeof DepartmentSchema>
export type Specialization = z.infer<typeof SpecializationSchema>
export type Patient = z.infer<typeof PatientSchema>
export type Dispatch = z.infer<typeof DispatchSchema>
export type DispatchDetail = z.infer<typeof DispatchDetailSchema>
export type AuditLog = z.infer<typeof AuditLogSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type DispatchStatus = z.infer<typeof DispatchStatusEnum>
export type Priority = z.infer<typeof PriorityEnum>
export type NurseSuggestion = z.infer<typeof NurseSuggestionSchema>
export type Analytics = z.infer<typeof AnalyticsResponseSchema>['data']
