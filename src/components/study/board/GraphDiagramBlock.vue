<template>
  <section class="graph-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <span class="structure-label">{{ directed ? '有向图' : '图' }}</span>
    </div>

    <div v-if="layoutNodes.length" class="graph-stage-wrap">
      <div class="graph-stage" :style="{ width: `${stageSize.width}px`, height: `${stageSize.height}px` }">
        <svg class="graph-lines" :viewBox="`0 0 ${stageSize.width} ${stageSize.height}`" aria-hidden="true">
          <defs>
            <marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
            <marker id="graph-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" />
            </marker>
          </defs>
          <g v-for="edge in layoutEdges" :key="`${edge.from}-${edge.to}-${edge.label}`">
            <line
              :x1="edge.fromX"
              :y1="edge.fromY"
              :x2="edge.toX"
              :y2="edge.toY"
              class="graph-edge"
              :class="{ path: edge.path }"
              :marker-end="directed ? `url(#${edge.path ? 'graph-arrow-active' : 'graph-arrow'})` : undefined"
            />
            <text
              v-if="edge.label"
              class="edge-label"
              :x="(edge.fromX + edge.toX) / 2"
              :y="(edge.fromY + edge.toY) / 2 - 6"
            >
              {{ edge.label }}
            </text>
          </g>
        </svg>

        <div
          v-for="node in layoutNodes"
          :key="node.id"
          class="graph-node"
          :class="{
            active: activeIds.includes(node.id),
            visited: visitedIds.includes(node.id),
            frontier: frontierIds.includes(node.id),
            path: pathIds.includes(node.id),
          }"
          :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        >
          {{ node.label }}
        </div>
      </div>
    </div>

    <div v-else class="empty-structure">暂无图节点</div>

    <div v-if="legendItems.length" class="graph-legend">
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

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
}

interface GraphEdge {
  from: string
  to: string
  label: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  path: boolean
}

const stageSize = { width: 620, height: 320 }
const rawNodes = computed(() => readPayloadArray('nodes') || props.block.nodes || props.block.items || [])
const rawEdges = computed(() => readPayloadArray('edges') || props.block.edges || [])
const activeIds = computed(() => normalizeStringArray(readPayloadArray('activeIds') || props.block.activeIds || []))
const visitedIds = computed(() => normalizeStringArray(readPayloadArray('visitedIds') || props.block.visitedIds || []))
const frontierIds = computed(() => normalizeStringArray(readPayloadArray('frontierIds') || props.block.frontierIds || []))
const pathIds = computed(() => normalizeStringArray(readPayloadArray('pathIds') || props.block.pathIds || []))
const directed = computed(() => {
  const payload = props.sceneAction?.payload?.directed
  return typeof payload === 'boolean' ? payload : props.block.directed === true
})
const layoutNodes = computed<GraphNode[]>(() => {
  const nodes = normalizeNodes(rawNodes.value)
  if (!nodes.length) return []
  return nodes.map((node, index) => {
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
      return node
    }
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / nodes.length
    const radiusX = 230
    const radiusY = 112
    return {
      ...node,
      x: stageSize.width / 2 + Math.cos(angle) * radiusX,
      y: stageSize.height / 2 + Math.sin(angle) * radiusY,
    }
  })
})
const nodeById = computed(() => new Map(layoutNodes.value.map((node) => [node.id, node])))
const layoutEdges = computed<GraphEdge[]>(() => normalizeEdges(rawEdges.value)
  .map((edge) => {
    const from = nodeById.value.get(edge.from)
    const to = nodeById.value.get(edge.to)
    if (!from || !to) return null
    const clipped = clipEdge(from, to)
    return {
      ...edge,
      ...clipped,
      path: isPathEdge(edge.from, edge.to),
    }
  })
  .filter((edge): edge is GraphEdge => !!edge))
const legendItems = computed(() => [
  ...(activeIds.value.length ? [{ key: 'active', label: '当前节点' }] : []),
  ...(frontierIds.value.length ? [{ key: 'frontier', label: '待访问' }] : []),
  ...(visitedIds.value.length ? [{ key: 'visited', label: '已访问' }] : []),
  ...(pathIds.value.length ? [{ key: 'path', label: '路径' }] : []),
])

function normalizeNodes(values: unknown[]): GraphNode[] {
  return values.map((value, index) => {
    const record = toRecord(value)
    const id = stringValue(record.id ?? record.key ?? index)
    return {
      id,
      label: stringValue(record.label ?? record.value ?? record.name ?? id),
      x: numberValue(record.x, Number.NaN),
      y: numberValue(record.y, Number.NaN),
    }
  })
}

function normalizeEdges(values: unknown[]): Array<{ from: string; to: string; label: string }> {
  return values
    .map((value) => {
      const record = toRecord(value)
      const from = record.from ?? record.source ?? record.start
      const to = record.to ?? record.target ?? record.end
      if (from === undefined || to === undefined) return null
      return {
        from: String(from),
        to: String(to),
        label: stringValue(record.label ?? record.weight ?? ''),
      }
    })
    .filter((edge): edge is { from: string; to: string; label: string } => !!edge)
}

function clipEdge(from: GraphNode, to: GraphNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
  const offset = 22
  return {
    fromX: from.x + (dx / length) * offset,
    fromY: from.y + (dy / length) * offset,
    toX: to.x - (dx / length) * offset,
    toY: to.y - (dy / length) * offset,
  }
}

function isPathEdge(from: string, to: string): boolean {
  const fromIndex = pathIds.value.indexOf(from)
  const toIndex = pathIds.value.indexOf(to)
  return fromIndex >= 0 && toIndex === fromIndex + 1
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

function readPayloadArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.graph-block {
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
  font-size: 14px;
  font-weight: 760;
  line-height: 1.4;
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

.graph-stage-wrap {
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.graph-stage {
  position: relative;
  min-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(226, 232, 240, 0.35) 1px, transparent 1px),
    linear-gradient(180deg, rgba(226, 232, 240, 0.35) 1px, transparent 1px),
    #fff;
  background-size: 28px 28px;
}

.graph-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.graph-edge {
  stroke: #94a3b8;
  stroke-width: 2;

  &.path {
    stroke: #0f766e;
    stroke-width: 3;
  }
}

.edge-label {
  fill: #64748b;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 700;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 4px;
}

.graph-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-left: -22px;
  margin-top: -22px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 780;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &.visited {
    background: #f8fafc;
    color: #64748b;
  }

  &.frontier {
    border-color: #d97706;
    background: #fffbeb;
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

.graph-legend {
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

  &.frontier {
    background: #fffbeb;
    color: #b45309;
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
