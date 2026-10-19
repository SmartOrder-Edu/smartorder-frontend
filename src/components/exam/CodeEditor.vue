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
      <span class="header-status">Ready</span>
    </div>
    <!-- 编辑器主体 -->
    <div class="editor-body" ref="editorBodyRef">
      <div class="line-numbers" ref="lineNumbersRef">
        <div v-for="n in lineCount" :key="n" class="line-number" :class="{ active: n === activeLine }">
          {{ n }}
        </div>
      </div>
      <div class="editor-code-pane">
        <div class="code-highlight-layer" ref="highlightLayerRef" aria-hidden="true">
          <pre><code v-html="highlightedCode"></code></pre>
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
import hljs from 'highlight.js/lib/core'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)

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
const highlightLayerRef = ref<HTMLDivElement | null>(null)

const activeLine = ref(1)

const languageLabelMap: Record<string, string> = {
  c11: 'C (C11)',
  c: 'C',
  cpp17: 'C++ (C++17)',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  sql: 'SQL'
}

const highlightLanguageMap: Record<string, string> = {
  c11: 'c',
  c: 'c',
  cpp17: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  java: 'java',
  python: 'python',
  py: 'python',
  sql: 'sql'
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

const highlightLanguage = computed(() => {
  const lang = props.language.toLowerCase()
  return highlightLanguageMap[lang] || lang
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const highlightedCode = computed(() => {
  const code = props.modelValue || ''
  if (!code) return ''

  try {
    // 将项目内部语言标识映射为 highlight.js 可识别的语言名，保证代码编辑器有语法颜色提示。
    if (hljs.getLanguage(highlightLanguage.value)) {
      return hljs.highlight(code, {
        language: highlightLanguage.value,
        ignoreIllegals: true
      }).value
    }

    return hljs.highlightAuto(code).value
  } catch (error) {
    console.warn('代码编辑器语法高亮失败，已回退为纯文本渲染', error)
    return escapeHtml(code)
  }
})

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
  if (highlightLayerRef.value && textareaRef.value) {
    highlightLayerRef.value.scrollTop = textareaRef.value.scrollTop
    highlightLayerRef.value.scrollLeft = textareaRef.value.scrollLeft
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
    nextTick(syncScroll)
  }
)
</script>

<style scoped>
.code-editor-wrapper {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(51, 65, 85, 0.95);
  background: #111827;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.code-editor-wrapper:focus-within {
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14), 0 22px 50px rgba(15, 23, 42, 0.22);
}

.code-editor-wrapper.readonly {
  opacity: 0.85;
}

/* 编辑器头部 - macOS 风格红绿灯 */
.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 16px;
  background: linear-gradient(180deg, #101827 0%, #0b1220 100%);
  border-bottom: 1px solid rgba(71, 85, 105, 0.42);
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
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
}

.header-status {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 999px;
  color: #5eead4;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.16);
  font-size: 11px;
  font-weight: 800;
}

/* 编辑器主体 */
.editor-body {
  display: flex;
  position: relative;
  height: clamp(360px, 48vh, 560px);
  max-height: 560px;
  overflow: hidden;
}

.line-numbers {
  flex-shrink: 0;
  width: 54px;
  padding: 16px 0;
  background: #0b1220;
  color: #64748b;
  font-size: 13px;
  line-height: 1.72;
  text-align: right;
  user-select: none;
  overflow: hidden;
}

.line-number {
  padding-right: 14px;
  padding-left: 4px;
  transition: color 0.15s ease;
}

.line-number.active {
  color: #5eead4;
  font-weight: 800;
}

.editor-code-pane {
  position: relative;
  flex: 1;
  min-width: 0;
  background:
    linear-gradient(90deg, rgba(20, 184, 166, 0.04) 0 1px, transparent 1px),
    #111827;
  background-size: 48px 100%;
}

.code-highlight-layer,
.editor-textarea {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding: 16px 18px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.72;
  tab-size: 4;
  -moz-tab-size: 4;
  white-space: pre;
  word-wrap: normal;
}

.code-highlight-layer {
  pointer-events: none;
  overflow: hidden;
  color: #dbeafe;
}

.code-highlight-layer pre {
  min-height: 100%;
  margin: 0;
  font: inherit;
}

.code-highlight-layer code {
  font: inherit;
}

.code-highlight-layer :deep(.hljs-keyword),
.code-highlight-layer :deep(.hljs-built_in) {
  color: #f472b6;
  font-weight: 800;
}

.code-highlight-layer :deep(.hljs-type),
.code-highlight-layer :deep(.hljs-title.class_),
.code-highlight-layer :deep(.hljs-literal) {
  color: #67e8f9;
  font-weight: 800;
}

.code-highlight-layer :deep(.hljs-title.function_),
.code-highlight-layer :deep(.hljs-params) {
  color: #93c5fd;
}

.code-highlight-layer :deep(.hljs-string),
.code-highlight-layer :deep(.hljs-char.escape_) {
  color: #86efac;
}

.code-highlight-layer :deep(.hljs-number) {
  color: #fbbf24;
}

.code-highlight-layer :deep(.hljs-comment) {
  color: #64748b;
  font-style: italic;
}

.code-highlight-layer :deep(.hljs-meta),
.code-highlight-layer :deep(.hljs-meta .hljs-keyword) {
  color: #c4b5fd;
}

.code-highlight-layer :deep(.hljs-symbol),
.code-highlight-layer :deep(.hljs-variable) {
  color: #fca5a5;
}

.editor-textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: #5eead4;
  -webkit-text-fill-color: transparent;
  overflow-y: auto;
  overflow-x: auto;
}

.editor-textarea::placeholder {
  color: #64748b;
  -webkit-text-fill-color: #64748b;
}

.editor-textarea::selection {
  background: rgba(45, 212, 191, 0.28);
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.editor-textarea:read-only {
  cursor: not-allowed;
}

/* 底部状态栏 */
.editor-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 36px;
  padding: 7px 16px;
  background: #0b1220;
  border-top: 1px solid rgba(71, 85, 105, 0.42);
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
  user-select: none;
}

.editor-footer span:first-child {
  color: #5eead4;
  font-weight: 900;
}

/* 滚动条 */
.editor-textarea::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.editor-textarea::-webkit-scrollbar-track {
  background: #0b1220;
}

.editor-textarea::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 999px;
}

.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

@media (max-width: 720px) {
  .editor-body {
    height: 360px;
  }

  .line-numbers {
    width: 44px;
  }

  .code-highlight-layer,
  .editor-textarea {
    padding: 14px;
    font-size: 13px;
  }
}
</style>
