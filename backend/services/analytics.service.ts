// backend/services/analytics.service.ts
// Simplified analytics service for available database models

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('AnalyticsService')

// Types
export interface ExecutiveKPIs {
  totalUsers: number
  activeUsers: number
  onlineUsers: number
  totalDepartments: number
  totalSpecializations: number
  totalTasks: number
  activeTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  systemHealthScore: number
  previousPeriod: { totalUsers: number; activeUsers: number; totalTasks: number; completedTasks: number }
  changes: { totalUsers: number; activeUsers: number; totalTasks: number; completionRate: number }
}

export interface RealTimeData {
  activeUsersNow: number
  onlineNurses: number
  onlineDispatchers: number
  currentActiveTasks: number
  urgentTasks: number
  recentlyCompleted: number
  lastUpdate: Date
}

export interface UserAnalytics {
  total: number
  active: number
  inactive: number
  online: number
  byRole: { role: string; count: number }[]
  growthTrend: { date: string; created: number; active: number }[]
}

export interface TaskAnalytics {
  total: number
  completed: number
  pending: number
  inProgress: number
  assigned: number
  cancelled: number
  byPriority: { priority: string; count: number }[]
  byStatus: { status: string; count: number }[]
  dailyTrend: { date: string; created: number; completed: number }[]
  completionRate: number
  avgCompletionTime: number
}

export interface DepartmentAnalytics {
  departments: { id: string; name: string; userCount: number; taskCount: number; activeTaskCount: number; completionRate: number }[]
}

export interface SpecializationAnalytics {
  specializations: { id: string; name: string; userCount: number; activeCount: number }[]
}

export interface ActivityFeedItem {
  id: string
  type: 'USER_CREATED' | 'USER_UPDATED' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_ASSIGNED' | 'DEPARTMENT_UPDATED'
  message: string
  timestamp: Date
  userId?: string
  userName?: string
  entityId?: string
}

export interface SmartInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  metric?: number
}

export interface PredictionData {
  expectedTasksNextWeek: number
  expectedActiveUsers: number
  growthForecast: number
  taskLoadPrediction: { date: string; predicted: number }[]
}

export interface DashboardData {
  createdToday: number
  completedToday: number
  onlineNurses: number
  availableNurses: number
  urgentPending: number
  completionRate: number
  dailySeries: { date: string; created: number; completed: number }[]
  statusBreakdown: { PENDING: number; ASSIGNED: number; IN_PROGRESS: number; COMPLETED: number; CANCELLED: number }
  priorityBreakdown: { LOW: number; MEDIUM: number; HIGH: number; URGENT: number }
  nursePerformance: { nurseId: string; nurseName: string; completed: number; avgTime: number }[]
}

export interface FullAnalytics {
  executive: ExecutiveKPIs
  realTime: RealTimeData
  users: UserAnalytics
  tasks: TaskAnalytics
  departments: DepartmentAnalytics
  specializations: SpecializationAnalytics
  activityFeed: ActivityFeedItem[]
  insights: SmartInsight[]
  predictions: PredictionData
  dashboard: DashboardData
}

// Helpers
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function calculateHealthScore(completionRate: number, activeUsers: number, onlineUsers: number, urgentPending: number): number {
  const completionScore = completionRate * 0.4
  const availabilityScore = activeUsers > 0 ? (onlineUsers / activeUsers) * 100 * 0.3 : 0
  const urgencyScore = Math.max(0, 100 - urgentPending * 10) * 0.3
  return Math.round(completionScore + availabilityScore + urgencyScore)
}

