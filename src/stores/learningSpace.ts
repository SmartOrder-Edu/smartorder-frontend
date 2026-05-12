import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { learningSpaceApi } from '@/api/learningSpace'
import type {
  LearningSpaceVO,
  LearningSpaceDTO,
  LearningSpaceDisplay,
  SpaceHealthStatus
} from '@/api/learningSpace'

// --- Helpers ---

function deriveHealthStatus(space: LearningSpaceVO): SpaceHealthStatus {
  if (space.status !== 'active') return 'normal'
  if (space.targetEndDate) {
    const daysLeft = Math.ceil(
      (new Date(space.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft < 0 && space.progress < 80) return 'danger'
    if (daysLeft <= 3 && space.progress < 60) return 'warning'
  }
  if (space.progress >= 70) return 'good'
  if (space.progress < 40) return 'warning'
  return 'normal'
}

function extractPrimaryGoal(goalsJson: string | null | undefined): string {
  if (!goalsJson) return ''
  try {
    const parsed = JSON.parse(goalsJson)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    if (typeof parsed === 'string') return parsed
    return goalsJson
  } catch {
    return goalsJson
  }
}

const TYPE_COLORS: Record<string, { color: string; gradient: string; icon: string }> = {
  course:      { color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', icon: '📐' },
  exam:        { color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: '📝' },
  project:     { color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: '💻' },
  career:      { color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', icon: '🚀' },
  competition: { color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', icon: '🏆' },
}

function toDisplaySpace(space: LearningSpaceVO): LearningSpaceDisplay {
  const theme = TYPE_COLORS[space.type] || TYPE_COLORS.course
  return {
    ...space,
    healthStatus: deriveHealthStatus(space),
    icon: theme.icon,
    color: theme.color,
    colorGradient: theme.gradient,
    goal: extractPrimaryGoal(space.goals),
    streakDays: 0,
    todaySuggestion: '',
    alert: '',
    agentInsight: '',
    pathNodes: [],
    tasks: [],
    resources: [],
  }
}

// --- Store ---

export const useLearningSpaceStore = defineStore('learningSpace', () => {
  const spaces = ref<LearningSpaceDisplay[]>([])
  const currentSpace = ref<LearningSpaceDisplay | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref<string | null>(null)

  const activeSpaces = computed(() => spaces.value.filter(s => s.status === 'active'))
  const spaceCount = computed(() => activeSpaces.value.length)

  async function fetchSpaces(status?: string) {
    loading.value = true
    error.value = null
    try {
      const list = await learningSpaceApi.list(status as any)
      spaces.value = list.map(toDisplaySpace)
    } catch (e: any) {
      error.value = e.message || '获取学习空间列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchSpaceDetail(id: number) {
    detailLoading.value = true
    error.value = null
    try {
      const vo = await learningSpaceApi.detail(id)
      currentSpace.value = toDisplaySpace(vo)
    } catch (e: any) {
      error.value = e.message || '获取学习空间详情失败'
      currentSpace.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function createSpace(data: LearningSpaceDTO) {
    const vo = await learningSpaceApi.create(data)
    const display = toDisplaySpace(vo)
    spaces.value.unshift(display)
    return display
  }

  async function updateSpace(id: number, data: LearningSpaceDTO) {
    const vo = await learningSpaceApi.update(id, data)
    const display = toDisplaySpace(vo)
    const idx = spaces.value.findIndex(s => s.id === id)
    if (idx !== -1) spaces.value[idx] = display
    if (currentSpace.value?.id === id) currentSpace.value = display
    return display
  }

  async function deleteSpace(id: number) {
    await learningSpaceApi.remove(id)
    spaces.value = spaces.value.filter(s => s.id !== id)
    if (currentSpace.value?.id === id) currentSpace.value = null
  }

  return {
    spaces,
    currentSpace,
    loading,
    detailLoading,
    error,
    activeSpaces,
    spaceCount,
    fetchSpaces,
    fetchSpaceDetail,
    createSpace,
    updateSpace,
    deleteSpace,
  }
})
