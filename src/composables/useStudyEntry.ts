import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { EnterStudyOptions, StudyEntrySource, StudyMode } from '@/types/study'

type StudyEntryTask = {
  id: string | number
  spaceId?: string | number | null
  pathNodeId?: string | number | null
  actionType?: string | null
  targetType?: string | null
  targetId?: string | number | null
}

function stringifyOptional(value: string | number | null | undefined) {
  return value === undefined || value === null || value === '' ? undefined : String(value)
}

/**
 * 统一学习入口 composable
 *
 * 设计依据：讨论方案要求所有学习入口最终汇入同一个地方 ——
 * /study/:taskId 的 Agent 教学画布。路径节点入口使用 pathNodeId 查询参数，
 * 由后端自动创建或复用对应学习任务。
 *
 * 入口文案模型：
 *   - 首页 → 开始今日学习
 *   - 空间详情 → 继续本空间学习
 *   - 任务卡片 → 开始这次学习
 *   - 知识点 → 学习 / 复习 / 测一下 / 专项突破 / 预览
 */
export function useStudyEntry() {
  const router = useRouter()

  /**
   * 进入指定任务的学习会话
   * @param taskId 学习任务 id（对应一次 Study Session）
   * @param options 模式 / 空间 / 来源等
   */
  function enterStudy(taskId: string | number | undefined | null, options: EnterStudyOptions = {}) {
    if (taskId === undefined || taskId === null || taskId === '') {
      ElMessage.warning('Agent 暂未为该入口排好学习会话，请稍后再试')
      return
    }
    const query: Record<string, string> = {}
    if (options.mode && options.mode !== 'learn') query.mode = options.mode
    if (options.spaceId) query.spaceId = String(options.spaceId)
    if (options.pathNodeId) query.pathNodeId = String(options.pathNodeId)
    if (options.stepId) query.stepId = String(options.stepId)
    if (options.source) query.source = options.source
    router.push({ path: `/study/${taskId}`, query })
  }

  function enterPathNodeStudy(pathNodeId: string | number | undefined | null, options: EnterStudyOptions = {}) {
    if (pathNodeId === undefined || pathNodeId === null || pathNodeId === '') {
      ElMessage.warning('Agent 暂未为该路径节点排好学习会话，请稍后再试')
      return
    }
    enterStudy(`path-node-${pathNodeId}`, {
      ...options,
      pathNodeId: String(pathNodeId),
      source: options.source || 'path_node',
    })
  }

  function enterTask(task: StudyEntryTask | null | undefined,
    options: EnterStudyOptions = {}) {
    if (!task || !task.id) {
      ElMessage.warning('Agent 暂未为该任务准备好执行入口，请稍后再试')
      return
    }
    if (task.targetType === 'resource' && task.targetId) {
      router.push({
        name: 'LearningResourceDetail',
        params: { resourceId: String(task.targetId) },
        query: {
          taskId: String(task.id),
          spaceId: stringifyOptional(task.spaceId),
          source: options.source || 'task',
        },
      })
      return
    }
    if (
      (task.actionType === 'practice_set' || task.actionType === 'assessment') &&
      (task.targetType === 'practice_session' || task.targetType === 'assessment_session') &&
      task.targetId
    ) {
      router.push({
        name: 'ExamSession',
        query: {
          sessionId: String(task.targetId),
          taskId: String(task.id),
          spaceId: stringifyOptional(task.spaceId),
          source: options.source || 'task',
        },
      })
      return
    }
    enterStudy(task.id, {
      ...options,
      spaceId: options.spaceId || stringifyOptional(task.spaceId),
      pathNodeId: options.pathNodeId || stringifyOptional(task.pathNodeId),
    })
  }

  /**
   * 进入"今日第一个学习会话"（首页 hero / 任务日程"开始今日任务"用）
   *
   * 调用方传入候选任务（来自 Dashboard / 任务日程的第一个今日任务）。
   * 若没有候选任务，提示用户今日 Agent 暂未排任务。
   */
  function enterTodayFirst(
    firstTask?: StudyEntryTask | null,
    source: StudyEntrySource = 'dashboard_hero',
  ) {
    if (!firstTask || !firstTask.id) {
      ElMessage.info('今日 Agent 暂未排定学习会话，去 AI 总学习伙伴 问问下一步学什么？')
      return
    }
    enterTask(firstTask, {
      mode: 'learn' as StudyMode,
      spaceId: stringifyOptional(firstTask.spaceId),
      source,
    })
  }

  return {
    enterStudy,
    enterTask,
    enterPathNodeStudy,
    enterTodayFirst,
  }
}
