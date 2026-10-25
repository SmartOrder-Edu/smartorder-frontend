<template>
  <article class="stat-card focus-card">
    <FocusProgressInfo
      :progress="progress"
      :completed="completed"
      :total="total"
    />
    <FocusProgressChart :progress="progress" />
  </article>
</template>

<script setup lang="ts">
import FocusProgressInfo from './FocusProgressInfo.vue'
import FocusProgressChart from './FocusProgressChart.vue'

defineProps<{
  progress: number
  completed: number
  total: number
}>()
</script>

<style scoped>
.focus-card {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px !important;
  background: var(--card-bg);
}
</style>
