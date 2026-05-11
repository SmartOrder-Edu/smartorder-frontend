<template>
  <AppLayout>
    <div class="learning-path-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">学习路径</h1>
          <p class="page-desc">系统为你规划的学习路线，按知识依赖顺序推进</p>
        </div>
        <div class="header-right">
          <el-button @click="showAdjustDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
            </svg>
            调整路径
          </el-button>
        </div>
      </div>

      <!-- 路径总览 -->
      <section class="section path-overview">
        <div class="overview-card">
          <div class="overview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
          </div>
          <div class="overview-info">
            <h3>操作系统 · 完整学习路径</h3>
            <div class="overview-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                预计 6 周
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                当前第 3 周
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                6 个阶段
              </span>
            </div>
          </div>
          <div class="overview-progress">
            <div class="progress-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-light)" stroke-width="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="url(#pathProgressGradient)" stroke-width="6"
                  stroke-linecap="round"
                  :stroke-dasharray="`${pathProgress * 2.136} 213.6`"
                  transform="rotate(-90 40 40)"/>
                <defs>
                  <linearGradient id="pathProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b5bdb"/>
                    <stop offset="100%" style="stop-color:#12b886"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="progress-text">
                <span class="progress-value">{{ pathProgress }}%</span>
                <span class="progress-label">完成</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 横向路径图 -->
      <section class="section path-visual">
        <div class="path-timeline">
          <div
            v-for="(node, index) in pathNodes"
            :key="node.id"
            class="timeline-item"
            :class="[`status-${node.status}`, { current: node.isCurrent }]"
          >
            <div class="timeline-connector" v-if="index > 0">
              <div class="connector-line" :class="{ filled: node.status !== 'pending' }"></div>
            </div>

            <div class="timeline-node">
              <div class="node-circle">
                <span v-if="node.status === 'completed'" class="node-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </span>
                <span v-else-if="node.isCurrent" class="node-pulse"></span>
                <span v-else class="node-num">{{ index + 1 }}</span>
              </div>
              <div class="node-label">{{ node.name }}</div>
            </div>

            <div class="timeline-card">
              <div class="card-header">
                <span class="card-badge" :class="node.status">{{ node.statusText }}</span>
                <span class="card-week">第 {{ node.week }} 周</span>
              </div>
              <h4 class="card-title">{{ node.name }}</h4>
              <p class="card-desc">{{ node.description }}</p>
              <div class="card-tags">
                <span v-for="tag in node.tags" :key="tag" class="card-tag">{{ tag }}</span>
              </div>
              <div class="card-footer">
                <span class="card-progress-label">
                  <span class="progress-bar-small">
                    <span class="progress-fill" :style="{ width: node.progress + '%' }"></span>
                  </span>
                  {{ node.progress }}%
                </span>
                <span class="card-duration">{{ node.duration }}h</span>
              </div>
              <div class="card-actions">
                <el-button size="small" v-if="node.isCurrent" type="primary" @click="$router.push('/study/' + node.id)">
                  继续学习
                </el-button>
                <el-button size="small" v-else-if="node.status === 'completed'" @click="$router.push('/study/' + node.id)">
                  回顾
                </el-button>
                <el-button size="small" v-else :disabled="node.status === 'locked'">
                  {{ node.status === 'locked' ? '前置未完成' : '开始' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 知识依赖关系 -->
      <section class="section knowledge-tree">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="19" cy="5" r="2"/>
              <circle cx="5" cy="5" r="2"/>
              <circle cx="19" cy="19" r="2"/>
              <circle cx="5" cy="19" r="2"/>
              <line x1="12" y1="9" x2="12" y2="3"/>
              <line x1="14.5" y1="13.5" x2="17.5" y2="17.5"/>
              <line x1="9.5" y1="13.5" x2="6.5" y2="17.5"/>
            </svg>
            知识依赖图谱
          </h2>
          <p class="section-desc">知识点之间的前置依赖关系，先学前置才能解锁后续</p>
        </div>

        <div class="tree-container">
          <svg viewBox="0 0 800 400" class="tree-svg">
            <defs>
              <linearGradient id="treeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#3b5bdb;stop-opacity:0.6"/>
                <stop offset="100%" style="stop-color:#12b886;stop-opacity:0.6"/>
              </linearGradient>
              <filter id="treeGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- 连接线 -->
            <g class="tree-connections" stroke="url(#treeLineGradient)" fill="none" stroke-width="2">
              <!-- OS基础 -> 进程管理 -->
              <path d="M200,80 Q300,80 350,120" class="active-line"/>
              <!-- 进程管理 -> 线程同步 -->
              <path d="M400,140 Q450,160 480,200" class="active-line"/>
              <!-- 线程同步 -> 内存管理 -->
              <path d="M530,220 Q560,250 560,300" class="active-line"/>
              <!-- 内存管理 -> 文件系统 -->
              <path d="M560,340 Q600,370 650,340" class="pending-line"/>
              <!-- 线程同步 -> 死锁 -> 综合项目 -->
              <path d="M560,240 Q650,200 720,280" class="pending-line" stroke-dasharray="5,5"/>
              <!-- 文件系统 -> 综合项目 -->
              <path d="M720,320 Q740,300 760,300" class="pending-line"/>
            </g>

            <!-- 节点 -->
            <g class="tree-nodes">
              <!-- 操作系统基础 -->
              <g class="tree-node completed" transform="translate(120, 60)">
                <circle r="36" fill="rgba(18,184,134,0.1)" stroke="#12b886" stroke-width="2"/>
                <circle r="28" fill="#12b886"/>
                <text y="4" text-anchor="middle" fill="white" font-size="11" font-weight="600">OS基础</text>
              </g>

              <!-- 进程管理 -->
              <g class="tree-node completed" transform="translate(350, 120)">
                <circle r="36" fill="rgba(18,184,134,0.1)" stroke="#12b886" stroke-width="2"/>
                <circle r="28" fill="#12b886"/>
                <text y="4" text-anchor="middle" fill="white" font-size="11" font-weight="600">进程管理</text>
              </g>

              <!-- 线程与同步 -->
              <g class="tree-node current" transform="translate(480, 200)" filter="url(#treeGlow)">
                <circle r="40" fill="rgba(59,91,219,0.1)" stroke="#3b5bdb" stroke-width="2"/>
                <circle r="32" fill="#3b5bdb"/>
                <text y="4" text-anchor="middle" fill="white" font-size="11" font-weight="600">线程同步</text>
                <circle r="8" cx="32" cy="-32" fill="#ef4444" class="pulse-ring"/>
              </g>

              <!-- 内存管理 -->
              <g class="tree-node pending" transform="translate(560, 300)">
                <circle r="36" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
                <circle r="28" fill="#cbd5e1"/>
                <text y="4" text-anchor="middle" fill="white" font-size="11" font-weight="600">内存管理</text>
              </g>

              <!-- 死锁 -->
              <g class="tree-node pending" transform="translate(720, 240)">
                <circle r="30" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
                <circle r="22" fill="#cbd5e1"/>
                <text y="4" text-anchor="middle" fill="white" font-size="10" font-weight="600">死锁</text>
              </g>

              <!-- 文件系统 -->
              <g class="tree-node pending" transform="translate(720, 340)">
                <circle r="30" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
                <circle r="22" fill="#cbd5e1"/>
                <text y="4" text-anchor="middle" fill="white" font-size="10" font-weight="600">文件系统</text>
              </g>

              <!-- 综合项目 -->
              <g class="tree-node pending" transform="translate(760, 300)">
                <circle r="22" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
                <circle r="16" fill="#cbd5e1"/>
                <text y="4" text-anchor="middle" fill="white" font-size="9" font-weight="600">项目</text>
              </g>
            </g>

            <!-- 图例 -->
            <g transform="translate(20, 20)">
              <circle r="6" fill="#12b886"/><text x="15" y="4" font-size="11" fill="#64748b">已完成</text>
              <circle r="6" fill="#3b5bdb" transform="translate(0, 24)"/><text x="15" y="28" font-size="11" fill="#64748b">进行中</text>
              <circle r="6" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" transform="translate(0, 48)"/><text x="15" y="52" font-size="11" fill="#64748b">待学习</text>
            </g>
          </svg>
        </div>
      </section>

      <!-- 调整路径对话框 -->
      <el-dialog v-model="showAdjustDialog" title="调整学习路径" width="500px" class="adjust-dialog">
        <div class="adjust-form">
          <div class="form-item">
            <label>学习强度</label>
            <div class="slider-group">
              <span class="slider-label">轻松</span>
              <el-slider v-model="learningIntensity" :min="1" :max="3" :step="1" :marks="intensityMarks" />
              <span class="slider-label">紧张</span>
            </div>
          </div>
          <div class="form-item">
            <label>学习时间</label>
            <el-radio-group v-model="dailyHours">
              <el-radio :label="1">每天 30 分钟</el-radio>
              <el-radio :label="2">每天 1 小时</el-radio>
              <el-radio :label="3">每天 2 小时以上</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item">
            <label>重点方向</label>
            <el-checkbox-group v-model="focusAreas">
              <el-checkbox label="理论">理论概念</el-checkbox>
              <el-checkbox label="编程">编程实现</el-checkbox>
              <el-checkbox label="做题">题目练习</el-checkbox>
              <el-checkbox label="项目">综合项目</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
        <template #footer>
          <el-button @click="showAdjustDialog = false">取消</el-button>
          <el-button type="primary" @click="submitAdjust">重新生成路径</el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const showAdjustDialog = ref(false)
const learningIntensity = ref(2)
const dailyHours = ref(2)
const focusAreas = ref(['理论', '做题'])

const intensityMarks = {
  1: '轻松',
  2: '适中',
  3: '紧张'
}

const pathProgress = computed(() => {
  const completed = pathNodes.value.filter(n => n.status === 'completed').length
  return Math.round((completed / pathNodes.value.length) * 100)
})

const pathNodes = ref([
  {
    id: 1,
    name: '操作系统基础',
    description: '了解操作系统的定义、发展历史、基本功能和架构',
    status: 'completed',
    statusText: '已完成',
    isCurrent: false,
    progress: 100,
    week: 1,
    duration: 8,
    tags: ['概念', '历史', '体系结构'],
    locked: false
  },
  {
    id: 2,
    name: '进程管理',
    description: '掌握进程的创建、终止、调度和状态转换',
    status: 'completed',
    statusText: '已完成',
    isCurrent: false,
    progress: 100,
    week: 2,
    duration: 10,
    tags: ['进程', 'PCB', '状态转换'],
    locked: false
  },
  {
    id: 3,
    name: '线程与同步',
    description: '理解线程概念、线程同步机制、互斥锁、信号量等',
    status: 'learning',
    statusText: '进行中',
    isCurrent: true,
    progress: 56,
    week: 3,
    duration: 12,
    tags: ['线程', 'PV操作', '同步互斥'],
    locked: false
  },
  {
    id: 4,
    name: '内存管理',
    description: '学习内存分配、分页、分段、虚拟内存等核心机制',
    status: 'pending',
    statusText: '待开始',
    isCurrent: false,
    progress: 0,
    week: 4,
    duration: 14,
    tags: ['虚拟内存', '分页', '页面置换'],
    locked: false
  },
  {
    id: 5,
    name: '文件系统',
    description: '理解文件系统的组织结构、目录管理、文件操作',
    status: 'pending',
    statusText: '待开始',
    isCurrent: false,
    progress: 0,
    week: 5,
    duration: 10,
    tags: ['inode', '目录', '磁盘管理'],
    locked: false
  },
  {
    id: 6,
    name: '综合项目',
    description: '综合运用所学知识完成一个简易操作系统模拟项目',
    status: 'pending',
    statusText: '待解锁',
    isCurrent: false,
    progress: 0,
    week: 6,
    duration: 16,
    tags: ['项目', '综合', '实践'],
    locked: true
  }
])

const submitAdjust = () => {
  showAdjustDialog.value = false
}
</script>

<style scoped>
.learning-path-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
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

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 区块 */
.section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-light);
}

/* 路径总览 */
.overview-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.1), rgba(18, 184, 134, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.overview-icon svg {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.overview-info {
  flex: 1;
}

.overview-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-sm);
}

