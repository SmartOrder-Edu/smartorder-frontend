<template>
  <div v-if="isObject(value)" class="detail-object">
    <div v-for="[key, item] in objectEntries" :key="key" class="detail-row">
      <span class="detail-label">{{ labelOf(key) }}</span>
      <ProfileDetailValue :value="item" :depth="depth + 1" :fieldKey="key" />
    </div>
  </div>
  <div v-else-if="Array.isArray(value) && arrayContainsObject" class="detail-array">
    <ProfileDetailValue v-for="(item, index) in value" :key="index" :value="item" :depth="depth + 1" :fieldKey="fieldKey" />
  </div>
  <div v-else-if="Array.isArray(value)" class="detail-tags">
    <span v-for="item in value" :key="String(item)" class="detail-tag">{{ formatValue(item) }}</span>
  </div>
  <span v-else class="detail-value">{{ formatValue(value) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'ProfileDetailValue' })

const props = withDefaults(defineProps<{
  value: unknown
  depth?: number
  fieldKey?: string
}>(), { depth: 0, fieldKey: '' })

const labels: Record<string, string> = {
  // 顶层及通用字段
  id: '主键ID',
  userId: '用户ID',
  profileVersion: '画像版本号',
  profileSummary: '画像摘要',
  lastUpdateReason: '最近更新原因',
  updatedAt: '更新时间',
  createdAt: '创建时间',
  dimensionMetadata: '维度更新信息',
  metadata: '维度元数据',
  confidence: '置信度',
  completeness: '完整度',
  sourceTypes: '数据来源类型',
  evidenceIds: '证据ID列表',
  lastUpdatedAt: '最近更新时间',
  updatedBy: '更新者',
  updateReason: '更新原因',
  validUntil: '有效期限',
  schemaVersion: 'Schema版本号',

  // 学习背景 (LearningBackgroundDTO)
  learningBackground: '学习背景',
  currentLevelDetail: '当前水平',
  selfDescription: '自我描述',
  education: '教育背景',
  educationLevel: '学历',
  grade: '年级',
  majorCode: '专业代码',
  majorName: '专业名称',
  enrollmentYear: '入学年份',
  priorExperience: '既往经验',
  completedSubjects: '已学课程',
  programmingLanguages: '编程语言',
  prerequisiteFoundation: '前置基础满足情况',
  prerequisiteFoundationDetail: '前置基础满足详情',
  learningConstraints: '学习约束',
  weeklyAvailableMinutes: '每周可学习时间',
  preferredStudyPeriods: '偏好学习时段',
  maxSessionMinutes: '单次最长学习时长（分钟）',
  deviceTypes: '设备类型',
  networkCondition: '网络条件',
  accessibilityNeeds: '无障碍需求',
  subjectId: '科目ID',
  subjectName: '科目名称',
  completionStatus: '完成状态',
  selfReportedLevel: '自评水平',
  verifiedLevel: '验证水平',
  lastStudiedAt: '最近学习时间',
  experienceMonths: '经验月数',
  status: '状态',
  score: '得分',

  // 全局学习目标 (LearningGoalsDTO)
  learningGoals: '学习目标详情',
  primaryGoalId: '主目标ID',
  goals: '目标列表',
  goalId: '目标ID',
  scope: '范围',
  title: '标题',
  description: '描述',
  goalType: '目标类型',
  targetLevel: '目标水平',
  targetKnowledgePointIds: '目标知识点',
  measurableCriteria: '衡量条件',
  priority: '优先级',
  startAt: '开始时间',
  deadline: '截止时间',
  weeklyTimeBudgetMinutes: '每周时间预算',
  progress: '进度',
  progressPercent: '进度百分比',
  completedCriteriaCount: '已完成标准数',
  totalCriteriaCount: '总标准数',
  calculationMethod: '计算方式',
  metric: '度量指标',
  operator: '比较运算符',
  targetValue: '目标值',

  // 综合能力 (AbilityProfileDTO)
  abilityProfile: '能力画像详情',
  overallScore: '综合能力得分',
  overallLevel: '综合能力等级',
  abilities: '能力列表',
  strengthAbilityCodes: '优势能力代码',
  developmentPriorityCodes: '优先发展能力代码',
  abilityCode: '能力代码',
  abilityName: '能力名称',
  level: '等级',
  trend: '趋势',
  strengthSummary: '优势说明',
  improvementFocus: '改进方向',
  lastEvaluatedAt: '最近评估时间',

  // 共性易错模式 (CommonMisconceptionsDTO)
  commonMisconceptions: '常见误区详情',
  patterns: '易错模式列表',
  misconceptionId: '易错模式ID',
  category: '分类',
  typicalSymptoms: '典型症状',
  affectedSubjectIds: '影响科目',
  affectedKnowledgePointIds: '影响知识点',
  rootCauseHypotheses: '根因假设',
  severity: '严重程度',
  frequency: '出现频率',
  persistence: '持续性',
  occurrenceStatistics: '出现统计',
  intervention: '干预建议',
  causeCode: '原因代码',
  probability: '概率',
  countLast7Days: '最近7天出现次数',
  countLast30Days: '最近30天出现次数',
  firstDetectedAt: '首次检测时间',
  lastObservedAt: '最近出现时间',
  strategyCodes: '策略代码',
  recommendedActions: '建议行动',
  successCriteria: '成功标准',

  // 稳定学习偏好 (LearningPreferenceDTO)
  learningPreference: '学习偏好详情',
  resourcePreferences: '资源偏好',
  explanationPreferences: '讲解偏好',
  practicePreferences: '练习偏好',
  feedbackPreferences: '反馈偏好',
  interactionPreferences: '交互偏好',
  subjectOverrides: '科目级偏好覆盖',
  resourceType: '资源类型',
  declaredPreference: '声明偏好',
  observedEffectivenessScore: '观测有效性得分',
  selectionRate: '选择率',
  postLearningAccuracyRate: '学习后正确率',
  preferredSequence: '偏好讲解顺序',
  contentGranularity: '内容粒度',
  preferredRepresentation: '偏好表征方式',
  preferredLanguageStyle: '偏好语言风格',
  analogyPreference: '类比偏好',
  practiceTiming: '练习时机',
  preferredQuestionTypes: '偏好题型',
  preferredDifficultyProgression: '难度递进方式',
  preferredQuestionsPerSession: '每次练习题数',
  allowHints: '是否允许提示',
  preferredHintStyle: '偏好提示风格',
  feedbackTiming: '反馈时机',
  feedbackDetailLevel: '反馈详细程度',
  showCorrectAnswerImmediately: '是否立即显示正确答案',
  showErrorCause: '是否显示错误原因',
  showImprovementSuggestion: '是否显示改进建议',
  preferredInteractionMode: '偏好交互模式',
  allowAgentProactiveReminder: '是否允许智能体主动提醒',
  preferredReminderFrequency: '偏好提醒频率',
  preferredQuestioningStyle: '偏好提问风格',
  preferredResourceTypes: '偏好资源类型列表',
  preferredExplanationSequence: '偏好讲解顺序',
  reason: '覆盖原因',

  // 元认知画像 (MetacognitiveProfileDTO)
  metacognitiveProfile: '元认知画像详情',
  dimensions: '元认知维度',
  calibrationStatistics: '信心校准统计',
  recommendedSupport: '推荐支持策略',
  dimensionCode: '维度代码',
  dimensionName: '维度名称',
  selfPredictedAccuracyRate: '自预测正确率',
  actualAccuracyRate: '实际正确率',
  calibrationGap: '校准偏差',
  calibrationStatus: '校准状态',
  sampleCount: '样本数量',
  planningSupportLevel: '规划支持级别',
  reflectionPromptFrequency: '反思提示频率',
  requireConfidencePredictionBeforeAnswer: '答题前是否要求信心预测',
  recommendedInterventions: '推荐干预措施',

  // 各科目画像集合 (SubjectProfilesDTO)
  subjectProfiles: '学科画像详情',
  profiles: '科目画像详情',
  subjectNameCache: '科目名称',
  subjectStatus: '科目状态',
  subjectGoals: '科目目标',
  subjectMisconceptions: '共性易错模式',
  learningPreferenceOverride: '学习偏好覆盖',
  learningBehavior: '学习行为',
  currentLearningState: '当前学习状态',
  goalIds: '目标ID列表',
  lastAssessedAt: '最近评估时间',

  // 当前学习状态 (CurrentLearningStateDTO)
  stateId: '状态ID',
  learningStatus: '学习状态',
  currentGoalId: '当前目标ID',
  currentPlanNodeId: '当前计划节点ID',
  currentChapterId: '当前章节ID',
  currentKnowledgePointId: '当前知识点ID',
  currentTask: '当前任务',
  blockingIssues: '阻塞问题',
  sessionSignals: '会话信号',
  recentPerformance: '最近表现',
  readiness: '就绪度',
  nextActions: '下一步行动',
  validFrom: '有效期开始',
  taskId: '任务ID',
  taskType: '任务类型',
  attemptCount: '尝试次数',
  hintCount: '提示次数',
  issueId: '问题ID',
  issueType: '问题类型',
  engagementLevel: '参与度',
  cognitiveLoad: '认知负荷',
  confusionLevel: '困惑程度',
  frustrationSignal: '挫败感信号',
  continueCurrentTask: '建议继续当前任务',
  needRemediation: '需要补救',
  recommendedDifficulty: '推荐难度',
  recommendedSupportLevel: '推荐支持级别',
  order: '顺序',
  actionType: '行动类型',
  estimatedMinutes: '预估时长（分钟）',
  recentAttemptCount: '最近尝试次数',
  recentAccuracyRate: '最近正确率',
  consecutiveWrongCount: '连续错误数',
  averageResponseSeconds: '平均响应时间（秒）',
  hintUsageCount: '提示使用次数',

  // 知识掌握度 (KnowledgeMasteryDTO)
  knowledgeMastery: '知识掌握度',
  overallMasteryScore: '综合掌握度得分',
  overallMasteryLevel: '综合掌握度等级',
  coverageRate: '知识点覆盖率',
  chapterSummaries: '章节摘要',
  knowledgePoints: '知识点详情',
  chapterName: '章节名称',
  completedKnowledgePointCount: '已完成知识点数',
  totalKnowledgePointCount: '知识点总数',
  weakKnowledgePointIds: '薄弱知识点列表',
  knowledgePointNameCache: '知识点名称',
  knowledgeType: '知识类型',
  importance: '重要性',
  prerequisiteKnowledgePointIds: '前置知识点',
  cognitiveMastery: '认知掌握度',
  independenceLevel: '独立完成水平',
  prerequisiteReadiness: '前置知识就绪度',
  assessmentStatistics: '评估统计',
  retention: '保持力',
  misconceptions: '知识点级易错模式',
  firstLearnedAt: '首次学习时间',
  remember: '记忆',
  understand: '理解',
  apply: '应用',
  analyze: '分析',
  implement: '实现',
  unsatisfiedKnowledgePointIds: '未满足的前置知识点',
  correctCount: '正确次数',
  partialCorrectCount: '部分正确次数',
  wrongCount: '错误次数',
  accuracyRate: '正确率',
  independentCorrectRate: '独立正确率',
  highestCompletedDifficulty: '最高完成难度',
  lastPracticedAt: '最近练习时间',
  nextReviewAt: '下一次复习时间',
  forgettingRisk: '遗忘风险',
  retentionScore: '保持力得分',

  // 学习行为 (LearningBehaviorDTO)
  statisticsWindows: '时间窗口统计',
  behaviorPatterns: '行为模式',
  resourceEffectiveness: '资源有效性',
  trends: '趋势',
  engagement: '参与度',
  windowStart: '窗口开始时间',
  windowEnd: '窗口结束时间',
  activeDays: '活跃天数',
  studyMinutes: '学习时长（分钟）',
  sessionCount: '学习会话数',
  resourceViewCount: '资源查看数',
  resourceCompletionRate: '资源完成率',
  exerciseAttemptCount: '练习尝试数',
  exerciseAccuracyRate: '练习正确率',
  independentAccuracyRate: '独立正确率',
  hintUsageRate: '提示使用率',
  reviewCount: '复习次数',
  activeQuestionCount: '活跃提问数',
  taskAbandonmentRate: '任务放弃率',
  preferredStudyPeriod: '偏好学习时段',
  studyRegularnessScore: '学习规律性得分',
  persistenceScore: '持续性得分',
  reviewRegularnessScore: '复习规律性得分',
  procrastinationRisk: '拖延风险',
  hintDependency: '提示依赖度',
  rapidGuessingRisk: '快速猜测风险',
  viewCount: '查看次数',
  averageEngagementScore: '平均参与度得分',
  studyDurationTrend: '学习时长趋势',
  accuracyTrend: '正确率趋势',
  independentCompletionTrend: '独立完成趋势',
  hintUsageTrend: '提示使用趋势',
  engagementScore: '参与度得分',
  riskFlags: '风险标记'
}

