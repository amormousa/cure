// backend/lib/ai/nurse-scoring.ts
// Rule-based nurse scoring algorithm for Smart Assignment.
// Re-exports + extends the core logic from app/lib/ai.ts.

export { calculateNurseScore, detectPriority } from '@/lib/ai'

// Re-export types used by the scoring engine
export type { NurseForScoring, NurseScoreResult, NurseSuggestion } from '@/backend/types/models'
