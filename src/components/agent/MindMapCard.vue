<template>
  <div class="mindmap-card" v-if="data">
    <div class="mindmap-header">
      <div class="mindmap-title">
        <el-icon class="mindmap-icon"><Connection /></el-icon>
        <span>{{ data.topic }}</span>
      </div>
      <span class="mindmap-meta">{{ data.nodes.length }} 个节点</span>
    </div>
    <div
      class="mindmap-thumb-wrapper"
      :style="{ height: thumbHeight + 'px' }"
      @click="openFullscreen"
    >
      <div ref="thumbContainerRef" class="mindmap-canvas"></div>
      <div class="mindmap-thumb-overlay">
        <el-icon><FullScreen /></el-icon>
        <span>点击查看完整思维导图</span>
      </div>
    </div>

    <el-dialog
      v-model="fullscreenVisible"
      :title="data.topic"
      width="92%"
      top="3vh"
      destroy-on-close
      class="mindmap-dialog"
      append-to-body
    >
      <div ref="fullscreenWrapperRef" class="mindmap-fullscreen-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
        <div class="mindmap-toolbar">
          <el-button size="small" @click="fitView">
            <el-icon><Aim /></el-icon><span>适应屏幕</span>
          </el-button>
          <el-button size="small" @click="zoomOut">
            <el-icon><ZoomOut /></el-icon><span>缩小</span>
          </el-button>
          <el-button size="small" @click="zoomIn">
            <el-icon><ZoomIn /></el-icon><span>放大</span>
          </el-button>
          <el-button size="small" @click="exportPNG">
            <el-icon><Picture /></el-icon><span>导出 PNG</span>
          </el-button>
          <el-button size="small" @click="exportSVG">
            <el-icon><Download /></el-icon><span>导出 SVG</span>
          </el-button>
          <el-button size="small" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon><span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
          </el-button>
        </div>
        <div ref="fullContainerRef" class="mindmap-full-canvas"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { Graph } from '@antv/x6'
import { Export } from '@antv/x6-plugin-export'
import {
  Connection, FullScreen, Aim, ZoomIn, ZoomOut, Picture, Download,
} from '@element-plus/icons-vue'
import type { MindMapData, MindMapNode } from '@/types/mindMap'

const props = withDefaults(defineProps<{
  data: MindMapData
  thumbHeight?: number
}>(), {
  thumbHeight: 200,
})

const thumbContainerRef = ref<HTMLDivElement | null>(null)
const fullContainerRef = ref<HTMLDivElement | null>(null)
const fullscreenWrapperRef = ref<HTMLDivElement | null>(null)
const fullscreenVisible = ref(false)
const isFullscreen = ref(false)

let thumbGraph: Graph | null = null
let fullGraph: Graph | null = null

const NODE_WIDTH = 120
const NODE_HEIGHT = 36
const H_GAP = 60   // 水平间距
const V_GAP = 16   // 同层兄弟节点垂直间距

/** 按 parentId 构造 children 索引 */
function buildChildrenMap(nodes: MindMapNode[]): Map<string | null, MindMapNode[]> {
  const map = new Map<string | null, MindMapNode[]>()
  for (const n of nodes) {
    const key = n.parentId ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  }
  return map
}

/** 子树高度（节点数 * 节点高 + 间距） */
function subtreeHeight(nodeId: string, childrenMap: Map<string | null, MindMapNode[]>): number {
  const children = childrenMap.get(nodeId) || []
  if (children.length === 0) return NODE_HEIGHT
  let sum = 0
  for (const c of children) {
    sum += subtreeHeight(c.id, childrenMap)
  }
  sum += V_GAP * (children.length - 1)
  return Math.max(NODE_HEIGHT, sum)
}

/** 递归布局：根节点居左，子节点纵向堆叠在父节点右侧 */
function layoutNodes(
  nodes: MindMapNode[],
): { positions: Map<string, { x: number; y: number }>; width: number; height: number } {
  const childrenMap = buildChildrenMap(nodes)
  const roots = childrenMap.get(null) || []
  const positions = new Map<string, { x: number; y: number }>()
  let cursorY = 0
  let maxX = 0
  let totalMinY = Infinity
  let totalMaxY = -Infinity

  function place(node: MindMapNode, x: number, yCenter: number) {
    positions.set(node.id, { x, y: yCenter - NODE_HEIGHT / 2 })
    maxX = Math.max(maxX, x + NODE_WIDTH)
    totalMinY = Math.min(totalMinY, yCenter - NODE_HEIGHT / 2)
    totalMaxY = Math.max(totalMaxY, yCenter + NODE_HEIGHT / 2)
    const children = childrenMap.get(node.id) || []
    if (children.length === 0) return
    // 计算子节点总高度
    let childTotal = 0
    for (const c of children) childTotal += subtreeHeight(c.id, childrenMap)
    childTotal += V_GAP * (children.length - 1)
    let startY = yCenter - childTotal / 2
    const childX = x + NODE_WIDTH + H_GAP
    for (const c of children) {
      const cH = subtreeHeight(c.id, childrenMap)
      place(c, childX, startY + cH / 2)
      startY += cH + V_GAP
    }
  }

  // 多根节点：纵向依次堆叠
  for (const r of roots) {
    const rH = subtreeHeight(r.id, childrenMap)
    place(r, 0, cursorY + rH / 2)
    cursorY += rH + V_GAP * 2
  }
  return {
    positions,
    width: maxX + 40,
    height: (isFinite(totalMaxY) ? totalMaxY - totalMinY : 400) + 40,
  }
}

