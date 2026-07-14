<template>
  <div class="oauth-page">
    <!-- 炫丽背景装饰 -->
    <div class="bg-gradient"></div>
    <div class="bg-blob blob-1" :style="{ background: blob1Bg }"></div>
    <div class="bg-blob blob-2" :style="{ background: blob2Bg }"></div>

    <div class="oauth-card">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  platform: {
    type: String,
    default: 'github' // 'github' | 'gitee'
  }
})

const blob1Bg = computed(() => {
  if (props.platform === 'gitee') {
    return 'radial-gradient(circle, rgba(199, 29, 35, 0.45) 0%, transparent 80%)'
  }
  return 'radial-gradient(circle, rgba(59, 91, 219, 0.45) 0%, transparent 80%)'
})

const blob2Bg = computed(() => {
  if (props.platform === 'gitee') {
    return 'radial-gradient(circle, rgba(243, 109, 38, 0.45) 0%, transparent 80%)'
  }
  return 'radial-gradient(circle, rgba(18, 184, 134, 0.45) 0%, transparent 80%)'
})
</script>
