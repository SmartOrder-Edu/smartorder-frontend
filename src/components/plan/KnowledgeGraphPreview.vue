<template>
  <div class="kg-container">
    <div class="kg-svg-wrapper" ref="svgWrapper">
      <!-- 悬浮工具栏 -->
      <div class="kg-toolbar">
        <el-button-group>
          <el-button icon="ZoomIn" @click="handleZoomIn" title="放大" />
          <el-button icon="ZoomOut" @click="handleZoomOut" title="缩小" />
          <el-button icon="Aim" @click="handleResetZoom" title="居中自适应" />
          <el-button icon="Refresh" @click="handleReLayout" title="重新布局" />
        </el-button-group>
      </div>

      <svg class="kg-svg" width="100%" height="100%" ref="svgRef">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="16"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148, 163, 184, 0.8)" />
          </marker>
        </defs>

        <!-- 放缩/平移图层 -->
        <g ref="zoomLayer">
          <!-- 边 -->
          <g class="kg-edges">
            <line
              v-for="edge in layoutEdges"
              :key="edge.id"
              :x1="edge.source.x"
              :y1="edge.source.y"
              :x2="edge.target.x"
              :y2="edge.target.y"
              class="kg-edge"
              :class="{ highlighted: edge.highlighted }"
              :style="{ strokeWidth: edge.highlighted ? 3 : Math.max(1, (edge.weight || 1) * 1.5) + 'px' }"
              marker-end="url(#arrowhead)"
            />
            <text
              v-for="edge in layoutEdges"
              :key="'text-' + edge.id"
              :x="(edge.source.x + edge.target.x) / 2"
              :y="(edge.source.y + edge.target.y) / 2 - 4"
              class="kg-edge-label"
              :class="{ highlighted: edge.highlighted }"
            >
              {{ edge.type }}
            </text>
          </g>

          <!-- 节点 -->
          <g class="kg-nodes">
            <g
              v-for="node in layoutNodes"
              :key="node.id"
              :transform="`translate(${node.x || 0}, ${node.y || 0})`"
              class="kg-node-group"
              :class="{
                highlighted: node.highlighted,
                dimmed: highlightedNode && !node.highlighted,
              }"
              @mouseenter="hoverNode(node)"
              @mouseleave="clearHover"
              :ref="el => setNodeRef(el, node)"
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
              >{{ node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name }}</text>
            </g>
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
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  graph: {
    nodes: { id?: string; name: string; category?: string; importance?: number }[]
    edges?: { from: string; to: string; type?: string; description?: string; weight?: number }[]
  }
}>()

const highlightedNode = ref<string | null>(null)
const svgWrapper = ref<HTMLElement | null>(null)
const svgRef = ref<SVGElement | null>(null)
const zoomLayer = ref<SVGGElement | null>(null)

// ===== 布局及数据定义 =====
interface LayoutNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  category: string
  importance: number
  radius: number
  highlighted: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface LayoutEdge extends d3.SimulationLinkDatum<LayoutNode> {
  id: string
  type: string
  weight: number
  highlighted: boolean
  source: LayoutNode
  target: LayoutNode
}

const layoutNodes = ref<LayoutNode[]>([])
const layoutEdges = ref<LayoutEdge[]>([])
let simulation: d3.Simulation<LayoutNode, LayoutEdge> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGElement, unknown> | null = null

// 设置节点绑定的 D3 drag 事件
const setNodeRef = (el: any, node: LayoutNode) => {
  if (el) {
    d3.select(el as Element).call(
      d3.drag<Element, unknown>()
        .on('start', (event) => {
          if (!event.active) simulation?.alphaTarget(0.3).restart()
          node.fx = node.x
          node.fy = node.y
        })
        .on('drag', (event) => {
          node.fx = event.x
          node.fy = event.y
        })
        .on('end', (event) => {
          if (!event.active) simulation?.alphaTarget(0)
          node.fx = null
          node.fy = null
        }) as any
    )
  }
}

