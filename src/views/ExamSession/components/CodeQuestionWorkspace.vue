<template>
  <div class="code-question-workspace" :id="'question-card-' + q.globalIndex">
    <section class="problem-panel" :class="{ active }">
      <div class="problem-topline">
        <span class="problem-index">第 {{ q.globalIndex }} 题</span>
        <span class="difficulty-pill">{{ difficultyLabel }}</span>
        <span class="score-pill">{{ formatScore(q.score) }} 分</span>
      </div>

      <h2 class="problem-title">{{ displayTitle }}</h2>

      <div class="problem-tags" v-if="knowledgeTags.length">
        <span v-for="tag in knowledgeTags" :key="tag" class="tag-pill">{{ tag }}</span>
      </div>

      <div class="problem-section">
        <div class="section-heading">题目描述</div>
        <div class="problem-stem" v-html="q.stem"></div>
      </div>

      <div class="problem-section" v-if="sampleBlocks.length">
        <div class="section-heading">样例</div>
        <div v-for="(sample, index) in sampleBlocks" :key="index" class="sample-block">
          <div class="sample-row">
            <div class="sample-label">
              <span>输入</span>
              <button type="button" class="copy-sample-btn" @click="copySampleText(sample.input)">复制</button>
            </div>
            <pre>{{ sample.input }}</pre>
          </div>
          <div class="sample-row">
            <div class="sample-label">
              <span>输出</span>
              <button type="button" class="copy-sample-btn" @click="copySampleText(sample.output)">复制</button>
            </div>
            <pre>{{ sample.output }}</pre>
          </div>
        </div>
      </div>

      <div class="problem-actions">
        <button type="button" class="soft-action" :class="{ active: favorited }" @click="$emit('toggle-favorite', q.globalIndex)">
          {{ favorited ? '已收藏' : '收藏' }}
        </button>
        <button type="button" class="soft-action" @click="$emit('show-kp', q)">查看知识点</button>
      </div>
    </section>

    <section class="editor-panel">
      <div class="editor-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="editor-tab"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="editor-toolbar">
        <div class="runtime-state">
          <span class="state-dot"></span>
          <span>{{ languageLabel }} · 自动换行 {{ wrapEnabled ? '已开启' : '已关闭' }}</span>
        </div>
        <div class="toolbar-actions">
          <select v-model="selectedLanguage" :disabled="showAnswer" class="language-select" aria-label="选择编程语言">
            <option v-for="option in languageOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <button type="button" class="icon-tool" :class="{ active: wrapEnabled }" title="自动换行" @click="wrapEnabled = !wrapEnabled">
            Aa
          </button>
          <button type="button" class="icon-tool" title="编辑器设置">⚙</button>
        </div>
      </div>

      <CodeEditor
        v-model="codeValue"
        :readonly="showAnswer"
        :language="selectedLanguage"
        :placeholder="editorPlaceholder"
        :show-footer="true"
        :min-lines="18"
      />

      <div class="io-grid">
        <div class="io-card">
          <div class="io-card-header">
            <span>输入</span>
            <small>自定义输入</small>
          </div>
          <textarea
            v-model="customInput"
            class="io-textarea"
            :readonly="showAnswer"
            :placeholder="customInputPlaceholder"
          ></textarea>
        </div>

        <div class="io-card">
          <div class="io-card-header">
            <span>输出</span>
            <small>运行结果</small>
          </div>
          <pre class="output-view">{{ runOutput }}</pre>
        </div>

        <div class="result-card" :class="[runStatus, { running: isRunningLocal }]">
          <div class="result-header">
            <span v-if="isRunningLocal" class="loading-spinner" aria-hidden="true"></span>
            <span v-else class="result-mark"></span>
            <strong>{{ resultTitle }}</strong>
          </div>
          <div class="result-metrics">
            <div>
              <span>通过率</span>
              <strong>{{ resultMetrics.passRate }}</strong>
            </div>
            <div>
              <span>执行时间</span>
              <strong>{{ resultMetrics.time }}</strong>
            </div>
            <div>
              <span>内存占用</span>
              <strong>{{ resultMetrics.memory }}</strong>
            </div>
          </div>
          <div class="case-list">
            <span
              v-for="caseItem in caseStates"
              :key="caseItem.label"
              class="case-pill"
              :class="caseItem.status"
            >
              {{ caseItem.label }}
            </span>
          </div>
        </div>
      </div>

      <ResultPanel
        v-if="showAnswer"
        :question="q"
        :grading="grading"
        :userAnswerText="userAnswerText"
        :correctAnswerText="correctAnswerText"
        :isCorrectLocal="false"
        :sessionId="sessionId"
        :isExpanded="isAnalysisExpanded"
        @toggle-expand="$emit('toggle-analysis', q.id)"
      />

      <div class="coding-actions">
        <button type="button" class="action-btn ghost" :disabled="showAnswer" @click="resetCode">重置</button>
        <button type="button" class="action-btn primary" :disabled="showAnswer || isRunningLocal" @click="runCode">
          <span v-if="isRunningLocal" class="button-spinner" aria-hidden="true"></span>
          {{ isRunningLocal ? '运行中' : '运行' }}
        </button>
        <button type="button" class="action-btn submit" :disabled="isSubmitting || showAnswer" @click="$emit('submit')">
          {{ isSubmitting ? '提交中...' : '提交' }}
        </button>
        <button type="button" class="action-btn nav" :disabled="q.globalIndex <= 1" @click="$emit('prev', q.globalIndex)">上一题</button>
        <button type="button" class="action-btn nav" :disabled="q.globalIndex >= totalCount" @click="$emit('next', q.globalIndex)">下一题</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import CodeEditor from '@/components/exam/CodeEditor.vue'
