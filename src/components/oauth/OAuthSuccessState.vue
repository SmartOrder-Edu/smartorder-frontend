<template>
  <div class="oauth-success">
    <div class="loading-wrapper">
      <div class="success-ring">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="svg-check">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="platform-icon" :class="[platform + '-icon']">
        <slot name="icon"></slot>
      </div>
    </div>
    <h3 class="status-title">{{ statusText }}</h3>
    <p class="status-subtitle">{{ subText }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
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
</script>
