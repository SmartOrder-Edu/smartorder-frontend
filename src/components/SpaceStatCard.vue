<template>
  <div class="stat-card" :class="{ clickable: !!to }" @click="to && $router.push(to)">
    <div class="stat-icon" :style="{ background: bgColor }">
      <slot name="icon">
        <svg
          v-if="iconPaths"
          class="stat-svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          :stroke="valueColor || 'currentColor'"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="iconPaths"
        />
      </slot>
    </div>
    <div class="stat-body">
      <span class="stat-value" :style="{ color: valueColor }">{{ formattedValue }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number | string
  label: string
  icon?: string[]
  bgColor?: string
  valueColor?: string
  suffix?: string
  to?: string
  max?: number
}>()

const iconPaths = computed(() => {
  if (!props.icon || props.icon.length === 0) return ''
  return props.icon.join('')
})

const formattedValue = computed(() => {
  if (props.max != null && typeof props.value === 'number') {
    return `${Math.round(props.value)}%`
  }
  if (props.suffix) return `${props.value}${props.suffix}`
  if (typeof props.value === 'number' && props.value < 100) return `${props.value}%`
  return String(props.value)
})
</script>

<script lang="ts">
export default { name: 'SpaceStatCard' }
</script>

<style scoped lang="scss">
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  min-width: 110px;
  transition: all 0.2s;

  &.clickable {
    cursor: pointer;
    &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); transform: translateY(-1px); }
  }
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-svg {
  display: block;
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.6875rem;
  color: #8c8ca1;
  white-space: nowrap;
}
</style>
