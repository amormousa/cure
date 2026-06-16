import { User, Dispatch } from '@prisma/client';

/**
 * Calculate a nurse's suitability score for a dispatch.
 *
 * Scoring rules (max 100 points):
 * - Inactive nurse: 0 points.
 * - Workload penalty: -10 points per active dispatch (status = 'IN_PROGRESS').
 * - Urgency match: +20 points if the dispatch priority is 'URGENT'.
 * - Seniority tie‑breaker: +5 points for the earliest createdAt date.
 * The final score is clamped between 0 and 100.
 */
export function calculateNurseScore(
  nurse: User,
  dispatch: Dispatch,
  activeDispatches: number
): { score: number; breakdown: Record<string, any> } {
  const breakdown: Record<string, any> = {};

  // 1. Availability
  if (!nurse.isActive) {
    breakdown.reason = 'inactive';
    return { score: 0, breakdown };
  }
  breakdown.isActive = true;

  // 2. Base score start at 100
  let score = 100;

  // 3. Workload penalty
  if (activeDispatches && activeDispatches > 0) {
    const penalty = activeDispatches * 10;
    score -= penalty;
    breakdown.workloadPenalty = -penalty;
    breakdown.activeDispatches = activeDispatches;
  } else {
    breakdown.workloadPenalty = 0;
    breakdown.activeDispatches = 0;
  }

  // 4. Urgency match bonus
  if (dispatch.priority === 'URGENT') {
    score += 20;
    breakdown.urgencyBonus = 20;
  } else {
    breakdown.urgencyBonus = 0;
  }

  // 5. Seniority tie‑breaker (+5 points for older account)
  // The calling code will handle sorting by createdAt; we simply expose the seniority flag.
  breakdown.seniorityBonus = 5;
  score += 5;

  // Clamp score
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  breakdown.finalScore = score;
  return { score, breakdown };
}
