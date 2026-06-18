// Standalone debug: run directly with `npx tsx scripts/debug-assign.ts <dispatchId> <nurseId>`
// Replicates exactly what the PATCH endpoint calls, with full error logging.
import { prisma } from '../app/lib/prisma'
;(async () => {
  const dispatchId = process.argv[2]
  const nurseId = process.argv[3]
  if (!dispatchId || !nurseId) {
    console.error('Usage: npx tsx scripts/debug-assign.ts <dispatchId> <nurseId>')
    process.exit(1)
  }

  console.log('=== Debug Nurse Assignment ===')
  console.log({ dispatchId, nurseId })

  try {
    // Step 1: find dispatch
    const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId } })
    console.log('Step 1 — dispatch lookup:', dispatch ? 'found' : 'NOT FOUND')
    if (!dispatch) { console.error('Dispatch not found'); process.exit(1) }

    // Step 2: find nurse
    const nurse = await prisma.user.findUnique({ where: { id: nurseId } })
    console.log('Step 2 — nurse lookup:', JSON.stringify(nurse, null, 2))

    // Step 3: audit log test (the most likely crash site)
    console.log('Step 3 — testing audit log serialization...')
    const test = { previousValue: dispatch, newValue: dispatch }
    JSON.stringify(test) // this would throw if serialization fails
    console.log('  audit log serialization: OK')

    // Step 4: try the full transaction
    console.log('Step 4 — running $transaction...')
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          nurseId,
          status: 'ASSIGNED',
          updatedAt: new Date(),
        },
        include: {
          patient: true,
          nurse: { select: { id: true, name: true, avatar: true } },
        },
      })
      console.log('  dispatch updated:', updated.id)

      await tx.auditLog.create({
        data: {
          userId: nurseId,
          action: 'DISPATCH_ASSIGNED',
          entityType: 'Dispatch',
          entityId: dispatchId,
          dispatchId,
          previousValue: dispatch,
          newValue: updated,
          details: {
            before: dispatch,
            after: updated,
            changedFields: ['nurseId', 'status'],
          },
        },
      })
      console.log('  audit log created')

      return updated
    })

    console.log('SUCCESS:', JSON.stringify(result, null, 2))
    process.exit(0)
  } catch (error) {
    console.error('FAILED — full error below:')
    console.error(error)
    process.exit(1)
  }
})()
