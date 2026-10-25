import request from './request'

// ==================== 维度元数据 ====================

/** 画像维度通用元数据 */
export interface DimensionMetadata {
  schemaVersion?: string
  confidence?: number
  completeness?: number
  sourceTypes?: string[]
  evidenceIds?: string[]
  lastUpdatedAt?: string
  updatedBy?: string
  updateReason?: string
  validUntil?: string
}

// ==================== 学习背景 ====================

export interface Education {
  educationLevel?: string
  grade?: string
  majorCode?: string
  majorName?: string
  enrollmentYear?: number
}

export interface CompletedSubject {
  subjectId?: string
  subjectName?: string
  completionStatus?: string
  selfReportedLevel?: string
  verifiedLevel?: string
  lastStudiedAt?: string
  confidence?: number
  evidenceIds?: string[]
}

export interface ProgrammingLanguage {
  selfReportedLevel?: string
  verifiedLevel?: string
  experienceMonths?: number
  confidence?: number
  evidenceIds?: string[]
}

export interface PrerequisiteFoundation {
  status?: string
  score?: number
  confidence?: number
  evidenceIds?: string[]
}

export interface PriorExperience {
  completedSubjects?: Record<string, CompletedSubject>
  programmingLanguages?: Record<string, ProgrammingLanguage>
  prerequisiteFoundation?: Record<string, PrerequisiteFoundation>
}

export interface LearningConstraints {
  weeklyAvailableMinutes?: number
  preferredStudyPeriods?: string[]
  maxSessionMinutes?: number
  deviceTypes?: string[]
  networkCondition?: string
  accessibilityNeeds?: string[]
}

export interface LearningBackground {
  currentLevelDetail?: string
  selfDescription?: string
  education?: Education
  priorExperience?: PriorExperience
  learningConstraints?: LearningConstraints
  metadata?: DimensionMetadata
}

// ==================== 学习目标 ====================

export interface MeasurableCriteria {
  metric?: string
  operator?: string
  targetValue?: any
}

export interface GoalProgress {
  progressPercent?: number
  completedCriteriaCount?: number
  totalCriteriaCount?: number
  calculationMethod?: string
}

