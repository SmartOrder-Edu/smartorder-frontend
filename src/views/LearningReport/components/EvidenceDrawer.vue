<template>
  <transition name="evidence">
    <aside
      v-if="open && content"
      class="evidence-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="算法依据"
    >
      <div class="evidence-backdrop" @click="$emit('close')"></div>
      <div class="evidence-panel">
        <header class="evidence-header">
          <div>
            <span class="evidence-eyebrow">算法依据</span>
            <h3>{{ content.title }}</h3>
          </div>
          <button class="evidence-close" aria-label="关闭算法依据" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div class="evidence-body">
          <article v-for="item in content.items" :key="item.label" class="evidence-item">
            <span class="item-label">{{ item.label }}</span>
            <p class="item-value">{{ item.value }}</p>
          </article>
        </div>
      </div>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import type { EvidenceSection } from '@/types/learningReport'

defineProps<{
  open: boolean
  content: EvidenceSection | null
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped lang="scss">
.evidence-drawer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.evidence-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 32, 51, 0.32);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.evidence-panel {
  position: relative;
  width: min(460px, 92vw);
  height: 100%;
  padding: 2rem 1.8rem;
  background: var(--panel-bg);
  border-left: 1px solid var(--border-color);
  box-shadow: -24px 0 60px rgba(15, 32, 51, 0.18);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.evidence-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  .evidence-eyebrow {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--primary-deep);
    text-transform: uppercase;
    margin-bottom: 0.4rem;
  }

  h3 {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-dark);
    line-height: 1.2;
  }
}

.evidence-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: var(--text-dark);
    background: rgba(11, 183, 170, 0.1);
  }
}

.evidence-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evidence-item {
  padding: 1rem 1.1rem;
  background: var(--bg-secondary);
  border-left: 3px solid var(--primary-light);
  border-radius: 0 var(--radius-sm, 8px) var(--radius-sm, 8px) 0;

  .item-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary-deep);
    margin-bottom: 0.3rem;
    letter-spacing: 0.05em;
  }

  .item-value {
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }
}

.evidence-enter-active,
.evidence-leave-active {
  transition: opacity 0.22s ease;

  .evidence-panel {
    transition: transform 0.26s var(--transition-spring, ease);
  }
}

.evidence-enter-from,
.evidence-leave-to {
  opacity: 0;

  .evidence-panel {
    transform: translateX(40px);
  }
}

@media (max-width: 760px) {
  .evidence-panel {
    width: 100%;
    padding: 1.5rem 1.2rem;
  }
}
</style>
