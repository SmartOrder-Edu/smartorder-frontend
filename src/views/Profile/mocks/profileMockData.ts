/**
 * Profile page mock data
 * 各模块在 API 无数据时的 mock fallback
 * 数据力求丰富、多样，让图表和列表看起来充实好看
 */

import type {
  RadarDimension,
  SubjectBarItem,
  PreferenceItem,
  MistakeItem,
  CurrentStatus,
  LearningSuggestion,
  MetacognitiveItem,
  KnowledgeDistribution,
  WeakKnowledgeItem,
  TrendData,
  StageSummary,
  PathStep,
  RecommendedResource,
} from '../types/profile'

// ==================== 能力雷达 - 画像页兜底能力数据 ====================
export function mockRadarDimensions(): RadarDimension[] {
  return [
    { name: '编程实现', score: 86 },
    { name: '算法思维', score: 72 },
    { name: '调试排错', score: 68 },
    { name: '系统设计', score: 54 },
    { name: '协作沟通', score: 78 },
    { name: '学习迁移', score: 82 },
  ]
}

// ==================== 能力雷达 - 同年级平均 ====================
export function mockPeerRadarData(dimensionNames: string[]): RadarDimension[] {
  const baseScores: Record<string, number> = {
    '编程实现': 70, '算法思维': 64, '调试排错': 60,
    '系统设计': 50, '协作沟通': 66, '学习迁移': 68,
    '知识理解': 62, '实践能力': 55, '解题能力': 58,
    '自我监控': 48, '反思能力': 45, '迁移应用': 50,
    逻辑思维: 60, 创新思维: 42, 协作能力: 55, 表达能力: 50,
  }
  return dimensionNames.map((name) => ({
    name,
    score: baseScores[name] ?? Math.round(42 + Math.random() * 25),
  }))
}

// ==================== 学科掌握度 ====================
export function mockSubjectBarData(): SubjectBarItem[] {
  return [
    { name: '数据结构', mastery: 78, lastTestTime: '2026-07-15', trend: 'up' },
    { name: '操作系统', mastery: 65, lastTestTime: '2026-07-12', trend: 'stable' },
    { name: '计算机网络', mastery: 72, lastTestTime: '2026-07-10', trend: 'up' },
    { name: '算法设计', mastery: 58, lastTestTime: '2026-07-08', trend: 'down' },
    { name: 'Java', mastery: 85, lastTestTime: '2026-07-16', trend: 'up' },
    { name: 'Python', mastery: 70, lastTestTime: '2026-07-14', trend: 'stable' },
    { name: '数据库原理', mastery: 81, lastTestTime: '2026-07-13', trend: 'up' },
    { name: '软件工程', mastery: 63, lastTestTime: '2026-07-11', trend: 'down' },
  ]
}

// ==================== 近 7 天学习趋势 ====================
export function mockTrendData(metric: 'duration' | 'tasks' | 'accuracy'): TrendData {
  const dates: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }

  switch (metric) {
    case 'duration':
      return { dates, values: [2.5, 3.2, 1.8, 4.0, 2.8, 3.5, 3.0] }
    case 'tasks':
      return { dates, values: [3, 5, 2, 6, 4, 5, 7] }
    case 'accuracy':
      return { dates, values: [72, 68, 75, 80, 78, 82, 85] }
    default:
      return { dates, values: [] }
  }
}

// ==================== 学习偏好（mock 补充） ====================
export function mockPreferenceItems(): PreferenceItem[] {
  return [
    { name: '视频', value: 27 },
    { name: '代码示例', value: 29 },
    { name: '文本', value: 13 },
    { name: '图表', value: 17 },
    { name: '测验', value: 15 },
  ]
}

