<template>
  <div class="stage-summary">
    <SectionSkeleton v-if="loading" :rows="4" />

    <div v-else class="summary-content">
      <div class="summary-period">
        <el-icon :size="14"><Calendar /></el-icon>
        {{ summary.period }}
      </div>

      <div class="summary-metrics">
        <div class="summary-metric">
          <div class="sm-icon-box" style="background:#eff6ff;color:#2563eb">
            <el-icon :size="18"><Clock /></el-icon>
          </div>
          <div class="sm-text">
            <span class="sm-value">{{ summary.totalHours }}<span class="sm-unit">h</span></span>
            <span class="sm-label">学习总时长</span>
          </div>
        </div>
        <div class="summary-metric">
          <div class="sm-icon-box" style="background:#ecfdf5;color:#10b981">
            <el-icon :size="18"><Finished /></el-icon>
          </div>
          <div class="sm-text">
            <span class="sm-value">{{ summary.completedTasks }}<span class="sm-unit">个</span></span>
            <span class="sm-label">完成任务</span>
          </div>
        </div>
        <div class="summary-metric">
          <div class="sm-icon-box" style="background:#f5f3ff;color:#8b5cf6">
            <el-icon :size="18"><CircleCheck /></el-icon>
          </div>
          <div class="sm-text">
            <span class="sm-value">{{ summary.accuracy }}<span class="sm-unit">%</span></span>
            <span class="sm-label">练习正确率</span>
          </div>
        </div>
        <div class="summary-metric">
          <div class="sm-icon-box" style="background:#fffbeb;color:#f59e0b">
            <el-icon :size="18"><TrendCharts /></el-icon>
          </div>
          <div class="sm-text">
            <span class="sm-value positive">
              <span class="trend-arrow">&#9650;</span>
              {{ summary.improvement }}<span class="sm-unit">%</span>
            </span>
            <span class="sm-label">环比提升</span>
          </div>
        </div>
      </div>

      <div class="summary-highlights">
        <div class="highlights-heading">
          <el-icon :size="14"><StarFilled /></el-icon>
          本周亮点
        </div>
        <ul class="highlights-list">
          <li v-for="(h, i) in summary.highlights" :key="i" class="highlight-item">
            <span class="highlight-num">{{ i + 1 }}</span>
            <span class="highlight-text">{{ h }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Clock, Finished, CircleCheck, TrendCharts, StarFilled } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockStageSummary } from '../mocks/profileMockData'

defineProps<{
  loading?: boolean
}>()

const summary = computed(() => mockStageSummary())
</script>

<style scoped lang="scss">
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-period {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #667085;
  padding: 5px 12px;
  background: #f1f5f9;
  border-radius: 999px;
  align-self: flex-start;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #edf1f7;
}

.sm-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sm-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sm-value {
  font-size: 20px;
  font-weight: 700;
  color: #172033;
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1.1;

  &.positive {
    color: #10b981;
  }
}

.trend-arrow {
  font-size: 11px;
  color: #10b981;
}

.sm-unit {
  font-size: 10px;
  font-weight: 400;
  color: #667085;
}

.sm-label {
  font-size: 11px;
  color: #98a2b3;
}

.summary-highlights {
  background: #f8faff;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  padding: 16px 18px;
}

.highlights-heading {
  font-size: 13px;
  font-weight: 600;
  color: #172033;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.highlights-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.highlight-item {
  font-size: 12px;
  color: #475467;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}

.highlight-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.highlight-text {
  flex: 1;
}
</style>
