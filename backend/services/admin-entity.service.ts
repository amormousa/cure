import { prisma } from '@/lib/prisma'
import { Errors } from '@/backend/utils/errors'

type EntityKind = 'Department' | 'Specialization'

interface EntityData {
  name?: string
  description?: string | null
  isActive?: boolean
}

export async function listEntities(kind: EntityKind, includeInactive = true) {
  const args = {
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' as const },
    include: { _count: { select: { users: true } } },
  }

  if (kind === 'Department') return prisma.department.findMany(args)
  return prisma.specialization.findMany(args)
}

export async function getEntity(kind: EntityKind, id: string) {
  const entity =
    kind === 'Department'
      ? await prisma.department.findUnique({
          where: { id },
          include: { users: { select: { id: true, name: true, email: true, role: true } } },
        })
      : await prisma.specialization.findUnique({
          where: { id },
          include: { users: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
        })
  if (!entity) throw Errors.notFound(kind)
  return entity
}

export async function createEntity(kind: EntityKind, data: Required<Pick<EntityData, 'name'>> & EntityData, userId: string) {
  const existing =
    kind === 'Department'
      ? await prisma.department.findUnique({ where: { name: data.name } })
      : await prisma.specialization.findUnique({ where: { name: data.name } })
  if (existing) throw Errors.conflict(`${kind} with this name already exists`)

  return prisma.$transaction(async (tx) => {
    const entity =
      kind === 'Department'
        ? await tx.department.create({
            data: {
              name: data.name,
              description: data.description ?? null,
              isActive: data.isActive ?? true,
            },
          })
        : await tx.specialization.create({
            data: {
              name: data.name,
              description: data.description ?? null,
              isActive: data.isActive ?? true,
            },
          })

    await tx.auditLog.create({
      data: {
        userId,
        action: `${kind.toUpperCase()}_CREATED`,
        entityType: kind,
        entityId: entity.id,
        newValue: entity,
        details: { after: entity },
      },
    })

    return entity
  })
}

export async function updateEntity(kind: EntityKind, id: string, data: EntityData, userId: string) {
  const existing =
    kind === 'Department'
      ? await prisma.department.findUnique({ where: { id } })
      : await prisma.specialization.findUnique({ where: { id } })
  if (!existing) throw Errors.notFound(kind)

  return prisma.$transaction(async (tx) => {
    const updateData = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    }
    const updated =
      kind === 'Department'
        ? await tx.department.update({ where: { id }, data: updateData })
        : await tx.specialization.update({ where: { id }, data: updateData })

    await tx.auditLog.create({
      data: {
        userId,
        action: `${kind.toUpperCase()}_UPDATED`,
        entityType: kind,
        entityId: id,
        previousValue: existing,
        newValue: updated,
        details: { before: existing, after: updated, changedFields: Object.keys(data) },
      },
    })

    return updated
  })
}

export async function deleteEntity(kind: EntityKind, id: string, userId: string) {
  const existing =
    kind === 'Department'
      ? await prisma.department.findUnique({ where: { id } })
      : await prisma.specialization.findUnique({ where: { id } })
  if (!existing) throw Errors.notFound(kind)

  return prisma.$transaction(async (tx) => {
    const deleted =
      kind === 'Department'
        ? await tx.department.update({ where: { id }, data: { isActive: false } })
        : await tx.specialization.update({ where: { id }, data: { isActive: false } })

    await tx.auditLog.create({
      data: {
        userId,
        action: `${kind.toUpperCase()}_DELETED`,
        entityType: kind,
        entityId: id,
        previousValue: existing,
        newValue: deleted,
        details: { before: existing, after: deleted },
      },
    })

    return deleted
  })
}
