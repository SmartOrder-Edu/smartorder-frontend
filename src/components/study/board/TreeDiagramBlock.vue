<template>
  <section class="tree-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <span class="structure-label">树</span>
    </div>

    <div class="tree-scroll" v-if="layoutNodes.length">
      <div class="tree-stage" :style="{ width: `${stageSize.width}px`, height: `${stageSize.height}px` }">
        <svg
          class="tree-lines"
          :width="stageSize.width"
          :height="stageSize.height"
          :viewBox="`0 0 ${stageSize.width} ${stageSize.height}`"
          aria-hidden="true"
        >
          <line
            v-for="edge in layoutEdges"
            :key="`${edge.from}-${edge.to}`"
            :x1="edge.fromX"
            :y1="edge.fromY"
            :x2="edge.toX"
            :y2="edge.toY"
            class="tree-edge"
            :class="{ active: isPathEdge(edge.from, edge.to) }"
          />
        </svg>

        <div
          v-for="node in layoutNodes"
          :key="node.id"
          class="tree-node"
          :class="{
            active: isActive(node.id),
            visited: isVisited(node.id),
            path: isPath(node.id),
          }"
          :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        >
          <span class="node-value">{{ node.label }}</span>
          <span class="node-id">{{ node.id }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-structure">暂无树节点</div>

    <div v-if="legendItems.length" class="tree-legend">
      <span v-for="item in legendItems" :key="item.key" class="legend-item" :class="item.key">
        {{ item.label }}
      </span>
    </div>

    <p v-if="block.caption || block.content" class="lesson-block-caption">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingStructureBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingStructureBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

interface LayoutNode {
  id: string
  label: string
  depth: number
  order: number
  x: number
  y: number
}

interface LayoutEdge {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

interface TreeGraph {
  nodes: LayoutNode[]
  edges: Array<{ from: string; to: string }>
  layoutMode: 'binary' | 'tree'
}

interface TreeLayout {
  stageSize: {
    width: number
    height: number
  }
  nodes: LayoutNode[]
}

const NODE_SIZE = 48
const LEVEL_GAP = 86
const NODE_SLOT_WIDTH = 96
const MIN_STAGE_WIDTH = 560
const STAGE_PADDING_X = 36
const STAGE_PADDING_Y = 28

const rawNodes = computed(() => readPayloadArray('nodes') || props.block.nodes || [])
const rawEdges = computed(() => readPayloadArray('edges') || props.block.edges || [])
const rawItems = computed(() => readPayloadArray('items') || props.block.items || [])
const activeIds = computed(() => normalizeStringArray(readPayloadArray('activeIds') || props.block.activeIds || []))
const visitedIds = computed(() => normalizeStringArray(readPayloadArray('visitedIds') || props.block.visitedIds || []))
const pathIds = computed(() => normalizeStringArray(readPayloadArray('pathIds') || props.block.pathIds || []))
const graph = computed(() => buildTreeGraph(rawNodes.value, rawEdges.value, rawItems.value))
const treeLayout = computed<TreeLayout>(() => buildTreeLayout(graph.value))
const stageSize = computed(() => treeLayout.value.stageSize)
const layoutNodes = computed<LayoutNode[]>(() => treeLayout.value.nodes)
const nodeById = computed(() => new Map(layoutNodes.value.map((node) => [node.id, node])))
const layoutEdges = computed<LayoutEdge[]>(() =>
  graph.value.edges
    .map((edge) => {
      const from = nodeById.value.get(edge.from)
      const to = nodeById.value.get(edge.to)
      if (!from || !to) return null
      const clipped = clipEdge(from, to)
      return {
        from: edge.from,
        to: edge.to,
        ...clipped,
      }
    })
    .filter((edge): edge is LayoutEdge => !!edge),
)
const legendItems = computed(() => [
  ...(activeIds.value.length ? [{ key: 'active', label: '当前节点' }] : []),
  ...(visitedIds.value.length ? [{ key: 'visited', label: '已访问' }] : []),
  ...(pathIds.value.length ? [{ key: 'path', label: '路径' }] : []),
])

function buildTreeGraph(nodes: unknown[], edges: unknown[], items: unknown[]): TreeGraph {
  if (nodes.length) return buildNodeGraph(nodes, edges)
  return buildLevelOrderGraph(items)
}

function buildNodeGraph(nodes: unknown[], edges: unknown[]): TreeGraph {
  const normalizedNodes = nodes.map((item, index) => {
    const record = toRecord(item)
    const id = stringValue(record.id ?? record.key ?? index)
    return {
      id,
      label: stringValue(record.label ?? record.value ?? record.name ?? id),
      depth: numberValue(record.depth, -1),
      order: numberValue(record.order ?? record.index, index),
      x: 0,
      y: 0,
    }
  })
  const normalizedEdges = normalizeEdges(edges)
  const depthById = inferDepths(normalizedNodes.map((node) => node.id), normalizedEdges)
  return {
    nodes: normalizedNodes.map((node) => ({
      ...node,
      depth: node.depth >= 0 ? node.depth : depthById.get(node.id) ?? 0,
    })),
    edges: normalizedEdges,
    layoutMode: 'tree',
  }
}

function buildLevelOrderGraph(items: unknown[]): TreeGraph {
  const nodes = items
    .map((item, index) => {
      if (item === null || item === undefined || item === '') return null
      const depth = Math.floor(Math.log2(index + 1))
      const firstIndex = 2 ** depth - 1
      return {
        id: String(index),
        label: itemLabel(item),
        depth,
        order: index - firstIndex,
        x: 0,
        y: 0,
      }
    })
    .filter((node): node is LayoutNode => !!node)
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = nodes
    .map((node) => {
      const index = Number(node.id)
      if (index <= 0) return null
      const parent = String(Math.floor((index - 1) / 2))
      return nodeIds.has(parent) ? { from: parent, to: node.id } : null
    })
    .filter((edge): edge is { from: string; to: string } => !!edge)
  return { nodes, edges, layoutMode: 'binary' }
}

function buildTreeLayout(graph: TreeGraph): TreeLayout {
  if (!graph.nodes.length) {
    return {
      stageSize: { width: MIN_STAGE_WIDTH, height: 180 },
      nodes: [],
    }
  }

  return graph.layoutMode === 'binary'
    ? buildBinaryTreeLayout(graph.nodes)
    : buildRelationalTreeLayout(graph.nodes, graph.edges)
}

function buildBinaryTreeLayout(nodes: LayoutNode[]): TreeLayout {
  const maxDepth = Math.max(...nodes.map((node) => node.depth), 0)
  const bottomSlotCount = 2 ** maxDepth
  const stageWidth = Math.max(MIN_STAGE_WIDTH, bottomSlotCount * NODE_SLOT_WIDTH + STAGE_PADDING_X * 2)
  const innerWidth = stageWidth - STAGE_PADDING_X * 2
  const layoutNodes = nodes.map((node) => {
    const span = 2 ** (maxDepth - node.depth)
    return {
      ...node,
      x: STAGE_PADDING_X + ((node.order * span + span / 2) * innerWidth) / bottomSlotCount,
      y: STAGE_PADDING_Y + NODE_SIZE / 2 + node.depth * LEVEL_GAP,
    }
  })

  return normalizeLayout(layoutNodes)
}

function buildRelationalTreeLayout(nodes: LayoutNode[], edges: Array<{ from: string; to: string }>): TreeLayout {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const childrenById = new Map<string, string[]>()
  const hasParent = new Set<string>()

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return
    if (!childrenById.has(edge.from)) childrenById.set(edge.from, [])
    const children = childrenById.get(edge.from)!
    if (!children.includes(edge.to)) children.push(edge.to)
    hasParent.add(edge.to)
  })

  childrenById.forEach((children) => {
    children.sort((left, right) => compareNodeOrder(nodeById.get(left), nodeById.get(right)))
  })

  const explicitRoot = stringValue(readPayloadValue('rootId') ?? props.block.rootId)
  const rootIds = explicitRoot && nodeIds.has(explicitRoot)
    ? [explicitRoot]
    : nodes
      .filter((node) => !hasParent.has(node.id))
      .sort(compareNodeOrder)
      .map((node) => node.id)
  const orderedRoots = rootIds.length ? rootIds : [nodes.slice().sort(compareNodeOrder)[0].id]
  const positioned = new Map<string, LayoutNode>()
  const visiting = new Set<string>()
  let cursor = 0

  function placeNode(id: string, depth: number): number {
    const source = nodeById.get(id)
    if (!source) return cursor
    if (positioned.has(id)) return positioned.get(id)!.x
    if (visiting.has(id)) {
      const fallbackX = cursor * NODE_SLOT_WIDTH
      cursor += 1
      return fallbackX
    }

    visiting.add(id)
    const childXs = (childrenById.get(id) || [])
      .filter((childId) => nodeIds.has(childId))
      .map((childId) => placeNode(childId, depth + 1))
    const x = childXs.length
      ? (Math.min(...childXs) + Math.max(...childXs)) / 2
      : cursor++ * NODE_SLOT_WIDTH
    positioned.set(id, {
      ...source,
      depth,
      x,
      y: STAGE_PADDING_Y + NODE_SIZE / 2 + depth * LEVEL_GAP,
    })
    visiting.delete(id)
    return x
  }

  orderedRoots.forEach((id) => placeNode(id, 0))
  nodes
    .slice()
    .sort(compareNodeOrder)
    .forEach((node) => {
      if (!positioned.has(node.id)) placeNode(node.id, 0)
    })

  return normalizeLayout(Array.from(positioned.values()))
}

