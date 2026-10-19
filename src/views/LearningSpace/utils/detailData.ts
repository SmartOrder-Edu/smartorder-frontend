import type {
  LearningRecordVO,
  PathNodeVO,
  ResourceType,
  ResourceVO,
  RiskStatus,
  SpaceDashboardVO,
  TaskVO,
} from '@/types/learningSpace'
import type {
  AlgorithmKnowledgeState,
  LearningAlgorithmState,
} from '@/api/algorithm'

export function normalizeText(text: unknown) {
  return String(text || '').trim().toLowerCase()
}

export function clampNumber(value: unknown, min: number, max: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return min
  return Math.min(Math.max(num, min), max)
}

export function percentFromRatio(value: unknown, fallback = 0) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.round(clampNumber(num, 0, 1) * 100)
}

export function allDashboardTasks(dashboard: SpaceDashboardVO | null | undefined) {
  if (!dashboard) return []
  const map = new Map<string, TaskVO>()
  ;[
    ...(dashboard.todayTasks || []),
    ...(dashboard.pendingTasks || []),
    ...(dashboard.overdueTasks || []),
  ].forEach(task => map.set(task.id, task))
  return [...map.values()]
}

export function childNodeIds(nodes: PathNodeVO[], nodeId: string) {
  const ids = new Set<string>([nodeId])
  nodes.forEach(node => {
    if (node.parentNodeId === nodeId) ids.add(node.id)
  })
  return ids
}

export function linkedTasks(tasks: TaskVO[], nodes: PathNodeVO[], nodeId: string) {
  const ids = childNodeIds(nodes, nodeId)
  return tasks.filter(task => task.pathNodeId && ids.has(task.pathNodeId))
}

export function linkedResources(resources: ResourceVO[], nodes: PathNodeVO[], nodeId: string) {
  const ids = childNodeIds(nodes, nodeId)
  return resources.filter(resource => resource.pathNodeId && ids.has(resource.pathNodeId))
}

export function findKnowledgeStateForNode(
  node: PathNodeVO | null | undefined,
  algorithmState: LearningAlgorithmState | null | undefined
) {
  if (!node || !algorithmState) return null
  const states = algorithmState.knowledgeStates || []
  const weakPoints = algorithmState.weakPoints || []
  return [...states, ...weakPoints].find(state => {
    const stateId = String(state.knowledgeNodeId || '')
    const titleText = normalizeText(node.title)
    const stateName = normalizeText(state.name)
    return stateId === node.id
      || Boolean(node.kpUid && stateId === String(node.kpUid))
      || stateName === titleText
      || stateName.includes(titleText)
      || titleText.includes(stateName)
  }) || null
}

export function findWeakPointForNode(
  node: PathNodeVO | null | undefined,
  algorithmState: LearningAlgorithmState | null | undefined
) {
  if (!node || !algorithmState) return null
  const titleText = normalizeText(node.title)
  return (algorithmState.weakPoints || []).find(point => {
    const stateId = String(point.knowledgeNodeId || '')
    const nameText = normalizeText(point.name)
    return stateId === node.id
      || Boolean(node.kpUid && stateId === String(node.kpUid))
      || nameText === titleText
      || nameText.includes(titleText)
      || titleText.includes(nameText)
  }) || null
}

export function nodeMasteryPercent(
  node: PathNodeVO | null | undefined,
  knowledgeState: AlgorithmKnowledgeState | null | undefined,
  fallbackProgress = 0
) {
  if (knowledgeState?.mastery != null) return percentFromRatio(knowledgeState.mastery, 0)
  if (node?.status === 'completed') return 92
  if (node?.status === 'current') return Math.max(45, Math.round(fallbackProgress))
  return 18
}

export function riskLabel(status: RiskStatus | string | undefined) {
  const map: Record<string, string> = { good: '良好', normal: '正常', warning: '注意', danger: '危险' }
  return map[String(status || '')] || String(status || '正常')
}

export function taskStatusLabel(status: string | undefined) {
  const map: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    doing: '进行中',
    completed: '已完成',
    overdue: '已逾期',
    cancelled: '已取消',
  }
  return map[String(status || '')] || String(status || '待开始')
}

export function resourceTypeLabel(type: ResourceType | string | undefined) {
  const map: Record<string, string> = {
    doc: '文档',
    html: 'HTML',
    ppt: 'PPT',
    video: '视频',
    mind_map: '思维导图',
    quiz: '练习题',
    case_study: '案例',
    flashcard_set: '闪卡',
    image: '图片',
    audio: '音频',
    link: 'B站推荐',
  }
  return map[String(type || '')] || String(type || '资源')
}

