// @ts-nocheck
import type { SpaceDashboardVO, TaskVO, PathNodeVO, PathEdgeVO, ResourceVO, LearningRecordVO, AgentActionVO } from '@/types/learningSpace'

// ============================================================
// 高等数学学习空间 — 完整 Mock 数据
// ============================================================

const today = new Date().toISOString().slice(0, 10)

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

// ---- Tasks ----

const mockTodayTasks: TaskVO[] = [
  {
    id: 101,
    spaceId: 1,
    pathNodeId: 2,
    title: '洛必达法则专项练习',
    description: '针对洛必达法则的适用条件进行专项训练，重点掌握0/0和∞/∞型极限的判定',
    taskType: 'daily',
    priority: 5,
    status: 'pending',
    dueDate: today,
    dueTime: '10:00',
    estimatedDurationMinutes: 25,
    actualDurationMinutes: null,
    completedAt: null,
    aiSuggestion: '连续出错3次，建议重点复习适用条件',
    isOverdue: false,
    isToday: true,
    metadata: { weakPoint: '洛必达法则适用条件' },
  },
  {
    id: 102,
    spaceId: 1,
    pathNodeId: 2,
    title: '极限运算法则学习',
    description: '学习极限的四则运算法则、复合函数极限、幂指函数极限',
    taskType: 'daily',
    priority: 3,
    status: 'in_progress',
    dueDate: today,
    dueTime: '14:00',
    estimatedDurationMinutes: 20,
    actualDurationMinutes: null,
    completedAt: null,
    aiSuggestion: '建议先完成前置知识回顾再开始新内容',
    isOverdue: false,
    isToday: true,
    metadata: {},
  },
  {
    id: 103,
    spaceId: 1,
    pathNodeId: 2,
    title: '极限定义复习',
    description: '复习数列极限和函数极限的ε-δ定义',
    taskType: 'review',
    priority: 2,
    status: 'completed',
    dueDate: today,
    dueTime: '08:00',
    estimatedDurationMinutes: 15,
    actualDurationMinutes: 12,
    completedAt: today + 'T08:12:00',
    aiSuggestion: null,
    isOverdue: false,
    isToday: true,
    metadata: {},
  },
]

const mockPendingTasks: TaskVO[] = [
  ...mockTodayTasks.filter(t => t.status === 'pending' || t.status === 'in_progress'),
  {
    id: 104,
    spaceId: 1,
    pathNodeId: 2,
    title: '夹逼定理理解与应用',
    description: '学习夹逼定理的证明思路和典型应用场景',
    taskType: 'daily',
    priority: 3,
    status: 'pending',
    dueDate: daysAgo(1),
    dueTime: null,
    estimatedDurationMinutes: 20,
    actualDurationMinutes: null,
    completedAt: null,
    aiSuggestion: null,
    isOverdue: true,
    isToday: false,
    metadata: {},
  },
]

const mockOverdueTasks: TaskVO[] = [
  {
    id: 104,
    spaceId: 1,
    pathNodeId: 2,
    title: '夹逼定理理解与应用',
    description: '学习夹逼定理的证明思路和典型应用场景',
    taskType: 'daily',
    priority: 3,
    status: 'overdue',
    dueDate: daysAgo(1),
    dueTime: null,
    estimatedDurationMinutes: 20,
    actualDurationMinutes: null,
    completedAt: null,
    aiSuggestion: '已逾期1天，建议尽快完成',
    isOverdue: true,
    isToday: false,
    metadata: {},
  },
]

// ---- Path Nodes ----

