<template>
  <section id="adjustments" class="report-section adjustments-section" :class="{ 'is-active': active }">
    <WatercolorOrb color="rgba(59, 130, 246, 0.12)" :size="400" top="10%" right="-100px" :opacity="0.5" />
    <WatercolorOrb color="rgba(245, 158, 11, 0.1)" :size="320" bottom="0" left="-80px" :opacity="0.5" />

    <div class="section-inner">
      <div class="section-copy centered">
        <div class="header-companion">
          <CompanionMascot :src="adjustmentsImg" size="sm" float alt="小序手持指南针校准航向" />
        </div>
        <p class="eyebrow">系统智能调整</p>
        <h2>这一周，系统为你做了<br />这些智能调整</h2>
        <p>每一次调整都来自真实学习证据，并继续落到任务、复习和测评安排里。</p>
        <button class="evidence-link" @click="$emit('open-evidence')">查看决策依据</button>
      </div>

      <div class="timeline-panel">
        <article
          v-for="(item, index) in report.adjustments"
          :key="item.title"
          class="timeline-item"
          :style="{ animationDelay: `${0.4 + index * 0.08}s` }"
        >
          <div class="timeline-index">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="timeline-copy">
            <span class="timeline-time">{{ item.time }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.action }}</p>
          </div>
          <div class="timeline-status" :class="statusClass(item.status)">{{ item.status }}</div>
        </article>
      </div>

      <AlgorithmExplainer
        v-if="evidence"
        :evidence="evidence"
        hint="系统调整基于以下三类决策规则"
        class="inline-explainer"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import adjustmentsImg from '@/assets/illustrations/adjustments-companion-compass.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'
import AlgorithmExplainer from '../components/AlgorithmExplainer.vue'
import type { EvidenceSection, WeeklyLearningReport } from '@/types/learningReport'

defineProps<{
  report: WeeklyLearningReport
  active: boolean
  evidence?: EvidenceSection
}>()

defineEmits<{
  'open-evidence': []
}>()

function statusClass(status: string) {
  if (status.includes('已执行') || status.includes('已完成')) return 'done'
  if (status.includes('生效中')) return 'active'
  if (status.includes('计划') || status.includes('待')) return 'pending'
  return 'updated'
}
</script>

<style scoped lang="scss">
.report-section {
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 4rem;
  position: relative;
  overflow: hidden;
}

.section-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 1040px;
  width: 100%;
}

.section-copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
  align-items: center;
  max-width: 720px;

  &.centered {
    align-items: center;
  }

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

.header-companion {
  margin-bottom: 0.4rem;
  animation: rise-in 1s var(--transition-spring, ease) 0.1s both;
}

.evidence-link {
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

.timeline-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.timeline-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 1.2rem;
  align-items: center;
  padding: 1rem 1.4rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 24px rgba(44, 70, 90, 0.05);
  opacity: 0;
  animation: rise-in 0.7s var(--transition-spring, ease) forwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 12px 32px rgba(11, 183, 170, 0.1);
    border-color: var(--border-primary);
  }
}

.timeline-index {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary-color);
  opacity: 0.32;
  text-align: center;
}

.timeline-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  .timeline-time {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--text-secondary);
  }
}

.timeline-status {
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;

  &.done {
    background: rgba(59, 130, 246, 0.12);
    color: var(--info-color);
  }
  &.active {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success-color);
  }
  &.pending {
    background: rgba(245, 158, 11, 0.14);
    color: var(--warning-color);
  }
  &.updated {
    background: rgba(11, 183, 170, 0.12);
    color: var(--primary-deep);
  }
}

.inline-explainer {
  width: 100%;
  max-width: 720px;
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

@media (max-width: 760px) {
  .timeline-item {
    grid-template-columns: 44px 1fr;
    gap: 0.8rem;
    padding: 0.9rem 1rem;

    .timeline-status {
      grid-column: 2;
      justify-self: start;
      margin-top: 0.4rem;
    }
  }

  .header-companion {
    transform: scale(0.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-copy *,
  .timeline-item {
    animation: none;
    opacity: 1;
  }
}
</style>