export interface Goal {
  goalId?: string
  scope?: string
  subjectId?: string
  title?: string
  description?: string
  goalType?: string
  targetLevel?: string
  targetKnowledgePointIds?: string[]
  measurableCriteria?: MeasurableCriteria[]
  priority?: string
  status?: string
  startAt?: string
  deadline?: string
  weeklyTimeBudgetMinutes?: number
  progress?: GoalProgress
  confidence?: number
  evidenceIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface LearningGoals {
  primaryGoalId?: string
  goals?: Record<string, Goal>
  metadata?: DimensionMetadata
}

// ==================== 能力画像 ====================

export interface AbilityItem {
  abilityCode?: string
  abilityName?: string
  score?: number
  level?: string
  trend?: string
  strengthSummary?: string
  improvementFocus?: string
  confidence?: number
  evidenceIds?: string[]
  lastEvaluatedAt?: string
}

export interface AbilityProfile {
  overallScore?: number
  overallLevel?: string
  abilities?: Record<string, AbilityItem>
  strengthAbilityCodes?: string[]
  developmentPriorityCodes?: string[]
  metadata?: DimensionMetadata
}

// ==================== 常见误区 ====================

export interface RootCauseHypothesis {
  causeCode?: string
  description?: string
  probability?: number
}

export interface OccurrenceStatistics {
  countLast7Days?: number
  countLast30Days?: number
  firstDetectedAt?: string
  lastObservedAt?: string
}

export interface SuccessCriteria {
  metric?: string
  targetValue?: any
  operator?: string
}

export interface Intervention {
  strategyCodes?: string[]
  recommendedActions?: string[]
  successCriteria?: SuccessCriteria[]
}

export interface MisconceptionPattern {
  misconceptionId?: string
  title?: string
  category?: string
  scope?: string
  description?: string
  typicalSymptoms?: string[]
  affectedSubjectIds?: string[]
  affectedKnowledgePointIds?: string[]
  rootCauseHypotheses?: RootCauseHypothesis[]
  severity?: string
  frequency?: string
  persistence?: string
  status?: string
  occurrenceStatistics?: OccurrenceStatistics
  intervention?: Intervention
  confidence?: number
  evidenceIds?: string[]
  updatedAt?: string
}

export interface CommonMisconceptions {
  patterns?: Record<string, MisconceptionPattern>
  metadata?: DimensionMetadata
}

// ==================== 学习偏好 ====================

export interface ResourcePreference {
  resourceType?: string
  declaredPreference?: string
  observedEffectivenessScore?: number
  selectionRate?: number
  completionRate?: number
  postLearningAccuracyRate?: number
  confidence?: number
  evidenceIds?: string[]
}

export interface ExplanationPreferences {
  preferredSequence?: string
  contentGranularity?: string
  preferredRepresentation?: string[]
  preferredLanguageStyle?: string
  analogyPreference?: string
}

export interface PracticePreferences {
  practiceTiming?: string
  preferredQuestionTypes?: string[]
  preferredDifficultyProgression?: string
  preferredQuestionsPerSession?: number
  allowHints?: boolean
  preferredHintStyle?: string
}

export interface FeedbackPreferences {
  feedbackTiming?: string
  feedbackDetailLevel?: string
  showCorrectAnswerImmediately?: boolean
  showErrorCause?: boolean
  showImprovementSuggestion?: boolean
}

export interface InteractionPreferences {
  preferredInteractionMode?: string
  allowAgentProactiveReminder?: boolean
  preferredReminderFrequency?: string
  preferredQuestioningStyle?: string
}

export interface SubjectOverride {
  preferredResourceTypes?: string[]
  preferredExplanationSequence?: string
  reason?: string
  confidence?: number
  evidenceIds?: string[]
}

export interface LearningPreference {
  resourcePreferences?: Record<string, ResourcePreference>
  explanationPreferences?: ExplanationPreferences
  practicePreferences?: PracticePreferences
  feedbackPreferences?: FeedbackPreferences
  interactionPreferences?: InteractionPreferences
  subjectOverrides?: Record<string, SubjectOverride>
  metadata?: DimensionMetadata
}

// ==================== 元认知画像 ====================

export interface MetaDimension {
  dimensionCode?: string
  dimensionName?: string
  score?: number
  level?: string
  trend?: string
  description?: string
  confidence?: number
  evidenceIds?: string[]
}

export interface CalibrationStatistics {
  selfPredictedAccuracyRate?: number
  actualAccuracyRate?: number
  calibrationGap?: number
  calibrationStatus?: string
  sampleCount?: number
}

export interface RecommendedSupport {
  planningSupportLevel?: string
  reflectionPromptFrequency?: string
  requireConfidencePredictionBeforeAnswer?: boolean
  recommendedInterventions?: string[]
}

export interface MetacognitiveProfile {
  overallScore?: number
  overallLevel?: string
  dimensions?: Record<string, MetaDimension>
  calibrationStatistics?: CalibrationStatistics
  recommendedSupport?: RecommendedSupport
  metadata?: DimensionMetadata
}

// ==================== 学科画像 ====================

export interface KnowledgePoint {
  knowledgePointId?: string
  knowledgePointNameCache?: string
  chapterId?: string
  knowledgeType?: string
  importance?: string
  prerequisiteKnowledgePointIds?: string[]
  masteryScore?: number
  masteryLevel?: string
  cognitiveMastery?: Record<string, any>
  independenceLevel?: string
  prerequisiteReadiness?: Record<string, any>
  assessmentStatistics?: Record<string, any>
  retention?: Record<string, any>
  misconceptions?: Record<string, any>
}

export interface ChapterSummary {
  chapterId?: string
  chapterName?: string
  masteryScore?: number
  masteryLevel?: string
  completedKnowledgePointCount?: number
  totalKnowledgePointCount?: number
  weakKnowledgePointIds?: string[]
  overallMastery?: number
}

export interface KnowledgeMastery {
  overallMasteryScore?: number
  overallMasteryLevel?: string
  coverageRate?: number
  trend?: string
  currentChapterId?: string
  chapterSummaries?: Record<string, ChapterSummary>
  knowledgePoints?: Record<string, KnowledgePoint>
  // Legacy frontend/mock shape. The backend field is chapterSummaries.
  chapters?: Record<string, ChapterSummary>
  metadata?: DimensionMetadata
}

export interface SubjectGoals {
  goalIds?: string[]
}

export interface SubjectLearningPreferenceOverride {
  preferredResourceTypes?: string[]
}

export interface SubjectBehavior {
  statisticsWindows?: Record<string, any>
  statisticsWindow?: Record<string, any>
  behaviorPatterns?: Record<string, any>
  resourceEffectiveness?: Record<string, any>
  trends?: Record<string, any>
  engagement?: Record<string, any>
}

export interface CurrentLearningState {
  stateId?: string
  learningStatus?: string
  currentGoalId?: string
  currentPlanNodeId?: string
  currentChapterId?: string
  currentKnowledgePointId?: string
  currentTask?: Record<string, any>
  blockingIssues?: Record<string, any>
  sessionSignals?: Record<string, any>
  recentPerformance?: Record<string, any>
  readiness?: Record<string, any>
  nextActions?: Record<string, any>[]
  nextAction?: Record<string, any>
}

export interface SubjectMetadata {
  confidence?: number
  completeness?: number
  lastUpdatedAt?: string
  lastAssessedAt?: string
}

export interface SubjectProfile {
  subjectId?: string
  subjectNameCache?: string
  subjectStatus?: string
  profileVersion?: number
  subjectGoals?: SubjectGoals
  knowledgeMastery?: KnowledgeMastery
  subjectMisconceptions?: CommonMisconceptions
  learningPreferenceOverride?: SubjectLearningPreferenceOverride
  learningBehavior?: SubjectBehavior
  currentLearningState?: CurrentLearningState
  metadata?: SubjectMetadata
}

export interface SubjectProfiles {
  profiles?: Record<string, SubjectProfile>
}

// ==================== 主接口 ====================

/** 学生画像完整数据（与后端 StudentProfile 实体对齐） */
export interface StudentProfileData {
  id?: number
  userId?: number
  profileVersion?: number
  // 7 个画像维度
  learningBackground?: LearningBackground
  learningGoals?: LearningGoals
  abilityProfile?: AbilityProfile
  commonMisconceptions?: CommonMisconceptions
  learningPreference?: LearningPreference
  metacognitiveProfile?: MetacognitiveProfile
  subjectProfiles?: SubjectProfiles
  // 维度元数据
  dimensionMetadata?: Record<string, DimensionMetadata>
  // 系统字段
  profileSummary?: string
  profileCompleteness?: number
  profileConfidenceScore?: number
  lastUpdateReason?: string
  lastAssessedAt?: string
  createdAt?: string
  updatedAt?: string
}

/** 引导页初始化参数 */
export interface ProfileInitParams {
  identity?: string
  grade?: string
  direction?: string
  directionDetail?: string
  level?: string
  levelDetail?: string
  goal?: string
  goalDetail?: string
  goalDeadline?: string
  dailyStudyTime?: string
  selfDescription?: string
}

export const studentProfileApi = {
  /** 获取当前用户的学生画像 */
  getProfile() {
    return request.get<StudentProfileData>('/student-profile')
  },

  /** 更新学生画像 */
  updateProfile(data: StudentProfileData) {
    return request.put<string>('/student-profile', data)
  },

  /** 引导页初始化画像 */
  initProfile(params: ProfileInitParams) {
    return request.post<string>('/student-profile/init', params)
  }
}

export default studentProfileApi