function normalizeLayout(nodes: LayoutNode[]): TreeLayout {
  const minX = Math.min(...nodes.map((node) => node.x))
  const maxX = Math.max(...nodes.map((node) => node.x))
  const maxDepth = Math.max(...nodes.map((node) => node.depth), 0)
  const centerSpan = Math.max(maxX - minX, 0)
  const stageWidth = Math.max(MIN_STAGE_WIDTH, centerSpan + (STAGE_PADDING_X + NODE_SIZE) * 2)
  const stageHeight = Math.max(180, STAGE_PADDING_Y * 2 + NODE_SIZE + maxDepth * LEVEL_GAP)
  const xOffset = centerSpan <= 0 ? stageWidth / 2 : (stageWidth - centerSpan) / 2

  return {
    stageSize: {
      width: Math.ceil(stageWidth),
      height: Math.ceil(stageHeight),
    },
    nodes: nodes.map((node) => ({
      ...node,
      x: node.x - minX + xOffset,
    })),
  }
}

function clipEdge(from: LayoutNode, to: LayoutNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
  const offset = NODE_SIZE / 2
  return {
    fromX: from.x + (dx / length) * offset,
    fromY: from.y + (dy / length) * offset,
    toX: to.x - (dx / length) * offset,
    toY: to.y - (dy / length) * offset,
  }
}