// ==================== 高频错题 ====================
export function mockMistakeList(): MistakeItem[] {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#2563eb', '#8b5cf6']
  return [
    {
      id: 'm-1', name: '指针与引用', percent: 42,
      color: colors[0], count: 28, lastObserved: '2026-07-18',
      recommendation: '建议重点练习指针的间接访问和多级指针场景',
    },
    {
      id: 'm-2', name: '递归与回溯', percent: 35,
      color: colors[1], count: 23, lastObserved: '2026-07-17',
      recommendation: '从简单递归开始，逐步理解递归树和状态回溯',
    },
    {
      id: 'm-3', name: '网络协议', percent: 28,
      color: colors[2], count: 19, lastObserved: '2026-07-16',
      recommendation: '结合 Wireshark 抓包分析加深协议层理解',
    },
    {
      id: 'm-4', name: '数据库设计', percent: 22,
      color: colors[3], count: 15, lastObserved: '2026-07-15',
      recommendation: '通过 ER 图练习将业务需求转化为表结构',
    },
    {
      id: 'm-5', name: '动态规划', percent: 18,
      color: colors[4], count: 12, lastObserved: '2026-07-14',
      recommendation: '掌握状态定义和状态转移方程的核心思想',
    },
  ]
}

// ==================== 当前学习状态 ====================
export function mockCurrentStatus(): CurrentStatus {
  return {
    icon: 'shield',
    name: '稳步提升中',
    description: '你的学习节奏良好，各项能力均衡发展。算法和数据结构进步明显，继续保持当前的学习频率和专注度，有望在下周突破 80% 综合掌握度。',
    focusLevel: 85,
    bestStudyTime: '下午 14:00 - 17:00',
  }
}

// ==================== 学习建议 ====================
export function mockLearningSuggestions(): LearningSuggestion[] {
  return [
    {
      icon: '📖',
      title: '加强算法练习',
      description: '建议每日完成 2-3 道中等难度算法题，重点关注动态规划和图论，预计 2 周内可将算法正确率提升 15%。',
      actionLabel: '开始练习',
    },
    {
      icon: '🔍',
      title: '复盘错题本',
      description: '本周有 12 道错题待复盘，着重分析"指针与引用"和"递归与回溯"两类高频错误，建议逐题写出错因分析。',
      actionLabel: '去复盘',
    },
    {
      icon: '🎯',
      title: '制定周计划',
      description: '根据当前进度，建议设定每周 18 小时学习目标，按学科模块分配到每天，周末安排 2 小时综合复习。',
      actionLabel: '制定计划',
    },
  ]
}

// ==================== 元认知画像 ====================
export function mockMetacognitions(): MetacognitiveItem[] {
  return [
    {
      name: '规划能力', value: 78, level: '良好',
      description: '能把阶段目标拆成每周任务，计划完成稳定性较好',
      trend: 'IMPROVING',
    },
    {
      name: '监控能力', value: 82, level: '优秀',
      description: '能及时发现卡点，并用测评反馈修正学习节奏',
      trend: 'IMPROVING',
    },
    {
      name: '调节能力', value: 74, level: '良好',
      description: '能根据错题类型调整练习强度，薄弱专题仍需持续跟踪',
      trend: 'IMPROVING',
    },
    {
      name: '反思能力', value: 68, level: '中等',
      description: '复盘记录已形成习惯，但错因归纳还可以更结构化',
      trend: 'STABLE',
    },
  ]
}

// ==================== 知识点掌握分布 ====================
export function mockKnowledgeDistribution(): KnowledgeDistribution {
  return {
    mastered: 126,
    basic: 38,
    weak: 15,
    unlearned: 8,
    total: 187,
  }
}

// ==================== 薄弱知识点 ====================
export function mockWeakKnowledgeList(): WeakKnowledgeItem[] {
  return [
    { id: 'wk-1', name: '虚拟内存管理', subject: '操作系统', percent: 38 },
    { id: 'wk-2', name: 'TCP 拥塞控制算法', subject: '计算机网络', percent: 42 },
    { id: 'wk-3', name: '红黑树插入与删除', subject: '数据结构', percent: 45 },
    { id: 'wk-4', name: '数据库事务隔离级别', subject: '数据库原理', percent: 48 },
    { id: 'wk-5', name: '状态压缩动态规划', subject: '算法设计', percent: 52 },
  ]
}

