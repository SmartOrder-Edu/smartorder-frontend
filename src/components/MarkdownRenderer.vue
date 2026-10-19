<template>
  <iframe
    v-if="isHtmlPreview"
    ref="htmlFrameRef"
    class="html-preview-frame"
    title="HTML 预览"
    :srcdoc="htmlPreviewSrcdoc"
    :style="{ height: `${htmlPreviewHeight}px` }"
    sandbox="allow-scripts allow-forms allow-modals allow-popups"
  ></iframe>
  <div v-else ref="rootRef" class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

type CodeLineTone = 'normal' | 'highlight' | 'error' | 'note'
type TeachingMarker =
  | 'highlight-next-line'
  | 'error-next-line'
  | 'note-next-line'
  | 'highlight-start'
  | 'highlight-end'

interface TeachingCodeLine {
  content: string
  tone: CodeLineTone
}

// 自定义代码渲染器：语法高亮 + 行号 + 教学标记 + 复制按钮
const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const rawLanguage = (lang || '').trim()
  const language = rawLanguage.split(/\s+/)[0] || ''

  // Mermaid 代码块：输出占位符，后续异步渲染
  if (language === 'mermaid') {
    const encodedSource = btoa(unescape(encodeURIComponent(text)))
    return `<div class="mermaid-block" data-mermaid-source="${encodedSource}">
  <div class="mermaid-loading">正在渲染图表…</div>
</div>`
  }

  const parsed = parseTeachingCode(text)
  const encodedSource = btoa(unescape(encodeURIComponent(parsed.cleanText)))
  const langLabel = language ? formatLanguageLabel(language) : '代码'
  const codeLines = parsed.lines
    .map((line, index) => renderTeachingCodeLine(line, index + 1, language))
    .join('')

  return `<div class="code-block-wrapper${parsed.hasTeachingMarkers ? ' has-teaching-markers' : ''}">
  <div class="code-block-header">
    <div class="code-title-group">
      <span class="code-lang">${escapeHtml(langLabel)}</span>
      <span class="code-caption">示例代码</span>
    </div>
    <button class="code-copy-btn" title="复制代码" data-code-source="${encodedSource}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>复制</span>
    </button>
  </div>
  <pre class="code-teaching-pre"><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${codeLines}</code></pre>
</div>`
}

function parseTeachingCode(text: string): {
  lines: TeachingCodeLine[]
  cleanText: string
  hasTeachingMarkers: boolean
} {
  const sourceLines = text.replace(/\r\n/g, '\n').split('\n')
  const lines: TeachingCodeLine[] = []
  let nextTone: CodeLineTone | null = null
  let rangeTone: CodeLineTone | null = null
  let hasTeachingMarkers = false

  sourceLines.forEach((sourceLine) => {
    const marker = readTeachingMarker(sourceLine)
    if (marker) {
      hasTeachingMarkers = true
      if (marker === 'highlight-start') {
        rangeTone = 'highlight'
      } else if (marker === 'highlight-end') {
        rangeTone = null
      } else if (marker === 'highlight-next-line') {
        nextTone = 'highlight'
      } else if (marker === 'error-next-line') {
        nextTone = 'error'
      } else if (marker === 'note-next-line') {
        nextTone = 'note'
      }
      return
    }

    lines.push({
      content: sourceLine,
      tone: nextTone || rangeTone || 'normal',
    })
    nextTone = null
  })

  return {
    lines,
    cleanText: lines.map((line) => line.content).join('\n'),
    hasTeachingMarkers,
  }
}

function readTeachingMarker(line: string): TeachingMarker | null {
  const slashOrHash = line.match(
    /^\s*(?:\/\/|#)\s*(highlight-next-line|error-next-line|note-next-line|highlight-start|highlight-end)\s*$/,
  )
  if (slashOrHash) return slashOrHash[1] as TeachingMarker

  const html = line.match(
    /^\s*<!--\s*(highlight-next-line|error-next-line|note-next-line|highlight-start|highlight-end)\s*-->\s*$/,
  )
  return html ? (html[1] as TeachingMarker) : null
}

function renderTeachingCodeLine(line: TeachingCodeLine, lineNumber: number, language: string): string {
  const lineClass = line.tone === 'normal' ? '' : ` code-line-${line.tone}`
  const highlighted = highlightCodeLine(line.content, language) || '&nbsp;'

  return `<span class="code-line${lineClass}" data-line="${lineNumber}">
  <span class="code-line-no">${lineNumber}</span>
  <span class="code-line-content">${highlighted}</span>
</span>`
}

function highlightCodeLine(line: string, language: string): string {
  if (!line) return ''
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(line, { language, ignoreIllegals: true }).value
  }
  return escapeHtml(line)
}

function formatLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    cs: 'C#',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    shell: 'Shell',
    bash: 'Bash',
    sh: 'Shell',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
  }
  return labels[language.toLowerCase()] || language
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

const htmlFrameRef = ref<HTMLIFrameElement>()
const htmlPreviewHeight = ref(720)

const renderableHtmlDocument = computed(() => extractRenderableHtmlDocument(props.content))

