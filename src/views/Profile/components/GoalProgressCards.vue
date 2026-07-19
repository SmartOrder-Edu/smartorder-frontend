<template>
  <div class="goal-progress-cards">
    <SectionSkeleton v-if="loading" :rows="4" />
    <el-empty
      v-else-if="!goals.length"
      description="暂无学习目标"
      :image-size="60"
    />
    <div v-else class="goal-list">
      <div v-for="goal in goals" :key="goal.id" class="goal-item">
        <div class="goal-icon-box" :style="{ background: goal.color + '15', color: goal.color }">
          <el-icon :size="16"><Flag /></el-icon>
        </div>
        <div class="goal-text">
          <div class="goal-name">{{ goal.name }}</div>
          <div class="goal-desc">{{ goal.description || '暂无说明' }}</div>
          <CustomProgressBar
            :percent="goal.percent"
            :color="[goal.color, goal.color + 'cc']"
            :height="5"
            :animated="true"
          />
        </div>
        <span class="goal-percent" :style="{ color: goal.color }">
          {{ goal.percent }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flag } from '@element-plus/icons-vue'
import CustomProgressBar from './CustomProgressBar.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { GoalProgressItem } from '../types/profile'

defineProps<{
  goals: GoalProgressItem[]
  loading?: boolean
}>()
</script>

<style scoped lang="scss">
.goal-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 0;
}

.goal-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 42px;
  gap: 12px;
  align-items: center;
}

.goal-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.goal-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.goal-name {
  font-size: 13px;
  font-weight: 600;
  color: #344054;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-desc {
  font-size: 11px;
  color: #98a2b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-percent {
  text-align: right;
  font-weight: 700;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
</style>
