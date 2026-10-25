<template>
  <div class="metacognitive-grid">
    <SectionSkeleton v-if="loading" :rows="4" />
    <el-empty
      v-else-if="!dimensions.length"
      description="暂无元认知数据"
      :image-size="60"
    />
    <div v-else class="meta-grid" :class="gridClass">
      <div
        v-for="d in dimensions"
        :key="d.name"
        class="meta-item"
        :class="'meta-level-' + (d.level === '优秀' ? 'good' : d.level === '良好' ? 'ok' : 'medium')"
      >
        <div class="meta-icon-box" :style="iconStyle(d)">
          <el-icon :size="16"><Cpu /></el-icon>
        </div>
        <div class="meta-body">
          <div class="meta-top">
            <div class="meta-title-block">
              <div class="meta-name">{{ d.name }}</div>
              <div class="meta-level-tag">{{ d.level }}</div>
            </div>
            <span class="meta-score">{{ d.value }}<small>分</small></span>
          </div>
          <p class="meta-desc">{{ d.description || '持续积累学习证据，等待更多行为样本更新画像。' }}</p>
          <div class="meta-bar">
            <div
              class="meta-bar-fill"
              :style="{ width: d.value + '%', background: barColor(d) }"
            />
          </div>
          <div class="meta-footer">
            <span>{{ trendText(d.trend) }}</span>
            <span>{{ d.value >= 80 ? '优势项' : d.value >= 70 ? '稳定项' : '提升项' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { MetacognitiveItem } from '../types/profile'

const props = defineProps<{
  dimensions: MetacognitiveItem[]
  loading?: boolean
}>()

const iconColors: Record<string, string> = {
  '规划能力': '#3b82f6',
  '监控能力': '#8b5cf6',
  '调节能力': '#f59e0b',
  '反思能力': '#10b981',
}

const iconBgs: Record<string, string> = {
  '规划能力': '#eff6ff',
  '监控能力': '#f5f3ff',
  '调节能力': '#fffbeb',
  '反思能力': '#ecfdf5',
}

function iconStyle(d: MetacognitiveItem) {
  const c = iconColors[d.name] || '#2563eb'
  const bg = iconBgs[d.name] || '#eff6ff'
  return { color: c, background: bg }
}

function barColor(d: MetacognitiveItem) {
  return iconColors[d.name] || '#2563eb'
}

function trendText(trend: string) {
  const map: Record<string, string> = {
    IMPROVING: '持续提升',
    STABLE: '稳定保持',
    DECLINING: '需要关注',
  }
  return map[trend] || '持续观察'
}

const gridClass = computed(() => {
  return props.dimensions.length >= 4 ? 'grid-2x2' : 'grid-2col'
})
</script>

<style scoped lang="scss">
.meta-grid {
  display: grid;
  gap: 12px;

  &.grid-2x2,
  &.grid-2col {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (max-width: 560px) {
      grid-template-columns: 1fr;
    }
  }
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 118px;
  padding: 14px;
  border: 1px solid #e6edf7;
  border-radius: 13px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 255, 0.96));
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #cddefa;
    box-shadow: 0 12px 24px rgba(52, 91, 173, 0.08);
  }
}

.meta-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.meta-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.meta-name {
  font-size: 13px;
  font-weight: 800;
  color: #101a33;
}

.meta-level-tag {
  display: inline-block;
  margin-top: 3px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;

  .meta-level-good & {
    background: #ecfdf5;
    color: #059669;
  }
  .meta-level-ok & {
    background: #eff6ff;
    color: #2563eb;
  }
  .meta-level-medium & {
    background: #fffbeb;
    color: #d97706;
  }
}

.meta-score {
  font-size: 24px;
  font-weight: 800;
  color: #101a33;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  flex-shrink: 0;

  small {
    margin-left: 1px;
    color: #7b879a;
    font-size: 11px;
    font-weight: 600;
  }
}

.meta-desc {
  min-height: 36px;
  margin: 0;
  color: #6b7690;
  font-size: 11px;
  line-height: 1.55;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.meta-bar {
  height: 5px;
  border-radius: 999px;
  background: #edf1f7;
  overflow: hidden;
}

.meta-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.meta-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #7b879a;
  font-size: 10px;
  font-weight: 700;
}
</style>
