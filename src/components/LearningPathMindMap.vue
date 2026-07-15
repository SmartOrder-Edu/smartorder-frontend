<template>
  <div class="mind-map-shell">
    <div class="mind-map-summary">
      <div>
        <span class="summary-eyebrow">知识节点总览</span>
        <h4>{{ title }}</h4>
      </div>
      <div class="summary-stats">
        <span><strong>{{ stageNodes.length }}</strong> 阶段</span>
        <span><strong>{{ knowledgeNodeCount }}</strong> 知识点</span>
        <span><strong>{{ props.resources.length }}</strong> 资源</span>
      </div>
    </div>

    <div class="mind-map-toolbar" aria-label="思维导图缩放控制">
      <button type="button" title="缩小" @click="zoomOut">-</button>
      <span>{{ zoomPercent }}</span>
      <button type="button" title="放大" @click="zoomIn">+</button>
      <button type="button" title="适应视图" @click="fitMap">适应</button>
      <button type="button" title="原始大小" @click="resetZoom">1:1</button>
    </div>

    <div
      ref="viewportRef"
      class="mind-map-scroll"
      :class="{ panning: isPanning }"
      :style="{ height: `${viewportHeight}px` }"
      @pointerdown="startPan"
      @pointermove="handlePan"
      @pointerup="endPan"
      @pointerleave="endPan"
      @wheel.ctrl.prevent="handleWheelZoom"
    >
      <div class="mind-map-stage" :style="stageStyle">
        <div
          class="mind-map-canvas"
          :style="canvasStyle"
        >
          <svg class="mind-map-lines" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" aria-hidden="true">
            <defs>
              <linearGradient id="mind-map-main-line" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0bb7aa" stop-opacity="0.18" />
                <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.62" />
                <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.24" />
              </linearGradient>
            </defs>
            <path
              v-for="stage in stageLayouts"
              :key="`root-${stage.node.id}`"
              class="mind-line main-line"
              :class="stage.node.status"
              :d="rootPath(stage)"
            />
            <path
              v-for="child in childLayouts"
              :key="`child-${child.node.id}`"
              class="mind-line child-line"
              :class="child.node.status"
              :d="childPath(child)"
            />
          </svg>

          <button
            class="mind-root"
            type="button"
            :style="nodeStyle(rootLayout)"
            @click="selectRoot"
          >
            <span>学习空间</span>
            <strong>{{ title }}</strong>
            <em>{{ progressText }}</em>
          </button>

          <button
            v-for="stage in stageLayouts"
            :key="stage.node.id"
            class="mind-node stage-node"
            :class="[stage.node.status, { selected: selectedNodeId === stage.node.id }]"
            type="button"
            :style="nodeStyle(stage)"
            @click="selectedNodeId = stage.node.id"
          >
            <span class="node-kicker">阶段 {{ stage.index + 1 }}</span>
            <strong>{{ stage.node.title }}</strong>
            <span class="node-meta">
              {{ statusLabel(stage.node.status) }}
              <template v-if="childNodes(stage.node.id).length"> · {{ childNodes(stage.node.id).length }} 知识点</template>
            </span>
          </button>

          <button
            v-for="child in childLayouts"
            :key="child.node.id"
            class="mind-node child-node"
            :class="[child.node.status, { selected: selectedNodeId === child.node.id }]"
            type="button"
            :style="nodeStyle(child)"
            @click="selectedNodeId = child.node.id"
          >
            <span class="child-dot"></span>
            <strong>{{ child.node.title }}</strong>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedNode" class="mind-detail">
      <div class="detail-main">
        <span class="detail-status" :class="selectedNode.status">{{ statusLabel(selectedNode.status) }}</span>
        <h4>{{ selectedNode.title }}</h4>
        <p>{{ selectedNode.description || '暂无节点说明，后续可由 Agent 补充学习重点和验收标准。' }}</p>
      </div>
      <div class="detail-rail">
        <span v-if="selectedNode.plannedDurationDays">计划 {{ selectedNode.plannedDurationDays }} 天</span>
        <span v-else-if="selectedNode.estimatedDurationMinutes">{{ selectedNode.estimatedDurationMinutes }} 分钟</span>
        <span v-if="selectedTasks.length">任务 {{ selectedTasks.length }}</span>
        <span v-if="selectedResources.length">资源 {{ selectedResources.length }}</span>
      </div>
      <div v-if="selectedTasks.length || selectedResources.length" class="detail-linked">
        <div v-if="selectedTasks.length" class="linked-group">
          <span>关联任务</span>
          <strong v-for="task in selectedTasks.slice(0, 3)" :key="task.id">{{ task.title }}</strong>
        </div>
        <div v-if="selectedResources.length" class="linked-group">
          <span>关联资源</span>
          <strong v-for="resource in selectedResources.slice(0, 3)" :key="resource.id">
            {{ resourceTypeLabel(resource.resourceType) }} · {{ resource.title }}
          </strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { PathNodeVO, ResourceType, ResourceVO, TaskVO } from '@/types/learningSpace'