import ResultPanel from './ResultPanel.vue'
import { getQuestionAnswerText } from '@/utils/examQuestionMapper'
import { LOCAL_MOCK_RUN_DELAY_MS, resolveLocalMockRunOutput } from '@/utils/localCodeMockRunner'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'
import type { AnswerDetailVO } from '@/api/evaluationSession'

const props = defineProps<{
  q: EvaluationQuestion & { globalIndex: number }
  typeName: string
  active: boolean
  answers: Record<string | number, string>
  codeLanguages: Record<string | number, string>
  showAnswer: boolean
  isSubmitting: boolean
  flagged: boolean
  favorited: boolean
  sessionId?: string
  grading?: AnswerDetailVO
  totalCount: number
  isAnalysisExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'update-code', q: EvaluationQuestion, val: string): void
  (e: 'update-code-language', q: EvaluationQuestion, language: string): void
  (e: 'toggle-flag', index: number): void
  (e: 'toggle-favorite', index: number): void
  (e: 'show-kp', q: EvaluationQuestion): void
  (e: 'prev', index: number): void
  (e: 'next', index: number): void
  (e: 'toggle-analysis', questionId: string | number): void
  (e: 'submit'): void
}>()

const activeTab = ref('editor')
const wrapEnabled = ref(true)
const customInput = ref('')
const runOutput = ref('')
const runStatus = ref<'idle' | 'success' | 'failed'>('idle')
const isRunningLocal = ref(false)
const runTimer = ref<number | null>(null)

const tabs = [
  { label: '题目', value: 'problem' },
  { label: '编辑器', value: 'editor' },
  { label: '测试用例', value: 'cases' },
  { label: '运行结果', value: 'result' }
]

const languageMap: Record<string, string> = {
  c11: 'C (C11)',
  c: 'C',
  cpp17: 'C++ (C++17)',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  sql: 'SQL'
}

const defaultLanguage = computed(() => {
  const allowed = props.q.correctAnswer?.allowedLanguages
  if (Array.isArray(allowed) && allowed.length > 0) {
    return String(allowed[0])
  }
  return props.q.questionType === 'sql' ? 'sql' : 'python'
})

const languageOptions = computed(() => {
  const allowed = props.q.correctAnswer?.allowedLanguages
  const values = Array.isArray(allowed) && allowed.length > 0
    ? allowed.map(item => String(item))
    : ['python', 'java', 'cpp17', 'c11']

  return values.map(value => ({
    value,
    label: languageMap[value] || value.toUpperCase()
  }))
})

const selectedLanguage = computed({
  get() {
    return props.codeLanguages[props.q.id as any] || defaultLanguage.value
  },
  set(value: string) {
    emit('update-code-language', props.q, value)
  }
})

const languageLabel = computed(() => languageMap[selectedLanguage.value] || selectedLanguage.value.toUpperCase())

const codeValue = computed({
  get() {
    return props.answers[props.q.id as any] || ''
  },
  set(value: string) {
    emit('update-code', props.q, value)
  }
})

const correctAnswerText = computed(() => getQuestionAnswerText(props.q.correctAnswer) || '提交后由系统判题')
const userAnswerText = computed(() => props.answers[props.q.id as any] || '')

const displayTitle = computed(() => {
  return props.q.questionTypeName || props.typeName || '编程题'
})

const difficultyLabel = computed(() => {
  const difficulty = Number(props.q.difficulty || 0)
  if (difficulty >= 5) return '困难'
  if (difficulty >= 3) return '中等'
  return '简单'
})

