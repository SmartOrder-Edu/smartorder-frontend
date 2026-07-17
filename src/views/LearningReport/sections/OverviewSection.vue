<template>
  <section id="overview" class="report-section overview-section" :class="{ 'is-active': active }">
    <WatercolorOrb color="rgba(11, 183, 170, 0.16)" :size="420" top="-100px" right="-80px" :opacity="0.5" />
    <WatercolorOrb color="rgba(245, 158, 11, 0.12)" :size="360" bottom="-80px" left="-60px" :opacity="0.5" />

    <div class="section-inner">
      <div class="overview-companion">
        <CompanionMascot :src="overviewImg" size="md" float alt="小序捧着本周学习光球" />
      </div>

      <div class="overview-copy">
        <p class="eyebrow">总览</p>
        <h2>这一周，你这样走过</h2>
        <p class="overview-conclusion">{{ report.mainConclusion }}</p>

        <div class="metric-row">
          <MetricHero
            v-for="metric in heroMetrics"
            :key="metric.label"
            :value="metric.value"
            :label="metric.label"
          />
        </div>

        <div class="agent-chip">
          <span class="agent-pulse-dot"></span>
          AI 学习助手已解读完成 · 共扫描 {{ report.metrics.reduce((sum, m) => sum + parseInt(m.value) || 0, 0) }} 项学习信号
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import overviewImg from '@/assets/illustrations/overview-companion-orb.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'
import MetricHero from '../components/MetricHero.vue'
import type { WeeklyLearningReport } from '@/types/learningReport'

const props = defineProps<{
  report: WeeklyLearningReport
  active: boolean
}>()

// 前 3 个指标作为 hero（学习天数 / 累计时长 / 完成任务）
const heroMetrics = props.report.metrics.slice(0, 3)
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
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4rem;
  max-width: 1080px;
  width: 100%;
}

.overview-companion {
  animation: rise-in 1s var(--transition-spring, ease) 0.2s both;
}

.overview-copy {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .eyebrow {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: var(--primary-deep);
    text-transform: uppercase;
    margin: 0;
    animation: rise-in 0.8s ease 0.3s both;
  }

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 800;
    line-height: 1.15;
    color: var(--text-dark);
    animation: rise-in 0.9s ease 0.4s both;
  }

  .overview-conclusion {
    margin: 0;
    font-size: clamp(1rem, 1.5vw, 1.15rem);
    line-height: 1.75;
    color: var(--text-secondary);
    max-width: 540px;
    animation: rise-in 0.9s ease 0.5s both;
  }
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-width: 560px;
  animation: rise-in 0.9s ease 0.6s both;
}

.agent-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 1rem;
  background: rgba(11, 183, 170, 0.08);
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  color: var(--primary-deep);
  font-size: 0.82rem;
  font-weight: 600;
  width: fit-content;
  animation: rise-in 0.9s ease 0.75s both;
}

.agent-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.6);
  animation: pulse-ring 1.6s ease-out infinite;
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

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.6);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(11, 183, 170, 0);
  }
}

@media (max-width: 1080px) {
  .section-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .overview-companion {
    display: flex;
    justify-content: center;
  }

  .overview-copy {
    align-items: center;
  }

  .metric-row {
    max-width: none;
  }
}

@media (max-width: 760px) {
  .metric-row {
    grid-template-columns: 1fr;
  }

  .overview-companion {
    transform: scale(0.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview-companion,
  .overview-copy *,
  .agent-pulse-dot {
    animation: none;
  }
}
</style>
