<template>
  <div class="algorithm-explainer" :class="{ expanded }">
    <button
      class="explainer-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="explainer-icon" aria-hidden="true">
        <component :is="SparklesIconComp" :size="14" />
      </span>
      <span class="explainer-label">为什么这么判断？</span>
      <svg class="explainer-chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>

    <transition name="expand">
      <div v-if="expanded" class="explainer-content">
        <p v-if="hint" class="explainer-hint">{{ hint }}</p>
        <article v-for="item in evidence.items" :key="item.label" class="explainer-item">
          <span class="item-label">{{ item.label }}</span>
          <p class="item-value">{{ item.value }}</p>
        </article>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getIcon } from '@/assets/icons/create'
import type { EvidenceSection } from '@/types/learningReport'

defineProps<{
  evidence: EvidenceSection
  /** 一句话引导，如「掌握度评估基于以下信号」 */
  hint?: string
}>()

const expanded = ref(false)
const SparklesIconComp = getIcon('SparklesIcon')
</script>

<style scoped lang="scss">
.algorithm-explainer {
  margin-top: 1rem;
  border: 1px dashed var(--border-color-strong, #cbd5e1);
  border-radius: 12px;
  background: rgba(11, 183, 170, 0.03);
  overflow: hidden;
  transition: border-color 0.25s ease, background 0.25s ease;

  &.expanded {
    border-style: solid;
    border-color: var(--border-primary);
    background: rgba(11, 183, 170, 0.06);
  }
}

.explainer-toggle {
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary-deep);
  }
}

.explainer-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.18), rgba(6, 182, 212, 0.1));
  color: var(--primary-color);
}

.explainer-label {
  flex: 1;
}

.explainer-chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.25s var(--transition-spring, ease);

  &.rotated {
    transform: rotate(180deg);
  }
}

.explainer-content {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.explainer-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0 0 0.2rem;
  line-height: 1.5;
}

.explainer-item {
  padding: 0.7rem 0.9rem;
  background: var(--panel-bg);
  border-radius: 8px;
  border: 1px solid var(--border-soft);

  .item-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--primary-deep);
    margin-bottom: 0.25rem;
    letter-spacing: 0.04em;
  }

  .item-value {
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0;
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
