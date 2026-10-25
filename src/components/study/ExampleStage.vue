<template>
  <div class="example-stage">
    <div class="intro-block">
      <MarkdownRenderer :content="markdown" />
    </div>

    <div class="steps-block">
      <h3 class="block-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        动态步骤展开
      </h3>

      <div v-for="(s, i) in steps" :key="s.id" class="ex-step" :class="{ open: openIndex >= i }">
        <button class="ex-step-toggle" @click="toggle(i)">
          <span class="ex-step-no">{{ i + 1 }}</span>
          <span class="ex-step-label">{{ s.label }}</span>
          <svg v-if="openIndex >= i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="18,15 12,9 6,15"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6,9 12,15 18,9"/></svg>
        </button>
        <div v-if="openIndex >= i" class="ex-step-body">
          <MarkdownRenderer :content="s.markdown" />
        </div>
      </div>

      <div class="ex-actions">
        <button class="ex-next-btn" :disabled="openIndex >= steps.length - 1" @click="openIndex = Math.min(openIndex + 1, steps.length - 1)">
          展开下一步
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
        <span class="ex-progress">{{ Math.min(openIndex + 1, steps.length) }} / {{ steps.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import type { ExampleStep } from '@/types/study'

const props = defineProps<{
  markdown: string
  steps: ExampleStep[]
}>()

const openIndex = ref(0)

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? -1 : i
}

watch(() => props.steps, () => { openIndex.value = 0 })
</script>

<style scoped lang="scss">
.example-stage { display: flex; flex-direction: column; gap: 18px; }

.intro-block {
  background: #fff;
  border-radius: 14px;
  padding: 22px 28px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.steps-block {
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 14px;
  svg { color: #0ea5e9; }
}

.ex-step {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &.open { border-color: rgba(14, 165, 233, 0.4); }
}

.ex-step-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;

  .ex-step-no {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(14, 165, 233, 0.12);
    color: #0ea5e9;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ex-step-label { flex: 1; }
  svg { color: #94a3b8; }
}

.ex-step-body {
  padding: 0 14px 14px 46px;
  border-top: 1px dashed rgba(15, 23, 42, 0.06);
  padding-top: 12px;
}

.ex-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.ex-next-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #fff;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.ex-progress {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .intro-block, .steps-block { padding: 16px; }
  .ex-step-body { padding-left: 14px; }
}
</style>
