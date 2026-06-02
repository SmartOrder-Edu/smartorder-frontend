<template>
  <div class="path-timeline">
    <div
      v-for="(node, idx) in nodes"
      :key="node.id"
      class="path-node"
      :class="[node.status, { 'has-children': expandedNodes.has(node.id) }]"
    >
      <div class="node-marker">
        <div class="node-line" v-if="idx < nodes.length - 1" :class="node.status"></div>
        <div class="node-dot" :class="node.status" @click="toggleNode(node)">
          <svg v-if="node.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <svg v-else-if="node.status === 'current'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="10" y1="11" x2="14" y2="11"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
          </svg>
        </div>
      </div>

      <div class="node-content" @click="toggleNode(node)">
        <div class="node-header">
          <span class="node-index" v-if="node.isMilestone">阶段 {{ node.sortOrder }}</span>
          <span class="node-index sub" v-else>模块 {{ node.sortOrder }}</span>
          <span class="node-type-badge" v-if="node.nodeType">{{ nodeTypeLabel(node.nodeType) }}</span>
          <span class="node-milestone" v-if="node.isMilestone">里程碑</span>
        </div>
        <h4 class="node-title">{{ node.title }}</h4>
        <p class="node-desc">{{ node.description }}</p>
        <div class="node-meta">
          <span class="node-duration">{{ node.estimatedDurationMinutes }}分钟</span>
          <span class="node-difficulty">{{ node.difficultyLevel }}</span>
          <span class="node-status-tag" :class="node.status">{{ statusLabel(node.status) }}</span>
        </div>
      </div>

      <div class="node-chevron" :class="{ open: expandedNodes.has(node.id) }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>

      <!-- Expanded children: tasks & resources for this node -->
      <div class="node-children" v-if="expandedNodes.has(node.id)">
        <div class="node-tasks" v-if="getNodeTasks(node.id).length">
          <span class="children-label">关联任务</span>
          <div class="node-task-item" v-for="t in getNodeTasks(node.id)" :key="t.id">
            <span class="mini-dot" :class="t.status"></span>
            <span>{{ t.title }}</span>
            <span class="mini-status" :class="t.status">{{ miniStatusLabel(t.status) }}</span>
          </div>
        </div>
        <div class="node-resources" v-if="getNodeResources(node.id).length">
          <span class="children-label">关联资源</span>
          <div class="node-resource-item" v-for="r in getNodeResources(node.id)" :key="r.id">
            <span class="res-type-icon" :class="r.resourceType">{{ resourceIcon(r.resourceType) }}</span>
            <span>{{ r.title }}</span>
            <span class="res-source">{{ r.isAiGenerated ? 'AI生成' : '精选' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PathNodeVO, TaskVO, ResourceVO } from '@/types/learningSpace'
import { taskApi } from '@/api/spaceDashboard'

const expandedNodes = ref(new Set<number>())

function toggleNode(node: PathNodeVO) {
  if (expandedNodes.value.has(node.id)) {
    expandedNodes.value.delete(node.id)
  } else {
    expandedNodes.value.add(node.id)
  }
  // Trigger reactivity
  expandedNodes.value = new Set(expandedNodes.value)
}

function nodeTypeLabel(t: string) {
  const m: Record<string, string> = { module: '模块', stage: '阶段', objective: '目标', knowledge_point: '知识点' }
  return m[t] || t
}

function statusLabel(s: string) {
  const m: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return m[s] || s
}

function miniStatusLabel(s: string) {
  const m: Record<string, string> = { completed: '已完成', in_progress: '进行中', pending: '待开始', overdue: '已逾期' }
  return m[s] || s
}

function resourceIcon(t: string) {
  const m: Record<string, string> = { doc: '📄', video: '🎬', mind_map: '🧠', quiz: '📝', case_study: '📋', flashcard_set: '🃏', image: '🖼', audio: '🎵', link: '🔗' }
  return m[t] || '📄'
}

const props = defineProps<{
  nodes: PathNodeVO[]
  tasks: TaskVO[]
  resources: ResourceVO[]
}>()

function getNodeTasks(nodeId: number) {
  return props.tasks.filter(t => t.pathNodeId === nodeId)
}

function getNodeResources(nodeId: number) {
  return props.resources.filter(r => r.pathNodeId === nodeId)
}
</script>

<script lang="ts">
export default { name: 'PathTimeline' }
</script>

<style scoped lang="scss">
.path-timeline {
  padding-left: 4px;
}

.path-node {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;

  &.locked { opacity: 0.45; }
}

.node-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.node-line {
  position: absolute;
  top: 28px;
  width: 2px;
  height: calc(100% + 8px);
  background: #e5e7eb;

  &.completed { background: #10b981; }
  &.current { background: linear-gradient(to bottom, #3b82f6 50%, #e5e7eb 50%); }
}

.node-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s;

  &.completed { background: #10b981; border-color: #10b981; color: white; }
  &.current {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #3b82f6;
    animation: pulse-ring 2s infinite;
  }
  &.locked { border-color: #d1d5db; color: #d1d5db; }

  &:hover { transform: scale(1.1); }
}

.node-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding-bottom: 20px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.node-index {
  font-size: 0.6875rem;
  color: #8c8ca1;
  font-weight: 600;

  &.sub { font-weight: 400; }
}

.node-type-badge {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #f3f4f6;
  color: #6b7280;
}

.node-milestone {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #fef3c7;
  color: #d97706;
}

.node-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 2px 0;
}

.node-desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 8px;
  line-height: 1.4;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-duration {
  font-size: 0.75rem;
  color: #9ca3af;
}

.node-difficulty {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;
  background: #f3f4f6;
  color: #6b7280;
}

.node-status-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;

  &.completed { background: #ecfdf5; color: #10b981; }
  &.current { background: #eff6ff; color: #3b82f6; }
  &.locked { background: #f3f4f6; color: #9ca3af; }
}

.node-chevron {
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: #9ca3af;
  cursor: pointer;
  transition: transform 0.2s;

  &.open { transform: rotate(180deg); }
}

/* Expanded children */
.node-children {
  flex: 1;
  margin-left: 44px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
}

.children-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.node-task-item, .node-resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.8125rem;
  color: #374151;
}

.mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.completed { background: #10b981; }
  &.in_progress { background: #3b82f6; }
  &.pending { background: #d1d5db; }
  &.overdue { background: #ef4444; }
}

.mini-status {
  font-size: 0.6875rem;
  margin-left: auto;
  color: #9ca3af;
}

.res-type-icon { font-size: 14px; }

.res-source {
  font-size: 0.6875rem;
  margin-left: auto;
  color: #9ca3af;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}
</style>
