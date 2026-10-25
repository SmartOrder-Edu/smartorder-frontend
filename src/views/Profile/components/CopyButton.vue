<template>
  <button class="copy-button" @click.stop="handleCopy" title="复制" type="button">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const props = defineProps<{
  text: string
  label?: string
}>()

const handleCopy = () => {
  if (!props.text) return
  if (navigator.clipboard) {
    navigator.clipboard.writeText(props.text)
      .then(() => {
        ElMessage.success(`${props.label || '内容'}已复制`)
      })
      .catch(() => {
        fallbackCopyText(props.text)
      })
  } else {
    fallbackCopyText(props.text)
  }
}

const fallbackCopyText = (text: string) => {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    ElMessage.success(`${props.label || '内容'}已复制`)
  } catch (err) {
    ElMessage.error('复制失败，请手动选择复制')
  }
  document.body.removeChild(textArea)
}
</script>

<style scoped>
.copy-button {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  color: #14b8a6;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: #ecfdfb;
  color: #0d9488;
}

.copy-button:active {
  transform: scale(0.92);
}

.copy-button:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

/* 深色模式适配 */
html[data-theme='dark'] .copy-button {
  color: var(--account-text-secondary, #b4bdca);
}
html[data-theme='dark'] .copy-button:hover {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
}
</style>
