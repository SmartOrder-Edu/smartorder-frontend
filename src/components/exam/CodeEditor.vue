<template>
  <div class="code-editor-wrapper" :class="{ readonly: readonly }">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <span class="header-title">{{ languageLabel }} Editor</span>
    </div>
    <!-- 编辑器主体 -->
    <div class="editor-body" ref="editorBodyRef">
      <div class="line-numbers" ref="lineNumbersRef">
        <div v-for="n in lineCount" :key="n" class="line-number" :class="{ active: n === activeLine }">
          {{ n }}
        </div>
      </div>
      <textarea
        ref="textareaRef"
        :value="modelValue"
        :readonly="readonly"
        :placeholder="placeholder"
        spellcheck="false"
        class="editor-textarea"
        @input="handleInput"
        @keydown="handleKeydown"
        @scroll="syncScroll"
        @click="updateActiveLine"
        @keyup="updateActiveLine"
      ></textarea>
    </div>
    <!-- 底部状态栏 -->
    <div class="editor-footer" v-if="showFooter">
      <span>{{ languageLabel }}</span>
      <span v-if="charCount > 0">{{ charCount }} 字符</span>
      <span v-if="lineCount > 0">{{ lineCount }} 行</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    readonly?: boolean
    language?: string
    placeholder?: string
    showFooter?: boolean
    minLines?: number
  }>(),
  {
    readonly: false,
    language: 'c',
    placeholder: '// 在此编写代码...',
    showFooter: true,
    minLines: 12
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const editorBodyRef = ref<HTMLDivElement | null>(null)
const lineNumbersRef = ref<HTMLDivElement | null>(null)

const activeLine = ref(1)

const languageLabelMap: Record<string, string> = {
  c11: 'C (C11)',
  c: 'C',
  cpp17: 'C++ (C++17)',
  cpp: 'C++',
  java: 'Java',
  python: 'Python'
}

const languageLabel = computed(() => {
  const lang = props.language.toLowerCase()
  return languageLabelMap[lang] || lang.toUpperCase()
})

const lineCount = computed(() => {
  if (!props.modelValue) return Math.max(1, props.minLines)
  const lines = props.modelValue.split('\n').length
  return Math.max(lines, props.minLines)
})

const charCount = computed(() => props.modelValue?.length || 0)

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  updateActiveLine()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = textareaRef.value
    if (!ta || props.readonly) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = props.modelValue || ''
    const newValue = value.substring(0, start) + '    ' + value.substring(end)
    emit('update:modelValue', newValue)
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + 4
      ta.focus()
    })
  }
}

const syncScroll = () => {
  if (lineNumbersRef.value && textareaRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

const updateActiveLine = () => {
  const ta = textareaRef.value
  if (!ta) return
  const textBeforeCursor = (props.modelValue || '').substring(0, ta.selectionStart)
  activeLine.value = textBeforeCursor.split('\n').length
}

onMounted(() => {
  updateActiveLine()
})

watch(
  () => props.modelValue,
  () => {
    syncScroll()
  }
)
</script>

<style scoped>
.code-editor-wrapper {
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e2e8f0;
  background: #1e1e2e;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.code-editor-wrapper:focus-within {
  border-color: #0bb7aa;
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.1);
}

.code-editor-wrapper.readonly {
  opacity: 0.85;
}

/* 编辑器头部 - macOS 风格红绿灯 */
.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #181825;
  border-bottom: 1px solid #313244;
  user-select: none;
}

.header-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red {
  background: #f38ba8;
}

.dot-yellow {
  background: #f9e2af;
}

.dot-green {
  background: #a6e3a1;
}

.header-title {
  font-size: 11px;
  color: #6c7086;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 编辑器主体 */
.editor-body {
  display: flex;
  position: relative;
  max-height: 480px;
  overflow: hidden;
}

.line-numbers {
  flex-shrink: 0;
  width: 48px;
  padding: 14px 0;
  background: #181825;
  color: #585b70;
  font-size: 13px;
  line-height: 1.65;
  text-align: right;
  user-select: none;
  overflow: hidden;
}

.line-number {
  padding-right: 12px;
  padding-left: 4px;
  transition: color 0.15s ease;
}

.line-number.active {
  color: #cdd6f4;
  font-weight: 600;
}

.editor-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 14px 16px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.65;
  tab-size: 4;
  -moz-tab-size: 4;
  overflow-y: auto;
  overflow-x: auto;
  white-space: pre;
  word-wrap: normal;
}

.editor-textarea::placeholder {
  color: #585b70;
  font-style: italic;
}

.editor-textarea:read-only {
  cursor: not-allowed;
}

/* 底部状态栏 */
.editor-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 14px;
  background: #181825;
  border-top: 1px solid #313244;
  font-size: 11px;
  color: #6c7086;
  font-weight: 500;
  user-select: none;
}

.editor-footer span:first-child {
  color: #89b4fa;
  font-weight: 600;
}

/* 滚动条 */
.editor-textarea::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.editor-textarea::-webkit-scrollbar-track {
  background: #181825;
}

.editor-textarea::-webkit-scrollbar-thumb {
  background: #45475a;
  border-radius: 3px;
}

.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: #585b70;
}
</style>
