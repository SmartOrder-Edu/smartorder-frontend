<template>
  <div class="learning-plan-preview">
    <!-- 标题栏 -->
    <div class="preview-header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M12 20h9"/><path d="M16 3v18"/><path d="M4 11l5-5 5 5"/><path d="M4 17l5-5 5 5"/><path d="M3 3h18v18H3z"/>
        </svg>
      </div>
      <div class="header-text">
        <span class="header-label">学习计划</span>
        <span class="header-name">{{ learningPlan.spaceName }}</span>
      </div>
      <span class="type-badge" :class="'type-' + learningPlan.type">{{ typeLabel }}</span>
    </div>

    <!-- 基本信息区 -->
    <div class="preview-body">
      <p class="plan-description">{{ learningPlan.description }}</p>

      <!-- 目标列表 -->
      <div class="section" v-if="learningPlan.goals?.length">
        <div class="section-title">学习目标</div>
        <div class="goals-list">
          <span class="goal-chip" v-for="(goal, i) in learningPlan.goals" :key="i">{{ goal }}</span>
        </div>
      </div>

      <!-- 时间安排 -->
      <div class="section" v-if="learningPlan.startDate || learningPlan.targetEndDate">
        <div class="section-title">时间安排</div>
        <div class="date-range">
          <span class="date-item" v-if="learningPlan.startDate">
            <span class="date-label">开始</span>
            <span class="date-value">{{ learningPlan.startDate }}</span>
          </span>
          <span class="date-arrow">→</span>
          <span class="date-item" v-if="learningPlan.targetEndDate">
            <span class="date-label">目标完成</span>
            <span class="date-value">{{ learningPlan.targetEndDate }}</span>
          </span>
        </div>
      </div>

      <!-- 学习阶段 -->
      <div class="section" v-if="learningPlan.phases?.length">
        <div class="section-title">
          学习阶段
          <span class="section-count">{{ learningPlan.phases.length }} 个阶段</span>
        </div>
        <div class="phases-list">
          <div
            v-for="phase in learningPlan.phases"
            :key="phase.phaseIndex"
            class="phase-card"
            :class="{ expanded: expandedPhase === phase.phaseIndex }"
            @click="togglePhase(phase.phaseIndex)"
          >
            <div class="phase-header">
              <span class="phase-index">{{ phase.phaseIndex }}</span>
              <div class="phase-info">
                <span class="phase-name">{{ phase.phaseName }}</span>
                <span class="phase-meta">
                  {{ phase.weeks }} 周 · {{ phase.knowledgePoints?.length || 0 }} 个知识点
                </span>
              </div>
              <svg class="phase-chevron" :class="{ rotated: expandedPhase === phase.phaseIndex }"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
            <div class="phase-detail" v-if="expandedPhase === phase.phaseIndex">
              <div class="detail-section" v-if="phase.knowledgePoints?.length">
                <span class="detail-label">知识点</span>
                <div class="kp-list">
                  <span class="kp-tag" v-for="kp in phase.knowledgePoints" :key="kp">{{ kp }}</span>
                </div>
              </div>
              <div class="detail-section" v-if="phase.resources?.length">
                <span class="detail-label">学习资源</span>
                <div class="resource-list">
                  <span class="resource-item" v-for="res in phase.resources" :key="res.title">
                    <span class="res-type">{{ res.resourceType }}</span>
                    {{ res.title }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 知识图谱概览 -->
      <div class="section" v-if="learningPlan.knowledgeGraph">
        <div class="section-title">
          知识图谱
          <span class="section-count" v-if="learningPlan.knowledgeGraph.nodes?.length">
            {{ learningPlan.knowledgeGraph.nodes.length }} 个节点
          </span>
        </div>
        <div class="kg-stats" v-if="learningPlan.knowledgeGraph.nodes?.length">
          <div class="kg-stat">
            <span class="kg-stat-value">{{ learningPlan.knowledgeGraph.nodes.length }}</span>
            <span class="kg-stat-label">知识点</span>
          </div>
          <div class="kg-stat">
            <span class="kg-stat-value">{{ learningPlan.knowledgeGraph.edges?.length || 0 }}</span>
            <span class="kg-stat-label">关联</span>
          </div>
        </div>
        <div class="kg-categories" v-if="getUniqueCategories().length">
          <span class="category-tag" v-for="cat in getUniqueCategories()" :key="cat">{{ cat }}</span>
        </div>
      </div>
    </div>

    <!-- 确认按钮 -->
    <div class="preview-footer">
      <button class="confirm-btn" @click="$emit('confirm')" :disabled="confirming">
        <svg v-if="!confirming" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="btn-spinner" v-else></span>
        {{ confirming ? '创建中...' : '确认并创建学习空间' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LearningPlanDraft } from '@/types/planExecute'

const props = defineProps<{
  learningPlan: LearningPlanDraft
  confirming?: boolean
}>()

defineEmits<{
  confirm: []
}>()

const expandedPhase = ref<number | null>(null)

function togglePhase(phaseIndex: number) {
  expandedPhase.value = expandedPhase.value === phaseIndex ? null : phaseIndex
}

const typeLabel = computed(() => {
  switch (props.learningPlan.type) {
    case 'course': return '课程'
    case 'exam': return '考试'
    case 'project': return '项目'
    case 'career': return '职业'
    case 'competition': return '竞赛'
    default: return props.learningPlan.type
  }
})

function getUniqueCategories() {
  const nodes = props.learningPlan.knowledgeGraph?.nodes
  if (!nodes?.length) return []
  const cats = new Set<string>()
  for (const n of nodes) {
    if (n.category) cats.add(n.category)
  }
  return [...cats]
}
</script>

<style scoped>
.learning-plan-preview {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 50%, #f5f3ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-lg, 0.75rem);
  overflow: hidden;
  margin-bottom: 8px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.header-label {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
}

.header-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge {
  font-size: 0.625rem;
  padding: 2px 10px;
  border-radius: var(--radius-full, 999px);
  font-weight: 600;
  flex-shrink: 0;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.type-badge.type-exam { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.type-badge.type-project { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.type-badge.type-career { background: rgba(16, 185, 129, 0.1); color: #059669; }
.type-badge.type-competition { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }

.preview-body {
  padding: 10px 14px;
}

.plan-description {
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-count {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-muted, #94a3b8);
}

.goals-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.goal-chip {
  font-size: 0.6875rem;
  padding: 3px 10px;
  background: white;
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: var(--radius-full, 999px);
  color: var(--text-dark, #0f172a);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.date-label {
  font-size: 0.5625rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
}

.date-value {
  font-weight: 600;
  color: var(--text-dark, #0f172a);
}

.date-arrow {
  color: var(--text-muted, #94a3b8);
  font-size: 0.875rem;
}

/* 阶段列表 */
.phases-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-card {
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid rgba(59, 130, 246, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.phase-card:hover {
  border-color: rgba(59, 130, 246, 0.2);
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}

.phase-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.phase-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.phase-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dark, #0f172a);
}

.phase-meta {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
}

.phase-chevron {
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.phase-chevron.rotated {
  transform: rotate(180deg);
}

.phase-detail {
  padding: 0 10px 8px 40px;
  border-top: 1px solid rgba(59, 130, 246, 0.06);
  padding-top: 6px;
}

.detail-section {
  margin-bottom: 6px;
}

.detail-label {
  font-size: 0.5625rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  margin-bottom: 4px;
  display: block;
}

.kp-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.kp-tag {
  font-size: 0.625rem;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 4px;
  color: var(--primary-color, #3b5bdb);
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.resource-item {
  font-size: 0.625rem;
  color: var(--text-secondary, #475569);
  display: flex;
  align-items: center;
  gap: 4px;
}

.res-type {
  font-size: 0.5625rem;
  padding: 1px 5px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 3px;
  color: #059669;
  font-weight: 500;
}

/* 知识图谱统计 */
.kg-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.kg-stat {
  flex: 1;
  text-align: center;
  padding: 6px;
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.kg-stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-color, #3b5bdb);
}

.kg-stat-label {
  font-size: 0.5625rem;
  color: var(--text-muted, #94a3b8);
}

.kg-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.category-tag {
  font-size: 0.625rem;
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 4px;
  color: #7c3aed;
}

/* 确认按钮 */
.preview-footer {
  padding: 10px 14px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.confirm-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
