<template>
  <svg
    :viewBox="viewBox"
    :width="finalSize"
    :height="finalSize"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['app-icon', `app-icon-${name}`]"
    v-html="iconPaths"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '@/hooks/useIcons'

const props = withDefaults(defineProps<{
  name: string
  size?: number | string
  strokeWidth?: number
}>(), {
  size: 20,
  strokeWidth: 2
})

const viewBox = '0 0 24 24'

const finalSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const iconPaths = computed(() => {
  const icon = icons[props.name]
  if (!icon) {
    console.warn(`Icon "${props.name}" not found`)
    return ''
  }

  if (Array.isArray(icon)) {
    return icon.join('')
  }
  if (icon.open && icon.closed) {
    return [...icon.open, ...icon.closed].join('')
  }
  return ''
})
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
