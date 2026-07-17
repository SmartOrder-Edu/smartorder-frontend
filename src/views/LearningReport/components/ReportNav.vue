<template>
  <div class="report-chrome-right">
    <div class="section-counter" aria-live="polite">
      <span>{{ String(activeSection + 1).padStart(2, '0') }}</span>
      <strong>/ {{ String(sections.length).padStart(2, '0') }}</strong>
    </div>

    <nav class="section-nav" aria-label="学习报告分页导航">
      <button
        v-for="(section, index) in sections"
        :key="section.id"
        class="section-nav-item"
        :class="{ active: activeSection === index }"
        @click="$emit('navigate', index)"
      >
        <span class="section-dot"></span>
        <span class="section-title">{{ section.label }}</span>
      </button>
    </nav>

    <div class="page-controls">
      <button
        :disabled="activeSection === 0"
        aria-label="上一屏"
        @click="$emit('prev')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18,15 12,9 6,15" />
        </svg>
      </button>
      <button
        :disabled="activeSection === sections.length - 1"
        aria-label="下一屏"
        @click="$emit('next')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SectionMeta {
  id: string
  label: string
}

defineProps<{
  sections: SectionMeta[]
  activeSection: number
}>()

defineEmits<{
  navigate: [index: number]
  prev: []
  next: []
}>()
</script>

<style scoped lang="scss">
.report-chrome-right {
  animation: chrome-fade-in 0.6s ease 0.1s both;
}

.section-counter {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 40;
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--text-muted);

  span {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--primary-deep);
  }

  strong {
    font-size: 0.9rem;
    font-weight: 600;
  }
}

.section-nav {
  position: fixed;
  top: 50%;
  right: 1.6rem;
  transform: translateY(-50%);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.section-nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;

  .section-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--border-color-strong, #cbd5e1);
    transition: all 0.25s ease;
  }

  .section-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    opacity: 0;
    transform: translateX(6px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    white-space: nowrap;
  }

  &:hover {
    .section-dot {
      background: var(--primary-light);
    }
    .section-title {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.active {
    .section-dot {
      width: 4px;
      height: 24px;
      border-radius: 999px;
      background: var(--gradient-primary);
      box-shadow: 0 0 12px rgba(11, 183, 170, 0.4);
    }
    .section-title {
      opacity: 1;
      transform: translateX(0);
      color: var(--primary-deep);
    }
  }
}

.page-controls {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 40;
  display: flex;
  gap: 0.6rem;

  button {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.74);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover:not(:disabled) {
      color: var(--primary-deep);
      border-color: var(--border-primary);
      background: rgba(11, 183, 170, 0.08);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

html[data-theme='dark'] .page-controls button {
  background: rgba(23, 30, 42, 0.74);
}

@keyframes chrome-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 760px) {
  .section-counter,
  .section-nav,
  .page-controls {
    display: none;
  }
}
</style>