// ==================== 热力图 ====================
export function mockHeatmapData(): number[][] {
  // 7天 x 24小时矩阵，值 0-100 表示学习活跃度
  // 模拟真实学习作息：上午 9-11 中等活跃，下午 14-17 高度活跃，晚上 19-22 再次活跃
  const rows = 24
  const cols = 7
  const data: number[][] = []
  // 每天不同的活跃模式（工作日 vs 周末）
  const dayBoost = [1.0, 1.0, 1.1, 0.9, 1.0, 0.7, 0.8] // 周日最低
  for (let h = 0; h < rows; h++) {
    const row: number[] = []
    for (let d = 0; d < cols; d++) {
      let base = 0
      if (h >= 9 && h <= 11) base = 35 + Math.random() * 30     // 上午中等
      else if (h >= 14 && h <= 17) base = 55 + Math.random() * 40 // 下午高峰
      else if (h >= 19 && h <= 22) base = 30 + Math.random() * 50 // 晚上次高峰
      else if (h >= 6 && h <= 8) base = Math.random() * 20        // 清晨偶尔
      else base = Math.random() * 8                               // 深夜低

      base = Math.round(base * dayBoost[d])
      row.push(Math.min(100, base))
    }
    data.push(row)
  }
  return data
}

// ==================== 阶段学习总结 ====================
export function mockStageSummary(): StageSummary {
  return {
    period: '2026-07-12 ~ 2026-07-18',
    totalHours: 21.5,
    completedTasks: 18,
    accuracy: 76,
    improvement: 8,
    highlights: [
      '完成数据结构二叉树专题学习，章节测试得分提升至 78%',
      '连续 5 天达成每日学习目标，获得"自律达人"成就',
      'Java 编程练习正确率达到 85%，错误主要集中在并发编程',
      '参与 2 次 AI 模拟面试，算法表达能力获导师好评',
      '主动完成 3 次自我评估，元认知反思准确度提升 12%',
    ],
  }
}

// ==================== 学习路径 ====================
export function mockLearningPathSteps(): PathStep[] {
  return [
    { label: '编程基础', status: 'completed', percent: 100 },
    { label: '数据结构', status: 'in_progress', percent: 68 },
    { label: '算法设计', status: 'in_progress', percent: 45 },
    { label: '操作系统', status: 'pending', percent: 0 },
    { label: '计算机网络', status: 'pending', percent: 0 },
    { label: '数据库原理', status: 'pending', percent: 0 },
    { label: '项目实战', status: 'pending', percent: 0 },
  ]
}

// ==================== 推荐资源 ====================
export function mockResources(): RecommendedResource[] {
  return [
    {
      id: 'r-1',
      title: '数据结构与算法之美',
      type: '视频课程',
      duration: '12h',
      difficulty: '中等',
      matchReason: '匹配你的数据结构学习目标',
    },
    {
      id: 'r-3',
      title: '操作系统概念精要',
      type: '文字教材',
      duration: '15h',
      difficulty: '中等',
      matchReason: '匹配你即将开始的操作系统学习路径',
    },
    {
      id: 'r-4',
      title: 'Java 并发编程实战',
      type: '代码实践',
      duration: '10h',
      difficulty: '较难',
      matchReason: 'Java 学科进阶推荐，含实战项目',
    },
    {
      id: 'r-5',
      title: '计算机网络自顶向下',
      type: '视频课程',
      duration: '18h',
      difficulty: '中等',
      matchReason: '覆盖 TCP 拥塞控制等你的薄弱环节',
    },
    {
      id: 'r-6',
      title: '剑指 Offer 编程题精解',
      type: '练习题集',
      duration: '6h',
      difficulty: '中等',
      matchReason: '配套算法设计学习路径的实战训练',
    },
  ]
}
