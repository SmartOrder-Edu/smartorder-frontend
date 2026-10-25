<template>
  <transition name="gate-out">
    <CoverGate
      v-if="!coverEntered"
      :student-name="report?.studentName || '同学'"
      :main-conclusion="report?.mainConclusion || '正在为你准备本周学习周报…'"
      @enter="handleEnter"
      @skip="handleSkip"
    />
  </transition>

  <main
    v-if="coverEntered"
    ref="reportRoot"
    class="learning-report-page"
    @scroll.passive="handleScroll"
  >
    <div class="page-progress" aria-hidden="true">
      <span :style="{ width: `${readingProgress}%` }"></span>
    </div>

    <template v-if="report && evidenceMap">
      <ReportTopbar :range="report.range" @back="goBack" />
      <ReportNav
        :sections="sections"
        :active-section="activeSection"
        @navigate="scrollToSection"
        @prev="goPreviousSection"
        @next="goNextSection"
      />

      <OverviewSection :report="report" :active="activeSection === 0" />
      <MasterySection
        :report="report"
        :active="activeSection === 1"
        :evidence="evidenceMap.mastery"
        @open-evidence="openEvidence('mastery')"
      />
      <WeaknessSection
        :report="report"
        :active="activeSection === 2"
        :evidence="evidenceMap.weakness"
        @open-evidence="openEvidence('weakness')"
      />
      <AdjustmentsSection
        :report="report"
        :active="activeSection === 3"
        :evidence="evidenceMap.adjustments"
        @open-evidence="openEvidence('adjustments')"
      />
      <ReviewSection
        :report="report"
        :active="activeSection === 4"
        :evidence="evidenceMap.review"
        @open-evidence="openEvidence('review')"
      />
      <SummarySection
        :report="report"
        :active="activeSection === 5"
        @action="handleAction"
      />

      <EvidenceDrawer
        :open="!!activeEvidence"
        :content="evidenceContent"
        @close="closeEvidence"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { EvidenceKey } from '@/types/learningReport'
import { useReportData } from './composables/useReportData'
import { useReportScroll } from './composables/useReportScroll'
import CoverGate from './sections/CoverGate.vue'
import OverviewSection from './sections/OverviewSection.vue'
import MasterySection from './sections/MasterySection.vue'
import WeaknessSection from './sections/WeaknessSection.vue'
import AdjustmentsSection from './sections/AdjustmentsSection.vue'
import ReviewSection from './sections/ReviewSection.vue'
import SummarySection from './sections/SummarySection.vue'
import ReportTopbar from './components/ReportTopbar.vue'
import ReportNav from './components/ReportNav.vue'
import EvidenceDrawer from './components/EvidenceDrawer.vue'

const router = useRouter()
const { report, evidenceMap } = useReportData()

const reportRoot = ref<HTMLElement | null>(null)
const coverEntered = ref(false)
const activeEvidence = ref<EvidenceKey | null>(null)

const sections = [
  { id: 'overview', label: '总览' },
  { id: 'mastery', label: '提升' },
  { id: 'weakness', label: '问题' },
  { id: 'adjustments', label: '调整' },
  { id: 'review', label: '建议' },
  { id: 'summary', label: '行动' },
]

const {
  activeSection,
  readingProgress,
  handleScroll,
  scrollToSection,
  goPreviousSection,
  goNextSection,
} = useReportScroll(reportRoot, sections.length, () => !!activeEvidence.value)

const evidenceContent = computed(() => {
  const key = activeEvidence.value || 'mastery'
  return evidenceMap.value?.[key] ?? null
})

function handleEnter() {
  coverEntered.value = true
}

function handleSkip() {
  coverEntered.value = true
}

function openEvidence(key: EvidenceKey) {
  activeEvidence.value = key
}

function closeEvidence() {
  activeEvidence.value = null
}

function handleDrawerEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeEvidence.value) {
    closeEvidence()
  }
}

