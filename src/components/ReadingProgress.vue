<template>
  <div class="reading-progress-bar" :style="{ width: progressPercent + '%' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progressPercent = ref(0)

function updateProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (docHeight <= 0) {
    progressPercent.value = 0
    return
  }
  progressPercent.value = Math.min(100, Math.round((scrollTop / docHeight) * 100))
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>

<style scoped>
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #0a9e94, #0bb7aa, #38d9a9);
  z-index: 2000;
  transition: width 0.15s ease-out;
  border-radius: 0 2px 0 0;
  pointer-events: none;
}
</style>
