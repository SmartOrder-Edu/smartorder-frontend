<template>
  <div class="mistake-list-wrapper">
    <SectionSkeleton v-if="loading" :rows="5" />
    <el-empty
      v-else-if="!items.length"
      description="暂无错题数据"
      :image-size="60"
    />
    <div v-else class="mistake-list">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="mistake-item"
        @click="$emit('item-click', item.id)"
      >
        <span class="mistake-rank" :style="{ color: item.color }">
          {{ idx + 1 }}
        </span>
        <div class="mistake-info">
          <span class="mistake-name">{{ item.name }}</span>
          <CustomProgressBar
            :percent="item.percent"
            :color="item.color"
            :height="5"
            :animated="true"
          />
        </div>
        <span class="mistake-percent">{{ item.percent }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomProgressBar from './CustomProgressBar.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { MistakeItem } from '../types/profile'

defineProps<{
  items: MistakeItem[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'item-click', id: string): void
}>()
</script>

<style scoped lang="scss">
.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mistake-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 38px;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #f8fafc;
    transform: translateX(2px);
  }
}

.mistake-rank {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  width: 24px;
}

.mistake-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.mistake-name {
  font-size: 12px;
  color: #475467;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mistake-percent {
  font-size: 12px;
  font-weight: 600;
  color: #344054;
  text-align: right;
}
</style>