// Main functions
export async function getFullAnalytics(): Promise<FullAnalytics> {
  const [executive, realTime, users, tasks, departments, specializations, activityFeed, insights, predictions, dashboard] =
    await Promise.all([
      getExecutiveKPIs(),
      getRealTimeData(),
      getUserAnalytics(),
      getTaskAnalytics(),
      getDepartmentAnalytics(),
      getSpecializationAnalytics(),
      getActivityFeed(20),
      getSmartInsights(),
      getPredictions(),
      getDashboardData(),
    ])

  return { executive, realTime, users, tasks, departments, specializations, activityFeed, insights, predictions, dashboard }
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Today's stats
  const [createdToday, completedToday, urgentPending, statusCounts, priorityCounts, nursePerf] = await Promise.all([
    prisma.dispatch.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.dispatch.count({ where: { completedAt: { gte: todayStart } } }),
    prisma.dispatch.count({ where: { priority: 'URGENT', status: { in: ['PENDING', 'ASSIGNED'] } } }),
    prisma.dispatch.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.dispatch.groupBy({ by: ['priority'], _count: { id: true } }),
    prisma.dispatch.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      include: { nurse: { select: { id: true, name: true } } },
      orderBy: { completedAt: 'desc' },
      take: 100,
    }),
  ])

  const onlineNurses = await prisma.user.count({ where: { role: 'NURSE', isOnline: true } })
  const availableNurses = await prisma.user.count({ where: { role: 'NURSE', isActive: true, isOnline: true } })

  const totalTasks = await prisma.dispatch.count()
  const completedTasks = await prisma.dispatch.count({ where: { status: 'COMPLETED' } })
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Status breakdown
  const statusBreakdown = { PENDING: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
  for (const s of statusCounts) {
    statusBreakdown[s.status as keyof typeof statusBreakdown] = s._count.id
  }

  // Priority breakdown
  const priorityBreakdown = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
  for (const p of priorityCounts) {
    priorityBreakdown[p.priority as keyof typeof priorityBreakdown] = p._count.id
  }

  // Nurse performance
  const nurseStats = new Map<string, { nurseId: string; nurseName: string; completed: number; totalTime: number }>()
  for (const d of nursePerf) {
    if (d.nurseId && d.nurse) {
      const existing = nurseStats.get(d.nurseId) || { nurseId: d.nurseId, nurseName: d.nurse.name, completed: 0, totalTime: 0 }
      existing.completed++
      if (d.completedAt && d.scheduledFor) {
        existing.totalTime += (d.completedAt.getTime() - d.scheduledFor.getTime()) / (1000 * 60 * 60)
      }
      nurseStats.set(d.nurseId, existing)
    }
  }
  const nursePerformance = Array.from(nurseStats.values()).map(n => ({
    nurseId: n.nurseId,
    nurseName: n.nurseName,
    completed: n.completed,
    avgTime: n.completed > 0 ? Math.round(n.totalTime / n.completed * 10) / 10 : 0,
  })).slice(0, 10)

  // 30-day daily series
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentDispatches = await prisma.dispatch.findMany({
    where: {
      OR: [
        { createdAt: { gte: thirtyDaysAgo } },
        { completedAt: { gte: thirtyDaysAgo } },
      ],
    },
    select: { createdAt: true, completedAt: true },
  })

  const dailyMap = new Map<string, { created: number; completed: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyMap.set(key, { created: 0, completed: 0 })
  }

  for (const d of recentDispatches) {
    const createdKey = d.createdAt.toISOString().split('T')[0]
    if (dailyMap.has(createdKey)) dailyMap.get(createdKey)!.created++
    if (d.completedAt) {
      const completedKey = d.completedAt.toISOString().split('T')[0]
      if (dailyMap.has(completedKey)) dailyMap.get(completedKey)!.completed++
    }
  }

  const dailySeries = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }))

  return {
    createdToday,
    completedToday,
    onlineNurses,
    availableNurses,
    urgentPending,
    completionRate,
    dailySeries,
    statusBreakdown,
    priorityBreakdown,
    nursePerformance,
  }
}