const valueTranslations: Record<string, string> = {
  UNDERGRADUATE: '本科',
  GRADUATE: '研究生',
  DOCTORAL: '博士生',
  SELF_TAUGHT: '自学者',
  FRESHMAN: '大一',
  SOPHOMORE: '大二',
  JUNIOR: '大三',
  SENIOR: '大四',
  BEGINNER: '入门',
  DEVELOPING: '发展中',
  PROFICIENT: '熟练',
  MASTER: '精通',
  ADVANCED: '优秀/高级',
  COMPLETED: '已完成',
  IN_PROGRESS: '进行中',
  PAUSED: '已暂停',
  ARCHIVED: '已归档',
  ACTIVE: '激活',
  RESOLVED: '已解决',
  SATISFIED: '已满足',
  PARTIALLY_SATISFIED: '部分满足',
  NOT_SATISFIED: '未满足',
  READY: '已就绪',
  PARTIALLY_READY: '部分就绪',
  NOT_READY: '未就绪',
  EVENING: '晚上',
  MORNING: '早上',
  AFTERNOON: '下午',
  NIGHT: '深夜/夜间',
  PC: '电脑',
  MOBILE: '手机',
  TABLET: '平板',
  STABLE: '稳定',
  UNSTABLE: '不稳定',
  IMPROVING: '提升中',
  STABLE_TREND: '稳定',
  DECLINING: '下降中',
  BOUNDARY_CONDITION_OMISSION: '边界条件遗漏',
  PROCEDURE_ORDER_ERROR: '过程顺序错误',
  CONCEPT_CONFUSION: '概念混淆',
  CROSS_SUBJECT: '跨科目',
  SUBJECT_SPECIFIC: '科目特异',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  FREQUENT: '频繁',
  OCCASIONAL: '偶尔',
  RARE: '罕见',
  PERSISTENT: '持续性',
  TRANSIENT: '暂时性',
  FLOW: '专注/心流',
  STUCK: '卡壳',
  FRUSTRATED: '挫败',
  DISENGAGED: '分心/抽离',
  CODE_IMPLEMENTATION: '代码实现',
  QUIZ: '测验/问答',
  USER_EXPLICIT: '用户显式提供',
  QUIZ_RESULT: '测验结果',
  CODE_EVALUATION: '代码评测',
  SYSTEM_DERIVED: '系统自动推导',
  SYSTEM_INFERRED: '系统推断',
  ASSESSMENT_AGENT: '评估智能体',
  PROFILE_AGENT: '画像智能体',
  GUIDED: '引导式',
  PROMPTED: '提示式',
  INDEPENDENT: '独立式',
  WITH_HINT: '使用提示',
  NEEDS_GUIDANCE: '需要引导',
  VIEW_DIAGRAM: '查看图表',
  TRACE_CODE: '追踪代码',
  PRACTICE: '练习',
  CONCEPT: '概念',
  PROCEDURE_AND_IMPLEMENTATION: '过程与实现',
  GREATER_THAN_OR_EQUAL: '大于等于',
  LESS_THAN_OR_EQUAL: '小于等于',
  EQUAL: '等于',
  GREATER_THAN: '大于',
  LESS_THAN: '小于',
  EXAMPLE_THEN_PRINCIPLE: '先看代码示例再学习概念',
  PRINCIPLE_THEN_EXAMPLE: '先看概念再看代码示例',
  FINE: '细粒度',
  COARSE: '粗粒度',
  LEARN_THEN_IMMEDIATE_PRACTICE: '学完立即练习',
  BATCH_PRACTICE_LATER: '集中练习',
  GRADUAL: '循序渐进',
  IMMEDIATE_CHALLENGE: '直接挑战难题',
  IMMEDIATE_FEEDBACK: '立即反馈',
  IMMEDIATE: '立即',
  DELAYED: '延迟反馈',
  DETAILED: '详细反馈',
  BRIEF: '简短反馈',
  GUIDED_DIALOGUE: '引导式对话',
  FREE_EXPLORATION: '自由探索',
  SOCRATIC_WITH_HINT: '苏格拉底式启发',
  DIRECT: '直接回答/解析',
  OVERCONFIDENT: '过度自信',
  UNDERCONFIDENT: '自信不足',
  WELL_CALIBRATED: '校准良好',
  TEXT_EXPLANATION: '文字讲解',
  CODE_SNIPPET: '代码片段',
  FLOW_DIAGRAM: '流程图/图示'
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const objectEntries = computed(() => {
  if (!isObject(props.value)) return []
  return Object.entries(props.value).filter(([key, value]) => 
    key !== 'lastUpdatedAt' && 
    key !== 'updatedAt' && 
    value !== null && 
    value !== undefined && 
    value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
})

const arrayContainsObject = computed(() => Array.isArray(props.value) && props.value.some(isObject))

const labelOf = (key: string) => labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())
const formatValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? '是' : '否'
  
  if (typeof value === 'number') {
    const percentFields = [
      'confidence', 'probability', 'coverageRate', 'progressPercent', 
      'selectionRate', 'completionRate', 'postLearningAccuracyRate', 
      'resourceCompletionRate', 'exerciseAccuracyRate', 'independentAccuracyRate', 
      'hintUsageRate', 'taskAbandonmentRate', 'recentAccuracyRate', 
      'accuracyRate', 'independentCorrectRate', 'selfPredictedAccuracyRate', 
      'actualAccuracyRate', 'calibrationGap'
    ]
    if (percentFields.includes(props.fieldKey || '') && value >= 0 && value <= 1) {
      return `${Math.round(value * 100)}%`
    }
    
    if ((props.fieldKey === 'weeklyAvailableMinutes' || props.fieldKey === 'weeklyTimeBudgetMinutes' || props.fieldKey === 'studyMinutes') && typeof value === 'number') {
      const hours = value / 60
      return `${parseFloat(hours.toFixed(1))} 小时`
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (valueTranslations[trimmed]) {
      return valueTranslations[trimmed]
    }
    const upper = trimmed.toUpperCase()
    if (valueTranslations[upper]) {
      return valueTranslations[upper]
    }
  }
  
  return String(value)
}
</script>

<style scoped>
.detail-object { display: grid; gap: 10px; width: 100%; }
.detail-row { display: grid; grid-template-columns: minmax(130px, 180px) 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid var(--border-light); }
.detail-label { color: var(--text-secondary); font-size: 0.8125rem; }
.detail-value { color: var(--text-dark); font-size: 0.875rem; overflow-wrap: anywhere; }
.detail-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-tag { padding: 4px 8px; border-radius: 999px; background: var(--bg-light); color: var(--text-dark); font-size: 0.8125rem; }
.detail-array { display: grid; gap: 10px; }
@media (max-width: 640px) { .detail-row { grid-template-columns: 1fr; gap: 4px; } }
</style>
