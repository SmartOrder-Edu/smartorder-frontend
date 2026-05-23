<template>
  <div class="kg-container">
    <!-- 30 节点以上降级为网格视图 -->
    <div v-if="graph.nodes.length > 30" class="kg-grid-fallback">
      <div class="kg-category-groups">
        <div
          v-for="group in categoryGroups"
          :key="group.category"
          class="kg-category-group"
        >
          <span class="kg-category-label" :style="{ color: categoryColor(group.category) }">
            {{ categoryLabel(group.category) }}
          </span>
          <div class="kg-category-nodes">
            <span
              v-for="node in group.nodes"
              :key="node.name"
              class="kg-fallback-tag"
              :style="fallbackTagStyle(node)"
            >
              {{ node.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- SVG 图谱（30 节点以内） -->
    <div v-else class="kg-svg-wrapper" ref="svgWrapper">
      <svg :viewBox="viewBox" class="kg-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="rgba(148, 163, 184, 0.5)" />
          </marker>
        </defs>

        <!-- 边 -->
        <g class="kg-edges">
          <path
            v-for="edge in layoutEdges"
            :key="edge.from + '-' + edge.to"
            :d="edge.d"
            class="kg-edge"
            :class="{ highlighted: edge.highlighted }"
            marker-end="url(#arrowhead)"
          />
        </g>

        <!-- 节点 -->
        <g class="kg-nodes">
          <g
            v-for="node in layoutNodes"
            :key="node.name"
            :transform="`translate(${node.x}, ${node.y})`"
            class="kg-node-group"
            :class="{
              highlighted: node.highlighted,
              dimmed: highlightedNode && !node.highlighted,
            }"
            @mouseenter="hoverNode(node)"
            @mouseleave="clearHover"
          >
            <circle
              :r="node.radius"
              class="kg-node-circle"
              :fill="categoryColor(node.category)"
              :stroke="categoryColor(node.category)"
              stroke-width="2"
              fill-opacity="0.18"
            />
            <text
              class="kg-node-label"
              dy="0.35em"
              :font-size="node.radius > 28 ? '11' : '10'"
            >{{ node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name }}</text>
          </g>
        </g>
      </svg>
    </div>

    <!-- 图例 -->
    <div class="kg-legend">
      <span
        v-for="cat in legendCategories"
        :key="cat"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ background: categoryColor(cat) }"></span>
        {{ categoryLabel(cat) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  graph: {
    nodes: { name: string; category?: string; importance?: number }[]
    edges?: { from: string; to: string; type?: string }[]
  }
}>()

const highlightedNode = ref<string | null>(null)

// ===== 布局计算 =====

interface LayoutNode {
  name: string
  category: string
  importance: number
  x: number
  y: number
  radius: number
  highlighted: boolean
}

interface LayoutEdge {
  from: string
  to: string
  type: string
  d: string
  highlighted: boolean
}

const layout = computed(() => computeLayout(props.graph))
const layoutNodes = computed(() => layout.value.nodes)
const layoutEdges = computed(() => layout.value.edges)

const viewBox = computed(() => {
  const nodes = layoutNodes.value
  if (!nodes.length) return '0 0 600 400'
  const minX = Math.min(...nodes.map(n => n.x)) - 50
  const maxX = Math.max(...nodes.map(n => n.x)) + 50
  const maxY = Math.max(...nodes.map(n => n.y)) + 60
  return `${minX} 0 ${maxX - minX} ${Math.max(maxY, 300)}`
})

// ===== 类别分组（fallback） =====

const categoryGroups = computed(() => {
  const graph = props.graph
  if (!graph?.nodes) return []
  const groups: Record<string, any[]> = {}
  for (const node of graph.nodes) {
    const cat = node.category || 'concept'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(node)
  }
  return Object.entries(groups).map(([category, nodes]) => ({
    category,
    nodes: nodes.sort((a, b) => (b.importance || 3) - (a.importance || 3)),
  }))
})

const legendCategories = computed(() => {
  const cats = new Set(props.graph.nodes?.map(n => n.category || 'concept') || [])
  return [...cats]
})

// ===== Hover 交互 =====

function hoverNode(node: LayoutNode) {
  highlightedNode.value = node.name
  node.highlighted = true
  for (const edge of layoutEdges.value) {
    if (edge.from === node.name || edge.to === node.name) {
      edge.highlighted = true
    }
    // highlight connected nodes
    for (const n of layoutNodes.value) {
      if (edge.from === node.name && edge.to === n.name) n.highlighted = true
      if (edge.to === node.name && edge.from === n.name) n.highlighted = true
    }
  }
}

function clearHover() {
  highlightedNode.value = null
  for (const node of layoutNodes.value) node.highlighted = false
  for (const edge of layoutEdges.value) edge.highlighted = false
}

// ===== 配色 =====

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    concept: '#3b82f6',
    skill: '#10b981',
    topic: '#f59e0b',
    method: '#8b5cf6',
    fact: '#94a3b8',
  }
  return colors[cat] || '#3b82f6'
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    concept: '概念',
    skill: '技能',
    topic: '主题',
    method: '方法',
    fact: '事实',
  }
  return labels[cat] || cat
}