// ===== 缩放/平移及布局工具方法 =====
const handleZoomIn = () => {
  if (svgRef.value && zoomBehavior) {
    d3.select(svgRef.value)
      .transition()
      .duration(300)
      .call(zoomBehavior.scaleBy, 1.3)
  }
}

const handleZoomOut = () => {
  if (svgRef.value && zoomBehavior) {
    d3.select(svgRef.value)
      .transition()
      .duration(300)
      .call(zoomBehavior.scaleBy, 0.7)
  }
}

const handleResetZoom = () => {
  if (svgRef.value && zoomBehavior && svgWrapper.value && layoutNodes.value.length > 0) {
    const width = svgWrapper.value.clientWidth || 600
    const height = svgWrapper.value.clientHeight || 400
    
    // 计算所有节点的包围盒以自适应缩放居中
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    layoutNodes.value.forEach(node => {
      const x = node.x ?? 0
      const y = node.y ?? 0
      const r = node.radius || 25
      if (x - r < minX) minX = x - r
      if (x + r > maxX) maxX = x + r
      if (y - r < minY) minY = y - r
      if (y + r > maxY) maxY = y + r
    })
    
    const graphWidth = maxX - minX
    const graphHeight = maxY - minY
    
    if (graphWidth > 0 && graphHeight > 0) {
      const padding = 60
      const scale = Math.max(0.3, Math.min(1.5, 0.9 / Math.max(graphWidth / (width - padding), graphHeight / (height - padding))))
      
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      
      const transform = d3.zoomIdentity
        .translate(width / 2 - centerX * scale, height / 2 - centerY * scale)
        .scale(scale)
        
      d3.select(svgRef.value)
        .transition()
        .duration(500)
        .call(zoomBehavior.transform, transform)
    } else {
      d3.select(svgRef.value)
        .transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity)
    }
  }
}

const handleReLayout = () => {
  if (simulation) {
    // 重新让力导向图恢复初始高能量状态并演化
    simulation.alpha(1).restart()
  }
}

const initGraph = () => {
  if (simulation) {
    simulation.stop()
  }

  const nodesMap = new Map<string, LayoutNode>()
  const nodes: LayoutNode[] = props.graph.nodes.map(n => {
    const radius = 25 + (n.importance || 3) * 3
    const node: LayoutNode = {
      id: n.id || n.name,
      name: n.name,
      category: n.category || 'concept',
      importance: n.importance || 3,
      radius,
      highlighted: false,
    }
    nodesMap.set(node.id, node)
    // fallback map by name as well
    if (n.name && n.name !== node.id) nodesMap.set(n.name, node)
    return node
  })

  const edges: LayoutEdge[] = (props.graph.edges || []).map((e, idx) => {
    return {
      id: `${e.from}-${e.to}-${idx}`,
      source: nodesMap.get(e.from) as LayoutNode,
      target: nodesMap.get(e.to) as LayoutNode,
      type: e.description || e.type || '',
      weight: e.weight || 1,
      highlighted: false
    }
  }).filter(e => e.source && e.target)

  layoutNodes.value = nodes
  layoutEdges.value = edges

  nextTick(() => {
    if (!svgWrapper.value) return
    const width = svgWrapper.value.clientWidth || 600
    const height = svgWrapper.value.clientHeight || 400

    // 初始化缩放行为
    if (svgRef.value && zoomLayer.value) {
      zoomBehavior = d3.zoom<SVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          if (zoomLayer.value) {
            d3.select(zoomLayer.value).attr('transform', event.transform)
          }
        })
      d3.select(svgRef.value).call(zoomBehavior)
      // 初始重置为默认视角
      d3.select(svgRef.value).call(zoomBehavior.transform, d3.zoomIdentity)
    }

    // 根据节点数量动态计算力导向图的参数，节点越多则排斥力和距离越大，防止堆叠
    const nodeCount = nodes.length
    // 动态连线距离：节点多时拉长连线，上限 200
    const linkDistance = nodeCount < 5 ? 100 : Math.min(200, 110 + (nodeCount - 5) * 5)
    // 动态电荷排斥力：节点多时加大排斥力，上限 -1000
    const chargeStrength = nodeCount < 5 ? -300 : Math.max(-1000, -400 - (nodeCount - 5) * 35)
    // 动态碰撞半径：节点多时增大碰撞边界
    const collideRadius = (d: any) => (d as LayoutNode).radius + (nodeCount < 8 ? 15 : 28)

    simulation = d3.forceSimulation<LayoutNode>(nodes)
      .force('link', d3.forceLink<LayoutNode, LayoutEdge>(edges)
        .id(d => d.id)
        .distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(collideRadius).iterations(2))
      .on('tick', () => {
        // Vue 响应式会自动更新视图，不需要手动操作 DOM
        // 这里只是为了触发响应式更新
        layoutNodes.value = [...nodes]
        layoutEdges.value = [...edges]
      })
  })
}

