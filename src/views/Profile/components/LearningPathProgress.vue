<template>
  <div class="path-progress">
    <SectionSkeleton v-if="loading" :rows="4" height="240px" />
    <div v-else class="path-steps">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="path-step"
        :class="'step-' + step.status"
      >
        <div class="step-indicator">
          <div class="step-dot">
            <el-icon v-if="step.status === 'completed'" :size="12"><Check /></el-icon>
            <span v-else-if="step.status === 'in_progress'" class="step-spinner" />
          </div>
          <div v-if="idx < steps.length - 1" class="step-line" :class="step.status" />
        </div>
        <div class="step-info">
          <span class="step-label">{{ step.label }}</span>
          <div class="step-bar-track">
            <div
              class="step-bar-fill"
              :class="step.status"
              :style="{ width: step.percent + '%' }"
            />
          </div>
          <span class="step-pct">{{ step.percent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockLearningPathSteps } from '../mocks/profileMockData'

defineProps<{
  loading?: boolean
}>()

const steps = computed(() => mockLearningPathSteps())
</script>

<style scoped lang="scss">
.path-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.path-step {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  min-height: 48px;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #d1dbe8;
  background: #fff;

  .step-completed & {
    background: #10b981;
    border-color: #10b981;
    color: #fff;
  }

  .step-in_progress & {
    border-color: #2563eb;
    background: #eff6ff;
  }
}

.step-spinner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 14px;
  background: #e8edf5;

  &.completed {
    background: #10b981;
  }
}

.step-info {
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: #172033;
}

.step-bar-track {
  height: 4px;
  border-radius: 999px;
  background: #edf1f7;
  overflow: hidden;
}

.step-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;

  &.completed {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  &.in_progress {
    background: linear-gradient(90deg, #2563eb, #60a5fa);
  }
}

.step-pct {
  font-size: 10px;
  color: #98a2b3;
}
</style>