function fallbackTagStyle(node: any): Record<string, string> {
  const imp = node.importance || 3
  const color = categoryColor(node.category || 'concept')
  return {
    fontSize: `${0.7 + imp * 0.04}rem`,
    fontWeight: imp >= 4 ? '600' : '400',
    borderColor: color,
    color,
  }
}

// ===== 布局算法 =====

function computeLayout(graph: { nodes: any[]; edges?: any[] }) {
  if (!graph?.nodes?.length) return { nodes: [], edges: [] }

  // 按 category 分组
  const categoryColumns: Record<string, LayoutNode[]> = {}
  for (const node of graph.nodes) {
    const cat = node.category || 'concept'
    if (!categoryColumns[cat]) categoryColumns[cat] = []
    categoryColumns[cat].push({
      name: node.name,
      category: cat,
      importance: node.importance || 3,
      x: 0, y: 0,
      radius: 18 + (node.importance || 3) * 4,
      highlighted: false,
    })
  }

  const columns = Object.keys(categoryColumns).filter(k => categoryColumns[k].length > 0)
  const colCount = columns.length || 1
  const svgWidth = 600
  const colPadding = svgWidth / (colCount + 1)

  columns.forEach((cat, colIdx) => {
    const nodes = categoryColumns[cat]
    nodes.sort((a, b) => b.importance - a.importance)
    const spacing = Math.min(80, 400 / nodes.length)
    const startY = 40
    nodes.forEach((node, i) => {
      node.x = colPadding * (colIdx + 1)
      node.y = startY + spacing * i
    })
  })

  const allNodes = Object.values(categoryColumns).flat()

  // 构建节点查找表
  const nodeMap = new Map<string, LayoutNode>()
  for (const n of allNodes) nodeMap.set(n.name, n)

  // 构建边
  const edges: LayoutEdge[] = []
  if (graph.edges) {
    for (const edge of graph.edges) {
      const from = nodeMap.get(edge.from)
      const to = nodeMap.get(edge.to)
      if (!from || !to) continue

      const midX = (from.x + to.x) / 2
      const d = `M ${from.x} ${from.y} Q ${midX} ${from.y} ${to.x} ${to.y}`
      edges.push({
        from: edge.from,
        to: edge.to,
        type: edge.type || 'prerequisite_of',
        d,
        highlighted: false,
      })
    }
  }

  return { nodes: allNodes, edges }
}
</script>

<style scoped>
.kg-container {
  background: white;
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  border-radius: var(--radius-xl, 1rem);
  padding: 12px;
}

/* ===== SVG 图谱 ===== */
.kg-svg-wrapper {
  width: 100%;
  overflow: auto;
  max-height: 420px;
}
.kg-svg {
  width: 100%;
  min-height: 300px;
}

.kg-edge {
  fill: none;
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}
.kg-edge.highlighted {
  stroke: var(--primary-color, #3b82f6);
  stroke-width: 2;
  stroke-dasharray: none;
}

.kg-node-group {
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.kg-node-group.dimmed {
  opacity: 0.2;
}
.kg-node-group.highlighted .kg-node-circle {
  fill-opacity: 0.35;
  stroke-width: 3;
}

.kg-node-circle {
  transition: all 0.2s ease;
}
.kg-node-label {
  text-anchor: middle;
  fill: var(--text-dark, #0f172a);
  font-weight: 500;
  pointer-events: none;
  user-select: none;
}

/* ===== Fallback 网格视图 ===== */
.kg-grid-fallback {
  max-height: 400px;
  overflow-y: auto;
}
.kg-category-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kg-category-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kg-category-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.kg-category-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.kg-fallback-tag {
  padding: 4px 10px;
  border: 1px solid;
  border-radius: var(--radius-full, 9999px);
  background: white;
  transition: all 0.15s ease;
}
.kg-fallback-tag:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ===== 图例 ===== */
.kg-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  margin-top: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .kg-svg-wrapper {
    max-height: 300px;
  }
}
</style>