watch(() => props.graph, () => {
  initGraph()
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  initGraph()
  
  if (svgWrapper.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === svgWrapper.value) {
          handleResize()
        }
      }
    })
    resizeObserver.observe(svgWrapper.value)
  }
})

onUnmounted(() => {
  if (resizeObserver && svgWrapper.value) {
    resizeObserver.unobserve(svgWrapper.value)
    resizeObserver.disconnect()
  }
  if (simulation) simulation.stop()
})

const handleResize = () => {
  if (simulation && svgWrapper.value) {
    const width = svgWrapper.value.clientWidth
    const height = svgWrapper.value.clientHeight
    simulation.force('center', d3.forceCenter(width / 2, height / 2))
    simulation.alpha(0.3).restart()
  }
}

const legendCategories = computed(() => {
  const cats = new Set(props.graph.nodes?.map(n => n.category || 'concept') || [])
  return [...cats]
})

// ===== Hover 交互 =====

function hoverNode(node: LayoutNode) {
  highlightedNode.value = node.id
  node.highlighted = true
  layoutEdges.value.forEach(edge => {
    if (edge.source.id === node.id || edge.target.id === node.id) {
      edge.highlighted = true
      edge.source.highlighted = true
      edge.target.highlighted = true
    }
  })
}

function clearHover() {
  highlightedNode.value = null
  layoutNodes.value.forEach(n => n.highlighted = false)
  layoutEdges.value.forEach(e => e.highlighted = false)
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

</script>

<style scoped>
.kg-container {
  background: white;
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  border-radius: var(--radius-xl, 1rem);
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 悬浮工具栏 */
.kg-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: var(--color-card-bg-secondary);
  backdrop-filter: blur(8px);
  padding: 4px;
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: 0 4px 12px  var(--color-shadow);
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  transition: all 0.2s ease;
}

.kg-toolbar:hover {
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.kg-svg-wrapper {
  width: 100%;
  flex: 1;
  min-height: 400px;
  overflow: hidden;
  position: relative;
}

.kg-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.kg-edges {
  pointer-events: none;
}

.kg-edge {
  stroke: rgba(148, 163, 184, 0.5);
  stroke-width: 1.5;
  transition: all 0.2s ease;
}

.kg-edge.highlighted {
  stroke: var(--el-color-primary, #409eff);
  stroke-width: 2.5;
}

.kg-edge-label {
  font-size: 10px;
  fill: #94a3b8;
  text-anchor: middle;
  pointer-events: none;
  background-color: white;
  transition: opacity 0.2s;
  opacity: 0.8;
}

.kg-edge-label.highlighted {
  fill: var(--el-color-primary, #409eff);
  font-weight: 600;
  opacity: 1;
}

.kg-nodes {
  cursor: grab;
}

.kg-node-group:active {
  cursor: grabbing;
}

.kg-node-group.dimmed {
  opacity: 0.3;
}

.kg-node-circle {
  transition: all 0.2s ease;
}

.kg-node-group.highlighted .kg-node-circle {
  fill-opacity: 0.5;
  stroke-width: 3;
}

.kg-node-label {
  text-anchor: middle;
  fill: var(--text-dark, #0f172a);
  font-weight: 500;
  pointer-events: none;
  user-select: none;
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
</style>