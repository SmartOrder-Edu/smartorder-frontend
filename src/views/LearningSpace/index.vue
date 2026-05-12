<template>
  <AppLayout>
    <!-- 加载状态 -->
    <div v-if="spaceStore.detailLoading" class="loading-state">
      <div class="space-hero skeleton">
        <div class="hero-content skeleton-inside">
          <div class="skeleton-block hero-skel"></div>
        </div>
      </div>
    </div>

    <!-- 错误/不存在 -->
    <div v-else-if="!spaceData" class="error-state">
      <el-empty description="学习空间不存在或加载失败" :image-size="120">
        <el-button type="primary" @click="$router.push('/dashboard')">返回仪表盘</el-button>
      </el-empty>
    </div>

    <!-- 正常内容 -->
    <div v-else class="learning-space-page">
    <!-- 空间头部 -->
    <section class="space-hero">
      <div class="hero-bg" :style="{ background: spaceData.colorGradient }"></div>
      <div class="hero-content">
        <div class="hero-left">
          <button class="back-btn" @click="$router.push('/dashboard')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <div class="hero-info">
            <h1 class="hero-title">{{ spaceData.name }}</h1>
            <p class="hero-goal" v-if="spaceData.goal">目标：{{ spaceData.goal }}</p>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-stat">
            <span class="hero-stat-value">{{ Math.round(spaceData.progress) }}%</span>
            <span class="hero-stat-label">完成进度</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value">{{ spaceData.streakDays }} 天</span>
            <span class="hero-stat-label">连续学习</span>
          </div>
          <div class="hero-stat warning" v-if="spaceData.healthStatus === 'warning'">
            <span class="hero-stat-value">关注</span>
            <span class="hero-stat-label">正确率下降</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 空间子导航 -->
    <div class="space-tabs">
      <button
        v-for="tab in spaceTabs"
        :key="tab.id"
        class="space-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon" v-html="tab.icon"></span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 空间 Agent -->
      <div v-if="activeTab === 'agent'" class="tab-panel">
        <div class="space-agent-card glass">
          <div class="agent-card-header">
            <div class="agent-card-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div>
              <span class="agent-card-name">{{ spaceData.name }} Agent</span>
              <span class="agent-card-status">在线 · 已监控该空间 {{ spaceData.streakDays }} 天</span>
            </div>
          </div>
          <div class="agent-card-body">
            <p v-if="spaceData.agentInsight" class="agent-insight-text" v-html="spaceData.agentInsight"></p>
            <p v-else class="agent-insight-text">该学习空间的 Agent 正在分析你的学习数据，详情即将上线。</p>
          </div>
          <div class="agent-card-actions">
            <button class="agent-quick-btn" @click="askAgent('我最近哪里学得不好？')">我最近哪里学得不好？</button>
            <button class="agent-quick-btn" @click="askAgent('帮我调整学习计划')">帮我调整学习计划</button>
            <button class="agent-quick-btn" @click="askAgent('生成一套练习题')">生成一套练习题</button>
            <button class="agent-quick-btn primary" @click="startChat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              与 Agent 对话
            </button>
          </div>
        </div>

        <!-- Agent 近期提醒 -->
        <div class="agent-alerts">
          <h3 class="panel-title">Agent 近期提醒</h3>
          <div class="alert-list" v-if="spaceData.healthStatus !== 'normal'">
            <div class="alert-item warning" v-if="spaceData.healthStatus === 'warning' || spaceData.healthStatus === 'danger'">
              <div class="alert-dot"></div>
              <div class="alert-content">
                <p class="alert-text" v-if="spaceData.alert">{{ spaceData.alert }}</p>
                <p class="alert-text" v-else>该空间需要关注，请查看学习进度并及时调整计划</p>
                <span class="alert-time">今天</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无提醒" :image-size="60" />
        </div>
      </div>

      <!-- 当前路径 -->
      <div v-if="activeTab === 'path'" class="tab-panel">
        <div class="path-timeline" v-if="spaceData.pathNodes.length > 0">
          <div
            class="path-node"
            v-for="(node, idx) in spaceData.pathNodes"
            :key="node.id"
            :class="{ completed: node.status === 'completed', current: node.status === 'current', locked: node.status === 'locked' }"
          >
            <div class="path-node-marker">
              <div class="path-line" v-if="idx < spaceData.pathNodes.length - 1"></div>
              <div class="path-dot"></div>
            </div>
            <div class="path-node-content">
              <span class="path-week">Week {{ node.week }}</span>
              <h4 class="path-name">{{ node.name }}</h4>
              <p class="path-desc">{{ node.description }}</p>
              <div class="path-meta">
                <span class="path-duration">{{ node.duration }}</span>
                <span class="path-status-tag" :class="node.status">{{ statusLabel(node.status) }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="学习路径即将由 Agent 生成" :image-size="100" />
      </div>

      <!-- 今日任务 -->
      <div v-if="activeTab === 'tasks'" class="tab-panel">
        <div class="space-task-list" v-if="spaceData.tasks.length > 0">
          <div
            class="space-task-card"
            v-for="task in spaceData.tasks"
            :key="task.id"
          >
            <div class="task-check" :class="{ done: task.status === 'done' }">
              <svg v-if="task.status === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="18" height="18">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div class="task-info">
              <span class="task-type-tag" :class="task.type">{{ typeLabel(task.type) }}</span>
              <h4 class="task-name">{{ task.title }}</h4>
              <p class="task-desc">{{ task.agentReason }}</p>
            </div>
            <div class="task-meta">
              <span class="task-time">{{ task.minutes }} 分钟</span>
              <button class="task-do-btn" v-if="task.status !== 'done'" @click="doTask(task)">开始</button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无任务，等待 Agent 生成" :image-size="100" />
      </div>

      <!-- 资源 -->
      <div v-if="activeTab === 'resources'" class="tab-panel">
        <div class="resource-grid" v-if="spaceData.resources.length > 0">
          <div class="resource-card" v-for="r in spaceData.resources" :key="r.id">
            <div class="resource-type-icon" :class="r.type">
              <svg v-if="r.type === 'doc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <svg v-else-if="r.type === 'quiz'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <svg v-else-if="r.type === 'mindmap'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <div class="resource-info">
              <h4 class="resource-title">{{ r.title }}</h4>
              <span class="resource-type">{{ typeLabel(r.type) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无资源，等待 Agent 生成" :image-size="100" />
      </div>

      <!-- 测评 / 错题 / 知识图谱 / 记录 占位 -->
      <div v-if="activeTab === 'exam'" class="tab-panel placeholder-panel">
        <el-empty description="该学习空间的测评数据">
          <el-button type="primary" @click="ElMessage.info('AI 正在生成测评...')">AI 生成测评</el-button>
        </el-empty>
      </div>
      <div v-if="activeTab === 'wrong'" class="tab-panel placeholder-panel">
        <el-empty description="暂无错题记录" />
      </div>
      <div v-if="activeTab === 'graph'" class="tab-panel placeholder-panel">
        <el-empty description="知识图谱" />
      </div>
      <div v-if="activeTab === 'records'" class="tab-panel placeholder-panel">
        <el-empty description="学习记录" />
      </div>
    </div>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const spaceStore = useLearningSpaceStore()
const activeTab = ref('agent')

const spaceId = computed(() => Number(route.params.spaceId))

function loadSpace() {
  const id = spaceId.value
  if (id && !isNaN(id)) {
    spaceStore.fetchSpaceDetail(id)
  }
}

onMounted(loadSpace)
watch(() => route.params.spaceId, loadSpace)

const spaceData = computed(() => spaceStore.currentSpace)

const spaceTabs = [
  { id: 'agent', label: '空间 Agent', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' },
  { id: 'path', label: '当前路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
  { id: 'tasks', label: '今日任务', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { id: 'resources', label: '资源', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { id: 'exam', label: '测评', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { id: 'wrong', label: '错题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { id: 'graph', label: '知识图谱', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/></svg>' },
  { id: 'records', label: '学习记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>' }
]

const typeLabel = (t: string) => {
  const m: Record<string, string> = { practice: '练习', review: '复习', project: '项目', learn: '学习', test: '测试', doc: '文档', quiz: '练习', mindmap: '思维导图' }
  return m[t] || t
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return m[s] || s
}

const askAgent = (q: string) => { ElMessage.info(`向 ${spaceData.value.name} Agent 提问：${q}`) }
const startChat = () => { ElMessage.success(`开始与 ${spaceData.value.name} Agent 对话`) }
const doTask = (task: any) => { ElMessage.success(`开始任务：${task.title}`) }
</script>

<style scoped lang="scss">
.learning-space-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 空间头部 */
.space-hero {
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.06;
}

.hero-content {
  position: relative;
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  &:hover { background: var(--background-color-base); color: var(--primary-color); }
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.hero-goal {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.hero-right {
  display: flex;
  gap: var(--spacing-2xl);
}

.hero-stat {
  text-align: center;

  &.warning .hero-stat-value { color: var(--warn-color); }
}

.hero-stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
}

.hero-stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 子导航 */
.space-tabs {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow-x: auto;
}

.space-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;

  .tab-icon {
    display: flex;
    align-items: center;
    svg { width: 16px; height: 16px; }
  }

  &:hover { color: var(--primary-color); background: rgba(59, 91, 219, 0.04); }

  &.active {
    color: var(--primary-color);
    background: rgba(59, 91, 219, 0.08);
    font-weight: 600;
  }
}

/* Tab 内容 */
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 空间 Agent 卡片 */
.space-agent-card {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border: 1px solid rgba(59, 91, 219, 0.1);
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.agent-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  svg { width: 22px; height: 22px; }
}

.agent-card-name {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
}

.agent-card-status {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.agent-insight-text {
  font-size: 0.875rem;
  color: var(--text-regular);
  line-height: 1.8;
  margin: 0 0 var(--spacing-md);
}

.agent-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.agent-quick-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { border-color: var(--primary-color); color: var(--primary-color); }

  &.primary {
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
    border-color: transparent;
    color: white;
    &:hover { opacity: 0.9; }
  }
}

/* Agent 提醒 */
.agent-alerts {
  .panel-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 var(--spacing-md);
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);

  &.warning { border-left: 3px solid var(--warn-color); }
  &.info { border-left: 3px solid var(--primary-color); }
  &.success { border-left: 3px solid var(--accent-color); }
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  .alert-item.warning & { background: var(--warn-color); }
  .alert-item.info & { background: var(--primary-color); }
  .alert-item.success & { background: var(--accent-color); }
}

.alert-text {
  font-size: 0.8125rem;
  color: var(--text-regular);
  margin: 0;
  line-height: 1.5;
}

.alert-time {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 路径时间线 */
.path-timeline {
  padding-left: var(--spacing-lg);
}

.path-node {
  display: flex;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);

  &.locked { opacity: 0.4; }
}

.path-node-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.path-line {
  position: absolute;
  top: 20px;
  width: 2px;
  height: calc(100% + var(--spacing-lg));
  background: var(--border-light);
  .path-node.completed & { background: var(--accent-color); }
}

.path-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--border-light);
  border: 3px solid white;
  box-shadow: 0 0 0 1px var(--border-light);
  flex-shrink: 0;
  z-index: 1;

  .path-node.completed & { background: var(--accent-color); box-shadow: 0 0 0 1px var(--accent-color); }
  .path-node.current & { background: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); animation: pulse-ring 2s infinite; }
}

.path-node-content {
  flex: 1;
  padding-bottom: var(--spacing-sm);
}

.path-week {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.path-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 2px 0;
}

.path-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.path-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.path-duration {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.path-status-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);

  &.completed { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  &.current { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.locked { background: var(--background-color-base); color: var(--text-muted); }
}

/* 任务列表 */
.space-task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.space-task-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
}

.task-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);

  &.done {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
  }
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-type-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  &.practice { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.review { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
  &.project { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
}

.task-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 4px 0;
}

.task-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.task-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-do-btn {
  padding: 4px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { background: var(--primary-color); color: white; }
}

/* 资源网格 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.resource-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); transform: translateY(-1px); }
}

.resource-type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.doc { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.quiz { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  &.mindmap { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
}

.resource-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  margin: 0;
}

.resource-type {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.placeholder-panel {
  padding: var(--spacing-3xl) 0;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 1px var(--primary-color); }
  50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
}

/* Loading skeleton */
.loading-state {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.skeleton {
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.skeleton-inside {
  min-height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.error-state {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
</style>
