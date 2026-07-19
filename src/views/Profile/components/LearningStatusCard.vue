<template>
  <div class="status-card">
    <SectionSkeleton v-if="loading" :rows="4" />

    <div v-else class="status-layout">
      <!-- 左侧：当前状态 -->
      <div class="status-left">
        <div class="status-icon-circle">
          <el-icon :size="24"><Sunny /></el-icon>
        </div>
        <h4 class="status-name">{{ status.name }}</h4>
        <p class="status-desc">{{ status.description }}</p>

        <div class="status-metrics">
          <div class="status-metric">
            <span class="sm-label">今日专注度</span>
            <span class="sm-value">
              {{ status.focusLevel }}<span class="sm-unit">%</span>
            </span>
          </div>
          <div class="status-metric">
            <span class="sm-label">最佳学习时间</span>
            <span class="sm-value sm-small">{{ status.bestStudyTime }}</span>
          </div>
        </div>

        <div class="focus-badge">
          <el-icon :size="12"><Clock /></el-icon>
          状态良好
        </div>
      </div>

      <!-- 右侧：学习建议 -->
      <div class="status-right">
        <h4 class="suggestions-heading">
          <el-icon :size="14"><Opportunity /></el-icon>
          个性化学习建议
        </h4>
        <div class="suggestions-grid">
          <div v-for="s in suggestions" :key="s.title" class="suggestion-card">
            <span class="suggestion-icon">{{ s.icon }}</span>
            <div class="suggestion-body">
              <div class="suggestion-title">{{ s.title }}</div>
              <p class="suggestion-desc">{{ s.description }}</p>
            </div>
            <button class="suggestion-btn">{{ s.actionLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sunny, Clock, Opportunity } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { CurrentStatus, LearningSuggestion } from '../types/profile'

defineProps<{
  status: CurrentStatus
  suggestions: LearningSuggestion[]
  loading?: boolean
}>()
</script>

<style scoped lang="scss">
.status-layout {
  display: flex;
  gap: 20px;

  @media (max-width: 1000px) {
    flex-direction: column;
  }
}

// ===== 左侧状态 =====
.status-left {
  flex: 0 0 32%;
  background: linear-gradient(135deg, #ecfdf5 0%, #f7fffb 100%);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.status-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-name {
  font-size: 17px;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.status-desc {
  font-size: 12px;
  color: #667085;
  line-height: 1.5;
  margin: 0;
}

.status-metrics {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 4px;
}

.status-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sm-label {
  font-size: 10px;
  color: #98a2b3;
}

.sm-value {
  font-size: 18px;
  font-weight: 700;
  color: #172033;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.sm-unit {
  font-size: 11px;
  font-weight: 400;
  color: #667085;
}

.sm-small {
  font-size: 12px;
}

.focus-badge {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  font-size: 11px;
  font-weight: 500;
}

// ===== 右侧建议 =====
.status-right {
  flex: 1;
  min-width: 0;
}

.suggestions-heading {
  font-size: 14px;
  font-weight: 600;
  color: #172033;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.suggestion-card {
  background: #f8faff;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 126px;
}

.suggestion-icon {
  font-size: 20px;
  line-height: 1;
}

.suggestion-body {
  flex: 1;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: #172033;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 12px;
  color: #7b8496;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.suggestion-btn {
  width: 100%;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #bcd0ff;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: auto;

  &:hover {
    background: #eff6ff;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }
}
</style>
