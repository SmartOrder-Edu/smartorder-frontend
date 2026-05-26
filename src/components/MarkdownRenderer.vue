<template>
  <div ref="rootRef" class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 自定义代码渲染器：语法高亮 + 语言标签 + 复制按钮
const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  // Mermaid 代码块：输出占位符，后续异步渲染
  if (lang === 'mermaid') {
    const encodedSource = btoa(unescape(encodeURIComponent(text)))
    return `<div class="mermaid-block" data-mermaid-source="${encodedSource}">
  <div class="mermaid-loading">正在渲染图表…</div>
</div>`
  }

  const language = lang || ''
  let highlighted: string

  if (language && hljs.getLanguage(language)) {
    highlighted = hljs.highlight(text, { language }).value
  } else {
    highlighted = hljs.highlightAuto(text).value
  }

  const langLabel = language
    ? `<span class="code-lang">${escapeHtml(language)}</span>`
    : ''

  return `<div class="code-block-wrapper">
  <div class="code-block-header">
    ${langLabel}
    <button class="code-copy-btn" title="复制代码">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>复制</span>
    </button>
  </div>
  <pre><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${highlighted}</code></pre>
</div>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
})

const props = defineProps<{
  content: string
}>()

const renderedHtml = computed(() => {
  if (!props.content) return ''
  try {
    return marked.parse(props.content) as string
  } catch {
    return props.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
})

// ─── Mermaid 渲染 ───────────────────────────────────────────
const blobUrls: string[] = []

function isDarkTheme(): boolean {
  const el = document.documentElement
  return el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark'
}

async function renderMermaidBlocks(el: HTMLElement) {
  const blocks = el.querySelectorAll('.mermaid-block:not([data-rendered])')
  if (blocks.length === 0) return

  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDarkTheme() ? 'dark' : 'default',
  })

  for (const block of blocks) {
    block.setAttribute('data-rendered', 'true')
    const source = decodeURIComponent(escape(atob((block as HTMLElement).dataset.mermaidSource!)))
    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`

    try {
      mermaid.parse(source)
      const { svg } = await mermaid.render(id, source)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const blobUrl = URL.createObjectURL(blob)
      blobUrls.push(blobUrl)
      block.innerHTML = `
  <div class="mermaid-diagram-header">
    <span class="code-lang">Mermaid</span>
    <button class="mermaid-copy-btn" data-mermaid-copy title="复制源码">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>复制</span>
    </button>
  </div>
  <div class="mermaid-diagram-body">
    <img src="${blobUrl}" alt="Mermaid diagram" />
  </div>`
    } catch {
      block.innerHTML = `
  <div class="mermaid-diagram-header">
    <span class="code-lang">Mermaid</span>
  </div>
  <div class="mermaid-error-body">
    <p class="mermaid-error-msg">图表渲染失败，请检查语法</p>
    <pre><code>${escapeHtml(source)}</code></pre>
  </div>`
    }
  }

  bindMermaidCopyButtons(el)
}

function bindMermaidCopyButtons(el: HTMLElement) {
  el.querySelectorAll('.mermaid-copy-btn').forEach((btn) => {
    if ((btn as HTMLElement)._copyBound) return
    ;(btn as HTMLElement)._copyBound = true

    btn.addEventListener('click', async () => {
      const block = btn.closest('.mermaid-block')
      if (!block) return
      const source = decodeURIComponent(
        escape(atob((block as HTMLElement).dataset.mermaidSource!)),
      )
      try {
        await navigator.clipboard.writeText(source)
        const span = btn.querySelector('span')!
        const prevText = span.textContent
        span.textContent = '已复制!'
        btn.classList.add('copied')
        setTimeout(() => {
          span.textContent = prevText
          btn.classList.remove('copied')
        }, 2000)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = source
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    })
  })
}

// ─── 代码块复制按钮 ─────────────────────────────────────────
const rootRef = ref<HTMLElement>()

function bindCopyButtons(el: HTMLElement) {
  el.querySelectorAll('.code-copy-btn').forEach((btn) => {
    if ((btn as HTMLElement)._copyBound) return
    ;(btn as HTMLElement)._copyBound = true

    btn.addEventListener('click', async () => {
      const codeEl = btn
        .closest('.code-block-wrapper')
        ?.querySelector('code')
      if (!codeEl) return

      const text = codeEl.textContent || ''
      try {
        await navigator.clipboard.writeText(text)
        const span = btn.querySelector('span')!
        const prevText = span.textContent
        span.textContent = '已复制!'
        btn.classList.add('copied')
        setTimeout(() => {
          span.textContent = prevText
          btn.classList.remove('copied')
        }, 2000)
      } catch {
        // fallback
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    })
  })
}

onMounted(() => {
  if (rootRef.value) {
    bindCopyButtons(rootRef.value)
    renderMermaidBlocks(rootRef.value)
  }
})

onUpdated(() => {
  if (rootRef.value) {
    bindCopyButtons(rootRef.value)
    renderMermaidBlocks(rootRef.value)
  }
})

onUnmounted(() => {
  blobUrls.forEach((url) => URL.revokeObjectURL(url))
  blobUrls.length = 0
})
</script>

<style scoped>
.markdown-renderer {
  line-height: 1.7;
  word-break: break-word;
}

/* 段落 */
.markdown-renderer :deep(p) {
  margin: 0 0 0.6em;
}

.markdown-renderer :deep(p:last-child) {
  margin-bottom: 0;
}

/* 标题 */
.markdown-renderer :deep(h1),
.markdown-renderer :deep(h2),
.markdown-renderer :deep(h3),
.markdown-renderer :deep(h4),
.markdown-renderer :deep(h5),
.markdown-renderer :deep(h6) {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-dark);
}

.markdown-renderer :deep(h1) { font-size: 1.25rem; }
.markdown-renderer :deep(h2) { font-size: 1.125rem; }
.markdown-renderer :deep(h3) { font-size: 1rem; }

/* 列表 */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.5em;
}

