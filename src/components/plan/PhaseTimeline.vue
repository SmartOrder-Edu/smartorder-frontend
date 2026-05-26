<template>
  <div class="timeline">
    <div
      v-for="(phase, i) in phases"
      :key="phase.phaseIndex"
      class="timeline-node"
      :class="{ expanded: expandedIndex === i }"
      :style="{ '--phase-color': phaseColors[i % phaseColors.length] }"
    >
      <!-- 时间线圆点 + 连接线 -->
      <div class="timeline-track">
        <div class="timeline-dot">
          <span class="dot-num">{{ phase.phaseIndex }}</span>
        </div>
        <div class="timeline-line" v-if="i < phases.length - 1"></div>
      </div>

      <!-- 阶段内容 -->
      <div class="timeline-content" @click="toggleExpand(i)">
        <div class="phase-card">
          <div class="phase-card-header">
            <div class="phase-main">
              <h4 class="phase-name">{{ phase.phaseName }}</h4>
              <span class="phase-weeks">{{ phase.weeks }} 周</span>
            </div>
            <button class="phase-expand-btn" :class="{ rotated: expandedIndex === i }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          <!-- 知识点标签（始终可见） -->
          <div class="phase-kps" v-if="phase.knowledgePoints?.length">
            <span
              v-for="kp in phase.knowledgePoints"
              :key="kp"
              class="kp-tag"
            >{{ kp }}</span>
          </div>

          <!-- 展开详情 -->
          <transition name="expand">
            <div v-if="expandedIndex === i" class="phase-detail">
              <div class="phase-resources" v-if="phase.resources?.length">
                <span class="detail-label">学习资源</span>
                <div class="resource-list">
                  <div
                    v-for="r in phase.resources"
                    :key="r.title"
                    class="resource-item"
                  >
                    <span class="res-type-icon">{{ resourceIcon(r.resourceType) }}</span>
                    <div class="res-info">
                      <span class="res-type">{{ resourceTypeLabel(r.resourceType) }}</span>
                      <span class="res-title">{{ r.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="phase-progress-preview">
                <span class="detail-label">预计进度占比</span>
                <div class="mini-progress-bar">
                  <div
                    class="mini-progress-fill"
                    :style="{ width: progressPercent(phase, i) + '%', background: phaseColors[i % phaseColors.length] }"
                  ></div>
                </div>
                <span class="mini-progress-text">{{ progressPercent(phase, i) }}%</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  phases: any[]
}>()

const expandedIndex = ref<number | null>(0) // 默认展开第一个
const phaseColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

function toggleExpand(i: number) {
  expandedIndex.value = expandedIndex.value === i ? null : i
}

function resourceIcon(type: string): string {
  const icons: Record<string, string> = {
    PPT: '📊',
    QUIZ: '📝',
    VIDEO: '🎬',
    DOC: '📄',
    MINDMAP: '🧠',
    EXERCISE: '✏️',
  }
  return icons[type] || '📦'
}

function resourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PPT: '课件',
    QUIZ: '测验',
    VIDEO: '视频',
    DOC: '文档',
    MINDMAP: '思维导图',
    EXERCISE: '练习',
  }
  return labels[type] || type
}

function progressPercent(phase: any, index: number): number {
  // 按 weeks 占比估算
  return 0 // 预览时显示为 0，避免误导
}
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-node {
  display: flex;
  gap: 16px;
  animation: fadeInUp 0.4s ease both;
}

/* 时间线轨道 */
.timeline-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--phase-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--phase-color) 20%, transparent);
  animation: dotPulse 2s ease-in-out infinite;
}

.dot-num {
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: linear-gradient(to bottom, var(--phase-color), var(--border-light, #e2e8f0));
}

/* 阶段内容 */
.timeline-content {
  flex: 1;
  padding-bottom: 20px;
  cursor: pointer;
}

.phase-card {
  background: white;
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  border-left: 3px solid var(--phase-color);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 14px 16px;
  transition: all 0.25s ease;
}
.phase-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateX(2px);
}

.phase-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.phase-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.phase-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark, #0f172a);
  margin: 0;
}
.phase-weeks {
  font-size: 0.6875rem;
  color: var(--phase-color);
  font-weight: 600;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--phase-color) 8%, transparent);
  border-radius: var(--radius-full, 9999px);
}

.phase-expand-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted, #94a3b8);
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.phase-expand-btn:hover {
  background: var(--background-color-base, #f1f5f9);
}
.phase-expand-btn.rotated svg {
  transform: rotate(180deg);
}

/* 知识点标签 */
.phase-kps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.kp-tag {
  padding: 3px 10px;
  background: color-mix(in srgb, var(--phase-color) 6%, transparent);
  color: var(--text-primary, #1e293b);
  border: 1px solid color-mix(in srgb, var(--phase-color) 15%, transparent);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  transition: all 0.15s ease;
}
.kp-tag:hover {
  background: color-mix(in srgb, var(--phase-color) 12%, transparent);
  border-color: var(--phase-color);
}

/* 展开详情 */
.phase-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}
.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--background-color-base, #f1f5f9);
  border-radius: var(--radius-md, 0.5rem);
}
.res-type-icon {
  font-size: 1rem;
  flex-shrink: 0;
}
.res-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.res-type {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
}
.res-title {
  font-size: 0.75rem;
  color: var(--text-primary, #1e293b);
  font-weight: 500;
}

.phase-progress-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.mini-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--background-color-base, #f1f5f9);
  border-radius: 2px;
  overflow: hidden;
}
.mini-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}
.mini-progress-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
}

/* 展开/收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
  opacity: 1;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--phase-color) 20%, transparent); }
  50% { box-shadow: 0 0 0 10px color-mix(in srgb, var(--phase-color) 0%, transparent); }
}
</style>
