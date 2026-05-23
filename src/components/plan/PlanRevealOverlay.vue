<template>
  <Teleport to="body">
    <transition name="plan-overlay">
      <div v-if="visible" class="plan-overlay-backdrop" @click.self="onBackdropClick">
        <div class="plan-overlay-panel">
          <!-- 固定顶部 -->
          <header class="plan-overlay-header">
            <div class="header-left">
              <span class="header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </span>
              <div>
                <h2 class="header-title">学习蓝图</h2>
                <p class="header-subtitle">AI 根据你的目标定制的个性化学习路径</p>
              </div>
            </div>
            <button class="header-close-btn" @click="$emit('cancel')" title="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>

          <!-- 可滚动内容区 -->
          <div class="plan-overlay-body" v-if="plan">
            <!-- 计划标题区 -->
            <div class="plan-hero">
              <h1 class="plan-hero-name">{{ plan.spaceName }}</h1>
              <div class="plan-hero-meta">
                <span class="plan-type-badge" :class="'type-' + (plan.type || 'course')">
                  {{ typeLabel(plan.type) }}
                </span>
                <span class="plan-date-range" v-if="plan.startDate && plan.targetEndDate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ plan.startDate }} ~ {{ plan.targetEndDate }}
                </span>
              </div>
            </div>

            <!-- 统计概览 -->
            <PlanStatsBar :plan="plan" />

            <!-- 描述 -->
            <section class="plan-section" v-if="plan.description">
              <h3 class="section-title">计划概述</h3>
              <p class="plan-desc">{{ plan.description }}</p>
            </section>

            <!-- 学习目标 -->
            <section class="plan-section" v-if="plan.goals?.length">
              <h3 class="section-title">学习目标</h3>
              <div class="goals-grid">
                <div v-for="(goal, i) in plan.goals" :key="i" class="goal-card">
                  <span class="goal-num">{{ i + 1 }}</span>
                  <span class="goal-text">{{ goal }}</span>
                </div>
              </div>
            </section>

            <!-- 学习阶段时间线 -->
            <section class="plan-section" v-if="plan.phases?.length">
              <h3 class="section-title">
                学习路径
                <span class="section-badge">{{ plan.phases.length }} 个阶段</span>
              </h3>
              <PhaseTimeline :phases="plan.phases" />
            </section>

            <!-- 知识图谱 -->
            <section class="plan-section" v-if="plan.knowledgeGraph?.nodes?.length">
              <h3 class="section-title">
                知识图谱
                <span class="section-badge">{{ plan.knowledgeGraph.nodes.length }} 个知识点</span>
              </h3>
              <KnowledgeGraphPreview :graph="plan.knowledgeGraph" />
            </section>

            <!-- 每日安排 -->
            <section class="plan-section" v-if="plan.dailyPlan">
              <h3 class="section-title">每日学习安排</h3>
              <div class="daily-plan-cards">
                <div class="daily-card morning" v-if="plan.dailyPlan.morning">
                  <span class="daily-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  </span>
                  <div class="daily-info">
                    <span class="daily-label">上午</span>
                    <span class="daily-text">{{ plan.dailyPlan.morning }}</span>
                  </div>
                </div>
                <div class="daily-card evening" v-if="plan.dailyPlan.evening">
                  <span class="daily-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  </span>
                  <div class="daily-info">
                    <span class="daily-label">下午/晚间</span>
                    <span class="daily-text">{{ plan.dailyPlan.evening }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- 固定底部 -->
          <footer class="plan-overlay-footer">
            <PlanExecutionProgress
              v-if="loading"
              :steps="executionSteps"
            />
            <div class="footer-actions" v-if="!loading">
              <button class="btn-cancel" @click="$emit('cancel')">
                取消
              </button>
              <button class="btn-confirm" @click="$emit('confirm', draftId)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                确认并创建学习空间
              </button>
            </div>
            <div class="footer-loading" v-else>
              <span class="loading-spinner"></span>
              <span>正在创建学习空间...</span>
            </div>
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ExecutionStep } from '@/api/agent'
import PlanStatsBar from './PlanStatsBar.vue'
import PhaseTimeline from './PhaseTimeline.vue'
import KnowledgeGraphPreview from './KnowledgeGraphPreview.vue'
import PlanExecutionProgress from './PlanExecutionProgress.vue'

defineProps<{
  visible: boolean
  plan: any | null
  draftId: string
  loading: boolean
  executionSteps: ExecutionStep[]
}>()

defineEmits<{
  confirm: [draftId: string]
  cancel: []
}>()

function onBackdropClick() {
  // 不允许点击遮罩关闭，必须显式取消
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    course: '课程学习',
    exam: '考试备考',
    project: '项目实战',
    career: '职业发展',
    competition: '竞赛训练',
  }
  return map[type] || type || '课程学习'
}
</script>