function compareNodeOrder(left?: LayoutNode, right?: LayoutNode): number {
  if (!left || !right) return left ? -1 : right ? 1 : 0
  return left.depth - right.depth || left.order - right.order || left.id.localeCompare(right.id)
}

function normalizeEdges(edges: unknown[]): Array<{ from: string; to: string }> {
  return edges
    .map((edge) => {
      const record = toRecord(edge)
      const from = record.from ?? record.source ?? record.parent
      const to = record.to ?? record.target ?? record.child
      if (from === undefined || to === undefined) return null
      return { from: String(from), to: String(to) }
    })
    .filter((edge): edge is { from: string; to: string } => !!edge)
}

function inferDepths(ids: string[], edges: Array<{ from: string; to: string }>): Map<string, number> {
  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()
  edges.forEach((edge) => {
    if (!children.has(edge.from)) children.set(edge.from, [])
    children.get(edge.from)!.push(edge.to)
    hasParent.add(edge.to)
  })
  const roots = ids.filter((id) => !hasParent.has(id))
  const depths = new Map<string, number>()
  const queue = roots.length ? roots.map((id) => ({ id, depth: 0 })) : ids.slice(0, 1).map((id) => ({ id, depth: 0 }))
  while (queue.length) {
    const current = queue.shift()!
    if (depths.has(current.id)) continue
    depths.set(current.id, current.depth)
    ;(children.get(current.id) || []).forEach((child) => queue.push({ id: child, depth: current.depth + 1 }))
  }
  ids.forEach((id) => {
    if (!depths.has(id)) depths.set(id, 0)
  })
  return depths
}

function isActive(id: string): boolean {
  return activeIds.value.includes(id)
}

function isVisited(id: string): boolean {
  return visitedIds.value.includes(id)
}

function isPath(id: string): boolean {
  return pathIds.value.includes(id)
}

function isPathEdge(from: string, to: string): boolean {
  return isPath(from) && isPath(to)
}

function itemLabel(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return stringValue(record.label ?? record.value ?? record.name ?? record.id ?? JSON.stringify(value))
  }
  return String(value)
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : { value }
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function numberValue(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeStringArray(values: unknown[]): string[] {
  return values.map((value) => String(value)).filter(Boolean)
}

function readPayloadValue(key: string): unknown {
  return props.sceneAction?.payload?.[key]
}

function readPayloadArray(key: string): unknown[] | null {
  const value = readPayloadValue(key)
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.tree-block {
  display: grid;
  gap: 12px;
}

.lesson-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lesson-block-title {
  min-width: 0;
  color: #0f172a;
  font-size: 17px;
  font-weight: 820;
  line-height: 1.34;
}

.structure-label,
.legend-item {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.structure-label {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}

.tree-scroll {
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.tree-stage {
  position: relative;
  min-width: 100%;
}

.tree-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.tree-edge {
  stroke: #cbd5e1;
  stroke-width: 2;

  &.active {
    stroke: #0f766e;
    stroke-width: 3;
  }
}

.tree-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  margin-top: -24px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &.visited {
    background: #f8fafc;
    color: #64748b;
  }

  &.path {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &.active {
    z-index: 2;
    transform: scale(1.08);
    border-color: #0f766e;
    background: #ecfdf5;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14), 0 10px 18px rgba(15, 118, 110, 0.12);
  }
}

.node-value {
  font-size: 15px;
  font-weight: 780;
  line-height: 1;
}

.node-id {
  margin-top: -5px;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1;
}

.tree-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.legend-item {
  padding: 3px 8px;
  background: #f1f5f9;
  color: #475569;

  &.active {
    background: #ecfdf5;
    color: #0f766e;
  }

  &.visited {
    background: #f8fafc;
    color: #64748b;
  }

  &.path {
    background: #eff6ff;
    color: #1d4ed8;
  }
}

.empty-structure {
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-size: 13px;
}

.lesson-block-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}
</style>