const isHtmlPreview = computed(() => !!renderableHtmlDocument.value)

const htmlPreviewSrcdoc = computed(() => {
  if (!renderableHtmlDocument.value) return ''
  return injectHtmlPreviewBridge(renderableHtmlDocument.value)
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  if (isHtmlPreview.value) return ''
  try {
    return marked.parse(props.content) as string
  } catch {
    return props.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
})

function extractRenderableHtmlDocument(content: string): string {
  const normalized = content.trim()
  if (!normalized) return ''

  if (isRunnableHtmlContent(normalized)) {
    return normalizeHtmlDocument(normalized)
  }

  const fenced = normalized.match(/^```\s*(?:html)?[^\n]*\n([\s\S]*?)\n```\s*$/i)
    || normalized.match(/```\s*html[^\n]*\n([\s\S]*?)\n```/i)
  const fencedContent = fenced?.[1]?.trim() || ''
  if (fencedContent && isRunnableHtmlContent(fencedContent)) {
    return normalizeHtmlDocument(fencedContent)
  }

  return ''
}

function isRunnableHtmlContent(content: string): boolean {
  const normalized = content.trim()

  if (/^<!doctype\s+html[\s>]/i.test(normalized)
    || /^<html[\s>]/i.test(normalized)
    || (/<head[\s>]/i.test(normalized) && /<body[\s>]/i.test(normalized))) {
    return true
  }

  return /<(script|style|canvas|svg)\b/i.test(normalized)
    && /<\/?[a-z][\s\S]*>/i.test(normalized)
}

function normalizeHtmlDocument(html: string): string {
  const normalized = html.trim()
  if (/^<!doctype\s+html[\s>]/i.test(normalized) || /^<html[\s>]/i.test(normalized)) {
    return normalized
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html,
    body {
      margin: 0;
      min-height: 100%;
    }
  </style>
</head>
<body>
${normalized}
</body>
</html>`
}

function injectHtmlPreviewBridge(html: string): string {
  const bridge = `<script>
;(() => {
  const sendHeight = () => {
    const doc = document.documentElement
    const body = document.body
    const height = Math.max(
      doc ? doc.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      320
    )
    window.parent.postMessage({ type: 'smartorder-html-preview-height', height }, '*')
  }

  window.addEventListener('load', sendHeight)
  window.addEventListener('resize', sendHeight)
  if ('ResizeObserver' in window) {
    new ResizeObserver(sendHeight).observe(document.documentElement)
    if (document.body) new ResizeObserver(sendHeight).observe(document.body)
  }
  setTimeout(sendHeight, 0)
  setTimeout(sendHeight, 300)
})()
</scr` + `ipt>`

  if (/<\/body\s*>/i.test(html)) {
    return html.replace(/<\/body\s*>/i, `${bridge}</body>`)
  }

  if (/<\/html\s*>/i.test(html)) {
    return html.replace(/<\/html\s*>/i, `${bridge}</html>`)
  }

  return `${html}${bridge}`
}

// ─── Mermaid 渲染 ───────────────────────────────────────────
const blobUrls: string[] = []

// SVG 图标常量
const ICON_TOGGLE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
const ICON_ZOOM_IN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
const ICON_ZOOM_OUT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
const ICON_FULLSCREEN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
const ICON_DOWNLOAD = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
const ICON_COPY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const ICON_CLOSE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
const ICON_DIAGRAM = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="9" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h6M6 9v2.5A3.5 3.5 0 0 0 9.5 15H12M18 9v2.5A3.5 3.5 0 0 1 14.5 15H12"/></svg>`

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
    theme: 'base',
    themeVariables: getMermaidThemeVariables(),
    flowchart: {
      curve: 'basis',
      htmlLabels: true,
      nodeSpacing: 52,
      rankSpacing: 58,
      padding: 14,
    },
    sequence: {
      boxMargin: 12,
      messageMargin: 42,
      mirrorActors: false,
    },
  })

  for (const block of blocks) {
    block.setAttribute('data-rendered', 'true')
    block.setAttribute('data-zoom', '100')
    block.setAttribute('data-view', 'diagram')
    const source = decodeURIComponent(escape(atob((block as HTMLElement).dataset.mermaidSource!)))
    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`

    try {
      await mermaid.parse(source)
      const { svg } = await mermaid.render(id, source)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const blobUrl = URL.createObjectURL(blob)
      blobUrls.push(blobUrl)

      block.innerHTML = `
  <div class="mermaid-diagram-header">
    <div class="mermaid-title-group">
      <span class="mermaid-title-icon">${ICON_DIAGRAM}</span>
      <span class="code-lang">图解画布</span>
      <span class="mermaid-caption">Mermaid</span>
    </div>
    <div class="mermaid-toolbar">
      <button class="mermaid-tool-btn" data-action="toggle" title="查看源码">${ICON_TOGGLE}</button>
      <span class="mermaid-toolbar-divider"></span>
      <button class="mermaid-tool-btn" data-action="zoom-out" title="缩小">${ICON_ZOOM_OUT}</button>
      <span class="mermaid-zoom-label">100%</span>
      <button class="mermaid-tool-btn" data-action="zoom-in" title="放大">${ICON_ZOOM_IN}</button>
      <span class="mermaid-toolbar-divider"></span>
      <button class="mermaid-tool-btn" data-action="fullscreen" title="全屏查看">${ICON_FULLSCREEN}</button>
      <div class="mermaid-download-wrap">
        <button class="mermaid-tool-btn" data-action="download" title="下载">${ICON_DOWNLOAD}</button>
        <div class="mermaid-download-menu">
          <button class="mermaid-download-option" data-dl="svg">下载 SVG</button>
          <button class="mermaid-download-option" data-dl="png">下载 PNG</button>
        </div>
      </div>
      <button class="mermaid-tool-btn" data-action="copy" title="复制源码">${ICON_COPY}</button>
    </div>
  </div>
  <div class="mermaid-diagram-body">
    <div class="mermaid-diagram-scroll">${svg}</div>
  </div>
  <div class="mermaid-source-body">
    <pre><code>${escapeHtml(source)}</code></pre>
  </div>`
    } catch (e) {
      console.warn('[Mermaid] render failed:', e)
      block.setAttribute('data-view', 'source')
      block.innerHTML = `
  <div class="mermaid-diagram-header">
    <div class="mermaid-title-group">
      <span class="mermaid-title-icon">${ICON_DIAGRAM}</span>
      <span class="code-lang">图解画布</span>
      <span class="mermaid-caption">Mermaid</span>
    </div>
    <div class="mermaid-toolbar">
      <button class="mermaid-tool-btn" data-action="toggle" title="查看图表">${ICON_TOGGLE}</button>
      <button class="mermaid-tool-btn" data-action="copy" title="复制源码">${ICON_COPY}</button>
    </div>
  </div>
  <div class="mermaid-error-body">
    <p class="mermaid-error-msg">图表渲染失败，请检查语法</p>
    <pre><code>${escapeHtml(source)}</code></pre>
  </div>`
    }
  }

  bindMermaidActions(el)
}

function getMermaidThemeVariables() {
  const dark = isDarkTheme()
  if (dark) {
    return {
      background: 'transparent',
      primaryColor: '#0f2f36',
      primaryTextColor: '#e5f7f4',
      primaryBorderColor: '#38bdf8',
      secondaryColor: '#16243b',
      secondaryTextColor: '#e2e8f0',
      secondaryBorderColor: '#7dd3fc',
      tertiaryColor: '#14261f',
      tertiaryTextColor: '#dcfce7',
      tertiaryBorderColor: '#34d399',
      lineColor: '#67e8f9',
      textColor: '#e2e8f0',
      mainBkg: '#0f2f36',
      secondBkg: '#16243b',
      tertiaryBkg: '#14261f',
      nodeBorder: '#38bdf8',
      clusterBkg: '#0f172a',
      clusterBorder: '#334155',
      edgeLabelBackground: '#0f172a',
      fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
      fontSize: '15px',
    }
  }
  return {
    background: 'transparent',
    primaryColor: '#e8fbf8',
    primaryTextColor: '#0f172a',
    primaryBorderColor: '#0bb7aa',
    secondaryColor: '#eef6ff',
    secondaryTextColor: '#0f172a',
    secondaryBorderColor: '#38bdf8',
    tertiaryColor: '#f7f4ff',
    tertiaryTextColor: '#111827',
    tertiaryBorderColor: '#8b5cf6',
    lineColor: '#0891b2',
    textColor: '#1e293b',
    mainBkg: '#e8fbf8',
    secondBkg: '#eef6ff',
    tertiaryBkg: '#f7f4ff',
    nodeBorder: '#0bb7aa',
    clusterBkg: '#f8fafc',
    clusterBorder: '#cbd5e1',
    edgeLabelBackground: '#ffffff',
    fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
    fontSize: '15px',
  }
}

function bindMermaidActions(el: HTMLElement) {
  // 工具栏按钮
  el.querySelectorAll('.mermaid-tool-btn').forEach((btn) => {
    if ((btn as HTMLElement)._actionBound) return
    ;(btn as HTMLElement)._actionBound = true

    btn.addEventListener('click', () => {
      const block = btn.closest('.mermaid-block') as HTMLElement
      if (!block) return
      const action = (btn as HTMLElement).dataset.action
      switch (action) {
        case 'toggle': toggleView(block); break
        case 'zoom-in': zoomDiagram(block, 20); break
        case 'zoom-out': zoomDiagram(block, -20); break
        case 'fullscreen': openFullscreen(block); break
        case 'download': toggleDownloadMenu(block); break
        case 'copy': copySource(block); break
      }
    })
  })

  // 下载菜单选项
  el.querySelectorAll('.mermaid-download-option').forEach((opt) => {
    if ((opt as HTMLElement)._dlBound) return
    ;(opt as HTMLElement)._dlBound = true
    opt.addEventListener('click', (e) => {
      e.stopPropagation()
      const block = opt.closest('.mermaid-block') as HTMLElement
      const menu = opt.closest('.mermaid-download-menu') as HTMLElement
      if (menu) menu.style.display = 'none'
      const format = (opt as HTMLElement).dataset.dl as 'svg' | 'png'
      if (block) downloadDiagram(block, format)
    })
  })
}

function toggleDownloadMenu(block: HTMLElement) {
  const menu = block.querySelector('.mermaid-download-menu') as HTMLElement
  if (!menu) return

  // 关闭其他打开的菜单
  document.querySelectorAll('.mermaid-download-menu').forEach((m) => {
    if (m !== menu) (m as HTMLElement).style.display = 'none'
  })

  const isOpen = menu.style.display === 'block'
  menu.style.display = isOpen ? 'none' : 'block'

  if (!isOpen) {
    setTimeout(() => {
      const close = (e: MouseEvent) => {
        if (!menu.contains(e.target as HTMLElement)) {
          menu.style.display = 'none'
          document.removeEventListener('click', close, true)
        }
      }
      document.addEventListener('click', close, true)
    }, 0)
  }
}

function toggleView(block: HTMLElement) {
  const current = block.dataset.view || 'diagram'
  const next = current === 'diagram' ? 'source' : 'diagram'
  block.dataset.view = next

  const diagramBody = block.querySelector('.mermaid-diagram-body') as HTMLElement
  const sourceBody = block.querySelector('.mermaid-source-body') as HTMLElement
  const toggleBtn = block.querySelector('[data-action="toggle"]') as HTMLElement

  if (next === 'source') {
    if (diagramBody) diagramBody.style.display = 'none'
    if (sourceBody) sourceBody.style.display = 'block'
    if (toggleBtn) toggleBtn.title = '查看图表'
  } else {
    if (diagramBody) diagramBody.style.display = 'block'
    if (sourceBody) sourceBody.style.display = 'none'
    if (toggleBtn) toggleBtn.title = '查看源码'
  }
}

function zoomDiagram(block: HTMLElement, delta: number) {
  let zoom = parseInt(block.dataset.zoom || '100') + delta
  zoom = Math.max(30, Math.min(300, zoom))
  block.dataset.zoom = String(zoom)

  const svgEl = block.querySelector('.mermaid-diagram-body svg') as HTMLElement
  if (svgEl) svgEl.style.transform = `scale(${zoom / 100})`

  const label = block.querySelector('.mermaid-zoom-label') as HTMLElement
  if (label) label.textContent = `${zoom}%`
}

function openFullscreen(block: HTMLElement) {
  const svgEl = block.querySelector('.mermaid-diagram-body svg')
  if (!svgEl) return

  const svgClone = svgEl.cloneNode(true) as SVGElement
  svgClone.style.transform = ''
  svgClone.style.maxWidth = '90vw'
  svgClone.style.maxHeight = '80vh'
  svgClone.style.width = ''
  svgClone.style.height = ''

  const overlay = document.createElement('div')
  overlay.className = 'mermaid-fullscreen-overlay'
  overlay.innerHTML = `
    <div class="mermaid-fullscreen-header">
      <span class="mermaid-fullscreen-title">Mermaid 图表</span>
      <div class="mermaid-fullscreen-toolbar">
        <button class="mermaid-fullscreen-btn" data-fs-action="zoom-out">${ICON_ZOOM_OUT}</button>
        <span class="mermaid-fullscreen-zoom">100%</span>
        <button class="mermaid-fullscreen-btn" data-fs-action="zoom-in">${ICON_ZOOM_IN}</button>
        <span class="mermaid-fullscreen-divider"></span>
        <div class="mermaid-fs-download-wrap">
          <button class="mermaid-fullscreen-btn" data-fs-action="download">${ICON_DOWNLOAD}</button>
          <div class="mermaid-fs-download-menu">
            <button class="mermaid-fs-download-option" data-fs-dl="svg">下载 SVG</button>
            <button class="mermaid-fs-download-option" data-fs-dl="png">下载 PNG</button>
          </div>
        </div>
        <button class="mermaid-fullscreen-btn" data-fs-action="close">${ICON_CLOSE}</button>
      </div>
    </div>
    <div class="mermaid-fullscreen-body">
      <div class="mermaid-fullscreen-content"></div>
    </div>`

  overlay.querySelector('.mermaid-fullscreen-content')!.appendChild(svgClone)

  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'
  requestAnimationFrame(() => overlay.classList.add('visible'))

  let fsZoom = 100
  const zoomLabel = overlay.querySelector('.mermaid-fullscreen-zoom') as HTMLElement
  const content = overlay.querySelector('.mermaid-fullscreen-content') as HTMLElement

  const doDownload = async (format: 'svg' | 'png') => {
    const s = overlay.querySelector('.mermaid-fullscreen-content svg') as SVGElement | null
    if (!s) return
    const svgStr = fixSvgDimensions(new XMLSerializer().serializeToString(s))
    if (format === 'svg') {
      triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), '.svg')
    } else {
      const blob = await svgToPngBlob(svgStr)
      if (blob) triggerDownload(blob, '.png')
    }
  }

  // 下载菜单选项
  overlay.querySelectorAll('.mermaid-fs-download-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation()
      overlay.querySelectorAll('.mermaid-fs-download-menu').forEach((m) => {
        ;(m as HTMLElement).style.display = 'none'
      })
      doDownload((opt as HTMLElement).dataset.fsDl as 'svg' | 'png')
    })
  })

  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // 点击菜单外关闭
    if (!target.closest('.mermaid-fs-download-menu')) {
      overlay.querySelectorAll('.mermaid-fs-download-menu').forEach((m) => {
        ;(m as HTMLElement).style.display = 'none'
      })
    }

    const fsBtn = target.closest('[data-fs-action]') as HTMLElement
    if (fsBtn) {
      const action = fsBtn.dataset.fsAction
      if (action === 'close') closeFullscreen(overlay)
      else if (action === 'zoom-in') {
        fsZoom = Math.min(400, fsZoom + 20)
        content.style.transform = `scale(${fsZoom / 100})`
        zoomLabel.textContent = `${fsZoom}%`
      } else if (action === 'zoom-out') {
        fsZoom = Math.max(30, fsZoom - 20)
        content.style.transform = `scale(${fsZoom / 100})`
        zoomLabel.textContent = `${fsZoom}%`
      } else if (action === 'download') {
        const menu = overlay.querySelector('.mermaid-fs-download-menu') as HTMLElement
        if (menu) {
          menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
        }
      }
    } else if (target === overlay || target.classList.contains('mermaid-fullscreen-body')) {
      closeFullscreen(overlay)
    }
  })

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeFullscreen(overlay)
      document.removeEventListener('keydown', escHandler)
    }
  })
}

function closeFullscreen(overlay: HTMLElement) {
  overlay.classList.remove('visible')
  document.body.style.overflow = ''
  setTimeout(() => overlay.remove(), 200)
}

async function downloadDiagram(block: HTMLElement, format: 'svg' | 'png') {
  const svgEl = block.querySelector('.mermaid-diagram-body svg') as SVGElement | null
  if (!svgEl) return

  const svgStr = fixSvgDimensions(new XMLSerializer().serializeToString(svgEl))

  if (format === 'svg') {
    triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), '.svg')
  } else {
    const blob = await svgToPngBlob(svgStr)
    if (blob) triggerDownload(blob, '.png')
  }
}

function fixSvgDimensions(svg: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement

  let w = parseFloat(root.getAttribute('width') || '')
  let h = parseFloat(root.getAttribute('height') || '')
  const viewBox = root.getAttribute('viewBox')

  if ((!w || !h) && viewBox) {
    const parts = viewBox.split(/\s+/)
    if (parts.length === 4) {
      w = parseFloat(parts[2])
      h = parseFloat(parts[3])
    }
  }
  if (!w || !h) { w = 800; h = 600 }

  root.setAttribute('width', String(w))
  root.setAttribute('height', String(h))
  return new XMLSerializer().serializeToString(root)
}

async function svgToPngBlob(svgStr: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)

    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

function triggerDownload(blob: Blob, ext: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `mermaid-${Date.now()}${ext}`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function copySource(block: HTMLElement) {
  const source = decodeURIComponent(escape(atob(block.dataset.mermaidSource!)))
  try {
    await navigator.clipboard.writeText(source)
    showCopyFeedback(block)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = source
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showCopyFeedback(block)
  }
}

function showCopyFeedback(block: HTMLElement) {
  const btn = block.querySelector('[data-action="copy"]')
  if (!btn) return
  btn.classList.add('copied')
  setTimeout(() => btn.classList.remove('copied'), 2000)
}

// ─── 代码块复制按钮 ─────────────────────────────────────────
const rootRef = ref<HTMLElement>()

function bindCopyButtons(el: HTMLElement) {
  el.querySelectorAll('.code-copy-btn').forEach((btn) => {
    if ((btn as HTMLElement)._copyBound) return
    ;(btn as HTMLElement)._copyBound = true

    btn.addEventListener('click', async () => {
      const button = btn as HTMLElement
      const encodedSource = button.dataset.codeSource
      const codeEl = button.closest('.code-block-wrapper')?.querySelector('code')
      const text = encodedSource
        ? decodeURIComponent(escape(atob(encodedSource)))
        : codeEl?.textContent || ''
      if (!text) return

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

function handleHtmlPreviewMessage(event: MessageEvent) {
  if (event.source !== htmlFrameRef.value?.contentWindow) return

  const data = event.data
  if (!data || data.type !== 'smartorder-html-preview-height') return

  const height = Number(data.height)
  if (!Number.isFinite(height)) return

  htmlPreviewHeight.value = Math.min(Math.max(Math.ceil(height), 320), 2400)
}

watch(
  () => props.content,
  () => {
    if (isHtmlPreview.value) {
      htmlPreviewHeight.value = 720
    }
  },
)

onMounted(() => {
  window.addEventListener('message', handleHtmlPreviewMessage)

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
  window.removeEventListener('message', handleHtmlPreviewMessage)

  blobUrls.forEach((url) => URL.revokeObjectURL(url))
  blobUrls.length = 0
})
</script>

<style scoped>
.html-preview-frame {
  display: block;
  width: 100%;
  min-height: 320px;
  border: 0;
  border-radius: 8px;
  background: #fff;
}

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
  --code-bg: #fbfcfd;
  --code-gutter-bg: #f4f7fa;
  --code-border: #d7dfe8;
  --code-muted: #64748b;
  --code-text: #1e293b;
  margin: 1em 0;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 252, 0.96)),
    var(--code-bg);
  border: 1px solid var(--code-border);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

/* 代码块头部：语言标签 + 复制按钮 */
.markdown-renderer :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  padding: 8px 12px 8px 14px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96));
  border-bottom: 1px solid var(--code-border);
  font-size: 0.78rem;
  color: var(--code-muted);
}

.markdown-renderer :deep(.code-title-group) {
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
  gap: 8px;
}

.markdown-renderer :deep(.code-lang) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-weight: 650;
  color: #1f2937;
  line-height: 1.2;
}

.markdown-renderer :deep(.code-caption) {
  color: var(--code-muted);
  font-size: 0.75rem;
  line-height: 1.2;
}

.markdown-renderer :deep(.code-copy-btn) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  min-height: 26px;
  padding: 3px 9px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--code-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.4;
}

.markdown-renderer :deep(.code-copy-btn:hover) {
  background: #fff;
  border-color: #cbd5e1;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
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
  padding: 0;
  font-size: 0.84rem;
  line-height: 1.68;
  background: var(--code-bg);
  color: var(--code-text);
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.markdown-renderer :deep(.code-block-wrapper pre::-webkit-scrollbar) {
  height: 10px;
}

.markdown-renderer :deep(.code-block-wrapper pre::-webkit-scrollbar-track) {
  background: #f1f5f9;
}

.markdown-renderer :deep(.code-block-wrapper pre::-webkit-scrollbar-thumb) {
  border: 3px solid #f1f5f9;
  border-radius: 999px;
  background: #cbd5e1;
}

.markdown-renderer :deep(.code-block-wrapper pre::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}

.markdown-renderer :deep(.code-block-wrapper pre code) {
  display: block;
  min-width: max-content;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-variant-ligatures: none;
  tab-size: 2;
  background: none;
  padding: 0;
}

.markdown-renderer :deep(.code-line) {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  min-height: 1.68em;
  border-left: 3px solid transparent;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.markdown-renderer :deep(.code-line:first-child .code-line-no),
.markdown-renderer :deep(.code-line:first-child .code-line-content) {
  padding-top: 12px;
}

.markdown-renderer :deep(.code-line:last-child .code-line-no),
.markdown-renderer :deep(.code-line:last-child .code-line-content) {
  padding-bottom: 12px;
}

.markdown-renderer :deep(.code-line:hover) {
  background: rgba(14, 116, 144, 0.045);
}

.markdown-renderer :deep(.code-line-no) {
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 0 12px 0 10px;
  color: #94a3b8;
  text-align: right;
  user-select: none;
  border-right: 1px solid #e2e8f0;
  background: var(--code-gutter-bg);
  font-size: 0.74rem;
}

.markdown-renderer :deep(.code-line-content) {
  min-width: 0;
  padding: 0 18px;
  white-space: pre;
}

.markdown-renderer :deep(.code-line-highlight) {
  border-left-color: #0f9f8f;
  background:
    linear-gradient(90deg, rgba(20, 184, 166, 0.18), rgba(20, 184, 166, 0.06) 68%, transparent);
  box-shadow: 0 1px 0 rgba(15, 159, 143, 0.08) inset;
}

.markdown-renderer :deep(.code-line-highlight .code-line-no) {
  color: #0f766e;
  background: #e6f7f5;
}

.markdown-renderer :deep(.code-line-note) {
  border-left-color: #2563eb;
  background:
    linear-gradient(90deg, rgba(37, 99, 235, 0.13), rgba(37, 99, 235, 0.045) 68%, transparent);
}

.markdown-renderer :deep(.code-line-note .code-line-no) {
  color: #2563eb;
  background: #edf4ff;
}

.markdown-renderer :deep(.code-line-error) {
  border-left-color: #dc2626;
  background:
    linear-gradient(90deg, rgba(220, 38, 38, 0.13), rgba(220, 38, 38, 0.045) 68%, transparent);
}

.markdown-renderer :deep(.code-line-error .code-line-no) {
  color: #dc2626;
  background: #fff1f1;
}

.markdown-renderer :deep(.has-teaching-markers .code-block-header) {
  background:
    linear-gradient(180deg, rgba(239, 253, 250, 0.98), rgba(236, 250, 248, 0.96));
  border-bottom-color: rgba(15, 159, 143, 0.22);
}

.markdown-renderer :deep(.code-block-wrapper .hljs-comment),
.markdown-renderer :deep(.code-block-wrapper .hljs-quote) {
  color: #64748b;
  font-style: italic;
}

.markdown-renderer :deep(.code-block-wrapper .hljs-keyword),
.markdown-renderer :deep(.code-block-wrapper .hljs-selector-tag),
.markdown-renderer :deep(.code-block-wrapper .hljs-built_in) {
  color: #0f5cb6;
  font-weight: 650;
}

.markdown-renderer :deep(.code-block-wrapper .hljs-string),
.markdown-renderer :deep(.code-block-wrapper .hljs-regexp),
.markdown-renderer :deep(.code-block-wrapper .hljs-template-variable) {
  color: #0f766e;
}

.markdown-renderer :deep(.code-block-wrapper .hljs-number),
.markdown-renderer :deep(.code-block-wrapper .hljs-literal),
.markdown-renderer :deep(.code-block-wrapper .hljs-variable) {
  color: #b45309;
}

.markdown-renderer :deep(.code-block-wrapper .hljs-title),
.markdown-renderer :deep(.code-block-wrapper .hljs-title.function_),
.markdown-renderer :deep(.code-block-wrapper .hljs-function .hljs-title) {
  color: #7c3aed;
  font-weight: 600;
}

.markdown-renderer :deep(.code-block-wrapper .hljs-attr),
.markdown-renderer :deep(.code-block-wrapper .hljs-attribute),
.markdown-renderer :deep(.code-block-wrapper .hljs-property) {
  color: #0369a1;
}

@media (max-width: 640px) {
  .markdown-renderer :deep(.code-block-header) {
    min-height: 34px;
    padding: 6px 10px;
  }

  .markdown-renderer :deep(.code-caption) {
    display: none;
  }

  .markdown-renderer :deep(.code-line) {
    grid-template-columns: 2.75rem minmax(0, 1fr);
  }

  .markdown-renderer :deep(.code-line-no) {
    padding: 0 8px 0 6px;
  }

  .markdown-renderer :deep(.code-line-content) {
    padding: 0 12px;
  }
}

/* 兼容：没有经过 wrapper 的裸 pre */
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
  --mermaid-border: rgba(15, 23, 42, 0.1);
  --mermaid-muted: #64748b;
  --mermaid-text: #0f172a;
  --mermaid-accent: #0bb7aa;
  margin: 1em 0;
  border-radius: 12px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98)),
    #fff;
  border: 1px solid var(--mermaid-border);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.92) inset;
}

.markdown-renderer :deep(.mermaid-loading) {
  padding: 28px 16px;
  text-align: center;
  color: var(--mermaid-muted);
  font-size: 0.8125rem;
}

.markdown-renderer :deep(.mermaid-diagram-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 8px 12px 8px 14px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.92));
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.75rem;
  color: var(--mermaid-muted);
}

.markdown-renderer :deep(.mermaid-title-group) {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.markdown-renderer :deep(.mermaid-title-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: rgba(11, 183, 170, 0.1);
  color: var(--mermaid-accent);
  flex-shrink: 0;
}

.markdown-renderer :deep(.mermaid-caption) {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.2;
}

.markdown-renderer :deep(.mermaid-toolbar) {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.markdown-renderer :deep(.mermaid-toolbar-divider) {
  width: 1px;
  height: 14px;
  background: #dbe3ea;
  margin: 0 4px;
}

.markdown-renderer :deep(.mermaid-tool-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--mermaid-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.markdown-renderer :deep(.mermaid-tool-btn:hover) {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.08);
  color: var(--mermaid-text);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.markdown-renderer :deep(.mermaid-tool-btn.copied) {
  color: #0f766e;
}

.markdown-renderer :deep(.mermaid-tool-btn svg) {
  flex-shrink: 0;
}

/* 下载下拉菜单 */
.markdown-renderer :deep(.mermaid-download-wrap) {
  position: relative;
}

.markdown-renderer :deep(.mermaid-download-menu) {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 6px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
  z-index: 100;
  min-width: 120px;
  overflow: hidden;
}

.markdown-renderer :deep(.mermaid-download-option) {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: #fff;
  color: #334155;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  font-family: inherit;
}

.markdown-renderer :deep(.mermaid-download-option:hover) {
  background: #f0fdfa;
  color: #0f766e;
}

.markdown-renderer :deep(.mermaid-zoom-label) {
  font-size: 0.7rem;
  color: var(--mermaid-muted);
  min-width: 32px;
  text-align: center;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.markdown-renderer :deep(.mermaid-diagram-body) {
  padding: 20px;
  text-align: center;
  max-height: 560px;
  overflow: auto;
  background:
    radial-gradient(circle at 16px 16px, rgba(14, 165, 233, 0.14) 1px, transparent 1.5px),
    linear-gradient(180deg, #ffffff, #f8fbfc);
  background-size: 24px 24px, 100% 100%;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.markdown-renderer :deep(.mermaid-diagram-body::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

.markdown-renderer :deep(.mermaid-diagram-body::-webkit-scrollbar-track) {
  background: transparent;
}

.markdown-renderer :deep(.mermaid-diagram-body::-webkit-scrollbar-thumb) {
  border: 3px solid transparent;
  border-radius: 999px;
  background: #cbd5e1;
  background-clip: content-box;
}

.markdown-renderer :deep(.mermaid-diagram-scroll) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: min(100%, 520px);
  min-height: 220px;
  padding: 18px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.markdown-renderer :deep(.mermaid-diagram-body svg) {
  max-width: 100%;
  height: auto;
  transform-origin: center top;
  transition: transform 0.15s ease;
  overflow: visible;
  filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.08));
}

.markdown-renderer :deep(.mermaid-diagram-body svg .node rect),
.markdown-renderer :deep(.mermaid-diagram-body svg .node polygon),
.markdown-renderer :deep(.mermaid-diagram-body svg .node circle),
.markdown-renderer :deep(.mermaid-diagram-body svg .node ellipse) {
  rx: 8px;
  filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.09));
}

.markdown-renderer :deep(.mermaid-diagram-body svg .edgePath .path) {
  stroke-width: 2.2px;
}

.markdown-renderer :deep(.mermaid-diagram-body svg .edgeLabel) {
  color: #334155;
  font-weight: 600;
}

.markdown-renderer :deep(.mermaid-source-body) {
  display: none;
  max-height: 400px;
  overflow: auto;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.markdown-renderer :deep(.mermaid-source-body pre) {
  margin: 0;
  padding: 16px 18px;
  font-size: 0.8125rem;
  line-height: 1.6;
  background: #f8fafc;
}

.markdown-renderer :deep(.mermaid-source-body pre code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
}

.markdown-renderer :deep(.mermaid-error-body) {
  padding: 14px 16px 16px;
  background: #fff7f7;
}

.markdown-renderer :deep(.mermaid-error-msg) {
  margin: 0 0 8px;
  color: #cf222e;
  font-size: 0.8125rem;
  font-weight: 500;
}

.markdown-renderer :deep(.mermaid-error-body pre) {
  margin: 0;
  border-radius: 8px;
  overflow-x: auto;
  padding: 10px 14px;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: #fff;
  border: 1px solid rgba(220, 38, 38, 0.16);
}

.markdown-renderer :deep(.mermaid-error-body pre code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
}

@media (max-width: 640px) {
  .markdown-renderer :deep(.mermaid-block) {
    border-radius: 10px;
  }

  .markdown-renderer :deep(.mermaid-diagram-header) {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px;
  }

  .markdown-renderer :deep(.mermaid-toolbar) {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 1px;
  }

  .markdown-renderer :deep(.mermaid-caption) {
    display: none;
  }

  .markdown-renderer :deep(.mermaid-diagram-body) {
    padding: 12px;
  }

  .markdown-renderer :deep(.mermaid-diagram-scroll) {
    min-height: 180px;
    padding: 12px;
  }
}
</style>

<!-- 全屏覆盖层样式（非 scoped，挂载到 body） -->
<style>
.mermaid-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: column;
  transition: background 0.2s ease;
}
.mermaid-fullscreen-overlay.visible {
  background: rgba(7, 12, 22, 0.78);
  backdrop-filter: blur(10px);
}
.mermaid-fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 12px 20px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9));
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  color: #cbd5e1;
  font-size: 0.8125rem;
}
.mermaid-fullscreen-title {
  font-weight: 650;
  color: #f8fafc;
}
.mermaid-fullscreen-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}
.mermaid-fullscreen-divider {
  width: 1px;
  height: 16px;
  background: rgba(148, 163, 184, 0.28);
  margin: 0 8px;
}
.mermaid-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  color: #cbd5e1;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mermaid-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.14);
  color: #fff;
}

/* 全屏下载菜单 */
.mermaid-fs-download-wrap {
  position: relative;
}
.mermaid-fs-download-menu {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 7px;
  background: #111827;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.38);
  z-index: 100;
  min-width: 120px;
  overflow: hidden;
}
.mermaid-fs-download-option {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: #111827;
  color: #cbd5e1;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  font-family: inherit;
}
.mermaid-fs-download-option:hover {
  background: rgba(20, 184, 166, 0.18);
  color: #f8fafc;
}

.mermaid-fullscreen-zoom {
  font-size: 0.75rem;
  color: #cbd5e1;
  min-width: 38px;
  text-align: center;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.mermaid-fullscreen-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    radial-gradient(circle at 24px 24px, rgba(125, 211, 252, 0.12) 1px, transparent 1.5px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.36), rgba(2, 6, 23, 0.5));
  background-size: 28px 28px, 100% 100%;
}
.mermaid-fullscreen-content {
  transform-origin: center center;
  transition: transform 0.15s ease;
  padding: 22px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.36),
    0 0 0 1px rgba(255, 255, 255, 0.72) inset;
}
.mermaid-fullscreen-content svg {
  max-width: 90vw;
  max-height: 80vh;
  height: auto;
  background: transparent;
  border-radius: 10px;
  filter: drop-shadow(0 12px 22px rgba(15, 23, 42, 0.12));
}

@media (max-width: 640px) {
  .mermaid-fullscreen-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
  }

  .mermaid-fullscreen-toolbar {
    width: 100%;
    overflow-x: auto;
  }

  .mermaid-fullscreen-body {
    padding: 14px;
  }

  .mermaid-fullscreen-content {
    padding: 12px;
  }
}
</style>
