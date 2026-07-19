<template>
  <div class="preference-donut">
    <SectionSkeleton v-if="loading" :rows="5" height="420px" />

    <el-empty
      v-else-if="!mainPreferenceGroup.segments.length"
      description="暂无偏好数据"
      :image-size="60"
    />

    <div v-else class="preference-panel">
      <div class="preference-panel-header">
        <h3 class="preference-panel-title">
          <el-icon class="preference-title-icon"><PieChart /></el-icon>
          学习偏好分析
        </h3>
      </div>

      <div class="preference-main-card">
        <div class="preference-copy">
          <h4 class="preference-card-title">内容形式偏好</h4>
          <span class="preference-card-subtitle">按选择率分布</span>
        </div>

        <div class="preference-main-body">
          <div class="donut-wrap donut-wrap--large">
            <svg viewBox="0 0 200 200" class="donut-svg" role="img" aria-label="内容形式偏好分布">
              <g transform="rotate(-90 100 100)">
                <circle
                  cx="100"
                  cy="100"
                  :r="radius"
                  fill="none"
                  class="donut-track"
                  stroke-width="24"
                />
                <circle
                  v-for="(seg, idx) in mainPreferenceGroup.segments"
                  :key="seg.name"
                  cx="100"
                  cy="100"
                  :r="radius"
                  fill="none"
                  :stroke="seg.color"
                  :stroke-width="isActive(mainPreferenceGroup.key, idx) ? 31 : 24"
                  :stroke-dasharray="`${seg.arcLength} ${circumference}`"
                  :stroke-dashoffset="animated ? seg.dashOffsetTarget : seg.dashOffsetInitial"
                  :stroke-linecap="mainPreferenceGroup.segments.length === 1 ? 'round' : 'butt'"
                  class="donut-segment"
                  :style="segmentStyle(mainPreferenceGroup.key, idx)"
                  @mouseenter="onHover(mainPreferenceGroup.key, idx)"
                  @mouseleave="onLeave"
                />
              </g>
              <text x="100" y="92" text-anchor="middle" class="donut-center-value donut-center-value--large">
                {{ displayCenterValue(mainPreferenceGroup) }}
              </text>
              <text x="100" y="116" text-anchor="middle" class="donut-center-label">
                {{ displayCenterLabel(mainPreferenceGroup) }}
              </text>
            </svg>
          </div>

          <div class="preference-legend preference-legend--main">
            <div
              v-for="(seg, idx) in mainPreferenceGroup.segments"
              :key="seg.name"
              class="legend-item"
              :class="{ active: isActive(mainPreferenceGroup.key, idx) }"
              @mouseenter="onHover(mainPreferenceGroup.key, idx)"
              @mouseleave="onLeave"
            >
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-name">{{ seg.name }}</span>
              <span class="legend-value">{{ seg.percent }}<small>%</small></span>
            </div>
          </div>
        </div>
      </div>

      <div class="preference-mini-grid">
        <div
          v-for="group in secondaryPreferenceGroups"
          :key="group.key"
          class="preference-mini-card"
        >
          <div class="preference-copy">
            <h4 class="preference-card-title">{{ group.title }}</h4>
            <span class="preference-card-subtitle">倾向分布</span>
          </div>

          <div class="preference-mini-body">
            <div class="donut-wrap donut-wrap--mini">
              <svg viewBox="0 0 200 200" class="donut-svg" :aria-label="`${group.title}分布`" role="img">
                <g transform="rotate(-90 100 100)">
                  <circle
                    cx="100"
                    cy="100"
                    :r="radius"
                    fill="none"
                    class="donut-track"
                    stroke-width="22"
                  />
                  <circle
                    v-for="(seg, idx) in group.segments"
                    :key="seg.name"
                    cx="100"
                    cy="100"
                    :r="radius"
                    fill="none"
                    :stroke="seg.color"
                    :stroke-width="isActive(group.key, idx) ? 29 : 22"
                    :stroke-dasharray="`${seg.arcLength} ${circumference}`"
                    :stroke-dashoffset="animated ? seg.dashOffsetTarget : seg.dashOffsetInitial"
                    :stroke-linecap="group.segments.length === 1 ? 'round' : 'butt'"
                    class="donut-segment"
                    :style="segmentStyle(group.key, idx)"
                    @mouseenter="onHover(group.key, idx)"
                    @mouseleave="onLeave"
                  />
                </g>
                <text x="100" y="96" text-anchor="middle" class="donut-mini-label">
                  {{ displayCenterLabel(group) }}
                </text>
                <text x="100" y="118" text-anchor="middle" class="donut-mini-caption">
                  主要偏好
                </text>
              </svg>
            </div>

            <div class="preference-legend">
              <div
                v-for="(seg, idx) in group.segments"
                :key="seg.name"
                class="legend-item legend-item--mini"
                :class="{ active: isActive(group.key, idx) }"
                @mouseenter="onHover(group.key, idx)"
                @mouseleave="onLeave"
              >
                <span class="legend-dot" :style="{ background: seg.color }"></span>
                <span class="legend-name">{{ seg.name }}</span>
                <span class="legend-value">{{ seg.percent }}<small>%</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { PieChart } from '@element-plus/icons-vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { PreferenceItem } from '../types/profile'

