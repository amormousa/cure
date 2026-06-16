// app/lib/ai.ts
import { Priority, DispatchStatus } from '@prisma/client'

/**
 * Automatically detects dispatch priority based on patient notes.
 */
export function detectPriority(notes: string): Priority {
  const normalized = notes.toLowerCase()
  
  const urgentKeywords = [
    'chest pain', 'heart attack', 'severe bleeding', 'critical', 'emergency', 
    'difficulty breathing', 'unconscious', 'stroke', 'spike', 'ألم في الصدر',
    'طارئ', 'ألم شديد', 'نزيف', 'جلطة', 'فقدان الوعي', 'ضيق تنفس'
  ]

  const highKeywords = [
    'high fever', 'intense pain', 'severe pain', 'fracture', 'worsening',
    'حرارة عالية', 'ألم حاد', 'كسر', 'تدهور'
  ]

  const lowKeywords = [
    'routine', 'checkup', 'follow-up', 'follow up', 'counseling', 'regular', 
    'روتيني', 'متابعة', 'فحص دوري', 'استشارة'
  ]

  if (urgentKeywords.some(kw => normalized.includes(kw))) {
    return Priority.URGENT
  }
  if (highKeywords.some(kw => normalized.includes(kw))) {
    return Priority.HIGH
  }
  if (lowKeywords.some(kw => normalized.includes(kw))) {
    return Priority.LOW
  }

  return Priority.MEDIUM
}

interface NurseDispatch {
  id: string
  scheduledFor: Date
  status: DispatchStatus
  priority: Priority
}

interface NurseInfo {
  id: string
  name: string
  isOnline: boolean
  dispatches: NurseDispatch[]
}

/**
 * Calculates a suitability score (0 to 100) for a nurse based on availability,
 * workload, presence, and schedule overlap.
 */
export function calculateNurseScore(nurse: NurseInfo, scheduledTime: Date): { score: number; reasons: string[] } {
  let score = 100
  const reasons: string[] = []

  // 1. Online presence
  if (nurse.isOnline) {
    score += 20
    reasons.push('الممرض متصل بالإنترنت حالياً (+20)')
  } else {
    score -= 30
    reasons.push('الممرض غير متصل بالإنترنت (-30)')
  }

  // 2. Active tasks count
  const activeCount = nurse.dispatches.length
  if (activeCount === 0) {
    score += 30
    reasons.push('لا توجد مهام نشطة مسندة إليه (+30)')
  } else {
    const penalty = activeCount * 20
    score -= penalty
    reasons.push(`لديه ${activeCount} مهام نشطة قيد التنفيذ (-${penalty})`)
  }

  // 3. Scheduling conflict (overlap check within a 2-hour window)
  let hasOverlap = false
  const TWO_HOURS = 2 * 60 * 60 * 1000 // 2 hours in ms
  
  nurse.dispatches.forEach((d) => {
    const diff = Math.abs(new Date(d.scheduledFor).getTime() - new Date(scheduledTime).getTime())
    if (diff < TWO_HOURS) {
      hasOverlap = true
    }
  })

  if (hasOverlap) {
    score -= 50
    reasons.push('يوجد تضارب محتمل في المواعيد (مهمة أخرى في غضون ساعتين) (-50)')
  } else {
    score += 10
    reasons.push('الجدول الزمني فارغ في هذا الوقت (+10)')
  }

  // Normalize score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score))

  return {
    score: finalScore,
    reasons,
  }
}
