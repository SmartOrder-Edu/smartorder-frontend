<template>
  <div class="focus-progress-container">
    <svg class="focus-progress-svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="focusProgressGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2dd4bf" />
          <stop offset="100%" stop-color="#0d9488" />
        </linearGradient>
      </defs>
      <circle class="focus-progress-bg" cx="50" cy="50" r="40" stroke-width="7.5" fill="transparent" />
      <circle
        class="focus-progress-active"
        cx="50"
        cy="50"
        r="40"
        stroke-width="7.5"
        fill="transparent"
        :stroke-dasharray="2 * Math.PI * 40"
        :stroke-dashoffset="2 * Math.PI * 40 * (1 - (progress || 0) / 100)"
        stroke-linecap="round"
        stroke="url(#focusProgressGrad)"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="focus-progress-icon-box">
      <svg class="focus-center-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 底部圆弧/小托盘 -->
        <path d="M 32 72 C 42 77, 58 77, 68 72" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" fill="none" />
        <!-- 山丘/波浪 -->
        <path d="M 32 61 C 32 45, 42 37, 48 39 C 54 41, 58 49, 68 61 C 50 64, 50 64, 32 61 Z" fill="currentColor" />
        <!-- 右上角星星 -->
        <path d="M 64 28 Q 64 34 70 34 Q 64 34 64 40 Q 64 34 58 34 Q 64 34 64 28 Z" fill="currentColor" />
        <!-- 内部镂空星星，填充色与背景渐变尾端一致以实现融合 -->
        <path d="M 50 46 Q 50 50 54 50 Q 50 50 50 54 Q 50 50 46 50 Q 50 50 50 46 Z" fill="var(--card-bg, #ffffff)" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<style scoped>
.focus-progress-container {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.focus-progress-svg {
  width: 100%;
  height: 100%;
}

.focus-progress-bg {
  stroke: rgba(13, 148, 136, 0.08);
}

.focus-progress-active {
  transition: stroke-dashoffset 0.35s ease;
}

.focus-progress-icon-box {
  position: absolute;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d9488;
  background: transparent;
  border-radius: 50%;
}

.focus-center-icon {
  width: 24px;
  height: 24px;
}
</style>