<style scoped>
/* ===== 背景遮罩 ===== */
.plan-overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 22, 41, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ===== 面板 ===== */
.plan-overlay-panel {
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 48px);
  background: white;
  border-radius: var(--radius-2xl, 1.5rem);
  box-shadow: var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.15));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 入场/离场动画 ===== */
.plan-overlay-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.plan-overlay-leave-active {
  transition: all 0.25s ease;
}
.plan-overlay-enter-from {
  opacity: 0;
}
.plan-overlay-enter-from .plan-overlay-panel {
  transform: translateY(60px) scale(0.97);
  opacity: 0;
}
.plan-overlay-leave-to {
  opacity: 0;
}
.plan-overlay-leave-to .plan-overlay-panel {
  transform: translateY(30px) scale(0.98);
  opacity: 0;
}

/* ===== 固定顶部 ===== */
.plan-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  background: white;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.header-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  margin: 0;
}
.header-subtitle {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  margin: 2px 0 0;
}
.header-close-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted, #94a3b8);
  transition: all 0.2s ease;
}
.header-close-btn:hover {
  background: var(--background-color-base, #f1f5f9);
  color: var(--text-dark, #0f172a);
}

/* ===== 滚动内容区 ===== */
.plan-overlay-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 计划标题区 */
.plan-hero {
  text-align: center;
  padding: 4px 0 12px;
}
.plan-hero-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}
.plan-hero-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.plan-type-badge {
  padding: 4px 14px;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}
.type-course { background: var(--gradient-primary); }
.type-exam { background: var(--gradient-warm); }
.type-project { background: var(--gradient-accent); }
.type-career { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
.type-competition { background: linear-gradient(135deg, #ef4444, #dc2626); }

.plan-date-range {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748b);
}

/* 区块 */
.plan-section {
  animation: fadeInUp 0.4s ease both;
}
.plan-section:nth-child(2) { animation-delay: 0.05s; }
.plan-section:nth-child(3) { animation-delay: 0.1s; }
.plan-section:nth-child(4) { animation-delay: 0.15s; }
.plan-section:nth-child(5) { animation-delay: 0.2s; }
.plan-section:nth-child(6) { animation-delay: 0.25s; }

.section-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  padding: 2px 8px;
  background: var(--background-color-base, #f1f5f9);
  border-radius: var(--radius-full, 9999px);
}

.plan-desc {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  line-height: 1.7;
  margin: 0;
  padding: 12px 16px;
  background: var(--background-color-base, #f1f5f9);
  border-radius: var(--radius-lg, 0.75rem);
}

/* 学习目标 */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}
.goal-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--gradient-card);
  border: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
  border-radius: var(--radius-lg, 0.75rem);
  transition: all 0.2s ease;
}
.goal-card:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: var(--shadow-sm);
}
.goal-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.goal-text {
  font-size: 0.8125rem;
  color: var(--text-primary, #1e293b);
  line-height: 1.4;
}

/* 每日安排 */
.daily-plan-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.daily-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-lg, 0.75rem);
}
.daily-card.morning {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.daily-card.evening {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.daily-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 0.5rem);
  display: flex;
  align-items: center;
  justify-content: center;
}
.morning .daily-icon {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}
.evening .daily-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}
.daily-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.daily-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
}
.daily-text {
  font-size: 0.8125rem;
  color: var(--text-primary, #1e293b);
}

/* ===== 固定底部 ===== */
.plan-overlay-footer {
  padding: 12px 24px;
  border-top: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  background: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: var(--radius-lg, 0.75rem);
  border: 1px solid var(--border-default, #e2e8f0);
  background: white;
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  background: var(--background-color-base, #f1f5f9);
  color: var(--text-dark, #0f172a);
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 28px;
  border-radius: var(--radius-lg, 0.75rem);
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}
.btn-confirm:active {
  transform: translateY(0);
}

.footer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--text-muted, #94a3b8);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-light, rgba(148, 163, 184, 0.2));
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .plan-overlay-backdrop {
    padding: 0;
    align-items: stretch;
  }
  .plan-overlay-panel {
    max-width: none;
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }
  .plan-overlay-body {
    padding: 16px 20px;
    gap: 20px;
  }
  .plan-hero-name {
    font-size: 1.25rem;
  }
  .goals-grid {
    grid-template-columns: 1fr;
  }
  .daily-plan-cards {
    grid-template-columns: 1fr;
  }
  .footer-actions {
    flex-direction: column-reverse;
  }
  .btn-cancel, .btn-confirm {
    width: 100%;
    justify-content: center;
  }
}
</style>
