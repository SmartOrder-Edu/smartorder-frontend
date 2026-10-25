<template>
  <div class="tool-call-card" :class="'status-' + status">
    <!-- 轻量状态行 -->
    <div class="tool-call-row">
      <span class="tool-icon">
        <el-icon v-if="status === 'running'" class="tool-spinner"><Loading /></el-icon>
        <el-icon v-else-if="status === 'completed'" class="icon-completed"><CircleCheck /></el-icon>
        <el-icon v-else class="icon-failed"><CircleClose /></el-icon>
      </span>
      <span class="tool-action-text">{{ actionText }}</span>
      <span class="tool-duration" v-if="status !== 'running' && formattedDuration">
        · {{ formattedDuration }}
      </span>
      <button
        v-if="status !== 'running' && (hasResultText || hasSearchRefs)"
        class="tool-toggle-btn"
        @click="expanded = !expanded"
      >
        <el-icon :class="{ rotated: expanded }"><ArrowDown /></el-icon>
      </button>
    </div>

    <!-- 结果句 + 草稿说明（展开后 / 失败时默认展开） -->
    <div class="tool-result-area" v-if="shouldShowResultArea">
      <!-- AI 测评快捷答题卡片 -->
      <div v-if="quizResult" class="quiz-card-inline">
        <div class="quiz-card-left">
          <div class="quiz-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <polyline points="9,15 11,17 15,13"/>
            </svg>
          </div>
          <div class="quiz-card-info">
            <div class="quiz-card-title">{{ quizResult.title || 'AI 测评练习题' }}</div>
            <div class="quiz-card-meta">
              <span>共 <strong>{{ quizResult.questionCount || 0 }}</strong> 道题</span>
              <span class="meta-dot">·</span>
              <span>总分 <strong>{{ quizResult.totalScore || 0 }}</strong> 分</span>
            </div>
          </div>
        </div>
        <button class="quiz-card-btn" @click="startQuiz(quizResult)">立即作答</button>
      </div>

      <template v-else>
        <div class="tool-result-text" v-if="resultText">{{ resultText }}</div>
        <div class="tool-draft-note" v-if="draftNote && status === 'completed'">
          <el-icon :size="12"><InfoFilled /></el-icon>
          <span>{{ draftNote }}</span>
        </div>
      </template>
    </div>

    <!-- 网络搜索来源（内联展示，仅标题） -->
    <div class="tool-search-refs" v-if="showInlineSearchRefs">
      <div class="search-refs-header">
        <el-icon :size="12"><Search /></el-icon>
        <span>搜索来源（{{ searchRefs.length }}）</span>
      </div>
      <a
        v-for="ref in searchRefs"
        :key="ref.citationIndex"
        :href="ref.url"
        target="_blank"
        rel="noopener noreferrer"
        class="search-ref-item"
      >
        <span class="search-ref-index">{{ ref.citationIndex }}.</span>
        <img
          :src="faviconUrl(ref.url)"
          class="search-ref-favicon"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span class="search-ref-title">{{ ref.title }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import {
  formatRunningText,
  formatCompletedText,
  formatResultText,
  formatDraftNote,
  formatFailedText,
} from '@/utils/agentToolDisplay'

interface SearchReference {
  citationIndex: number
  title: string
  url: string
  snippet: string
}

const props = defineProps<{
  toolName: string
  status: 'running' | 'completed' | 'failed'
  arguments?: any
  result?: any
  durationMs?: number
}>()

const expanded = ref(true)
const router = useRouter()

const normalizedResult = computed(() => normalizeResult(props.result))

const quizResult = computed(() => {
  if (
    (props.toolName !== 'generateQuiz' && props.toolName !== 'assessment_tool') ||
    props.status !== 'completed' ||
    !props.result
  ) {
    return null
  }
  return normalizedResult.value
})

const startQuiz = (quiz: any) => {
  const spaceId = props.arguments?.spaceId || 0
  router.push({
    name: 'ExamSession',
    query: {
      spaceId,
      title: quiz.title
    }
  })
}

function normalizeResult(result: any): Record<string, any> | null {
  if (!result) return null
  if (typeof result === 'string') {
    try { return JSON.parse(result) } catch { return null }
  }
  if (typeof result === 'object') return result
  return null
}

const searchRefs = computed<SearchReference[]>(() => {
  if (props.toolName !== 'webSearch' || props.status !== 'completed' || !props.result) return []
  const obj = normalizedResult.value
  if (!obj) return []
  const refs = obj.references ?? obj.webSearchReferences
  if (!Array.isArray(refs) || refs.length === 0) return []
  return refs
})

const hasSearchRefs = computed(() => searchRefs.value.length > 0)

// 搜索来源出现时自动展开
watch(searchRefs, (refs) => {
  if (refs.length > 0) expanded.value = true
})

// 内联搜索来源受 expanded 控制
const showInlineSearchRefs = computed(() => expanded.value && hasSearchRefs.value)

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function faviconUrl(url: string): string {
  const d = domain(url)
  if (!d || d === url) return ''
  return `https://icon.horse/icon/${d}`
}

const actionText = computed(() => {
  if (props.status === 'running') return formatRunningText(props.toolName, props.arguments)
  if (props.status === 'completed') return formatCompletedText(props.toolName, props.arguments)
  return formatFailedText(props.toolName)
})

const resultText = computed(() => {
  if (props.status !== 'completed') return null
  return formatResultText(props.toolName, props.result)
})

const draftNote = computed(() => {
  if (props.status !== 'completed') return null
  return formatDraftNote(props.toolName)
})

const hasResultText = computed(() => {
  return !!(resultText.value || draftNote.value)
})

const shouldShowResultArea = computed(() => {
  if (props.status === 'failed') return false
  if (props.status === 'running') return false
  return expanded.value || hasResultText.value
})

const formattedDuration = computed(() => {
  if (!props.durationMs) return ''
  const ms = props.durationMs
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`
})

</script>

<style scoped>
.tool-call-card {
  margin-bottom: 2px;
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.75rem;
}

.tool-call-card.status-failed {
  background: rgba(245, 108, 108, 0.04);
  border: 1px solid rgba(245, 108, 108, 0.12);
}

.tool-call-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px 5px 10px;
  position: relative;
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.icon-completed {
  color: #52c41a;
  font-size: 14px;
}

.icon-failed {
  color: #f56c6c;
  font-size: 14px;
}

.tool-spinner {
  animation: tool-spin 1.2s linear infinite;
  color: #3b5bdb;
  font-size: 14px;
}

@keyframes tool-spin {
  to { transform: rotate(360deg); }
}

.tool-action-text {
  font-weight: 500;
  color: var(--text-dark);
  flex: 1;
  line-height: 1.4;
  font-size: 0.75rem;
}

.tool-duration {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  opacity: 0.75;
}

.tool-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  padding: 0;
  transition: background 0.15s;
  flex-shrink: 0;
}

.tool-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tool-toggle-btn .el-icon {
  transition: transform 0.2s;
}

.tool-toggle-btn .el-icon.rotated {
  transform: rotate(180deg);
}

/* 结果区域 */
.tool-result-area {
  padding: 4px 8px 6px 34px;
}

.quiz-card-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.05) 0%, rgba(79, 110, 246, 0.03) 100%);
  border: 1px solid rgba(11, 183, 170, 0.12);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 4px;
  transition: all 0.3s ease;
}

.quiz-card-inline:hover {
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.08);
  border-color: rgba(11, 183, 170, 0.25);
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.08) 0%, rgba(79, 110, 246, 0.05) 100%);
}

.quiz-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.quiz-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color, #0bb7aa);
  flex-shrink: 0;
}

.quiz-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.quiz-card-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark, #303133);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quiz-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted, #909399);
}

.quiz-card-meta strong {
  color: var(--primary-color, #0bb7aa);
  font-weight: 600;
}

.meta-dot {
  opacity: 0.5;
}

.quiz-card-btn {
  background: linear-gradient(135deg, #0bb7aa 0%, #009688 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(11, 183, 170, 0.2);
}

.quiz-card-btn:hover {
  background: linear-gradient(135deg, #0ccbc0 0%, #00a899 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(11, 183, 170, 0.3);
}

.quiz-card-btn:active {
  transform: translateY(0);
}

.tool-result-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.tool-draft-note {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted);
  opacity: 0.85;
}

/* 网络搜索来源（内联，仅标题） */
.tool-search-refs {
  padding: 0 8px 6px 34px;
  border-top: 1px solid rgba(11, 183, 170, 0.06);
  margin-top: 2px;
}

.search-refs-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0 6px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-muted);
}

.search-ref-item {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 3px 0;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.15s;
}

.search-ref-item:hover {
  background: rgba(11, 183, 170, 0.04);
}

.search-ref-index {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 1.4em;
  text-align: right;
  opacity: 0.7;
}

.search-ref-favicon {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 1px;
}

.search-ref-title {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #3b5bdb;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.search-ref-item:hover .search-ref-title {
  text-decoration: underline;
}
</style>