interface LayoutNode {
  node: PathNodeVO
  x: number
  y: number
  width: number
  height: number
  side: 'left' | 'right'
  index: number
  parent?: LayoutNode
}

const props = defineProps<{
  nodes: PathNodeVO[]
  tasks: TaskVO[]
  resources: ResourceVO[]
  title?: string
  progress?: number
}>()

const canvasWidth = 1360
const rootWidth = 226
const rootHeight = 104
const stageWidth = 214
const stageHeight = 94
const childWidth = 162
const childHeight = 44
const rowGap = 154
const stageOffsetX = 220
const childOffsetX = 42
const minZoom = 0.65
const maxZoom = 1.8
const zoomStep = 0.15

const selectedNodeId = ref('')
const viewportRef = ref<HTMLElement | null>(null)
const zoom = ref(1)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

const stageNodes = computed(() =>
  [...props.nodes]
    .filter(node => node.nodeType === 'stage' || node.parentNodeId == null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
)

const knowledgeNodeCount = computed(() =>
  props.nodes.filter(node => node.nodeType === 'knowledge_point').length
)

const canvasHeight = computed(() => Math.max(640, 260 + Math.max(stageNodes.value.length, 1) * rowGap))
const viewportHeight = computed(() => Math.min(680, Math.max(520, Math.round(canvasHeight.value * 0.72))))
const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)
const stageStyle = computed(() => ({
  width: `${Math.round(canvasWidth * zoom.value)}px`,
  height: `${Math.round(canvasHeight.value * zoom.value)}px`,
}))
const canvasStyle = computed(() => ({
  width: `${canvasWidth}px`,
  height: `${canvasHeight.value}px`,
  transform: `scale(${zoom.value})`,
}))

const rootLayout = computed<LayoutNode>(() => ({
  node: stageNodes.value[0] || props.nodes[0] || emptyNode(),
  x: (canvasWidth - rootWidth) / 2,
  y: canvasHeight.value / 2 - rootHeight / 2,
  width: rootWidth,
  height: rootHeight,
  side: 'right',
  index: -1,
}))

const stageLayouts = computed<LayoutNode[]>(() => {
  const centerX = canvasWidth / 2
  const top = Math.max(120, canvasHeight.value / 2 - ((stageNodes.value.length - 1) * rowGap) / 2)
  return stageNodes.value.map((node, index) => {
    const side = index % 2 === 0 ? 'right' : 'left'
    return {
      node,
      x: side === 'right' ? centerX + stageOffsetX : centerX - stageOffsetX - stageWidth,
      y: top + index * rowGap,
      width: stageWidth,
      height: stageHeight,
      side,
      index,
    }
  })
})