const props = defineProps<{
  items: PreferenceItem[]
  loading?: boolean
}>()

const COLORS = ['#3b5bdb', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899']
const MINI_COLORS = ['#14b8a6', '#cbd5e1']
const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const radius = RADIUS
const circumference = CIRCUMFERENCE
const duration = 0.9
const stagger = 0.1

interface DonutSegment {
  name: string
  value: number
  color: string
  percent: number
  arcLength: number
  dashOffsetTarget: number
  dashOffsetInitial: number
}

interface PreferenceGroup {
  key: string
  title: string
  centerValue?: string
  segments: DonutSegment[]
}

const hoveredKey = ref<string | null>(null)
const hoveredIdx = ref<number | null>(null)
const animated = ref(false)

// 计算 SVG 圆环每一段的长度和偏移量，用 stroke-dasharray 拼出多段环形图。
function buildSegments(items: PreferenceItem[], colors: string[]) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  let cumulative = 0

  return items
    .filter((item) => item.value > 0)
    .map((item, index) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0
      const arcLength = (percent / 100) * CIRCUMFERENCE
      const startOffset = (cumulative / 100) * CIRCUMFERENCE
      cumulative += percent

      return {
        name: item.name,
        value: item.value,
        color: colors[index % colors.length],
        percent: Math.round(percent),
        arcLength,
        dashOffsetTarget: -startOffset,
        dashOffsetInitial: -startOffset - arcLength,
      }
    })
}

const mainPreferenceGroup = computed<PreferenceGroup>(() => {
  const segments = buildSegments(props.items, COLORS)
  const lead = findLeadSegment(segments)
  return {
    key: 'content-format',
    title: '内容形式偏好',
    centerValue: `${Math.min(95, Math.max(0, Math.round((lead?.percent ?? 0) * 2.4)))}%`,
    segments,
  }
})

const secondaryPreferenceGroups = computed<PreferenceGroup[]>(() => {
  // 细分偏好沿用设计稿里的结构，先用稳定画像数据兜底，后续可接入后端同名字段。
  const groups = [
    { key: 'explanation', title: '讲解方式偏好', items: [{ name: '先示例', value: 72 }, { name: '先原理', value: 28 }] },
    { key: 'practice', title: '练习偏好', items: [{ name: '渐进式', value: 80 }, { name: '直接挑战', value: 20 }] },
    { key: 'feedback', title: '反馈偏好', items: [{ name: '即时', value: 75 }, { name: '延迟', value: 25 }] },
    { key: 'interaction', title: '交互模式偏好', items: [{ name: '引导式', value: 70 }, { name: '自由探索', value: 30 }] },
  ]

  return groups.map((group) => ({
    key: group.key,
    title: group.title,
    segments: buildSegments(group.items, MINI_COLORS),
  }))
})

function findLeadSegment(segments: DonutSegment[]) {
  return segments.reduce<DonutSegment | null>(
    (max, segment) => (!max || segment.value > max.value ? segment : max),
    null
  )
}

function getActiveSegment(group: PreferenceGroup) {
  if (hoveredKey.value !== group.key || hoveredIdx.value == null) return null
  return group.segments[hoveredIdx.value] ?? null
}

function displayCenterValue(group: PreferenceGroup) {
  const active = getActiveSegment(group)
  return active ? `${active.percent}%` : group.centerValue || `${findLeadSegment(group.segments)?.percent ?? 0}%`
}

function displayCenterLabel(group: PreferenceGroup) {
  return getActiveSegment(group)?.name || findLeadSegment(group.segments)?.name || '偏好分布'
}

function isActive(groupKey: string, index: number) {
  return hoveredKey.value === groupKey && hoveredIdx.value === index
}