const knowledgeTags = computed(() => {
  const tags = [
    ...(props.q.knowledgePoints || []),
    ...(props.q.tags || []),
    ...(props.q.abilityTags || [])
  ]
  return Array.from(new Set(tags)).slice(0, 8)
})

const editorPlaceholder = computed(() => {
  if (selectedLanguage.value === 'c11' || selectedLanguage.value === 'c') {
    // 空编辑器只展示语言提示，避免刚进入页面时用模板代码暗示答案结构。
    return '// 请输入 C 语言代码'
  }
  if (selectedLanguage.value === 'java') {
    return '// 请输入 Java 代码'
  }
  if (selectedLanguage.value === 'cpp17' || selectedLanguage.value === 'cpp') {
    return '// 请输入 C++ 代码'
  }
  return '# 请输入代码'
})

const sampleBlocks = computed(() => {
  const raw = props.q.correctAnswer?.examples || props.q.correctAnswer?.samples || props.q.correctAnswer?.testCases
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.slice(0, 3).map((item: any) => ({
    input: String(item.input ?? item.stdin ?? ''),
    output: String(item.output ?? item.stdout ?? item.expectedOutput ?? '')
  }))
})

const customInputPlaceholder = computed(() => {
  const firstSample = sampleBlocks.value[0]
  // 运行区输入示例跟随当前题样例，避免算法题仍显示其它题型的占位数据。
  return firstSample?.input ? `例如：\n${firstSample.input}` : '请输入自定义测试数据'
})

const resultTitle = computed(() => {
  if (isRunningLocal.value) return '正在评测'
  if (runStatus.value === 'success') return '算法题测试成功'
  if (runStatus.value === 'failed') return '需要补全代码'
  return '等待运行'
})

const resultMetrics = computed(() => {
  if (isRunningLocal.value) {
    return { passRate: '评测中', time: '-', memory: '-' }
  }
  if (runStatus.value === 'success') {
    return { passRate: '全部通过', time: '-', memory: '-' }
  }
  if (runStatus.value === 'failed') {
    return { passRate: '0/4', time: '-', memory: '-' }
  }
  return { passRate: '-', time: '-', memory: '-' }
})

const caseStates = computed(() => {
  const status = isRunningLocal.value ? 'running' : runStatus.value === 'success' ? 'passed' : runStatus.value === 'failed' ? 'failed' : 'idle'
  return ['用例 1', '用例 2', '用例 3', '用例 4'].map(label => ({ label, status }))
})

const formatScore = (score?: number) => {
  return Number(score || 0).toFixed(Number(score || 0) % 1 === 0 ? 0 : 1)
}

// 清理上一轮本地运行计时器，避免连续点击或切题时旧结果覆盖新题输出。
const clearPendingRun = () => {
  if (runTimer.value !== null) {
    window.clearTimeout(runTimer.value)
    runTimer.value = null
  }
  isRunningLocal.value = false
}

// 样例复制用于录屏演示，优先调用浏览器剪贴板，失败时不影响题目作答。
const copySampleText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('样例已复制')
  } catch (error) {
    console.warn('复制样例失败', error)
    ElMessage.warning('复制失败，请手动选择样例文本')
  }
}

// 前端 mock 阶段只输出本题对应的标准答案文本，不在输出区拼接任何额外说明。
const runCode = () => {
  clearPendingRun()

  if (!codeValue.value.trim()) {
    runStatus.value = 'failed'
    runOutput.value = ''
    ElMessage.warning('请先编写代码')
    return
  }

  const output = resolveLocalMockRunOutput(customInput.value, sampleBlocks.value)
  if (!output) {
    runStatus.value = 'failed'
    runOutput.value = ''
    ElMessage.warning(customInput.value.trim() ? '请输入符合题目格式的测试数据' : '请先输入测试数据')
    return
  }

  runStatus.value = 'idle'
  runOutput.value = ''
  isRunningLocal.value = true
  runTimer.value = window.setTimeout(() => {
    runStatus.value = 'success'
    runOutput.value = output
    isRunningLocal.value = false
    runTimer.value = null
    ElMessage.success('算法题测试成功')
  }, LOCAL_MOCK_RUN_DELAY_MS)
}

// 重置只清空当前题代码，避免影响其它题目的作答状态。
const resetCode = () => {
  clearPendingRun()
  emit('update-code', props.q, '')
  runStatus.value = 'idle'
  runOutput.value = ''
}

watch(
  () => props.q.id,
  () => {
    clearPendingRun()
    activeTab.value = 'editor'
    customInput.value = ''
    runOutput.value = ''
    runStatus.value = 'idle'
  }
)