const mockPathNodes: PathNodeVO[] = [
  {
    id: 1,
    spaceId: 1,
    title: '极限的基本概念',
    description: '理解数列极限与函数极限的定义，掌握极限的直观含义',
    nodeType: 'stage',
    estimatedDurationMinutes: 180,
    difficultyLevel: '基础',
    sortOrder: 1,
    isMilestone: true,
    status: 'completed',
  },
  {
    id: 2,
    spaceId: 1,
    title: '极限运算法则与洛必达法则',
    description: '掌握极限的四则运算、复合极限、洛必达法则及其适用条件',
    nodeType: 'stage',
    estimatedDurationMinutes: 240,
    difficultyLevel: '中等',
    sortOrder: 2,
    isMilestone: true,
    status: 'current',
  },
  {
    id: 3,
    spaceId: 1,
    title: '连续与间断',
    description: '理解连续的定义、间断点分类、闭区间连续函数的性质',
    nodeType: 'stage',
    estimatedDurationMinutes: 200,
    difficultyLevel: '中等',
    sortOrder: 3,
    isMilestone: true,
    status: 'locked',
  },
  {
    id: 4,
    spaceId: 1,
    title: '综合复习与测试',
    description: '对极限与连续进行全面复习，通过综合测试检验掌握程度',
    nodeType: 'stage',
    estimatedDurationMinutes: 120,
    difficultyLevel: '综合',
    sortOrder: 4,
    isMilestone: true,
    status: 'locked',
  },
]

const mockPathEdges: PathEdgeVO[] = [
  { id: 1, fromNodeId: 1, toNodeId: 2, edgeType: 'prerequisite_of' },
  { id: 2, fromNodeId: 2, toNodeId: 3, edgeType: 'prerequisite_of' },
  { id: 3, fromNodeId: 3, toNodeId: 4, edgeType: 'prerequisite_of' },
  { id: 4, fromNodeId: 1, toNodeId: 3, edgeType: 'recommended_before' },
]

// ---- Resources ----

const mockResources: ResourceVO[] = [
  {
    id: 1, spaceId: 1, pathNodeId: 2, taskId: null,
    title: '极限运算法则总结', description: '涵盖四则运算、复合极限、幂指函数极限',
    resourceType: 'doc', url: '#', isAiGenerated: true, source: 'ai',
  },
  {
    id: 2, spaceId: 1, pathNodeId: 2, taskId: 101,
    title: '洛必达法则思维导图', description: '适用条件、常见类型、注意事项',
    resourceType: 'mind_map', url: '#', isAiGenerated: true, source: 'ai',
  },
  {
    id: 3, spaceId: 1, pathNodeId: 2, taskId: 101,
    title: '洛必达法则专项练习题', description: '10道精选练习题，含详细解析',
    resourceType: 'quiz', url: '#', isAiGenerated: true, source: 'ai',
  },
  {
    id: 4, spaceId: 1, pathNodeId: 2, taskId: null,
    title: '极限计算常见错误案例', description: '总结学生最常犯的5类错误',
    resourceType: 'case_study', url: '#', isAiGenerated: true, source: 'ai',
  },
  {
    id: 5, spaceId: 1, pathNodeId: 1, taskId: null,
    title: '极限概念视频讲解', description: 'ε-δ定义的直观理解',
    resourceType: 'video', url: '#', isAiGenerated: false, source: 'curated',
  },
  {
    id: 6, spaceId: 1, pathNodeId: 2, taskId: null,
    title: '极限计算速查表', description: '各类极限计算方法快速查找',
    resourceType: 'doc', url: '#', isAiGenerated: false, source: 'curated',
  },
]

// ---- Learning Records ----

const mockRecentRecords: LearningRecordVO[] = [
  { id: 1, recordDate: today, studyDurationMinutes: 12, tasksCompleted: 1, tasksPlanned: 3, focusLevel: 4, mood: 'focused', selfRating: 4, aiReflection: '复习效率不错，继续保持' },
  { id: 2, recordDate: daysAgo(1), studyDurationMinutes: 45, tasksCompleted: 2, tasksPlanned: 3, focusLevel: 3, mood: 'normal', selfRating: 3, aiReflection: '洛必达法则练习正确率偏低，需要更多练习' },
  { id: 3, recordDate: daysAgo(2), studyDurationMinutes: 60, tasksCompleted: 3, tasksPlanned: 3, focusLevel: 5, mood: 'motivated', selfRating: 5, aiReflection: '今天状态很好，极限定义掌握扎实' },
  { id: 4, recordDate: daysAgo(3), studyDurationMinutes: 30, tasksCompleted: 1, tasksPlanned: 2, focusLevel: 3, mood: 'tired', selfRating: 2, aiReflection: '学习时长偏短，建议调整学习时段' },
  { id: 5, recordDate: daysAgo(4), studyDurationMinutes: 55, tasksCompleted: 2, tasksPlanned: 3, focusLevel: 4, mood: 'normal', selfRating: 4, aiReflection: '数列极限部分完成，可以进入下一阶段' },
  { id: 6, recordDate: daysAgo(5), studyDurationMinutes: 40, tasksCompleted: 2, tasksPlanned: 2, focusLevel: 4, mood: 'focused', selfRating: 4, aiReflection: '进度正常' },
  { id: 7, recordDate: daysAgo(6), studyDurationMinutes: 50, tasksCompleted: 2, tasksPlanned: 3, focusLevel: 3, mood: 'normal', selfRating: 3, aiReflection: '第一天学习，基础概念理解需要加强' },
]

