<template>
  <div class="oauth-page">
    <!-- 炫丽背景装饰 -->
    <div class="bg-gradient"></div>
    <div class="bg-blob blob-1" :style="{ background: blob1Bg }"></div>
    <div class="bg-blob blob-2" :style="{ background: blob2Bg }"></div>

    <div class="oauth-card">
      <div class="oauth-platform-badge">
        <template v-if="platform === 'gitee'">
          <svg viewBox="0 0 24 24" class="badge-icon gitee">
            <path fill="currentColor" d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>
          </svg>
          <span class="badge-text">Gitee 授权登录</span>
        </template>
        <template v-else-if="platform === 'github'">
          <svg viewBox="0 0 24 24" class="badge-icon github">
            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span class="badge-text">GitHub 授权登录</span>
        </template>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.oauth-platform-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.3);
}

.badge-icon {
  width: 24px;
  height: 24px;
}

.badge-icon.gitee {
  color: #c71d23;
}

.badge-icon.github {
  color: #24292f;
}

.badge-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

/* 适配暗黑模式 */
html[data-theme='dark'] .badge-icon.github {
  color: #f0f6fc;
}
html[data-theme='dark'] .badge-text {
  color: #f8fafc;
}
</style>

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