.overview-meta {
  display: flex;
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.progress-label {
  font-size: 0.625rem;
  color: var(--text-muted);
}

/* 路径时间线 */
.path-timeline {
  display: flex;
  overflow-x: auto;
  padding-bottom: var(--spacing-md);
  gap: 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 180px;
  flex: 1;
}

.timeline-connector {
  position: absolute;
  top: 16px;
  right: 50%;
  width: 100%;
  height: 2px;
  z-index: 0;
}

.connector-line {
  width: 100%;
  height: 100%;
  background: var(--border-light);
}

.connector-line.filled {
  background: linear-gradient(90deg, #12b886, #3b5bdb);
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  z-index: 1;
}

.node-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--background-color-base);
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.node-circle svg {
  width: 14px;
  height: 14px;
}

.node-pulse {
  width: 10px;
  height: 10px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.node-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  max-width: 100px;
}

.timeline-item.current .node-circle {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(59, 91, 219, 0.15);
}

.timeline-item.current .node-label {
  color: var(--primary-color);
}

.timeline-item.completed .node-circle {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.timeline-item.completed .node-label {
  color: var(--accent-color);
}

/* 路径卡片 */
.timeline-card {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  width: 100%;
  transition: all var(--transition-base);
}

.timeline-item.current .timeline-card {
  background: rgba(59, 91, 219, 0.04);
  border-color: rgba(59, 91, 219, 0.15);
}

.timeline-item:hover .timeline-card {
  background: white;
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.card-badge {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
}

.card-badge.completed {
  background: rgba(18, 184, 134, 0.1);
  color: var(--accent-color);
}

.card-badge.learning {
  background: rgba(59, 91, 219, 0.1);
  color: var(--primary-color);
}

.card-badge.pending {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-muted);
}

.card-week {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.card-desc {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
  line-height: 1.4;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.card-tag {
  padding: 1px 6px;
  background: rgba(59, 91, 219, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.5625rem;
  color: var(--primary-color);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.card-progress-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.625rem;
  color: var(--text-muted);
}

.progress-bar-small {
  width: 40px;
  height: 4px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, #12b886);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.card-duration {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  justify-content: center;
}

/* 知识树 */
.section-header {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.section-icon {
  width: 22px;
  height: 22px;
  color: var(--primary-color);
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.tree-container {
  overflow-x: auto;
}

.tree-svg {
  width: 100%;
  min-width: 700px;
  height: auto;
}

.tree-node.completed circle:first-child { opacity: 0.8; }
.tree-node.current circle:first-child { opacity: 1; }
.tree-node.pending circle:first-child { opacity: 0.6; }

.pulse-ring {
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { r: 8; opacity: 1; }
  50% { r: 12; opacity: 0.5; }
}

.active-line { stroke: url(#treeLineGradient); }
.pending-line { stroke: #cbd5e1; stroke-dasharray: 5,5; opacity: 0.5; }

/* 调整对话框 */
.adjust-form .form-item {
  margin-bottom: var(--spacing-xl);
}

.adjust-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-md);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.slider-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
</style>
