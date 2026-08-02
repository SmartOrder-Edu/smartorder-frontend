<template>
  <section id="summary" class="report-section summary-section" :class="{ 'is-active': active }">
    <WatercolorOrb color="rgba(11, 183, 170, 0.2)" :size="480" top="-120px" left="-100px" :opacity="0.5" />
    <WatercolorOrb color="rgba(245, 158, 11, 0.16)" :size="400" bottom="-100px" right="-80px" :opacity="0.5" />

    <div class="section-inner">
      <div class="summary-companion">
        <CompanionMascot :src="summaryImg" size="md" float alt="小序挥手告别，期待下周再见" />
      </div>

      <div class="summary-panel">
        <p class="eyebrow">行动入口</p>
        <h2>你的下一周，<br />已经准备好了</h2>
        <p class="agent-summary">{{ report.agentSummary }}</p>

        <div class="grade-row">
          <article v-for="grade in report.grades" :key="grade.label" class="grade-card">
            <span class="grade-label">{{ grade.label }}</span>
            <strong class="grade-value">{{ grade.value }}</strong>
          </article>
        </div>

        <div class="summary-actions">
          <button class="primary-action" @click="goToNextWeekPlan">
            <component :is="TargetIconComp" :size="16" />
            <span>查看下周计划</span>
          </button>
          <button class="secondary-action" @click="$emit('action', 'study')">
            继续学习
          </button>
          <button class="secondary-action" @click="$emit('action', 'profile')">
            查看成长画像
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getIcon } from '@/assets/icons/create'
import summaryImg from '@/assets/illustrations/summary-companion-wave.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'
import type { WeeklyLearningReport } from '@/types/learningReport'

defineProps<{
  report: WeeklyLearningReport
  active: boolean
}>()

defineEmits<{
  action: [type: 'tasks' | 'study' | 'profile']
}>()

const router = useRouter()

function goToNextWeekPlan() {
  router.push('/next-week-plan')
}

const TargetIconComp = getIcon('TargetIcon')
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
  gap: 1.5rem;
  max-width: 920px;
  width: 100%;
}

.summary-companion {
  animation: rise-in 1s var(--transition-spring, ease) 0.2s both;
}

.summary-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 2.4rem 2.2rem;
  box-shadow: 0 24px 60px rgba(44, 70, 90, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  text-align: center;
  width: 100%;
  animation: rise-in 1s var(--transition-spring, ease) 0.35s both;

  .eyebrow {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.22em;
    color: var(--primary-deep);
    text-transform: uppercase;
    margin: 0;
  }

  h2 {
    margin: 0;
    font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text-dark);
  }
}

.agent-summary {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-secondary);
  max-width: 600px;
}

.grade-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 560px;
}

.grade-card {
  padding: 1rem 0.8rem;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.06), rgba(6, 182, 212, 0.03));
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;

  .grade-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .grade-value {
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--primary-deep);
  }
}

.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  justify-content: center;
  margin-top: 0.4rem;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-glow), 0 10px 24px rgba(11, 183, 170, 0.28);
  transition: transform 0.25s var(--transition-spring, ease), box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 24px rgba(11, 183, 170, 0.32), 0 14px 32px rgba(11, 183, 170, 0.36);
  }

  &:active {
    transform: translateY(0);
  }
}

.secondary-action {
  padding: 0.85rem 1.4rem;
  background: var(--panel-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color-strong, #cbd5e1);
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary-deep);
    border-color: var(--primary-color);
    background: rgba(11, 183, 170, 0.06);
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

@media (max-width: 760px) {
  .summary-panel {
    padding: 1.8rem 1.4rem;
  }

  .grade-row {
    grid-template-columns: 1fr;
  }

  .summary-companion {
    transform: scale(0.7);
  }

  .summary-actions {
    flex-direction: column;
    width: 100%;

    button {
      width: 100%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-companion,
  .summary-panel {
    animation: none;
  }
}
</style>
