<template>
  <article class="metric-hero">
    <div v-if="icon" class="metric-icon" aria-hidden="true">
      <component :is="icon" :size="22" />
    </div>
    <div class="metric-body">
      <span class="metric-value">{{ value }}</span>
      <span class="metric-label">{{ label }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  value: string
  label: string
  icon?: Component
}>()
</script>

<style scoped lang="scss">
.metric-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1.4rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 30px rgba(44, 70, 90, 0.06);
  overflow: hidden;
  transition: transform 0.3s var(--transition-spring, ease), box-shadow 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: var(--gradient-primary);
    transform: scaleX(0.4);
    transform-origin: left;
    transition: transform 0.4s var(--transition-spring, ease);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 42px rgba(11, 183, 170, 0.12);

    &::before {
      transform: scaleX(1);
    }
  }
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.16), rgba(6, 182, 212, 0.1));
  color: var(--primary-color);
}

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-value {
  font-size: clamp(1.6rem, 2.2vw, 2rem);
  font-weight: 800;
  line-height: 1.1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.metric-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