const childLayouts = computed<LayoutNode[]>(() => {
  const layouts: LayoutNode[] = []
  stageLayouts.value.forEach(stage => {
    const children = childNodes(stage.node.id).slice(0, 5)
    const childGap = 48
    const startY = stage.y + stage.height / 2 - ((children.length - 1) * childGap + childHeight) / 2
    children.forEach((node, index) => {
      layouts.push({
        node,
        x: stage.side === 'right' ? stage.x + stage.width + childOffsetX : stage.x - childWidth - childOffsetX,
        y: startY + index * childGap,
        width: childWidth,
        height: childHeight,
        side: stage.side,
        index,
        parent: stage,
      })
    })
  })
  return layouts
})

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return stageNodes.value.find(node => node.status === 'current') || stageNodes.value[0] || null
  return props.nodes.find(node => node.id === selectedNodeId.value) || null
})

const selectedTasks = computed(() => {
  const node = selectedNode.value
  if (!node) return []
  const childIds = childNodes(node.id).map(child => child.id)
  const ids = new Set([node.id, ...childIds])
  return props.tasks.filter(task => task.pathNodeId && ids.has(task.pathNodeId))
})

const selectedResources = computed(() => {
  const node = selectedNode.value
  if (!node) return []
  const childIds = childNodes(node.id).map(child => child.id)
  const ids = new Set([node.id, ...childIds])
  return props.resources.filter(resource => resource.pathNodeId && ids.has(resource.pathNodeId))
})

const title = computed(() => props.title || '当前学习路径')
const progressText = computed(() => `${Math.round(props.progress || 0)}% 完成`)

watch(
  () => props.nodes.map(node => `${node.id}:${node.status}`).join('|'),
  () => {
    const current = props.nodes.find(node => node.status === 'current')
    selectedNodeId.value = current?.id || stageNodes.value[0]?.id || ''
    nextTick(centerSelectedNode)
  },
  { immediate: true }
)

function emptyNode(): PathNodeVO {
  return {
    id: 'empty',
    spaceId: '',
    parentNodeId: null,
    kpUid: null,
    title: '学习路径',
    description: '',
    nodeType: 'stage',
    estimatedDurationMinutes: null,
    plannedDurationDays: null,
    difficultyLevel: '',
    sortOrder: 0,
    isMilestone: false,
    status: 'current',
  }
}

