<template>
  <div class="oauth-loading">
    <div class="loading-wrapper">
      <div class="loading-ring ring-outer" :style="outerRingStyle"></div>
      <div class="loading-ring ring-inner" :style="innerRingStyle"></div>
      <div class="platform-icon" :class="[platform + '-icon']">
        <slot name="icon"></slot>
      </div>
    </div>
    <h3 class="status-title">{{ statusText }}</h3>
    <p class="status-subtitle">{{ subText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  platform: {
    type: String,
    default: 'github'
  },
  statusText: {
    type: String,
    required: true
  },
  subText: {
    type: String,
    required: true
  }
})

const outerRingStyle = computed(() => {
  if (props.platform === 'gitee') {
    return { borderTopColor: '#c71d23', borderBottomColor: '#f36d26' }
  }
  return { borderTopColor: '#3b5bdb', borderBottomColor: '#12b886' }
})

const innerRingStyle = computed(() => {
  if (props.platform === 'gitee') {
    return { borderLeftColor: '#c71d23', borderRightColor: '#f36d26' }
  }
  return { borderLeftColor: '#3b5bdb', borderRightColor: '#12b886' }
})
</script>