// ---- Agent Actions ----

const mockAgentActions: AgentActionVO[] = [
  { id: 1, agentType: 'planner', actionType: 'adjust_plan', targetType: 'task', targetId: 101, reason: '洛必达法则练习正确率降至42%，需要增加针对性练习', status: 'success', createTime: today + 'T09:12:00' },
  { id: 2, agentType: 'resource', actionType: 'generate_resource', targetType: 'resource', targetId: 3, reason: '生成洛必达法则专项练习题', status: 'success', createTime: today + 'T09:14:00' },
  { id: 3, agentType: 'assessment', actionType: 'analyze_errors', targetType: 'task', targetId: 101, reason: '分析洛必达法则错误模式', status: 'success', createTime: daysAgo(1) + 'T21:00:00' },
  { id: 4, agentType: 'profile', actionType: 'update_profile', targetType: 'profile', targetId: null, reason: '更新高数空间画像：极限运算法则薄弱，偏好例题驱动', status: 'success', createTime: daysAgo(1) + 'T21:05:00' },
  { id: 5, agentType: 'memory', actionType: 'update_memory', targetType: 'profile', targetId: null, reason: '记录连续3天洛必达法则练习情况', status: 'success', createTime: daysAgo(1) + 'T21:06:00' },
]

// ---- Dashboard ----

export function getMockDashboard(spaceId: number): SpaceDashboardVO {
  return {
    space: {
      id: spaceId,
      userId: 1,
      name: '高等数学',
      type: 'course',
      description: '大学高等数学上册，重点攻克极限与连续',
      iconUrl: '',
      coverUrl: '',
      goals: '["三周内掌握极限与连续"]',
      progress: 42,
      status: 'active',
      startDate: daysAgo(6),
      targetEndDate: daysAgo(-18),
      actualEndDate: null,
      sortOrder: 0,
      createTime: daysAgo(6) + 'T08:00:00',
      updateTime: today + 'T09:12:00',
    },
    currentGoal: '三周内掌握极限与连续',
    todayTasks: mockTodayTasks,
    pendingTasks: mockPendingTasks,
    overdueTasks: mockOverdueTasks,
    pathNodes: mockPathNodes,
    pathEdges: mockPathEdges,
    pathProgress: {
      completedNodes: 1,
      totalNodes: 4,
      currentNodeId: 2,
      percent: 25,
    },
    resources: mockResources,
    recentRecords: mockRecentRecords,
    agentInsight: '你在洛必达法则适用条件上连续出错，建议今天优先完成极限专项练习',
    riskStatus: 'normal',
    streakDays: 5,
    progress: 42,
    recentAgentActions: mockAgentActions,
    daysRemaining: 18,
  }
}

// ---- Task State Mutations (mock) ----

const taskMap = new Map(mockTodayTasks.map(t => [t.id, { ...t }]))

export function mockUpdateTaskStatus(taskId: number, status: TaskVO['status']): TaskVO {
  const task = taskMap.get(taskId)
  if (!task) throw new Error(`Task ${taskId} not found`)
  task.status = status
  if (status === 'completed') {
    task.completedAt = new Date().toISOString()
  }
  return { ...task }
}

export function mockCompleteTask(taskId: number, data: { actualDurationMinutes: number }): TaskVO {
  const task = taskMap.get(taskId)
  if (!task) throw new Error(`Task ${taskId} not found`)
  task.status = 'completed'
  task.completedAt = new Date().toISOString()
  task.actualDurationMinutes = data.actualDurationMinutes
  return { ...task }
}

import type { TaskStatus } from '@/types/learningSpace'
