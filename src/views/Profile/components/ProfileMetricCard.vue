<template>
  <div class="metric-card" :style="{ '--metric-color': metric.color, '--metric-bg': metric.bg }">
    <div class="metric-icon-box">
      <span class="metric-icon">{{ metric.icon }}</span>
    </div>
    <div class="metric-body">
      <div class="metric-value-row">
        <span class="metric-value">{{ metric.value }}</span>
        <span
          v-if="metric.trend"
          class="metric-trend"
          :class="metric.trendUp === true ? 'up' : metric.trendUp === false ? 'down' : ''"
        >
          {{ metric.trend }}
        </span>
      </div>
      <span class="metric-label">{{ metric.label }}</span>
      <!-- 指标底部进度线：强化参考图中的彩色数据卡片节奏 -->
      <span class="metric-progress" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HeroMetric } from '../types/profile'

defineProps<{
  metric: HeroMetric
}>()
</script>

<style scoped lang="scss">
.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(228, 236, 251, 0.95);
  border-radius: 13px;
  padding: 15px 16px;
  min-height: 98px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
  box-shadow: 0 10px 22px rgba(52, 91, 173, 0.07);

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--metric-color, #2f6df6) 36%, #dbe7fb);
  }
}

.metric-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--metric-bg, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .metric-icon {
    font-size: 18px;
    line-height: 1;
  }
}

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #101a33;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-trend {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;

  &.up {
    color: #059669;
    background: #ecfdf5;
  }

  &.down {
    color: #dc2626;
    background: #fef2f2;
  }

  &:not(.up):not(.down) {
    color: #667085;
    background: #f1f5f9;
  }
}

.metric-label {
  font-size: 12px;
  color: #7c879c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-progress {
  display: block;
  width: 100%;
  height: 6px;
  margin-top: 8px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, var(--metric-color, #2f6df6) 0 72%, #e8eef8 72% 100%);
}
</style>
