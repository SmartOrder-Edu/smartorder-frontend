<template>
  <div class="recommended-resources">
    <SectionSkeleton v-if="loading" :rows="4" />

    <div v-else class="resources-list">
      <div
        v-for="r in resources"
        :key="r.id"
        class="resource-item"
      >
        <div class="resource-icon-box">
          <el-icon :size="16"><Collection /></el-icon>
        </div>
        <div class="resource-body">
          <div class="resource-name">{{ r.title }}</div>
          <div class="resource-meta">
            <span class="resource-tag">{{ r.type }}</span>
            <span class="resource-dot">·</span>
            <span>{{ r.duration }}</span>
            <span class="resource-dot">·</span>
            <span>{{ r.difficulty }}</span>
          </div>
          <div class="resource-reason">
            <el-icon :size="11"><Connection /></el-icon>
            {{ r.matchReason }}
          </div>
        </div>
        <button class="resource-btn">
          <el-icon :size="14"><ArrowRight /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Collection, Connection, ArrowRight } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockResources } from '../mocks/profileMockData'

defineProps<{
  loading?: boolean
}>()

const resources = computed(() => mockResources())
</script>

<style scoped lang="scss">
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #edf1f7;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;

  &:hover {
    border-color: #cddefa;
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.06);
  }
}

.resource-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.resource-name {
  font-size: 13px;
  font-weight: 500;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #98a2b3;
}

.resource-tag {
  padding: 1px 6px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #667085;
  font-size: 10px;
}

.resource-dot {
  font-size: 8px;
  color: #d1dbe8;
}

.resource-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #2563eb;
}

.resource-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e8edf5;
  background: #fff;
  color: #667085;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #eff6ff;
    color: #2563eb;
  }
}
</style>
