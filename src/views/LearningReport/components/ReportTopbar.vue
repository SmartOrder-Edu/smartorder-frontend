<template>
  <header class="report-topbar">
    <button class="back-button" @click="$emit('back')" aria-label="返回任务日程">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15,18 9,12 15,6" />
      </svg>
      返回任务日程
    </button>
    <div class="brand-mark">
      <img src="/logo.png" alt="知序智学" />
      <span>知序智学</span>
    </div>
    <div class="report-range">{{ range }}</div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  range: string
}>()

defineEmits<{
  back: []
}>()
</script>

<style scoped lang="scss">
.report-topbar {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
  width: min(1080px, 92vw);
  padding: 0.6rem 0.6rem 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  box-shadow: 0 12px 36px rgba(44, 70, 90, 0.08);
  animation: chrome-fade-in 0.6s ease both;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: var(--primary-deep);
    background: rgba(11, 183, 170, 0.08);
  }
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  color: var(--text-dark);
  font-size: 0.95rem;
  letter-spacing: 0.05em;

  img {
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }
}

.report-range {
  justify-self: end;
  padding: 0.45rem 0.9rem;
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-deep);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

@keyframes chrome-fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

html[data-theme='dark'] .report-topbar {
  background: rgba(23, 30, 42, 0.78);
}

@media (max-width: 760px) {
  .report-topbar {
    grid-template-columns: auto 1fr;
    gap: 0.8rem;
    padding: 0.5rem 0.8rem;
  }

  .brand-mark {
    display: none;
  }

  .report-range {
    font-size: 0.75rem;
    padding: 0.35rem 0.7rem;
  }
}
</style>