function segmentStyle(groupKey: string, index: number) {
  const hasHover = hoveredKey.value !== null
  const currentActive = hoveredKey.value === groupKey && hoveredIdx.value === index
  return {
    transition: `stroke-dashoffset ${duration}s cubic-bezier(0.34, 1.4, 0.64, 1) ${index * stagger}s, stroke-width 0.25s ease, opacity 0.25s ease`,
    opacity: !hasHover || currentActive ? 1 : 0.34,
  }
}

function onHover(groupKey: string, index: number) {
  hoveredKey.value = groupKey
  hoveredIdx.value = index
}

function onLeave() {
  hoveredKey.value = null
  hoveredIdx.value = null
}

// 等首帧初始 dashOffset 落盘后再开启动画，形成文档里的“绘制圆环”效果。
function playEnterAnimation() {
  animated.value = false
  nextTick(() => {
    requestAnimationFrame(() => {
      animated.value = true
    })
  })
}

onMounted(playEnterAnimation)

watch(
  () => props.items,
  () => {
    hoveredKey.value = null
    hoveredIdx.value = null
    playEnterAnimation()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.preference-donut {
  width: 100%;
  min-height: 500px;
}

.preference-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #dfe7f1;
  box-shadow: 0 18px 45px rgba(44, 71, 110, 0.07);
}

.preference-panel-header {
  padding-bottom: 14px;
  border-bottom: 1px solid #dde6f0;
}

.preference-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #07172f;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.preference-title-icon {
  width: 20px;
  height: 20px;
  color: #07172f;
  font-size: 19px;
}

.preference-main-card,
.preference-mini-card {
  border-radius: 11px;
  background: #f1f5fa;
  border: 1px solid rgba(226, 233, 242, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.preference-main-card {
  padding: 14px 16px 16px;
  min-height: 180px;
}

.preference-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preference-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #07172f;
  margin: 0;
}

.preference-card-subtitle {
  font-size: 11px;
  color: #8d99ad;
}

.preference-main-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-top: 12px;
  padding-right: 2px;
}

.preference-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preference-mini-card {
  padding: 12px 14px 14px;
  min-height: 142px;
}

.preference-mini-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.donut-wrap {
  flex-shrink: 0;
}

.donut-wrap--large {
  width: 126px;
  height: 126px;
  margin-left: 12px;
}

.donut-wrap--mini {
  width: 88px;
  height: 88px;
  margin-left: 6px;
}

.donut-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.donut-track {
  stroke: #d7e1ec;
  opacity: 1;
}

.donut-segment {
  cursor: pointer;
  filter: drop-shadow(0 6px 9px rgba(15, 23, 42, 0.1));
}

.donut-center-value {
  font-size: 18px;
  font-weight: 800;
  fill: #07172f;
  font-variant-numeric: tabular-nums;
}

.donut-center-value--large {
  font-size: 21px;
}

.donut-center-label,
.donut-mini-caption {
  font-size: 10px;
  font-weight: 600;
  fill: #9aa6b8;
}

.donut-mini-label {
  font-size: 12px;
  font-weight: 800;
  fill: #07172f;
}

.preference-legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preference-legend--main {
  max-width: 420px;
  gap: 6px;
  padding-right: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  padding: 1px 4px;
  border-radius: 7px;
  color: #627086;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover,
  &.active {
    background: rgba(20, 184, 166, 0.08);
    color: #07172f;
    transform: translateX(2px);
  }
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.72);
  transition: transform 0.2s ease;
}

.legend-item:hover .legend-dot,
.legend-item.active .legend-dot {
  transform: scale(1.25);
}

.legend-item--mini {
  min-height: 23px;
}

.legend-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  color: #07172f;
  font-weight: 800;
  font-variant-numeric: tabular-nums;

  small {
    margin-left: 1px;
    color: #8d99ad;
    font-size: 9px;
    font-weight: 600;
  }
}

@media (max-width: 920px) {
  .preference-panel {
    padding: 22px;
  }

  .preference-main-body {
    gap: 20px;
  }

  .preference-legend--main {
    max-width: 300px;
  }
}

@media (max-width: 560px) {
  .preference-panel {
    padding: 18px;
  }

  .preference-main-body,
  .preference-mini-body {
    align-items: stretch;
    flex-direction: column;
  }

  .preference-mini-grid {
    grid-template-columns: 1fr;
  }

  .donut-wrap {
    align-self: center;
    margin-left: 0;
  }

  .preference-legend--main {
    max-width: none;
  }
}
</style>