function buildGraph(container: HTMLDivElement, interactive: boolean): Graph {
  const graph = new Graph({
    container,
    background: { color: '#fafbfc' },
    interacting: interactive ? { nodeMovable: false, edgeMovable: false, magnet: false } : false,
    mousewheel: interactive ? { enabled: true, modifiers: ['ctrl', 'meta'], minScale: 0.2, maxScale: 3 } : false,
    panning: interactive ? { enabled: true } : false,
    grid: interactive ? { visible: true, size: 10, type: 'dot' } : false,
  })
  if (interactive) {
    graph.use(new Export()) // 只有全屏交互模式才加载导出插件
  }
  return graph
}

function renderGraph(graph: Graph, interactive: boolean) {
  graph.clearCells()
  const { positions } = layoutNodes(props.data.nodes)
  // 节点
  for (const n of props.data.nodes) {
    const pos = positions.get(n.id)
    if (!pos) continue
    graph.addNode({
      id: n.id,
      shape: 'rect',
      x: pos.x,
      y: pos.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      attrs: {
        body: {
          fill: n.color || '#4f46e5',
          stroke: n.color || '#4f46e5',
          rx: 6,
          ry: 6,
        },
        label: {
          text: n.label,
          fill: '#ffffff',
          fontSize: 12,
          fontWeight: (n.level ?? 0) === 0 ? 600 : 400,
        },
      },
    })
  }
  // 父子边
  for (const n of props.data.nodes) {
    if (!n.parentId) continue
    graph.addEdge({
      shape: 'edge',
      source: n.parentId,
      target: n.id,
      connector: { name: 'rounded' },
      router: { name: 'manhattan' },
      attrs: {
        line: {
          stroke: '#cbd5e1',
          strokeWidth: 1.5,
          targetMarker: null,
        },
      },
    })
  }
  // 额外关联边（虚线带 label）
  for (const e of props.data.edges || []) {
    graph.addEdge({
      shape: 'edge',
      source: e.source,
      target: e.target,
      connector: { name: 'rounded' },
      router: { name: 'orth' },
      attrs: {
        line: {
          stroke: '#f59e0b',
          strokeWidth: 1.5,
          strokeDasharray: '5 4',
          targetMarker: { name: 'block', width: 6, height: 6 },
        },
      },
      labels: e.label
        ? [{ position: 0.5, attrs: { label: { text: e.label, fill: '#f59e0b', fontSize: 11 } } }]
        : [],
    })
  }
  graph.zoomToFit({ padding: interactive ? 30 : 10, maxScale: interactive ? 1.5 : 1 })
}

function initThumb() {
  if (!thumbContainerRef.value) return
  if (thumbGraph) return // 已初始化，避免重复
  try {
    const container = thumbContainerRef.value
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      // 容器尺寸为零（布局未完成），跳过稍后由 watch fullscreenVisible 或外部重试
      console.warn('[MindMapCard] 缩略图容器尺寸为零，跳过初始化')
      return
    }
    thumbGraph = buildGraph(container, false)
    renderGraph(thumbGraph, false)
  } catch (e) {
    console.error('[MindMapCard] 缩略图初始化失败:', e)
    // 清理失败的 graph，防止内存泄漏
    if (thumbGraph) { try { thumbGraph.dispose() } catch { /* */ } thumbGraph = null }
  }
}

function initFull() {
  if (!fullContainerRef.value) return
  if (fullGraph) { fullGraph.dispose(); fullGraph = null }
  try {
    fullGraph = buildGraph(fullContainerRef.value, true)
    renderGraph(fullGraph, true)
  } catch (e) {
    console.error('[MindMapCard] 全屏画布初始化失败:', e)
    if (fullGraph) { try { fullGraph.dispose() } catch { /* */ } fullGraph = null }
  }
}