.markdown-renderer :deep(li) {
  margin: 0.2em 0;
}

/* 代码块容器 */
.markdown-renderer :deep(.code-block-wrapper) {
  margin: 0.8em 0;
  border-radius: 10px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e2e6ea;
}

/* 代码块头部：语言标签 + 复制按钮 */
.markdown-renderer :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: #eef0f3;
  border-bottom: 1px solid #e2e6ea;
  font-size: 0.75rem;
  color: #6a737d;
}

.markdown-renderer :deep(.code-lang) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  text-transform: lowercase;
  font-weight: 500;
}

.markdown-renderer :deep(.code-copy-btn) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6a737d;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.4;
}

.markdown-renderer :deep(.code-copy-btn:hover) {
  background: rgba(0, 0, 0, 0.06);
  color: #24292e;
}

.markdown-renderer :deep(.code-copy-btn.copied) {
  color: #22863a;
}

.markdown-renderer :deep(.code-copy-btn svg) {
  flex-shrink: 0;
}

/* 代码块主体 */
.markdown-renderer :deep(.code-block-wrapper pre) {
  margin: 0;
  border-radius: 0;
  overflow-x: auto;
  padding: 14px 16px;
  font-size: 0.8125rem;
  line-height: 1.6;
  background: #f8f9fa;
}

.markdown-renderer :deep(.code-block-wrapper pre code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
}

/* 兼容：没有经过 wrapper 的裸 pre（如非代码块内的 pre） */
.markdown-renderer :deep(pre:not(.code-block-wrapper pre)) {
  margin: 0.6em 0;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 14px 16px;
}

.markdown-renderer :deep(pre:not(.code-block-wrapper pre) code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
}

/* 行内代码 */
.markdown-renderer :deep(code:not(pre code)) {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: rgba(148, 163, 184, 0.15);
  color: #e83e8c;
}

/* 引用 */
.markdown-renderer :deep(blockquote) {
  margin: 0.6em 0;
  padding: 4px 12px;
  border-left: 3px solid var(--primary-color);
  background: rgba(59, 130, 246, 0.04);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 表格 */
.markdown-renderer :deep(table) {
  width: 100%;
  margin: 0.6em 0;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  text-align: left;
}

.markdown-renderer :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
}

/* 分割线 */
.markdown-renderer :deep(hr) {
  margin: 0.8em 0;
  border: none;
  border-top: 1px solid var(--border-light);
}

/* 链接 */
.markdown-renderer :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
}

/* 图片 */
.markdown-renderer :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.4em 0;
}

/* 强调 */
.markdown-renderer :deep(strong) {
  font-weight: 600;
  color: var(--text-dark);
}

/* ─── Mermaid 图表 ─────────────────────────────────────── */
.markdown-renderer :deep(.mermaid-block) {
  margin: 0.8em 0;
  border-radius: 10px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e2e6ea;
}

.markdown-renderer :deep(.mermaid-loading) {
  padding: 24px 16px;
  text-align: center;
  color: #6a737d;
  font-size: 0.8125rem;
}

.markdown-renderer :deep(.mermaid-diagram-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: #eef0f3;
  border-bottom: 1px solid #e2e6ea;
  font-size: 0.75rem;
  color: #6a737d;
}

.markdown-renderer :deep(.mermaid-copy-btn) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6a737d;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.4;
}

.markdown-renderer :deep(.mermaid-copy-btn:hover) {
  background: rgba(0, 0, 0, 0.06);
  color: #24292e;
}

.markdown-renderer :deep(.mermaid-copy-btn.copied) {
  color: #22863a;
}

.markdown-renderer :deep(.mermaid-copy-btn svg) {
  flex-shrink: 0;
}

.markdown-renderer :deep(.mermaid-diagram-body) {
  padding: 16px;
  text-align: center;
  max-height: 500px;
  overflow-y: auto;
}

.markdown-renderer :deep(.mermaid-diagram-body img) {
  max-width: 100%;
  height: auto;
}

.markdown-renderer :deep(.mermaid-error-body) {
  padding: 12px 16px;
}

.markdown-renderer :deep(.mermaid-error-msg) {
  margin: 0 0 8px;
  color: #cf222e;
  font-size: 0.8125rem;
  font-weight: 500;
}

.markdown-renderer :deep(.mermaid-error-body pre) {
  margin: 0;
  border-radius: 6px;
  overflow-x: auto;
  padding: 10px 14px;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: #fff;
  border: 1px solid #e2e6ea;
}

.markdown-renderer :deep(.mermaid-error-body pre code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
}
</style>