onBeforeUnmount(() => {
  clearPendingRun()
})
</script>

<style scoped>
.code-question-workspace {
  display: grid;
  grid-template-columns: minmax(280px, 0.78fr) minmax(520px, 1.42fr);
  gap: 18px;
  align-items: stretch;
  min-width: 0;
}

.problem-panel,
.editor-panel {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.problem-panel:hover,
.editor-panel:hover {
  border-color: rgba(20, 184, 166, 0.28);
  box-shadow: 0 22px 46px rgba(15, 23, 42, 0.08);
}

.problem-panel {
  padding: 24px;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
}

.problem-panel.active {
  border-color: rgba(20, 184, 166, 0.38);
}

.problem-topline,
.problem-tags,
.problem-actions,
.editor-tabs,
.editor-toolbar,
.coding-actions {
  display: flex;
  align-items: center;
}

.problem-topline {
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.problem-index,
.difficulty-pill,
.score-pill,
.tag-pill {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.problem-index {
  padding: 8px 12px;
  color: #ffffff;
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
}

.difficulty-pill,
.score-pill {
  padding: 8px 10px;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid rgba(20, 184, 166, 0.22);
}

.score-pill {
  color: #4f46e5;
  background: #eef2ff;
  border-color: rgba(99, 102, 241, 0.18);
}

.problem-title {
  margin: 0 0 14px;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 850;
  color: #0f172a;
  text-wrap: balance;
}

.problem-tags {
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.tag-pill {
  padding: 7px 10px;
  color: #475569;
  background: #f3f7fb;
  border: 1px solid #e2e8f0;
}

.problem-section {
  padding-top: 18px;
  border-top: 1px solid #edf2f7;
}

.problem-section + .problem-section {
  margin-top: 18px;
}

.section-heading {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.problem-stem {
  color: #334155;
  font-size: 15px;
  line-height: 1.75;
}

.sample-block {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e7eef6;
}

.sample-block + .sample-block {
  margin-top: 12px;
}

.sample-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.sample-label span {
  font-size: 12px;
  font-weight: 850;
  color: #64748b;
}

.copy-sample-btn {
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(20, 184, 166, 0.22);
  background: #ffffff;
  color: #0f766e;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.copy-sample-btn:hover {
  background: #f0fdfa;
  border-color: rgba(20, 184, 166, 0.42);
  transform: translateY(-1px);
}

.sample-row pre,
.output-view {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
}

.sample-row pre {
  padding: 10px 12px;
  border-radius: 10px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #edf2f7;
}

.problem-actions {
  gap: 10px;
  margin-top: 22px;
}

.soft-action,
.action-btn,
.editor-tab,
.icon-tool {
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.soft-action {
  flex: 1;
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid #dbe6ef;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.soft-action:hover,
.soft-action.active {
  color: #0f766e;
  border-color: rgba(20, 184, 166, 0.36);
  background: #f0fdfa;
}

.editor-panel {
  overflow: hidden;
  min-width: 0;
}

.editor-tabs {
  gap: 6px;
  padding: 14px 16px 0;
  border-bottom: 1px solid #edf2f7;
}

.editor-tab {
  padding: 12px 14px;
  border-radius: 12px 12px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 850;
  border-bottom: 2px solid transparent;
}

.editor-tab:hover {
  color: #0f766e;
  background: #f8fafc;
}

.editor-tab.active {
  color: #0f766e;
  border-bottom-color: #14b8a6;
  background: #f0fdfa;
}

.editor-toolbar {
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.runtime-state {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 750;
}

.state-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-select,
.icon-tool {
  height: 38px;
  border-radius: 11px;
  border: 1px solid #dbe6ef;
  background: #ffffff;
  color: #334155;
  font-weight: 800;
  outline: none;
}

.language-select {
  min-width: 130px;
  padding: 0 12px;
}

.language-select:focus,
.icon-tool:focus-visible,
.action-btn:focus-visible,
.soft-action:focus-visible {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}

.icon-tool {
  width: 38px;
}

.icon-tool:hover,
.icon-tool.active {
  color: #0f766e;
  background: #f0fdfa;
}

.io-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(250px, 0.95fr);
  gap: 12px;
  padding: 14px 16px 16px;
}

.io-card,
.result-card {
  min-height: 190px;
  border-radius: 16px;
  border: 1px solid #e4ebf3;
  background: #fbfdff;
}

.io-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid #edf2f7;
}

.io-card-header span {
  color: #0f172a;
  font-size: 14px;
  font-weight: 850;
}

.io-card-header small {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 750;
}

.io-textarea,
.output-view {
  width: 100%;
  min-height: 136px;
  padding: 12px 14px;
  border: 0;
  outline: none;
  background: transparent;
  color: #1e293b;
  font-size: 13px;
  line-height: 1.65;
  resize: none;
}

.io-textarea:focus {
  box-shadow: inset 0 0 0 2px rgba(20, 184, 166, 0.18);
}

.result-card {
  padding: 14px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #475569;
}

.result-mark {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #cbd5e1;
}

.result-card.success {
  border-color: rgba(16, 185, 129, 0.28);
  background: linear-gradient(180deg, #ecfdf5, #ffffff);
}

.result-card.running {
  border-color: rgba(20, 184, 166, 0.3);
  background: linear-gradient(180deg, #f0fdfa, #ffffff);
}

.result-card.failed {
  border-color: rgba(239, 68, 68, 0.28);
  background: linear-gradient(180deg, #fef2f2, #ffffff);
}

.result-card.success .result-mark {
  background: #10b981;
}

.result-card.failed .result-mark {
  background: #ef4444;
}

.loading-spinner,
.button-spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid rgba(20, 184, 166, 0.18);
  border-top-color: #14b8a6;
  animation: local-judge-spin 0.82s linear infinite;
}

.loading-spinner {
  width: 20px;
  height: 20px;
}

.button-spinner {
  width: 14px;
  height: 14px;
  margin-right: 7px;
  border-color: rgba(255, 255, 255, 0.34);
  border-top-color: #ffffff;
  vertical-align: -2px;
}

@keyframes local-judge-spin {
  to {
    transform: rotate(360deg);
  }
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.result-metrics div {
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(226, 232, 240, 0.72);
}

.result-metrics span,
.result-metrics strong {
  display: block;
  text-align: center;
}

.result-metrics span {
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

.result-metrics strong {
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}

.case-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.case-pill {
  padding: 7px 9px;
  border-radius: 999px;
  color: #64748b;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 850;
}

.case-pill.passed {
  color: #047857;
  background: #d1fae5;
}

.case-pill.running {
  color: #0f766e;
  background: #ccfbf1;
}

.case-pill.failed {
  color: #b91c1c;
  background: #fee2e2;
}

.coding-actions {
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #edf2f7;
  background: #fbfdff;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 900;
  border: 1px solid #dbe6ef;
  color: #475569;
  background: #ffffff;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.action-btn.primary {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #14b8a6, #0f9f91);
  box-shadow: 0 10px 24px rgba(20, 184, 166, 0.28);
}

.action-btn.submit {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.24);
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.52;
  box-shadow: none;
}

@media (max-width: 1380px) {
  .code-question-workspace {
    grid-template-columns: minmax(260px, 0.74fr) minmax(480px, 1.35fr);
  }

  .io-grid {
    grid-template-columns: 1fr 1fr;
  }

  .result-card {
    grid-column: span 2;
  }
}

@media (max-width: 1100px) {
  .code-question-workspace {
    grid-template-columns: 1fr;
  }

  .problem-panel {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .io-grid {
    grid-template-columns: 1fr;
  }

  .result-card {
    grid-column: auto;
  }

  .editor-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1 1 42%;
  }
}

html[data-theme='dark'] .problem-panel,
html[data-theme='dark'] .editor-panel,
html[data-theme='dark'] .soft-action,
html[data-theme='dark'] .language-select,
html[data-theme='dark'] .icon-tool {
  background: #1e293b;
  border-color: #334155;
}

html[data-theme='dark'] .problem-title,
html[data-theme='dark'] .section-heading,
html[data-theme='dark'] .io-card-header span,
html[data-theme='dark'] .result-metrics strong {
  color: #f4f7fb;
}

html[data-theme='dark'] .problem-stem,
html[data-theme='dark'] .runtime-state,
html[data-theme='dark'] .soft-action,
html[data-theme='dark'] .language-select,
html[data-theme='dark'] .icon-tool,
html[data-theme='dark'] .output-view,
html[data-theme='dark'] .io-textarea {
  color: #cbd5e1;
}

html[data-theme='dark'] .tag-pill,
html[data-theme='dark'] .sample-block,
html[data-theme='dark'] .io-card,
html[data-theme='dark'] .result-card,
html[data-theme='dark'] .coding-actions {
  background: #111827;
  border-color: #263244;
}

html[data-theme='dark'] .sample-row pre,
html[data-theme='dark'] .result-metrics div {
  background: #182235;
  border-color: #334155;
  color: #cbd5e1;
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .button-spinner {
    animation: none;
  }
}
</style>