function openFullscreen() {
  fullscreenVisible.value = true
  nextTick(() => {
    // dialog 动画完成后初始化
    setTimeout(() => initFull(), 50)
  })
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  if (fullGraph) {
    // requestAnimationFrame 确保 fullscreen 布局完成后再重设画布
    nextTick(() => {
      requestAnimationFrame(() => {
        const container = fullContainerRef.value
        if (container && fullGraph) {
          fullGraph.resize(container.clientWidth, container.clientHeight)
          fullGraph.zoomToFit({ padding: 30, maxScale: 1.5 })
        }
      })
    })
  }
}

function toggleFullscreen() {
  if (!fullscreenWrapperRef.value) return
  if (!isFullscreen.value) {
    fullscreenWrapperRef.value.requestFullscreen().catch((err) => {
      console.warn('[MindMapCard] 进入全屏失败:', err)
    })
  } else {
    document.exitFullscreen().catch((err) => {
      console.warn('[MindMapCard] 退出全屏失败:', err)
    })
  }
}

function fitView() {
  fullGraph?.zoomToFit({ padding: 30, maxScale: 1.5 })
}
function zoomIn() {
  fullGraph?.zoom(0.1)
}
function zoomOut() {
  fullGraph?.zoom(-0.1)
}
function exportPNG() {
  fullGraph?.toPNG((dataUri: string) => {
    downloadDataUri(dataUri, `${props.data.topic}.png`)
  }, { padding: 20, backgroundColor: '#ffffff' })
}
function exportSVG() {
  fullGraph?.toSVG((svg: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    downloadUrl(url, `${props.data.topic}.svg`)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
}
function downloadDataUri(dataUri: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUri
  a.download = filename
  a.click()
}
function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

const thumbInitDone = ref(false)

onMounted(() => {
  // 用 requestAnimationFrame 延迟初始化，确保浏览器完成 layout（容器有正确尺寸）
  let rafId: number
  let mounted = true
  function tryInit() {
    if (!mounted || thumbInitDone.value) return
    // 检查容器是否有尺寸（浏览器 layout 后才有）
    if (!thumbContainerRef.value || thumbContainerRef.value.clientWidth === 0 || thumbContainerRef.value.clientHeight === 0) {
      rafId = requestAnimationFrame(tryInit) // 重试
      return
    }
    initThumb()
    thumbInitDone.value = true
  }
  rafId = requestAnimationFrame(tryInit)
  // 安全兜底：最迟 500ms 后强制初始化
  const fallbackTimer = setTimeout(() => {
    if (!thumbInitDone.value && mounted) {
      console.warn('[MindMapCard] rAF 超时，强制初始化缩略图')
      cancelAnimationFrame(rafId)
      initThumb()
      thumbInitDone.value = true
    }
  }, 500)

  onBeforeUnmount(() => {
    mounted = false
    cancelAnimationFrame(rafId)
    clearTimeout(fallbackTimer)
  })
})

watch(() => props.data, () => {
  if (thumbGraph) renderGraph(thumbGraph, false)
  if (fullGraph && fullscreenVisible.value) renderGraph(fullGraph, true)
}, { deep: true })

watch(fullscreenVisible, (v) => {
  if (!v) {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    isFullscreen.value = false
    if (fullGraph) {
      try { fullGraph.dispose() } catch { /* */ }
      fullGraph = null
    }
  } else {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (thumbGraph) { try { thumbGraph.dispose() } catch { /* */ } thumbGraph = null }
  if (fullGraph) { try { fullGraph.dispose() } catch { /* */ } fullGraph = null }
})
</script>

<style scoped lang="scss">
.mindmap-card {
  margin: 8px 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}
.mindmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #fff;
}
.mindmap-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}
.mindmap-icon {
  font-size: 16px;
}
.mindmap-meta {
  font-size: 12px;
  opacity: 0.85;
}
.mindmap-thumb-wrapper {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.mindmap-canvas {
  width: 100%;
  height: 100%;
}
.mindmap-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0);
  color: transparent;
  font-size: 13px;
  transition: all 0.2s;
}
.mindmap-thumb-wrapper:hover .mindmap-thumb-overlay {
  background: rgba(15, 23, 42, 0.35);
  color: #fff;
}
.mindmap-dialog :deep(.el-dialog__body) {
  padding: 0 16px 16px;
}
.mindmap-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
}
.mindmap-fullscreen-wrapper {
  display: flex;
  flex-direction: column;
}

.mindmap-full-canvas {
  width: 100%;
  height: 70vh;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafbfc;
}

/* 全屏模式样式（position: fixed 脱离 dialog body 布局约束） */
.mindmap-fullscreen-wrapper.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
}
.mindmap-fullscreen-wrapper.is-fullscreen .mindmap-toolbar {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid #e5e7eb;
  justify-content: center;
  flex-wrap: wrap;
}
.mindmap-fullscreen-wrapper.is-fullscreen .mindmap-full-canvas {
  flex: 1;
  min-height: 0;
  border: none;
  border-radius: 0;
}
</style>
