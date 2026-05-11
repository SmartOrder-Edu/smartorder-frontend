<template>
  <AppLayout>
    <div class="knowledge-graph-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">知识图谱</h1>
          <p class="page-desc">可视化展示知识节点之间的依赖关系和掌握程度</p>
        </div>
        <div class="header-right">
          <el-button @click="viewMode = viewMode === 'graph' ? 'tree' : 'graph'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="19" cy="5" r="2"/>
              <circle cx="5" cy="5" r="2"/>
              <line x1="12" y1="9" x2="12" y2="3"/>
            </svg>
            {{ viewMode === 'graph' ? '树状视图' : '图谱视图' }}
          </el-button>
          <el-button @click="selectedNode = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
            </svg>
            重置视图
          </el-button>
        </div>
      </div>

      <div class="graph-container">
        <!-- 图谱主体 -->
        <section class="graph-main">
          <div class="graph-wrapper" ref="graphRef">
            <!-- 图谱视图 -->
            <svg v-if="viewMode === 'graph'" viewBox="0 0 900 600" class="graph-svg">
              <defs>
                <linearGradient id="kgLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#3b5bdb;stop-opacity:0.6"/>
                  <stop offset="100%" style="stop-color:#12b886;stop-opacity:0.6"/>
                </linearGradient>
                <filter id="kgGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="kgGlowStrong">
                  <feGaussianBlur stdDeviation="6" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <!-- 连接线 -->
              <g class="connections" stroke="url(#kgLineGrad)" fill="none" stroke-width="2">
                <path v-for="link in knowledgeLinks" :key="link.id" :d="link.path" :class="link.type"/>
              </g>

              <!-- 知识节点 -->
              <g class="nodes">
                <g
                  v-for="node in knowledgeNodes"
                  :key="node.id"
                  :transform="`translate(${node.x}, ${node.y})`"
                  class="node-group"
                  :class="[node.status, { selected: selectedNode?.id === node.id }]"
                  @click="selectNode(node)"
                  style="cursor: pointer"
                >
                  <circle
                    r="32"
                    :fill="getNodeFill(node)"
                    :stroke="getNodeStroke(node)"
                    stroke-width="3"
                    :filter="node.isCurrent ? 'url(#kgGlowStrong)' : 'url(#kgGlow)'"
                  />
                  <circle
                    v-if="node.status === 'current'"
                    r="40"
                    fill="none"
                    :stroke="node.stroke"
                    stroke-width="1"
                    opacity="0.3"
                    class="pulse-ring"
                  />
                  <text y="4" text-anchor="middle" fill="white" font-size="11" font-weight="600">{{ node.shortName }}</text>
                  <text y="48" text-anchor="middle" :fill="node.status === 'mastered' ? '#12b886' : '#64748b'" font-size="10">{{ node.progress }}%</text>

                  <!-- 连接点指示 -->
                  <circle v-for="(conn, ci) in node.connections" :key="ci"
                    :cx="conn === 'top' ? 0 : conn === 'bottom' ? 0 : conn === 'left' ? -32 : conn === 'right' ? 32 : 0"
                    :cy="conn === 'top' ? -32 : conn === 'bottom' ? 32 : 0"
                    r="4" fill="rgba(255,255,255,0.4)" class="conn-dot"
                  />
                </g>
              </g>

              <!-- 图例 -->
              <g transform="translate(20, 20)">
                <circle r="6" fill="#12b886"/><text x="15" y="4" font-size="11" fill="#64748b">已掌握</text>
                <circle r="6" fill="#3b5bdb" transform="translate(0, 24)"/><text x="15" y="28" font-size="11" fill="#64748b">学习中</text>
                <circle r="6" fill="#f59e0b" transform="translate(0, 48)"/><text x="15" y="52" font-size="11" fill="#64748b">薄弱</text>
                <circle r="6" fill="#cbd5e1" transform="translate(0, 72)"/><text x="15" y="76" font-size="11" fill="#64748b">未学习</text>
              </g>
            </svg>

            <!-- 树状视图 -->
            <div v-else class="tree-view">
              <div
                v-for="branch in knowledgeTree"
                :key="branch.id"
                class="tree-branch"
              >
                <div class="branch-header" :class="branch.status" @click="toggleBranch(branch)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="branch-arrow">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                  <span class="branch-name">{{ branch.name }}</span>
                  <span class="branch-progress">{{ branch.progress }}%</span>
                </div>
                <div class="branch-children" v-if="branch.expanded">
                  <div
                    v-for="child in branch.children"
                    :key="child.id"
                    class="child-node"
                    :class="child.status"
                    @click="selectNodeFromTree(child)"
                  >
                    <div class="child-indicator"></div>
                    <span class="child-name">{{ child.name }}</span>
                    <span class="child-progress">{{ child.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 节点详情面板 -->
        <aside class="node-detail-panel" v-if="selectedNode">
          <div class="panel-header">
            <h3>{{ selectedNode.name }}</h3>
            <button class="close-btn" @click="selectedNode = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="panel-body">
            <div class="mastery-section">
              <div class="mastery-header">
                <span>掌握度</span>
                <span class="mastery-value" :style="{ color: getMasteryColor(selectedNode.progress) }">{{ selectedNode.progress }}%</span>
              </div>
              <div class="mastery-bar">
                <div class="mastery-fill" :style="{ width: selectedNode.progress + '%', background: getMasteryColor(selectedNode.progress) }"></div>
              </div>
            </div>

            <div class="detail-section">
              <h4>前置知识</h4>
              <div class="prereq-tags">
                <span
                  v-for="prereq in selectedNode.prerequisites"
                  :key="prereq"
                  class="prereq-tag"
                >
                  {{ prereq }}
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h4>后续知识</h4>
              <div class="prereq-tags">
                <span
                  v-for="next in selectedNode.nextSteps"
                  :key="next"
                  class="next-tag"
                >
                  {{ next }}
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h4>推荐学习资源</h4>
              <div class="resource-list">
                <div
                  v-for="res in selectedNode.resources"
                  :key="res.title"
                  class="resource-item"
                >
                  <span class="res-icon">{{ res.type }}</span>
                  <div class="res-info">
                    <span class="res-title">{{ res.title }}</span>
                    <span class="res-time">{{ res.minutes }}分钟</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>关联任务</h4>
              <div class="task-list">
                <div
                  v-for="task in selectedNode.tasks"
                  :key="task"
                  class="task-item"
                >
                  <div class="task-dot"></div>
                  <span>{{ task }}</span>
                </div>
              </div>
            </div>

            <div class="panel-actions">
              <el-button type="primary" @click="$router.push('/study/' + selectedNode.id)">
                开始学习
              </el-button>
              <el-button @click="$router.push('/resources')">
                查看资源
              </el-button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const viewMode = ref('graph')
const selectedNode = ref<any>(null)
const graphRef = ref<HTMLElement>()

const knowledgeNodes = ref([
  { id: 1, name: '操作系统基础', shortName: 'OS基础', x: 450, y: 80, status: 'mastered', progress: 100, stroke: '#12b886', connections: ['bottom'], prerequisites: [], nextSteps: ['进程管理'], resources: [{ type: 'doc', title: 'OS概念详解', minutes: 15 }, { type: 'mind', title: '知识导图', minutes: 8 }], tasks: ['完成OS基础测试'] },
  { id: 2, name: '进程管理', shortName: '进程管理', x: 450, y: 180, status: 'mastered', progress: 100, stroke: '#12b886', connections: ['top', 'bottom'], prerequisites: ['操作系统基础'], nextSteps: ['线程同步'], resources: [{ type: 'doc', title: 'PCB详解', minutes: 12 }], tasks: ['进程状态转换练习'] },
  { id: 3, name: '线程同步', shortName: '线程同步', x: 450, y: 280, status: 'current', progress: 56, stroke: '#3b5bdb', isCurrent: true, connections: ['top', 'bottom'], prerequisites: ['进程管理'], nextSteps: ['内存管理', '死锁'], resources: [{ type: 'video', title: 'PV操作动画', minutes: 10 }, { type: 'quiz', title: '同步练习题', minutes: 15 }], tasks: ['PV操作练习', '同步互斥测试'] },
  { id: 4, name: '内存管理', shortName: '内存管理', x: 450, y: 380, status: 'weak', progress: 20, stroke: '#f59e0b', connections: ['top', 'bottom'], prerequisites: ['线程同步'], nextSteps: ['文件系统'], resources: [{ type: 'mind', title: '虚拟内存导图', minutes: 12 }], tasks: ['内存管理练习'] },
  { id: 5, name: '文件系统', shortName: '文件系统', x: 450, y: 480, status: 'locked', progress: 0, stroke: '#94a3b8', connections: ['top'], prerequisites: ['内存管理'], nextSteps: ['综合项目'], resources: [], tasks: [] },
  { id: 6, name: '死锁', shortName: '死锁', x: 650, y: 320, status: 'weak', progress: 15, stroke: '#f59e0b', connections: ['left'], prerequisites: ['线程同步'], nextSteps: ['综合项目'], resources: [{ type: 'code', title: '哲学家就餐', minutes: 30 }], tasks: ['死锁分析练习'] },
  { id: 7, name: '综合项目', shortName: '综合项目', x: 450, y: 560, status: 'locked', progress: 0, stroke: '#94a3b8', connections: ['top', 'left'], prerequisites: ['文件系统', '死锁'], nextSteps: [], resources: [], tasks: [] },
  { id: 8, name: '进程调度', shortName: '进程调度', x: 250, y: 280, status: 'learning', progress: 40, stroke: '#3b5bdb', connections: ['right'], prerequisites: ['进程管理'], nextSteps: [], resources: [{ type: 'doc', title: '调度算法对比', minutes: 20 }], tasks: ['调度算法练习'] }
])

const knowledgeLinks = ref([
  { id: 1, from: 1, to: 2, path: 'M450,112 Q450,146 450,148', type: 'completed' },
  { id: 2, from: 2, to: 3, path: 'M450,212 Q450,246 450,248', type: 'completed' },
  { id: 3, from: 3, to: 4, path: 'M450,312 Q450,346 450,348', type: 'learning' },
  { id: 4, from: 3, to: 6, path: 'M482,300 Q566,310 618,320', type: 'learning' },
  { id: 5, from: 4, to: 5, path: 'M450,412 Q450,446 450,448', type: 'pending' },
  { id: 6, from: 5, to: 7, path: 'M450,512 Q450,536 450,540', type: 'pending' },
  { id: 7, from: 6, to: 7, path: 'M618,352 Q534,456 478,540', type: 'pending' },
  { id: 8, from: 2, to: 8, path: 'M418,200 Q334,240 282,280', type: 'completed' }
])

const knowledgeTree = ref([
  {
    id: 1, name: '操作系统基础', status: 'mastered', progress: 100, expanded: true,
    children: [
      { id: 2, name: '进程管理', status: 'mastered', progress: 100 },
      { id: 8, name: '进程调度', status: 'learning', progress: 40 },
      { id: 3, name: '线程同步', status: 'current', progress: 56 }
    ]
  },
  {
    id: 3, name: '线程同步', status: 'current', progress: 56, expanded: false,
    children: [
      { id: 4, name: '内存管理', status: 'weak', progress: 20 },
      { id: 6, name: '死锁', status: 'weak', progress: 15 }
    ]
  },
  {
    id: 4, name: '内存管理', status: 'weak', progress: 20, expanded: false,
    children: [
      { id: 5, name: '文件系统', status: 'locked', progress: 0 }
    ]
  },
  {
    id: 5, name: '文件系统', status: 'locked', progress: 0, expanded: false,
    children: [
      { id: 7, name: '综合项目', status: 'locked', progress: 0 }
    ]
  }
])

const getNodeFill = (node: any) => {
  const colors: Record<string, string> = {
    mastered: '#12b886',
    current: '#3b5bdb',
    learning: '#3b5bdb',
    weak: '#f59e0b',
    locked: '#cbd5e1'
  }
  return colors[node.status] || '#cbd5e1'
}

const getNodeStroke = (node: any) => {
  const colors: Record<string, string> = {
    mastered: '#0d9668',
    current: '#2d4fc7',
    learning: '#2d4fc7',
    weak: '#d97706',
    locked: '#94a3b8'
  }
  return colors[node.status] || '#94a3b8'
}

const getMasteryColor = (progress: number) => {
  if (progress >= 80) return '#12b886'
  if (progress >= 50) return '#3b5bdb'
  if (progress >= 20) return '#f59e0b'
  return '#94a3b8'
}

const selectNode = (node: any) => {
  selectedNode.value = node
}

const selectNodeFromTree = (child: any) => {
  const found = knowledgeNodes.value.find(n => n.name === child.name)
  if (found) {
    selectedNode.value = found
    viewMode.value = 'graph'
  }
}

const toggleBranch = (branch: any) => {
  branch.expanded = !branch.expanded
}
</script>

<style scoped>
.knowledge-graph-page {
  max-width: 1200px;
  height: calc(100vh - var(--header-height) - 2 * var(--spacing-xl));
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: var(--spacing-sm);
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.graph-container {
  display: flex;
  gap: var(--spacing-xl);
}

.graph-main {
  flex: 1;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.graph-wrapper {
  height: 600px;
  position: relative;
}

.graph-svg {
  width: 100%;
  height: 100%;
}

.connections path.completed { stroke: #12b886; opacity: 0.6; }
.connections path.learning { stroke: #3b5bdb; opacity: 0.6; }
.connections path.pending { stroke: #cbd5e1; stroke-dasharray: 5,5; opacity: 0.4; }

.node-group {
  transition: transform 0.2s ease;
}

.node-group:hover {
  transform: scale(1.05);
}

.node-group.selected circle:first-child {
  stroke-width: 4;
  stroke: #0f1629;
}

.pulse-ring {
  animation: pulseRing 2s ease-in-out infinite;
}

@keyframes pulseRing {
  0%, 100% { r: 40; opacity: 0.3; }
  50% { r: 48; opacity: 0.1; }
}

.conn-dot {
  transition: opacity 0.2s;
  opacity: 0;
}

.node-group:hover .conn-dot {
  opacity: 1;
}

/* 树状视图 */
.tree-view {
  padding: var(--spacing-xl);
  height: 100%;
  overflow-y: auto;
}

.tree-branch {
  margin-bottom: var(--spacing-md);
}

.branch-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.branch-header:hover { background: var(--background-color-base); }
.branch-header.mastered { border-left: 3px solid #12b886; }
.branch-header.current { border-left: 3px solid #3b5bdb; background: rgba(59, 91, 219, 0.04); }
.branch-header.weak { border-left: 3px solid #f59e0b; }
.branch-header.locked { border-left: 3px solid #cbd5e1; }

.branch-arrow {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.branch-header[aria-expanded="true"] .branch-arrow,
.branch-header:has(.branch-arrow) {
  transform: rotate(0deg);
}

.branch-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.branch-progress {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.branch-children {
  padding-left: var(--spacing-xl);
  margin-top: var(--spacing-sm);
}

.child-node {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.child-node:hover { background: var(--background-color-base); }

.child-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.child-node.mastered .child-indicator { background: #12b886; }
.child-node.current .child-indicator { background: #3b5bdb; }
.child-node.weak .child-indicator { background: #f59e0b; }
.child-node.locked .child-indicator { background: #cbd5e1; }

.child-name {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.child-progress {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 详情面板 */
.node-detail-panel {
  width: 320px;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.panel-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--background-color-base);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn svg { width: 14px; height: 14px; color: var(--text-muted); }
.close-btn:hover { background: rgba(239, 68, 68, 0.1); }
.close-btn:hover svg { color: var(--danger-color); }

.panel-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.mastery-section {
  margin-bottom: var(--spacing-xl);
}

.mastery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.mastery-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.mastery-bar {
  height: 8px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.prereq-tags, .next-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.prereq-tag {
  padding: 2px 10px;
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 500;
}

.next-tag {
  padding: 2px 10px;
  background: rgba(18, 184, 134, 0.08);
  color: var(--accent-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 500;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--background-color-base);
  border-radius: var(--radius-md);
}

.res-icon { font-size: 1rem; }

.res-info {
  display: flex;
  flex-direction: column;
}

.res-title {
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.res-time {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
}

.panel-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
}

.panel-actions .el-button {
  flex: 1;
}
</style>
