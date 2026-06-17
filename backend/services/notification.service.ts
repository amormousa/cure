import { prisma } from '@/lib/prisma'
import { Errors } from '@/backend/utils/errors'

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      readAt: unreadOnly ? null : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function markNotificationRead(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({ where: { id, userId } })
  if (!existing) throw Errors.notFound('Notification')

  return prisma.notification.update({
    where: { id },
    data: { readAt: existing.readAt ?? new Date() },
  })
}

export async function deleteNotification(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({ where: { id, userId } })
  if (!existing) throw Errors.notFound('Notification')

  return prisma.notification.delete({ where: { id } })
}
