import request from './request'

export type AlgorithmLevel =
  | 'diagnose_needed'
  | 'weak'
  | 'partial'
  | 'basic'
  | 'proficient'
  | 'mastered'

export type AlgorithmNextActionType =
  | 'diagnostic_quiz'
  | 'weakness_practice'
  | 'verification_quiz'
  | 'advance_or_review'
  | string

export interface AlgorithmEvidenceSummary {
  sourceType?: string
  sourceId?: string | number
  questionId?: string | number
  score?: number
  isCorrect?: number | boolean | null
  evidenceWeight?: number
  errorType?: string | null
  createdAt?: string
}

export interface AlgorithmKnowledgeState {
  knowledgeNodeId: string | number
  name: string
  category?: string
  importance?: number
  mastery: number
  confidence: number
  assessmentCount: number
  level: AlgorithmLevel | string
  lastAssessedAt?: string | null
  explanationFacts?: string | null
  recentEvidence?: AlgorithmEvidenceSummary[]
}

export interface AlgorithmNextAction {
  type: AlgorithmNextActionType
  knowledgeNodeId?: string | number
  knowledgeName?: string
  mastery?: number
  confidence?: number
  reason?: string
}

export interface LearningAlgorithmState {
  spaceId: string | number
  knowledgeCount: number
  assessedCount: number
  weakPoints: AlgorithmKnowledgeState[]
  nextAction: AlgorithmNextAction
  knowledgeStates: AlgorithmKnowledgeState[]
  algorithmVersion: string
}

export function fetchLearningState(spaceId: string | number) {
  return request.get<LearningAlgorithmState>('/algorithm/learning-state', {
    params: { spaceId },
    showError: false
  })
}

