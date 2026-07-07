<template>
  <div ref="rootRef" class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from 'vue'
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

// SVG 图标常量
const ICON_TOGGLE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
const ICON_ZOOM_IN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
const ICON_ZOOM_OUT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
const ICON_FULLSCREEN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
const ICON_DOWNLOAD = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
const ICON_COPY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const ICON_CLOSE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

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
    <span class="code-lang">Mermaid</span>
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
    <span class="code-lang">Mermaid</span>
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

.markdown-renderer :deep(.mermaid-toolbar) {
  display: flex;
  align-items: center;
  gap: 2px;
}

.markdown-renderer :deep(.mermaid-toolbar-divider) {
  width: 1px;
  height: 14px;
  background: #d0d5db;
  margin: 0 4px;
}

.markdown-renderer :deep(.mermaid-tool-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6a737d;
  cursor: pointer;
  transition: all 0.15s ease;
}

.markdown-renderer :deep(.mermaid-tool-btn:hover) {
  background: rgba(0, 0, 0, 0.06);
  color: #24292e;
}

.markdown-renderer :deep(.mermaid-tool-btn.copied) {
  color: #22863a;
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
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e6ea;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
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
  color: #24292e;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  font-family: inherit;
}

.markdown-renderer :deep(.mermaid-download-option:hover) {
  background: #f0f2f5;
}

.markdown-renderer :deep(.mermaid-zoom-label) {
  font-size: 0.7rem;
  color: #6a737d;
  min-width: 32px;
  text-align: center;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.markdown-renderer :deep(.mermaid-diagram-body) {
  padding: 16px;
  text-align: center;
  max-height: 500px;
  overflow: auto;
}

.markdown-renderer :deep(.mermaid-diagram-body svg) {
  max-width: 100%;
  height: auto;
  transform-origin: center top;
  transition: transform 0.15s ease;
}

.markdown-renderer :deep(.mermaid-source-body) {
  display: none;
  max-height: 400px;
  overflow: auto;
}

.markdown-renderer :deep(.mermaid-source-body pre) {
  margin: 0;
  padding: 14px 16px;
  font-size: 0.8125rem;
  line-height: 1.6;
  background: #f8f9fa;
}

.markdown-renderer :deep(.mermaid-source-body pre code) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  background: none;
  padding: 0;
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
  background: rgba(0, 0, 0, 0.75);
}
.mermaid-fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1e1e1e;
  color: #ccc;
  font-size: 0.8125rem;
}
.mermaid-fullscreen-title {
  font-weight: 500;
}
.mermaid-fullscreen-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mermaid-fullscreen-divider {
  width: 1px;
  height: 16px;
  background: #555;
  margin: 0 8px;
}
.mermaid-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #aaa;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mermaid-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1);
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
  margin-top: 4px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 100;
  min-width: 120px;
  overflow: hidden;
}
.mermaid-fs-download-option {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: #2a2a2a;
  color: #ccc;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  font-family: inherit;
}
.mermaid-fs-download-option:hover {
  background: #3a3a3a;
}

.mermaid-fullscreen-zoom {
  font-size: 0.75rem;
  color: #999;
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
}
.mermaid-fullscreen-content {
  transform-origin: center center;
  transition: transform 0.15s ease;
}
.mermaid-fullscreen-content svg {
  max-width: 90vw;
  max-height: 80vh;
  height: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
</style>