function handleAction(type: 'tasks' | 'study' | 'profile') {
  if (type === 'profile') {
    router.push('/profile')
  } else {
    router.push('/tasks')
  }
}

function goBack() {
  router.push('/tasks')
}

onMounted(() => {
  window.addEventListener('keydown', handleDrawerEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleDrawerEscape)
})
</script>

<style scoped lang="scss">
.learning-report-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  background:
    linear-gradient(135deg, rgba(11, 183, 170, 0.06), transparent 26%),
    linear-gradient(225deg, rgba(245, 158, 11, 0.06), transparent 24%),
    linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-secondary) 100%);
}

html[data-theme='dark'] .learning-report-page {
  background:
    linear-gradient(135deg, rgba(11, 183, 170, 0.04), transparent 26%),
    linear-gradient(225deg, rgba(245, 158, 11, 0.04), transparent 24%),
    linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-secondary) 100%);
}

.page-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 60;
  background: var(--border-soft);

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #0bb7aa, #3b82f6, #f59e0b);
    transition: width 0.3s ease;
  }
}

/* CoverGate 离场过渡 */
.gate-out-leave-active {
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.gate-out-leave-to {
  opacity: 0;
}

@media (max-width: 760px) {
  .learning-report-page {
    scroll-snap-type: none;
  }
}
</style>

<style lang="scss">
.learning-report-page {
  .report-section:not(.is-active) {
    .overview-companion,
    .overview-copy > *,
    .metric-hero,
    .agent-chip,
    .section-copy > *,
    .header-companion,
    .section-panel,
    .chart-header,
    .trend-chart,
    .knowledge-card,
    .weakness-card,
    .cause-board,
    .cause-row,
    .timeline-panel,
    .timeline-item,
    .inline-explainer,
    .risk-table,
    .risk-row:not(.risk-head),
    .next-plan,
    .next-plan-content > *,
    .summary-companion,
    .summary-panel,
    .summary-panel > *,
    .grade-card,
    .summary-actions {
      opacity: 0;
      transform: translateY(26px);
      animation: none !important;
    }

    .trend-line {
      stroke-dashoffset: 1200;
      animation: none !important;
    }

    .trend-point {
      opacity: 0;
      animation: none !important;
    }
  }

  .report-section.is-active {
    .overview-companion,
    .overview-copy > *,
    .metric-hero,
    .agent-chip,
    .section-copy > *,
    .header-companion,
    .section-panel,
    .chart-header,
    .trend-chart,
    .knowledge-card,
    .weakness-card,
    .cause-board,
    .cause-row,
    .timeline-panel,
    .timeline-item,
    .inline-explainer,
    .risk-table,
    .risk-row:not(.risk-head),
    .next-plan,
    .next-plan-content > *,
    .summary-companion,
    .summary-panel,
    .summary-panel > *,
    .grade-card,
    .summary-actions {
      animation: report-section-reveal 0.72s var(--transition-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both !important;
    }

    .overview-companion,
    .header-companion,
    .summary-companion {
      animation-delay: 0.12s !important;
    }

    .overview-copy .eyebrow,
    .section-copy .eyebrow,
    .summary-panel .eyebrow {
      animation-delay: 0.24s !important;
    }

    .overview-copy h2,
    .section-copy h2,
    .summary-panel h2 {
      animation-delay: 0.42s !important;
    }

    .overview-conclusion,
    .section-copy > p,
    .agent-summary {
      animation-delay: 0.62s !important;
    }

    .context-chips,
    .evidence-link,
    .grade-row {
      animation-delay: 0.82s !important;
    }

    .algorithm-explainer,
    .inline-explainer {
      animation-delay: 1.02s !important;
    }

    .metric-hero:nth-child(1),
    .knowledge-card:nth-child(1),
    .weakness-card:nth-child(1),
    .grade-card:nth-child(1) {
      animation-delay: 0.9s !important;
    }

    .metric-hero:nth-child(2),
    .knowledge-card:nth-child(2),
    .weakness-card:nth-child(2),
    .grade-card:nth-child(2) {
      animation-delay: 1.05s !important;
    }

    .metric-hero:nth-child(3),
    .knowledge-card:nth-child(3),
    .weakness-card:nth-child(3),
    .grade-card:nth-child(3) {
      animation-delay: 1.2s !important;
    }

    .agent-chip,
    .summary-actions {
      animation-delay: 1.38s !important;
    }

    .section-panel,
    .timeline-panel,
    .risk-table,
    .next-plan,
    .summary-panel {
      animation-delay: 0.7s !important;
    }

    .chart-header,
    .trend-chart {
      animation-delay: 0.95s !important;
    }

    .trend-line {
      stroke-dasharray: 1200;
      stroke-dashoffset: 1200;
      animation: report-draw-line 1.2s ease-out 1.12s forwards !important;
    }

    .trend-point {
      animation: report-point-in 0.4s ease-out forwards !important;
    }

    .trend-chart > g:nth-of-type(2) .trend-point {
      animation-delay: 1.55s !important;
    }

    .trend-chart > g:nth-of-type(3) .trend-point {
      animation-delay: 1.65s !important;
    }

    .trend-chart > g:nth-of-type(4) .trend-point {
      animation-delay: 1.75s !important;
    }

    .trend-chart > g:nth-of-type(5) .trend-point {
      animation-delay: 1.85s !important;
    }

    .trend-chart > g:nth-of-type(6) .trend-point {
      animation-delay: 1.95s !important;
    }

    .trend-chart > g:nth-of-type(7) .trend-point {
      animation-delay: 2.05s !important;
    }

    .trend-chart > g:nth-of-type(8) .trend-point {
      animation-delay: 2.15s !important;
    }

    .cause-board {
      animation-delay: 1.14s !important;
    }

    .cause-row:nth-child(2),
    .risk-row:nth-child(2),
    .timeline-item:nth-child(1),
    .next-plan-content > *:nth-child(1) {
      animation-delay: 1.08s !important;
    }

    .cause-row:nth-child(3),
    .risk-row:nth-child(3),
    .timeline-item:nth-child(2),
    .next-plan-content > *:nth-child(2) {
      animation-delay: 1.22s !important;
    }

    .cause-row:nth-child(4),
    .risk-row:nth-child(4),
    .timeline-item:nth-child(3),
    .next-plan-content > *:nth-child(3) {
      animation-delay: 1.36s !important;
    }

    .cause-row:nth-child(5),
    .risk-row:nth-child(5),
    .timeline-item:nth-child(4),
    .next-plan-content > *:nth-child(4) {
      animation-delay: 1.5s !important;
    }
  }
}

@keyframes report-section-reveal {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.985);
    filter: blur(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes report-draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes report-point-in {
  from {
    opacity: 0;
    transform: scale(0.7);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .learning-report-page {
    .report-section,
    .report-section.is-active,
    .report-section:not(.is-active) {
      .overview-companion,
      .overview-copy > *,
      .metric-hero,
      .agent-chip,
      .section-copy > *,
      .header-companion,
      .section-panel,
      .chart-header,
      .trend-chart,
      .knowledge-card,
      .weakness-card,
      .cause-board,
      .cause-row,
      .timeline-panel,
      .timeline-item,
      .inline-explainer,
      .risk-table,
      .risk-row,
      .next-plan,
      .next-plan-content > *,
      .summary-companion,
      .summary-panel,
      .summary-panel > *,
      .grade-card,
      .summary-actions {
        opacity: 1;
        transform: none;
        filter: none;
        animation: none !important;
      }

      .trend-line {
        stroke-dashoffset: 0;
        animation: none !important;
      }

      .trend-point {
        opacity: 1;
        animation: none !important;
      }
    }
  }
}
</style>