export function formatMinutes(minutes: number | null | undefined, fallback = '待估算') {
  const value = Number(minutes || 0)
  return value > 0 ? `${value} 分钟` : fallback
}

export function buildMockLearningRecords(): LearningRecordVO[] {
  const source = [
    { daysAgo: 20, minutes: 42, completed: 2, planned: 3, focus: 3, mood: 'normal', rating: 3, reflection: '完成练习，但错题需要二次复盘。' },
    { daysAgo: 18, minutes: 28, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '保持最低学习量，避免中断。' },
    { daysAgo: 17, minutes: 64, completed: 2, planned: 3, focus: 4, mood: 'focused', rating: 4, reflection: '专项练习效果较好，继续巩固薄弱点。' },
    { daysAgo: 16, minutes: 88, completed: 3, planned: 3, focus: 4, mood: 'motivated', rating: 4, reflection: '任务完成质量较高，可增加综合题。' },
    { daysAgo: 13, minutes: 22, completed: 1, planned: 2, focus: 2, mood: 'low', rating: 2, reflection: '状态偏低，建议减少新知识输入。' },
    { daysAgo: 12, minutes: 55, completed: 2, planned: 3, focus: 4, mood: 'normal', rating: 4, reflection: '恢复正常节奏，错题回顾有效。' },
    { daysAgo: 10, minutes: 76, completed: 3, planned: 3, focus: 5, mood: 'focused', rating: 5, reflection: '今天适合推进核心知识点。' },
    { daysAgo: 9, minutes: 46, completed: 2, planned: 2, focus: 4, mood: 'normal', rating: 4, reflection: '复习任务完成，保持当前节奏。' },
    { daysAgo: 6, minutes: 31, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '开始新一轮复习，先处理基础题。' },
    { daysAgo: 5, minutes: 67, completed: 2, planned: 3, focus: 4, mood: 'focused', rating: 4, reflection: '薄弱点练习有效，建议明天继续。' },
    { daysAgo: 4, minutes: 104, completed: 4, planned: 4, focus: 5, mood: 'motivated', rating: 5, reflection: '本周最高活跃日，学习效率很好。' },
    { daysAgo: 3, minutes: 44, completed: 2, planned: 3, focus: 3, mood: 'normal', rating: 3, reflection: '完成主要任务，留一个复盘尾巴。' },
    { daysAgo: 2, minutes: 58, completed: 2, planned: 2, focus: 4, mood: 'focused', rating: 4, reflection: '连续学习状态稳定。' },
    { daysAgo: 1, minutes: 39, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '轻量复习，适合作为过渡。' },
    { daysAgo: 0, minutes: 82, completed: 3, planned: 3, focus: 5, mood: 'focused', rating: 5, reflection: '今天状态集中，可以继续完成高优任务。' },
  ]
  const now = new Date()
  return source.map((record, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - record.daysAgo)
    return {
      id: index + 1,
      recordDate: date.toISOString().slice(0, 10),
      studyDurationMinutes: record.minutes,
      tasksCompleted: record.completed,
      tasksPlanned: record.planned,
      focusLevel: record.focus,
      mood: record.mood,
      selfRating: record.rating,
      aiReflection: record.reflection,
    }
  })
}

export function reportSummary(
  dashboard: SpaceDashboardVO | null | undefined,
  records: LearningRecordVO[],
  algorithmState: LearningAlgorithmState | null | undefined
) {
  const tasks = allDashboardTasks(dashboard)
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const totalTasks = Math.max(tasks.length, 1)
  const totalMinutes = records.reduce((sum, record) => sum + Number(record.studyDurationMinutes || 0), 0)
  const planned = records.reduce((sum, record) => sum + Number(record.tasksPlanned || 0), 0)
  const done = records.reduce((sum, record) => sum + Number(record.tasksCompleted || 0), 0)
  const avgFocus = records.length
    ? records.reduce((sum, record) => sum + Number(record.focusLevel || 0), 0) / records.length
    : 0
  const states = algorithmState?.knowledgeStates || []
  const avgMastery = states.length
    ? states.reduce((sum, state) => sum + clampNumber(state.mastery, 0, 1), 0) / states.length
    : Number(dashboard?.progress || 0) / 100

  return {
    totalMinutes,
    completedTasks,
    taskCompletionRate: Math.round((done || completedTasks) / Math.max(planned || totalTasks, 1) * 100),
    avgFocus: Number(avgFocus.toFixed(1)),
    masteryPercent: Math.round(clampNumber(avgMastery, 0, 1) * 100),
    weakCount: algorithmState?.weakPoints?.length || 0,
  }
}
