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
  gap: 12px;
  min-height: 76px;
  padding: 14px 16px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  min-width: 110px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &.clickable {
    cursor: pointer;
    &:hover {
      border-color: rgba(11, 183, 170, 0.28);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.075);
      transform: translateY(-2px);
    }
  }
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.stat-svg {
  display: block;
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.stat-value {
  font-size: 1.18rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: 0;
}

.stat-label {
  font-size: 0.74rem;
  color: #64748b;
  white-space: nowrap;
  font-weight: 600;
}
</style>
