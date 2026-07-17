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
