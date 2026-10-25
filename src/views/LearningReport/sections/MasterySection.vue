<template>
  <section id="mastery" class="report-section split-section mastery-section" :class="{ 'is-active': active }">
    <div class="section-bg">
      <WatercolorOrb color="rgba(16, 185, 129, 0.14)" :size="380" top="-60px" right="-80px" :opacity="0.5" />
    </div>

    <div class="section-copy">
      <p class="eyebrow">知识掌握变化</p>
      <h2>你的知识掌握<br />正在发生变化</h2>
      <p>
        系统综合本周测评表现、学习行为、答题耗时与连续表现，评估关键知识点的掌握状态。
      </p>

      <div class="context-chips">
        <span class="chip">
          <strong>{{ masteredCount }}</strong> 个掌握
        </span>
        <span class="chip warn">
          <strong>{{ weakCount }}</strong> 个待巩固
        </span>
      </div>

      <button class="evidence-link" @click="$emit('open-evidence')">查看算法依据</button>

      <AlgorithmExplainer
        v-if="evidence"
        :evidence="evidence"
        hint="掌握度评估基于以下信号综合判断"
      />
    </div>

    <div class="section-panel chart-panel">
      <div class="panel-companion">
        <CompanionMascot :src="masteryImg" size="sm" float alt="小序在为嫩芽浇水" />
      </div>

      <div class="chart-header">
        <div>
          <span class="panel-kicker">掌握度趋势</span>
          <h3>核心知识点变化</h3>
        </div>
        <span class="confidence-badge">判断可靠度 86%</span>
      </div>

      <TrendChart :points="report.trend" />

      <div class="knowledge-cards">
        <article v-for="item in report.mastery" :key="item.name" class="knowledge-card">
          <div class="knowledge-main">
            <span class="knowledge-name">{{ item.name }}</span>
            <strong :class="item.delta >= 0 ? 'positive' : 'negative'">{{ formatDelta(item.delta) }}</strong>
          </div>
          <div class="mini-track">
            <span :style="{ width: `${item.current}%` }"></span>
          </div>
          <div class="knowledge-meta">
            <span>周初 {{ item.start }}%</span>
            <span>当前 {{ item.current }}%</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import masteryImg from '@/assets/illustrations/mastery-companion-sprout.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'
import TrendChart from '../components/TrendChart.vue'
import AlgorithmExplainer from '../components/AlgorithmExplainer.vue'
import type { EvidenceSection, WeeklyLearningReport } from '@/types/learningReport'

const props = defineProps<{
  report: WeeklyLearningReport
  active: boolean
  evidence?: EvidenceSection
}>()

defineEmits<{
  'open-evidence': []
}>()

const masteredCount = computed(() => props.report.metrics[4]?.value || '0')
const weakCount = computed(() => props.report.metrics[5]?.value || '0')

function formatDelta(value: number) {
  return value >= 0 ? `+${value}%` : `${value}%`
}
</script>

<style scoped lang="scss">
.report-section,
.split-section {
  min-height: 100vh;
  scroll-snap-align: start;
  position: relative;
  overflow: visible;
}

.section-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.split-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(560px, 1.28fr);
  gap: 3rem;
  align-items: center;
  padding: 6rem 2.5rem 4rem;
  max-width: 1440px;
  margin: 0 auto;
}

.section-copy {
  position: relative;
  z-index: 1;
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
    line-height: 1.15;
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

.context-chips {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  animation: rise-in 0.9s ease 0.5s both;

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.8rem;
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;

    &.warn {
      background: rgba(245, 158, 11, 0.12);
      color: var(--warning-color);
    }

    strong {
      font-size: 0.95rem;
    }
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
  animation: rise-in 0.9s ease 0.55s both;

  &:hover {
    background: rgba(11, 183, 170, 0.08);
    border-color: var(--primary-color);
  }
}

.section-panel {
  position: relative;
  z-index: 1;
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 1.8rem;
  box-shadow: 0 18px 42px rgba(44, 70, 90, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  animation: rise-in 1s var(--transition-spring, ease) 0.4s both;
}

.panel-companion {
  position: absolute;
  top: -28px;
  right: -160px;
  z-index: 2;
  filter: drop-shadow(0 8px 16px rgba(11, 183, 170, 0.18));
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  .panel-kicker {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 0.3rem;
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text-dark);
  }
}

.confidence-badge {
  padding: 0.35rem 0.8rem;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.knowledge-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}

.knowledge-card {
  padding: 0.9rem 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.knowledge-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  .knowledge-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  strong {
    font-size: 0.95rem;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;

    &.positive {
      color: var(--success-color);
    }
    &.negative {
      color: var(--danger-color);
    }
  }
}

.mini-track {
  height: 6px;
  background: var(--border-soft);
  border-radius: 999px;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--gradient-primary);
    border-radius: 999px;
    transition: width 1s var(--transition-spring, ease);
  }
}

.knowledge-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
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

  .panel-companion {
    display: none;
  }
}

@media (max-width: 760px) {
  .knowledge-cards {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-copy *,
  .section-panel {
    animation: none;
  }
}
</style>