function childNodes(parentId: string): PathNodeVO[] {
  return props.nodes
    .filter(node => node.parentNodeId === parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

function nodeStyle(layout: LayoutNode) {
  return {
    left: `${layout.x}px`,
    top: `${layout.y}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
  }
}

function rootPath(stage: LayoutNode) {
  const root = rootLayout.value
  const fromX = stage.side === 'right' ? root.x + root.width : root.x
  const fromY = root.y + root.height / 2
  const toX = stage.side === 'right' ? stage.x : stage.x + stage.width
  const toY = stage.y + stage.height / 2
  const curve = stage.side === 'right' ? 92 : -92
  return `M ${fromX} ${fromY} C ${fromX + curve} ${fromY}, ${toX - curve} ${toY}, ${toX} ${toY}`
}

function childPath(child: LayoutNode) {
  const parent = child.parent
  if (!parent) return ''
  const fromX = child.side === 'right' ? parent.x + parent.width : parent.x
  const fromY = parent.y + parent.height / 2
  const toX = child.side === 'right' ? child.x : child.x + child.width
  const toY = child.y + child.height / 2
  const curve = child.side === 'right' ? 48 : -48
  return `M ${fromX} ${fromY} C ${fromX + curve} ${fromY}, ${toX - curve} ${toY}, ${toX} ${toY}`
}

function selectRoot() {
  selectedNodeId.value = stageNodes.value.find(node => node.status === 'current')?.id || stageNodes.value[0]?.id || ''
  nextTick(centerSelectedNode)
}

function clampZoom(value: number) {
  return Math.min(Math.max(value, minZoom), maxZoom)
}

function setZoom(nextZoom: number, anchor?: { x: number; y: number }) {
  const viewport = viewportRef.value
  const previousZoom = zoom.value
  const next = clampZoom(nextZoom)
  if (next === previousZoom) return

  if (!viewport) {
    zoom.value = next
    return
  }

  const anchorX = anchor?.x ?? viewport.clientWidth / 2
  const anchorY = anchor?.y ?? viewport.clientHeight / 2
  const canvasX = (viewport.scrollLeft + anchorX) / previousZoom
  const canvasY = (viewport.scrollTop + anchorY) / previousZoom
  zoom.value = next

  requestAnimationFrame(() => {
    viewport.scrollLeft = canvasX * next - anchorX
    viewport.scrollTop = canvasY * next - anchorY
  })
}

function zoomIn() {
  setZoom(zoom.value + zoomStep)
}

function zoomOut() {
  setZoom(zoom.value - zoomStep)
}

function resetZoom() {
  zoom.value = 1
  nextTick(centerSelectedNode)
}

function fitMap() {
  const viewport = viewportRef.value
  if (!viewport) {
    zoom.value = 0.75
    return
  }
  const horizontalFit = (viewport.clientWidth - 36) / canvasWidth
  const verticalFit = (viewport.clientHeight - 36) / canvasHeight.value
  zoom.value = clampZoom(Math.min(1, horizontalFit, verticalFit))
  nextTick(centerSelectedNode)
}

function handleWheelZoom(event: WheelEvent) {
  const viewport = viewportRef.value
  if (!viewport) return
  const rect = viewport.getBoundingClientRect()
  const direction = event.deltaY > 0 ? -1 : 1
  setZoom(zoom.value + direction * zoomStep, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  })
}

function startPan(event: PointerEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button')) return
  const viewport = viewportRef.value
  if (!viewport) return
  isPanning.value = true
  panStart.value = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
  }
  viewport.setPointerCapture(event.pointerId)
}

function handlePan(event: PointerEvent) {
  if (!isPanning.value) return
  const viewport = viewportRef.value
  if (!viewport) return
  viewport.scrollLeft = panStart.value.scrollLeft - (event.clientX - panStart.value.x)
  viewport.scrollTop = panStart.value.scrollTop - (event.clientY - panStart.value.y)
}

function endPan(event: PointerEvent) {
  if (!isPanning.value) return
  const viewport = viewportRef.value
  isPanning.value = false
  if (viewport?.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId)
  }
}

function centerSelectedNode() {
  const viewport = viewportRef.value
  const node = selectedNode.value
  if (!viewport || !node) return
  const layout = [...stageLayouts.value, ...childLayouts.value].find(item => item.node.id === node.id) || rootLayout.value
  viewport.scrollLeft = (layout.x + layout.width / 2) * zoom.value - viewport.clientWidth / 2
  viewport.scrollTop = (layout.y + layout.height / 2) * zoom.value - viewport.clientHeight / 2
}

function statusLabel(status: string) {
  const map: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return map[status] || status
}

function resourceTypeLabel(type: ResourceType) {
  const map: Record<ResourceType, string> = {
    ppt: 'PPT',
    doc: '文档',
    html: 'HTML',
    video: '视频',
    mind_map: '思维导图',
    quiz: '练习',
    case_study: '案例',
    flashcard_set: '闪卡',
    image: '图解',
    audio: '音频',
    link: '链接',
  }
  return map[type] || type
}
</script>

<style scoped lang="scss">
.mind-map-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mind-map-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(135deg, rgba(236, 253, 251, 0.9), rgba(248, 250, 252, 0.94)),
    #ffffff;

  h4 {
    margin: 3px 0 0;
    color: #0f172a;
    font-size: 1rem;
    line-height: 1.35;
  }
}

.summary-eyebrow {
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 800;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    min-height: 30px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: #64748b;
    font-size: 0.74rem;
    font-weight: 700;
  }

  strong {
    color: #0f172a;
    font-size: 0.9rem;
  }
}

.mind-map-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 30px;
    padding: 0 10px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 10px;
    background: #f8fafc;
    color: #334155;
    font-size: 0.78rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(11, 183, 170, 0.32);
      background: #ecfdfb;
      color: #0a9e94;
    }
  }

  span {
    min-width: 48px;
    color: #0f172a;
    font-size: 0.76rem;
    font-weight: 900;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
}

.mind-map-scroll {
  position: relative;
  overflow: auto;
  padding: 4px 0 8px;
  border-radius: 18px;
  cursor: grab;
  overscroll-behavior: contain;

  &.panning {
    cursor: grabbing;
    user-select: none;
  }
}

.mind-map-stage {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.mind-map-canvas {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at 50% 50%, rgba(11, 183, 170, 0.12), transparent 23%),
    linear-gradient(135deg, #ffffff, #f8fafc 48%, #f0fdfa);
  transform-origin: left top;
}

.mind-map-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mind-line {
  fill: none;
  stroke-linecap: round;
  stroke-width: 2.5;
  stroke: url(#mind-map-main-line);
  stroke-dasharray: 10 12;
  animation: lineFlow 4.5s linear infinite;

  &.completed {
    stroke: rgba(16, 185, 129, 0.46);
  }

  &.current {
    stroke: rgba(14, 165, 233, 0.76);
    stroke-width: 3.2;
  }

  &.locked {
    stroke: rgba(148, 163, 184, 0.28);
  }
}

.child-line {
  stroke-width: 1.8;
  opacity: 0.82;
}

.mind-root,
.mind-node {
  position: absolute;
  border: 0;
  cursor: pointer;
  text-align: left;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.mind-root {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #ffffff;
  box-shadow: 0 20px 44px rgba(11, 183, 170, 0.26);
  animation: rootBreath 3.8s ease-in-out infinite;

  span,
  em {
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 800;
    opacity: 0.82;
  }

  strong {
    overflow: hidden;
    color: #ffffff;
    font-size: 1rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.mind-node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(10px);

  &:hover,
  &.selected {
    transform: translateY(-2px);
    border-color: rgba(11, 183, 170, 0.34);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
  }

  &.locked {
    opacity: 0.58;
  }

  &.current {
    border-color: rgba(14, 165, 233, 0.42);
    animation: nodeBreath 3s ease-in-out infinite;
  }

  &.completed {
    border-color: rgba(16, 185, 129, 0.28);
  }
}

.stage-node {
  gap: 4px;
  padding: 14px 16px;
  border-radius: 16px;

  strong {
    overflow: hidden;
    color: #0f172a;
    font-size: 0.88rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.node-kicker,
.node-meta {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}

.node-meta {
  color: #94a3b8;
}

.child-node {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 12px;

  strong {
    overflow: hidden;
    min-width: 0;
    color: #334155;
    font-size: 0.76rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.child-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #94a3b8;
}

.child-node.completed .child-dot {
  background: #10b981;
}

.child-node.current .child-dot {
  background: #0ea5e9;
  box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.12);
}

.mind-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 18px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
}

.detail-main {
  min-width: 0;

  h4 {
    margin: 6px 0 5px;
    color: #0f172a;
    font-size: 0.98rem;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.55;
  }
}

.detail-status {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;

  &.completed {
    background: #ecfdf5;
    color: #059669;
  }

  &.current {
    background: #eff6ff;
    color: #0284c7;
  }
}

.detail-rail {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;

  span {
    padding: 4px 9px;
    border-radius: 999px;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 800;
  }
}

.detail-linked {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.linked-group {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;

  span {
    display: block;
    margin-bottom: 6px;
    color: #0a9e94;
    font-size: 0.68rem;
    font-weight: 800;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #334155;
    font-size: 0.76rem;
    line-height: 1.55;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@keyframes lineFlow {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -44;
  }
}

@keyframes rootBreath {
  0%,
  100% {
    box-shadow: 0 20px 44px rgba(11, 183, 170, 0.22);
  }
  50% {
    box-shadow: 0 24px 58px rgba(11, 183, 170, 0.36);
  }
}

@keyframes nodeBreath {
  0%,
  100% {
    box-shadow: 0 12px 28px rgba(14, 165, 233, 0.12);
  }
  50% {
    box-shadow: 0 18px 42px rgba(14, 165, 233, 0.24);
  }
}

@media (max-width: 768px) {
  .mind-map-summary,
  .mind-detail {
    grid-template-columns: 1fr;
  }

  .mind-map-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-rail {
    justify-content: flex-start;
  }

  .detail-linked {
    grid-template-columns: 1fr;
  }
}
</style>