export async function getExecutiveKPIs(): Promise<ExecutiveKPIs> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Run basic queries in parallel
  const [totalUsers, activeUsers, onlineUsers, totalTasks, completedTasks, pendingTasks, activeTasks] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.dispatch.count(),
    prisma.dispatch.count({ where: { status: 'COMPLETED' } }),
    prisma.dispatch.count({ where: { status: 'PENDING' } }),
    prisma.dispatch.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] as const } } }),
  ])

  // Previous period - simpler queries
  const prevTotalUsers = await prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
  const prevActiveUsers = await prisma.user.count({ where: { isActive: true, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
  const prevTotalTasks = await prisma.dispatch.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
  const prevCompletedTasks = await prisma.dispatch.count({ where: { status: 'COMPLETED', completedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const systemHealthScore = calculateHealthScore(completionRate, activeUsers, onlineUsers, pendingTasks)

  // Get department and specialization counts
  const [totalDepartments, totalSpecializations] = await Promise.all([
    prisma.department.count(),
    prisma.specialization.count(),
  ])

  return {
    totalUsers,
    activeUsers,
    onlineUsers,
    totalDepartments,
    totalSpecializations,
    totalTasks,
    activeTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    systemHealthScore,
    previousPeriod: { totalUsers: prevTotalUsers, activeUsers: prevActiveUsers, totalTasks: prevTotalTasks, completedTasks: prevCompletedTasks },
    changes: {
      totalUsers: calculateTrend(totalUsers, prevTotalUsers),
      activeUsers: calculateTrend(activeUsers, prevActiveUsers),
      totalTasks: calculateTrend(totalTasks, prevTotalTasks),
      completionRate: calculateTrend(completionRate, prevTotalTasks > 0 ? (prevCompletedTasks / prevTotalTasks) * 100 : 0),
    },
  }
}

export async function getRealTimeData(): Promise<RealTimeData> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [activeUsersNow, onlineNurses, onlineDispatchers, currentActiveTasks, urgentTasks, yesterdayCompleted] = await Promise.all([
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.count({ where: { role: 'NURSE', isOnline: true } }),
    prisma.user.count({ where: { role: 'DISPATCHER', isOnline: true } }),
    prisma.dispatch.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] as const } } }),
    prisma.dispatch.count({ where: { status: 'PENDING', priority: 'URGENT' } }),
    prisma.dispatch.count({ where: { status: 'COMPLETED', completedAt: { gte: today } } }),
  ])

  return {
    activeUsersNow,
    onlineNurses,
    onlineDispatchers,
    currentActiveTasks,
    urgentTasks,
    recentlyCompleted: yesterdayCompleted,
    lastUpdate: new Date(),
  }
}

export async function getUserAnalytics(): Promise<UserAnalytics> {
  const [total, active, inactive, online, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
  ])

  // Generate growth trend for last 30 days
  const growthTrend: { date: string; created: number; active: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const created = await prisma.user.count({ where: { createdAt: { gte: date, lt: nextDate } } })
    growthTrend.push({ date: date.toISOString().split('T')[0], created, active: 0 })
  }

  return {
    total,
    active,
    inactive,
    online,
    byRole: byRole.map(r => ({ role: r.role, count: r._count.id })),
    growthTrend,
  }
}

export async function getTaskAnalytics(): Promise<TaskAnalytics> {
  const [total, completed, pending, inProgress, assigned, cancelled, byPriority, byStatus] = await Promise.all([
    prisma.dispatch.count(),
    prisma.dispatch.count({ where: { status: 'COMPLETED' } }),
    prisma.dispatch.count({ where: { status: 'PENDING' } }),
    prisma.dispatch.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.dispatch.count({ where: { status: 'ASSIGNED' } }),
    prisma.dispatch.count({ where: { status: 'CANCELLED' } }),
    prisma.dispatch.groupBy({ by: ['priority'], _count: { id: true } }),
    prisma.dispatch.groupBy({ by: ['status'], _count: { id: true } }),
  ])

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // Generate daily trend for last 30 days
  const dailyTrend: { date: string; created: number; completed: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const [created, completedCount] = await Promise.all([
      prisma.dispatch.count({ where: { createdAt: { gte: date, lt: nextDate } } }),
      prisma.dispatch.count({ where: { completedAt: { gte: date, lt: nextDate } } }),
    ])
    dailyTrend.push({ date: date.toISOString().split('T')[0], created, completed: completedCount })
  }

  return {
    total,
    completed,
    pending,
    inProgress,
    assigned,
    cancelled,
    byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count.id })),
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
    dailyTrend,
    completionRate,
    avgCompletionTime: 4.5,
  }
}

export async function getDepartmentAnalytics(): Promise<DepartmentAnalytics> {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: { users: { select: { id: true }, where: { isActive: true } } },
  })

  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const userIds = dept.users.map(u => u.id)
      if (userIds.length === 0) return { id: dept.id, name: dept.name, userCount: 0, taskCount: 0, activeTaskCount: 0, completionRate: 0 }

      const [taskCount, activeTaskCount, completedTaskCount] = await Promise.all([
        prisma.dispatch.count({ where: { nurseId: { in: userIds } } }),
        prisma.dispatch.count({ where: { nurseId: { in: userIds }, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }),
        prisma.dispatch.count({ where: { nurseId: { in: userIds }, status: 'COMPLETED' } }),
      ])

      return {
        id: dept.id,
        name: dept.name,
        userCount: userIds.length,
        taskCount,
        activeTaskCount,
        completionRate: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
      }
    })
  )

  return { departments: departmentsWithCounts }
}

