<template>
  <div class="agent-command-bar" :class="{ focused: isFocused }">
    <!-- Shortcut hint when collapsed -->
    <div class="acb-collapsed" v-if="!isFocused && !input" @click="focusInput">
      <div class="acb-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </div>
      <span class="acb-placeholder">告诉 Agent 你想做什么...</span>
      <button
        class="acb-mic-btn"
        :class="{ listening: isListening }"
        @click.stop="toggleListening"
        :title="isListening ? '点击停止录音' : '语音输入'"
      >
        <svg v-if="!isListening" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <span v-else class="acb-mic-pulse"></span>
      </button>
      <kbd class="acb-kbd">Ctrl K</kbd>
    </div>

    <!-- Expanded input -->
    <div class="acb-expanded" v-show="isFocused || input">
      <div class="acb-input-row">
        <div class="acb-icon-wrap active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <input
          ref="inputRef"
          v-model="input"
          class="acb-input"
          placeholder="告诉 Agent 你想做什么..."
          @keyup.enter="handleSend"
          @focus="isFocused = true"
          @keydown.escape="handleBlur"
        />
        <button
          class="acb-send-btn"
          @click="handleSend"
          :disabled="!input.trim()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>

      <!-- Suggestions -->
      <div class="acb-suggestions" v-if="isFocused && !input">
        <span class="acb-sugg-label">试试这些</span>
        <div class="acb-sugg-list">
          <button
            v-for="s in suggestions"
            :key="s"
            class="acb-sugg-item"
            @click="selectSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const input = ref('')
const isFocused = ref(false)
const isListening = ref(false)
const inputRef = ref<HTMLInputElement>()
const isHovering = ref(false)
let recognition: any = null

const props = defineProps<{
  activeTab?: string
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

// --- Voice Input ---
function initSpeechRecognition() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const rec = new SpeechRecognition()
  rec.lang = 'zh-CN'
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1

  rec.onresult = (event: any) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    if (event.results[0]?.isFinal) {
      input.value = transcript.trim()
      isListening.value = false
      // Auto expand and send after brief pause
      isFocused.value = true
      setTimeout(() => {
        if (input.value.trim()) {
          handleSend()
        }
      }, 600)
    }
  }

  rec.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error)
    isListening.value = false
  }

  rec.onend = () => {
    isListening.value = false
  }

  return rec
}

function toggleListening() {
  if (isListening.value) {
    stopListening()
    return
  }
  startListening()
}

function startListening() {
  if (!recognition) {
    recognition = initSpeechRecognition()
  }
  if (!recognition) {
    // Browser doesn't support SpeechRecognition
    focusInput()
    return
  }
  try {
    isListening.value = true
    recognition.start()
  } catch {
    // Already started
    isListening.value = false
  }
}

function stopListening() {
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
  }
  isListening.value = false
}

// Tab-specific suggestions
const allSuggestions: Record<string, string[]> = {
  today: [
    '帮我生成今日学习任务',
    '今天时间不够，帮我精简到 30 分钟',
    '调整今日任务的优先级',
    '分析我今天的薄弱点',
  ],
  plan: [
    '帮我调整学习计划',
    '这个计划当前处于什么阶段？',
    '重新规划学习路径',
    '加快当前阶段的学习进度',
  ],
  path: [
    '当前路径的薄弱节点是哪些？',
    '这个知识点太难了，换个更基础的讲解',
    '帮我生成这个知识点的学习脚本',
    '跳过我已有的知识，直接学新的',
  ],
  resources: [
    '帮我生成一份不定积分的思维导图',
    '推荐几个B站讲解视频',
    '生成10道诊断题测一下',
    '整理一份错题笔记',
  ],
  records: [
    '分析我最近一周的学习趋势',
    '我的专注度变化如何？',
    '对比上个月有没有进步？',
    '哪些时间段学习效率最高？',
  ],
  insight: [
    '我的知识薄弱点主要在哪些方面？',
    '给我生成一份学习报告',
    '与同龄人相比我的进度如何？',
    '接下来应该重点学什么？',
  ],
}

const defaultSuggestions = [
  '帮我分析一下薄弱点',
  '生成一份思维导图',
  '调整今日学习计划',
  '推荐适合我的学习资源',
]

const suggestions = ref<string[]>([...defaultSuggestions])

function updateSuggestions() {
  const tab = props.activeTab || 'today'
  const tabSuggests = allSuggestions[tab]
  suggestions.value = tabSuggests ? [...tabSuggests] : [...defaultSuggestions]
}

function focusInput() {
  isFocused.value = true
  updateSuggestions()
  setTimeout(() => inputRef.value?.focus(), 100)
}

function handleBlur() {
  if (!input.value) {
    isFocused.value = false
  }
}

function selectSuggestion(text: string) {
  input.value = text
  handleSend()
}

function handleSend() {
  const text = input.value.trim()
  if (!text) return
  emit('send', text)
  input.value = ''
  isFocused.value = false
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    focusInput()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  stopListening()
})

defineExpose({
  focus: focusInput,
})
</script>

<style scoped lang="scss">
.agent-command-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 80;
  width: min(680px, calc(100vw - 48px));
  background: var(--color-card-bg);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.1),
    0 4px 12px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(16px);
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);

  &.focused {
    border-color: rgba(11, 183, 170, 0.28);
    box-shadow: 0 22px 50px rgba(11, 183, 170, 0.12),
      0 4px 14px rgba(11, 183, 170, 0.06);
  }
}

/* ===== Collapsed state ===== */
.acb-collapsed {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  cursor: text;
  transition: background 0.15s;

  &:hover { background: rgba(11, 183, 170, 0.04); }
}

.acb-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: linear-gradient(135deg, #ecfdfb, #f0f9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a9e94;
  flex-shrink: 0;
  transition: all 0.25s;

  &.active {
    background: linear-gradient(135deg, #0bb7aa, #0284c7);
    color: white;
    box-shadow: 0 6px 16px rgba(11, 183, 170, 0.2);
  }
}

.acb-placeholder {
  flex: 1;
  font-size: 0.875rem;
  color: #94a3b8;
  text-align: left;
}

.acb-mic-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: var(--color-card-bg-secondary);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3);
    color: #0a9e94;
    background: #ecfdfb;
  }

  &.listening {
    background: #fef2f2;
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
    animation: micPulse 1.5s ease-in-out infinite;
  }
}

.acb-mic-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  display: inline-block;
  animation: micDotPulse 0.8s ease-in-out infinite;
}

@keyframes micPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

@keyframes micDotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.75); }
}

.acb-kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.16);
  line-height: 1.5;
  white-space: nowrap;
}

/* ===== Expanded state ===== */
.acb-expanded {
  padding: 6px;
  display: flex;
  flex-direction: column;
}

.acb-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
}

.acb-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  min-width: 0;

  &::placeholder { color: #b0b8c4; }
}

.acb-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;

  &:disabled { opacity: 0.35; cursor: default; }

  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(11, 183, 170, 0.22);
  }
}

/* ===== Suggestions ===== */
.acb-suggestions {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acb-sugg-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.acb-sugg-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.acb-sugg-item {
  padding: 5px 12px;
  border-radius: 99px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: var(--color-card-bg-secondary);
  font-size: 0.75rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3);
    background: #ecfdfb;
    color: #0a9e94;
    transform: translateY(-1px);
  }
}
</style>
