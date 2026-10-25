<template>
  <section id="review" class="report-section split-section review-section" :class="{ 'is-active': active }">
    <WatercolorOrb color="rgba(245, 158, 11, 0.14)" :size="380" top="-60px" left="-80px" :opacity="0.5" />

    <div class="section-copy">
      <p class="eyebrow">遗忘风险与下周建议</p>
      <h2>哪些内容该复习了？<br />下周该怎么学？</h2>
      <p>系统结合掌握度、复习记录和遗忘风险，为下周生成优先建议。</p>
      <button class="evidence-link" @click="$emit('open-evidence')">查看复习排序依据</button>

      <AlgorithmExplainer
        v-if="evidence"
        :evidence="evidence"
        hint="复习优先级排序基于以下三类信号"
      />
    </div>

    <div class="section-panel review-panel">
      <div class="risk-table">
        <div class="risk-row risk-head">
          <span>知识点</span>
          <span>遗忘风险</span>
          <span>建议</span>
          <span>状态</span>
        </div>
        <div v-for="item in report.reviewRisks" :key="item.name" class="risk-row">
          <strong>{{ item.name }}</strong>
          <span class="risk-pill" :class="item.risk">{{ riskLabel(item.risk) }}</span>
          <span>{{ item.advice }}</span>
          <span class="status-pill">{{ item.status }}</span>
        </div>
      </div>

      <div class="next-plan">
        <div class="next-plan-glow"></div>
        <div class="next-plan-content">
          <span class="plan-kicker">下周优先策略</span>
          <h3>先补弱 · 再验证 · 后推进</h3>
          <ol>
            <li v-for="item in report.nextWeek" :key="item">{{ item }}</li>
          </ol>
          <p class="next-summary">{{ report.nextWeekSummary }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import WatercolorOrb from '../components/WatercolorOrb.vue'
import AlgorithmExplainer from '../components/AlgorithmExplainer.vue'
import type { EvidenceSection, RiskLevel, WeeklyLearningReport } from '@/types/learningReport'

defineProps<{
  report: WeeklyLearningReport
  active: boolean
  evidence?: EvidenceSection
}>()

defineEmits<{
  'open-evidence': []
}>()

function riskLabel(risk: RiskLevel) {
  const labels: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return labels[risk] || risk
}
</script>

<style scoped lang="scss">
.report-section,
.split-section {
  min-height: 100vh;
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
}

.split-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(560px, 1.28fr);
  gap: 3rem;
  align-items: center;
  padding: 6rem 4rem 4rem;
  max-width: 1280px;
  margin: 0 auto;
}

.section-copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 460px;

  .eyebrow {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: var(--primary-deep);
    text-transform: uppercase;
    margin: 0;
    animation: rise-in 0.8s ease 0.2s both;
  }

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 800;
    line-height: 1.18;
    color: var(--text-dark);
    animation: rise-in 0.9s ease 0.3s both;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.75;
    color: var(--text-secondary);
    animation: rise-in 0.9s ease 0.4s both;
  }
}

.evidence-link {
  align-self: flex-start;
  padding: 0.55rem 1.1rem;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  color: var(--primary-deep);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: rise-in 0.9s ease 0.5s both;

  &:hover {
    background: rgba(11, 183, 170, 0.08);
    border-color: var(--primary-color);
  }
}

.section-panel {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.2rem;
  animation: rise-in 1s var(--transition-spring, ease) 0.4s both;
}

.risk-table {
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 1.2rem;
  box-shadow: 0 18px 42px rgba(44, 70, 90, 0.08);
}

.risk-row {
  display: grid;
  grid-template-columns: 1fr 100px 1.1fr 104px;
  gap: 0.8rem;
  align-items: center;
  padding: 0.75rem 0.4rem;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border-soft);

  &:last-child {
    border-bottom: none;
  }

  &.risk-head {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
    border-bottom: 2px solid var(--border-color-strong, #cbd5e1);
  }

  strong {
    color: var(--text-dark);
    font-weight: 700;
  }

  span {
    color: var(--text-secondary);
  }
}

.risk-pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;

  &.high {
    background: rgba(239, 68, 68, 0.12);
    color: var(--danger-color);
  }
  &.medium {
    background: rgba(245, 158, 11, 0.14);
    color: var(--warning-color);
  }
  &.low {
    background: rgba(11, 183, 170, 0.12);
    color: var(--primary-deep);
  }
}

.status-pill {
  padding: 0.25rem 0.7rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--info-color);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
}

.next-plan {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--panel-bg-secondary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-glow), 0 18px 42px rgba(44, 70, 90, 0.1);
}

.next-plan-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(11, 183, 170, 0.18), transparent 60%),
    radial-gradient(ellipse at 100% 100%, rgba(16, 185, 129, 0.12), transparent 60%);
  pointer-events: none;
}

.next-plan-content {
  position: relative;
  z-index: 1;
  padding: 1.6rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .plan-kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: var(--primary-deep);
    text-transform: uppercase;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-dark);
  }

  ol {
    margin: 0.4rem 0 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      font-size: 0.85rem;
      line-height: 1.55;
      color: var(--text-primary);

      &::marker {
        color: var(--primary-color);
        font-weight: 800;
      }
    }
  }

  .next-summary {
    margin: 0.6rem 0 0;
    padding-top: 0.8rem;
    border-top: 1px solid var(--border-soft);
    font-size: 0.78rem;
    line-height: 1.65;
    color: var(--text-secondary);
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1080px) {
  .split-section {
    grid-template-columns: 1fr;
    padding: 6rem 1.5rem 3rem;
    gap: 2rem;
  }

  .section-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .risk-row {
    grid-template-columns: 1fr 80px;
    gap: 0.5rem;
    font-size: 0.78rem;

    &.risk-head {
      display: none;
    }

    span:nth-child(3),
    span:nth-child(4) {
      grid-column: 1 / -1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-copy *,
  .section-panel {
    animation: none;
  }
}
</style>
