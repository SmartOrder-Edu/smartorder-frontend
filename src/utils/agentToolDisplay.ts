/**
 * Agent 工具调用展示——自然语言生成
 *
 * 把后端工具名、入参、结果转成用户看得懂的自然语言，
 * 不出现 JSON、"参数"、"结果"等技术术语。
 */

// ─── 类型 ──────────────────────────────────────────

export type RiskLevel = 'read' | 'write_draft' | 'write_confirmed'

interface ToolDisplayMeta {
  /** 用户可见的工具名，如"学习画像" */
  label: string
  /** Element Plus 图标名 */
  icon: string
  riskLevel: RiskLevel
}

// ─── 元数据映射 ─────────────────────────────────────

const TOOL_META: Record<string, ToolDisplayMeta> = {
  getStudentProfile:      { label: '学习画像',  icon: 'User',        riskLevel: 'read' },
  queryKnowledge:         { label: '知识图谱',  icon: 'Connection',  riskLevel: 'read' },
  queryLearningProgress:  { label: '学习进度',  icon: 'TrendCharts', riskLevel: 'read' },
  queryTasks:             { label: '学习任务',  icon: 'List',        riskLevel: 'read' },
  manageLearningPlan:     { label: '学习规划',  icon: 'EditPen',     riskLevel: 'write_confirmed' },
  generateResource:       { label: '学习资料',  icon: 'Document',    riskLevel: 'write_confirmed' },
  generateQuiz:           { label: '练习题',    icon: 'Edit',        riskLevel: 'write_confirmed' },
  webSearch:              { label: '网络搜索',  icon: 'Search',      riskLevel: 'read' },
  generateMindMap:        { label: '思维导图',  icon: 'Connection',  riskLevel: 'read' },
  // 兼容旧名字（LangChain4j @Tool 注册名）
  profile_tool:           { label: '学习画像',  icon: 'User',        riskLevel: 'read' },
  knowledge_search_tool:  { label: '知识图谱',  icon: 'Connection',  riskLevel: 'read' },
  learning_plan_tool:     { label: '学习计划',  icon: 'EditPen',     riskLevel: 'write_draft' },
  resource_gen_tool:      { label: '学习资料',  icon: 'Document',    riskLevel: 'write_draft' },
  assessment_tool:        { label: '练习题',    icon: 'Edit',        riskLevel: 'write_draft' },
}

const UNKNOWN_META: ToolDisplayMeta = {
  label: '系统操作',
  icon: 'Setting',
  riskLevel: 'read',
}

/** 获取工具展示元数据 */
export function getToolDisplayMeta(toolName: string): ToolDisplayMeta {
  return TOOL_META[toolName] || UNKNOWN_META
}

// ─── 入参关键词提取 ─────────────────────────────────

