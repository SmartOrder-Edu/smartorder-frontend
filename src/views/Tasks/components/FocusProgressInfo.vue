<template>
  <div class="focus-info">
    <span class="focus-title">今日专注进度</span>
    <div class="focus-value-wrapper">
      <span class="focus-value">{{ progress }}</span>
      <span class="focus-percentage">%</span>
    </div>
    <span class="focus-target">目标 {{ completed }}/{{ total }} 任务</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
  completed: number
  total: number
}>()
</script>

<style scoped>
.focus-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

.focus-title {
  color: var(--text-primary-local);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
}

.focus-value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 1px;
  margin: 4px 0;
}

.focus-value {
  color: var(--text-primary-local);
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
}

.focus-percentage {
  color: var(--text-primary-local);
  font-size: 1.15rem;
  font-weight: 700;
}

.focus-target {
  color: var(--text-secondary-local);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.2;
}
</style>
