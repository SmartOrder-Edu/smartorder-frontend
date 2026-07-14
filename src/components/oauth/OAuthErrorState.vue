<template>
  <div class="oauth-error">
    <div class="loading-wrapper">
      <div class="error-ring">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="svg-cross">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div class="platform-icon" :class="[platform + '-icon', { 'gitee-error': platform === 'gitee' }]">
        <slot name="icon"></slot>
      </div>
    </div>
    <h3 class="status-title text-error">{{ statusText }}</h3>
    <p class="status-subtitle">{{ subText }}</p>
    <div class="action-wrapper animate-fade-in">
      <button class="back-btn" @click="$emit('back')">返回登录页</button>
    </div>
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

defineEmits(['back'])
</script>