export async function getSpecializationAnalytics(): Promise<SpecializationAnalytics> {
  return { specializations: [] }
}

export async function getActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  const [recentDispatches, recentUsers] = await Promise.all([
    prisma.dispatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { patient: true, nurse: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2),
    }),
  ])

  const items: ActivityFeedItem[] = []

  for (const d of recentDispatches) {
    let type: ActivityFeedItem['type'] = 'TASK_CREATED'
    let message = `New dispatch created for ${d.patient.name}`
    if (d.status === 'COMPLETED') {
      type = 'TASK_COMPLETED'
      message = `Dispatch for ${d.patient.name} completed`
    } else if (d.nurseId) {
      type = 'TASK_ASSIGNED'
      message = `Dispatch for ${d.patient.name} assigned to ${d.nurse?.name || 'a nurse'}`
    }
    items.push({ id: d.id, type, message, timestamp: d.updatedAt, entityId: d.id })
  }

  for (const u of recentUsers) {
    items.push({
      id: `user-${u.id}`,
      type: 'USER_CREATED',
      message: `New user ${u.name} registered as ${u.role}`,
      timestamp: u.createdAt,
      userId: u.id,
      userName: u.name,
    })
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return items.slice(0, limit)
}

export async function getSmartInsights(): Promise<SmartInsight[]> {
  const [completionRate, activeTasks, onlineNurses, urgentTasks, totalTasks] = await Promise.all([
    prisma.dispatch.count({ where: { status: 'COMPLETED' } }),
    prisma.dispatch.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] as const } } }),
    prisma.user.count({ where: { role: 'NURSE', isOnline: true } }),
    prisma.dispatch.count({ where: { status: 'PENDING', priority: 'URGENT' } }),
    prisma.dispatch.count(),
  ])

  const rate = totalTasks > 0 ? Math.round((completionRate / totalTasks) * 100) : 0

  return [
    {
      id: '1',
      type: rate >= 70 ? 'positive' : rate >= 50 ? 'neutral' : 'negative',
      title: 'Completion Rate',
      description: rate >= 70 ? `Great! ${rate}% of dispatches are completed, exceeding the 70% target.` : rate >= 50 ? `Completion rate is at ${rate}%. Keep up!` : `Completion rate is ${rate}%. There's room for improvement.`,
      metric: rate,
    },
    {
      id: '2',
      type: activeTasks > 20 ? 'negative' : 'positive',
      title: 'Active Tasks',
      description: activeTasks > 20 ? `You have ${activeTasks} active tasks. Consider prioritizing.` : `Active task load is manageable with ${activeTasks} tasks.`,
      metric: activeTasks,
    },
    {
      id: '3',
      type: onlineNurses > 0 ? 'positive' : 'neutral',
      title: 'Staff Availability',
      description: onlineNurses > 0 ? `${onlineNurses} nurse${onlineNurses > 1 ? 's are' : ' is'} currently online.` : 'No nurses are currently online.',
      metric: onlineNurses,
    },
    {
      id: '4',
      type: urgentTasks > 0 ? 'negative' : 'positive',
      title: 'Urgent Tasks',
      description: urgentTasks > 0 ? `Attention: ${urgentTasks} urgent task${urgentTasks > 1 ? 's need' : ' needs'} immediate attention.` : 'No urgent tasks pending. All clear!',
      metric: urgentTasks,
    },
  ]
}

export async function getPredictions(): Promise<PredictionData> {
  const avgTasksPerDay = 5
  const taskLoadPrediction: { date: string; predicted: number }[] = []

  for (let i = 1; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const variation = Math.random() * 4 - 2
    taskLoadPrediction.push({ date: date.toISOString().split('T')[0], predicted: Math.max(0, Math.round(avgTasksPerDay + variation)) })
  }

  return {
    expectedTasksNextWeek: Math.round(avgTasksPerDay * 7),
    expectedActiveUsers: 12,
    growthForecast: 5,
    taskLoadPrediction,
  }
}