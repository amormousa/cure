/// <reference types="vitest/globals" />
import { detectPriority, calculateNurseScore } from '../../app/lib/ai'
import { Priority, DispatchStatus } from '@prisma/client'

describe('detectPriority', () => {
  it('should detect URGENT for chest pain and other urgent symptoms', () => {
    expect(detectPriority('Patient has severe chest pain and breathlessness')).toBe(Priority.URGENT)
    expect(detectPriority('ألم شديد في الصدر وضيق تنفس')).toBe(Priority.URGENT)
  })

  it('should detect HIGH for high fever or fractures', () => {
    expect(detectPriority('High fever and worsening symptoms')).toBe(Priority.HIGH)
    expect(detectPriority('حرارة عالية جداً')).toBe(Priority.HIGH)
  })

  it('should detect LOW for routine checkups', () => {
    expect(detectPriority('Routine checkup after a week')).toBe(Priority.LOW)
    expect(detectPriority('فحص دوري عادي')).toBe(Priority.LOW)
  })

  it('should default to MEDIUM', () => {
    expect(detectPriority('A normal visit')).toBe(Priority.MEDIUM)
  })
})

describe('calculateNurseScore', () => {
  it('should return low score (e.g. 0) if nurse has overlap and is offline', () => {
    const nurse = {
      id: 'nurse-1',
      name: 'Test Nurse',
      isOnline: false,
      dispatches: [
        {
          id: 'dispatch-1',
          scheduledFor: new Date('2026-06-16T12:00:00Z'),
          status: DispatchStatus.IN_PROGRESS,
          priority: Priority.HIGH,
        }
      ]
    }
    const result = calculateNurseScore(nurse, new Date('2026-06-16T12:30:00Z'))
    expect(result.score).toBe(0) // 100 - 30 (offline) - 20 (1 active) - 50 (overlap) = 0
  })

  it('should return high score if nurse is online, has no active tasks, and no overlap', () => {
    const nurse = {
      id: 'nurse-2',
      name: 'Available Nurse',
      isOnline: true,
      dispatches: []
    }
    const result = calculateNurseScore(nurse, new Date('2026-06-16T15:00:00Z'))
    expect(result.score).toBeGreaterThan(60) // should be 100 + 20 (online) + 30 (no tasks) + 10 (no overlap) = 100 (capped at 100)
    expect(result.score).toBe(100)
  })
})