/** 从入参中提取最关键的一个描述词（keyword / topic / planDescription 等） */
function extractSubject(args: any): string | null {
  if (!args || typeof args !== 'object') return null
  // 优先级：topic > keyword > planDescription > goal > subject
  const keys = ['topic', 'keyword', 'query', 'planDescription', 'goal', 'subject']
  for (const k of keys) {
    const v = args[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/** 提取天数 */
function extractDays(args: any): number | null {
  if (!args || typeof args !== 'object') return null
  const d = args.recentDays ?? args.days
  return typeof d === 'number' ? d : null
}

/** 提取范围 */
function extractScope(args: any): string | null {
  if (!args || typeof args !== 'object') return null
  const s = args.scope
  if (typeof s !== 'string') return null
  const map: Record<string, string> = {
    today: '今天',
    pending: '待完成',
    overdue: '已延期',
  }
  return map[s] || s
}

// ─── 自然语言生成 ───────────────────────────────────

/**
 * running 状态的自然语言
 * 例："正在读取你的学习画像..."
 *     "正在检索关于「进程调度」的知识..."
 */
export function formatRunningText(toolName: string, args?: any): string {
  const meta = getToolDisplayMeta(toolName)
  const subject = extractSubject(args)

  switch (toolName) {
    case 'getStudentProfile':
    case 'profile_tool':
      return '正在读取你的学习画像...'

    case 'queryKnowledge':
    case 'knowledge_search_tool':
      return subject
        ? `正在检索关于「${subject}」的知识...`
        : '正在检索知识图谱...'

    case 'queryLearningProgress': {
      const days = extractDays(args)
      return days
        ? `正在分析你近 ${days} 天的学习进度...`
        : '正在分析你的学习进度...'
    }

    case 'queryTasks': {
      const scope = extractScope(args)
      return scope
        ? `正在查看你${scope}的学习任务...`
        : '正在查看你的学习任务...'
    }

    case 'learning_plan_tool':
      return subject
        ? `正在为你草拟关于「${subject}」的学习计划...`
        : '正在为你草拟学习计划...'

    case 'generateResource':
    case 'resource_gen_tool':
      return subject
        ? `正在生成关于「${subject}」的学习资料...`
        : '正在生成学习资料...'

    case 'generateQuiz':
    case 'assessment_tool':
      return subject
        ? `正在出关于「${subject}」的练习题...`
        : '正在出练习题...'

    case 'webSearch':
      return subject
        ? `正在搜索「${subject}」...`
        : '正在搜索网络...'

    case 'generateMindMap':
      return subject
        ? `正在生成「${subject}」的思维导图...`
        : '正在生成思维导图...'

    default:
      return `正在${meta.label}...`
  }
}

/**
 * completed 状态的动作句（第一行）
 * 例："读取了你的学习画像"
 *     "检索了关于「进程调度」的知识"
 */
export function formatCompletedText(toolName: string, args?: any): string {
  const subject = extractSubject(args)

  switch (toolName) {
    case 'getStudentProfile':
    case 'profile_tool':
      return '读取了你的学习画像'

    case 'queryKnowledge':
    case 'knowledge_search_tool':
      return subject
        ? `检索了关于「${subject}」的知识`
        : '检索了知识图谱'

    case 'queryLearningProgress': {
      const days = extractDays(args)
      return days
        ? `分析了你近 ${days} 天的学习进度`
        : '分析了你的学习进度'
    }

    case 'queryTasks': {
      const scope = extractScope(args)
      return scope
        ? `查看了你${scope}的学习任务`
        : '查看了你的学习任务'
    }

    case 'learning_plan_tool':
      return subject
        ? `为你草拟了关于「${subject}」的学习计划`
        : '为你草拟了学习计划'

    case 'generateResource':
    case 'resource_gen_tool':
      return subject
        ? `生成了关于「${subject}」的学习资料`
        : '生成了学习资料'

    case 'generateQuiz':
    case 'assessment_tool':
      return subject
        ? `出了关于「${subject}」的练习题`
        : '出了练习题'

    case 'webSearch':
      return subject
        ? `搜索了「${subject}」`
        : '搜索了网络'

    case 'generateMindMap':
      return subject
        ? `生成了「${subject}」的思维导图`
        : '生成了思维导图'

    default:
      return `完成了${getToolDisplayMeta(toolName).label}`
  }
}

/**
 * completed 状态的结果句（第二行），返回 null 表示无结果句
 * 例："你有 3 个学习目标，2 个薄弱环节"
 *     "找到 12 个相关知识，18 条关联"
 */
function normalizeResult(result: any): Record<string, any> | null {
  if (!result) return null
  if (typeof result === 'string') {
    try { return JSON.parse(result) } catch { return null }
  }
  if (typeof result === 'object') return result
  return null
}

export function formatResultText(toolName: string, result?: any): string | null {
  const obj = normalizeResult(result)
  if (!obj) return null

  switch (toolName) {
    case 'getStudentProfile':
    case 'profile_tool': {
      const parts: string[] = []
      const goals = obj.learningGoals ?? obj.goals
      const weaknesses = obj.weaknesses
      if (Array.isArray(goals)) parts.push(`${goals.length} 个学习目标`)
      if (Array.isArray(weaknesses)) parts.push(`${weaknesses.length} 个薄弱环节`)
      return parts.length ? parts.join('，') : null
    }

    case 'queryKnowledge':
    case 'knowledge_search_tool': {
      const nodeCount = obj.nodeCount ?? obj.nodes?.length ?? 0
      const edgeCount = obj.edgeCount ?? obj.edges?.length ?? obj.relations?.length ?? 0
      if (nodeCount === 0 && edgeCount === 0) return '暂未找到相关知识'
      const parts: string[] = []
      if (nodeCount > 0) parts.push(`${nodeCount} 个相关知识`)
      if (edgeCount > 0) parts.push(`${edgeCount} 条关联`)
      return parts.join('，')
    }

    case 'queryLearningProgress': {
      const parts: string[] = []
      const todayTotal = obj.todayTasksCount ?? 0
      const todayDone = obj.todayCompletedCount ?? 0
      const pending = obj.pendingTasksCount ?? 0
      const overdue = obj.overdueTasksCount ?? 0
      const minutes = obj.totalStudyMinutes
      if (todayTotal > 0) parts.push(`今天 ${todayDone}/${todayTotal} 个任务已完成`)
      if (pending > 0) parts.push(`${pending} 个待完成`)
      if (overdue > 0) parts.push(`${overdue} 个已延期`)
      if (typeof minutes === 'number' && minutes > 0) parts.push(`累计学习 ${minutes} 分钟`)
      return parts.length ? parts.join('，') : null
    }

    case 'queryTasks': {
      const count = obj.taskCount ?? obj.tasks?.length ?? 0
      const scope = obj.scope
      const scopeText = scope === 'today' ? '今天' : scope === 'pending' ? '待完成' : scope === 'overdue' ? '已延期' : ''
      if (count === 0) return `${scopeText}没有任务`
      const parts: string[] = []
      const tasks = obj.tasks ?? obj.list ?? []
      if (Array.isArray(tasks)) {
        const done = tasks.filter((t: any) => t.status === 'done').length
        const inProgress = tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'inProgress').length
        if (done > 0) parts.push(`${done} 个已完成`)
        if (inProgress > 0) parts.push(`${inProgress} 个进行中`)
      }
      return parts.length
        ? `${scopeText}共 ${count} 个任务，${parts.join('，')}`
        : `${scopeText}共 ${count} 个任务`
    }

    case 'learning_plan_tool': {
      const success = obj.success
      if (success === false) return obj.error ?? '生成失败'
      return '学习计划草稿已准备好，需要你确认后才会生效'
    }

    case 'generateResource':
    case 'resource_gen_tool': {
      const title = obj.title
      return title
        ? `「${title}」已生成，需要你确认后才会保存`
        : '学习资料草稿已生成，需要你确认后才会保存'
    }

    case 'generateQuiz':
    case 'assessment_tool': {
      const count = obj.questionCount ?? obj.questions?.length ?? 0
      return count > 0
        ? `共 ${count} 道题，需要你确认后才会保存`
        : '练习题已生成，需要你确认后才会保存'
    }

    case 'webSearch': {
      const refs = obj.references ?? obj.webSearchReferences
      const refCount = Array.isArray(refs) ? refs.length : 0
      return refCount > 0 ? `参考 ${refCount} 篇资料` : '未找到相关结果'
    }

    case 'generateMindMap': {
      const count = obj.nodeCount ?? obj.nodes?.length ?? 0
      return count > 0 ? `已生成 ${count} 个节点的思维导图` : '思维导图已生成'
    }

    default: {
      // 通用 fallback：尝试提取数量信息
      const total = obj.total ?? obj.count
      if (typeof total === 'number') return `共 ${total} 条`
      return null
    }
  }
}

/**
 * 草稿类工具的补充说明
 * 返回 null 表示不需要补充说明
 */
export function formatDraftNote(toolName: string): string | null {
  const meta = getToolDisplayMeta(toolName)
  if (meta.riskLevel === 'write_draft') {
    return '这是草稿，需要你确认后才会生效'
  }
  return null
}

/**
 * failed 状态的自然语言
 */
export function formatFailedText(toolName: string): string {
  const meta = getToolDisplayMeta(toolName)
  switch (toolName) {
    case 'getStudentProfile':
    case 'profile_tool':
      return '读取学习画像失败'
    case 'queryKnowledge':
    case 'knowledge_search_tool':
      return '检索知识失败'
    case 'queryLearningProgress':
      return '分析学习进度失败'
    case 'queryTasks':
      return '查询学习任务失败'
    case 'learning_plan_tool':
      return '生成学习计划失败'
    case 'generateResource':
    case 'resource_gen_tool':
      return '生成学习资料失败'
    case 'generateQuiz':
    case 'assessment_tool':
      return '出题失败'
    case 'webSearch':
      return '搜索失败'
    case 'generateMindMap':
      return '生成思维导图失败'
    default:
      return `${meta.label}失败`
  }
}
