<template>
  <div class="weak-knowledge">
    <SectionSkeleton v-if="loading" :rows="5" />

    <!-- 空状态 -->
    <div v-else-if="!items.length" class="weak-empty">
      <el-icon :size="28" color="#10b981"><SuccessFilled /></el-icon>
      <span>暂未发现明显薄弱知识点</span>
    </div>

    <div v-else class="weak-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="weak-item"
        @click="$emit('item-click', item.id)"
      >
        <div class="weak-main">
          <div class="weak-name-row">
            <span class="weak-name">{{ item.name }}</span>
            <span class="weak-subject-tag">{{ item.subject }}</span>
          </div>
          <div class="weak-bar-track">
            <div
              class="weak-bar-fill"
              :style="barStyle(item.percent)"
            />
          </div>
        </div>
        <span class="weak-percent" :style="{ color: percentColor(item.percent) }">
          {{ item.percent }}%
        </span>
        <el-icon :size="14" class="weak-arrow" color="#98a2b3"><ArrowRight /></el-icon>
      </div>
    </div>

    <button class="text-btn" v-if="items.length">
      查看全部薄弱点 <el-icon :size="12"><ArrowRight /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { SuccessFilled, ArrowRight } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { WeakKnowledgeItem } from '../types/profile'

const props = defineProps<{
  items: WeakKnowledgeItem[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'item-click', id: string): void
}>()

function percentColor(pct: number) {
  if (pct < 40) return '#ef4444'
  if (pct < 55) return '#f59e0b'
  return '#3b82f6'
}

function barStyle(pct: number) {
  // 薄弱度越低越偏红，越高越偏蓝
  const color = pct < 40
    ? 'linear-gradient(90deg, #ef4444, #f87171)'
    : pct < 55
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #8b5cf6, #3b82f6)'

  return { width: pct + '%', background: color }
}
</script>

<style scoped lang="scss">
.weak-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weak-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px 16px;
  gap: 10px;
  align-items: center;
  padding: 6px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f8fafc;

    .weak-arrow {
      opacity: 1;
    }
  }
}

.weak-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.weak-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.weak-name {
  font-size: 12px;
  font-weight: 500;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weak-subject-tag {
  padding: 1px 6px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #98a2b3;
  font-size: 10px;
  flex-shrink: 0;
}

.weak-bar-track {
  height: 4px;
  border-radius: 999px;
  background: #edf1f7;
  overflow: hidden;
}

.weak-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.weak-percent {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.weak-arrow {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.weak-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 13px;
  color: #667085;
}

.text-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 6px;
  font-family: inherit;
  margin-top: 8px;
  transition: background 0.15s;

  &:hover {
    background: #eff6ff;
  }
}
</style>
