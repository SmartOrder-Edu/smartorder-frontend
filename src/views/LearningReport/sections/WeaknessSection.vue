<template>
  <section id="weakness" class="report-section split-section weakness-section" :class="{ 'is-active': active }">
    <div class="section-bg">
      <WatercolorOrb color="rgba(236, 72, 153, 0.12)" :size="380" bottom="-80px" left="-80px" :opacity="0.5" />
    </div>

    <div class="section-copy">
      <p class="eyebrow">薄弱点与错因</p>
      <h2>你的问题，<br />不只是做错了</h2>
      <p>
        报告会把错题背后的原因拆开，帮助你区分"概念没懂""条件误用"和"过程遗漏"。
      </p>

      <div class="context-chips">
        <span class="chip">
          本周共练习 <strong>{{ practiceCount }}</strong> 题
        </span>
      </div>

      <button class="evidence-link" @click="$emit('open-evidence')">查看错因判定依据</button>

      <AlgorithmExplainer
        v-if="evidence"
        :evidence="evidence"
        hint="错因归类基于以下三类信号"
      />
    </div>

    <div class="section-panel weakness-panel">
      <div class="panel-companion">
        <CompanionMascot :src="weaknessImg" size="sm" float alt="小序举着放大镜审视错题" />
      </div>

      <div class="weakness-list">
        <article
          v-for="item in report.weaknesses"
          :key="item.name"
          class="weakness-card"
          :class="item.risk"
        >
          <div class="weakness-rank">{{ item.rank }}</div>
          <div class="weakness-body">
            <div class="weakness-title-row">
              <h3>{{ item.name }}</h3>
              <span class="risk-pill" :class="item.risk">{{ riskLabel(item.risk) }}</span>
            </div>
            <p>{{ item.reason }}</p>
            <div class="weakness-meta">
              <span>出现 {{ item.count }} 次</span>
              <span>{{ item.trend }}</span>
            </div>
          </div>
        </article>
      </div>

      <div class="cause-board">
        <h3>错因解释</h3>
        <div v-for="cause in report.causes" :key="cause.title" class="cause-row">
          <span class="cause-title">{{ cause.title }}</span>
          <p>{{ cause.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import weaknessImg from '@/assets/illustrations/weakness-companion-magnifier.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'
import AlgorithmExplainer from '../components/AlgorithmExplainer.vue'
import type { EvidenceSection, RiskLevel, WeeklyLearningReport } from '@/types/learningReport'

const props = defineProps<{
  report: WeeklyLearningReport
  active: boolean
  evidence?: EvidenceSection
}>()

defineEmits<{
  'open-evidence': []
}>()

const practiceCount = props.report.metrics[3]?.value || '0'

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
    background: rgba(11, 183, 170, 0.08);
    color: var(--primary-deep);
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;

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
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
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

.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.weakness-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 0.9rem;
  padding: 0.9rem 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border-left: 4px solid var(--text-muted);

  &.high {
    border-left-color: var(--danger-color);
  }
  &.medium {
    border-left-color: var(--warning-color);
  }
  &.low {
    border-left-color: var(--primary-color);
  }
}

.weakness-rank {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-muted);
  opacity: 0.6;
  align-self: center;
  text-align: center;
}

.weakness-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .weakness-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-dark);
    }
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--text-secondary);
  }
}

.risk-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;

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

.weakness-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.cause-board {
  padding: 1.1rem 1.2rem;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.08), rgba(6, 182, 212, 0.04));
  border-radius: 12px;
  border: 1px solid var(--border-primary);

  h3 {
    margin: 0 0 0.8rem;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--primary-deep);
  }
}

.cause-row {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border-soft);

  &:last-child {
    border-bottom: none;
  }

  .cause-title {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 0.2rem;
  }

  p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.55;
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

  .panel-companion {
    display: none;
  }

  .section-panel {
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
