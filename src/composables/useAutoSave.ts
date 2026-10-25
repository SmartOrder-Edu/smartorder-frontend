import { ref, watch, type Ref } from 'vue'
import { saveProgress, fetchDraftAnswers, type DraftAnswerVO } from '@/api/evaluationSession'
import type { AnswerItem } from '@/api/evaluationSession'

export interface AutoSaveOptions {
  /** 答案变更后延迟保存的毫秒数，默认 30000 (30s) */
  debounceMs?: number
}

export function useAutoSave(
  sessionId: () => string | number | undefined,
  answers: Ref<Record<string | number, string>>,
  buildAnswerItems: () => AnswerItem[],
  options: AutoSaveOptions = {}
) {
  const { debounceMs = 30000 } = options

  const isSaving = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const dirty = ref(false)

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let isRestoring = false

  /** 执行异步保存（定时器 / 页面隐藏触发） */
  async function doSave() {
    const id = sessionId()
    if (!id || isSaving.value) return

    const items = buildAnswerItems()
    if (!items.length) return

    isSaving.value = true
    try {
      await saveProgress(id, { answers: items })
      lastSavedAt.value = new Date()
      dirty.value = false
    } catch {
      // 静默失败，下次重试
    } finally {
      isSaving.value = false
    }
  }

  /** 用 sendBeacon 做同步保存（beforeunload 触发） */
  function doSaveSync() {
    const id = sessionId()
    if (!id || !dirty.value) return

    const items = buildAnswerItems()
    if (!items.length) return

    const payload = JSON.stringify({ answers: items })
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${baseUrl}/evaluation/session/${id}/save-progress`
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
    } catch {
      // 忽略 sendBeacon 失败
    }
  }

  /** 延迟调度保存 */
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    if (!dirty.value || isSaving.value) return
    saveTimer = setTimeout(() => doSave(), debounceMs)
  }

  /** 页面隐藏时立即保存 */
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden' && dirty.value) {
      if (saveTimer) clearTimeout(saveTimer)
      doSave()
    }
  }

  /** 页面关闭前同步保存 */
  function onBeforeUnload() {
    if (dirty.value) doSaveSync()
  }

  // 注册全局事件监听
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('beforeunload', onBeforeUnload)

  // 监听答案变更 → 标记 dirty + 调度保存
  // 草稿恢复期间跳过，避免恢复后立即触发保存
  watch(answers, () => {
    if (isRestoring) return
    dirty.value = true
    scheduleSave()
  }, { deep: true })

  /** 恢复草稿：返回 questionId → 用户答案字符串的映射 */
  async function restoreDraft(): Promise<Record<string | number, string>> {
    const id = sessionId()
    if (!id) return {}

    isRestoring = true
    try {
      const drafts: DraftAnswerVO[] = await fetchDraftAnswers(id)
      const restored: Record<string | number, string> = {}
      for (const d of drafts) {
        if (!d.userAnswer) continue
        const ua = d.userAnswer
        if (ua.selectedOptions !== undefined) {
          const opts = ua.selectedOptions as string[] | undefined
          restored[d.questionId] = opts ? opts.join('、') : ''
        } else if (ua.value !== undefined) {
          restored[d.questionId] = ua.value as string
        } else if (ua.blanks !== undefined) {
          const blanks = ua.blanks as string[] | undefined
          restored[d.questionId] = blanks ? blanks.join(';;') : ''
        } else if (ua.code !== undefined) {
          restored[d.questionId] = ua.code as string
        } else if (ua.text !== undefined) {
          restored[d.questionId] = ua.text as string
        }
      }
      return restored
    } finally {
      Promise.resolve().then(() => { isRestoring = false })
    }
  }

  return { isSaving, lastSavedAt, dirty, doSave, restoreDraft }
}
