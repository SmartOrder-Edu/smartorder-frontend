<template>
  <div class="page-navigation">
    <!-- 上一题 -->
    <button 
      type="button" 
      class="nav-btn page-nav-secondary" 
      :disabled="globalIndex === 1"
      @click="emit('prev')"
    >
      上一题
    </button>
    
    <!-- 下一题 -->
    <button 
      type="button" 
      class="nav-btn page-nav-primary" 
      :disabled="globalIndex === totalCount"
      @click="emit('next')"
    >
      下一题
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  globalIndex: number
  totalCount: number
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<style scoped>
.page-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  min-width: 128px;
  height: 54px;
  padding: 0 24px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  border: none;
}

/* 下一题 (Primary Action) */
.page-nav-primary {
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
  color: #ffffff;
  box-shadow: 0 8px 22px rgba(20, 184, 166, 0.22);
}

.page-nav-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #18c5b2, #10b4b3);
  box-shadow: 0 10px 24px rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}

.page-nav-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* 上一题 (Secondary Action) */
.page-nav-secondary {
  background: #ffffff;
  color: #344054;
  border: 1.5px solid #dbe3ec;
}

.page-nav-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.03);
}

.page-nav-secondary:active:not(:disabled) {
  transform: translateY(0);
}

/* 禁用状态 */
.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 深色模式适配 */
html[data-theme='dark'] .page-nav-primary {
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
  box-shadow: 0 8px 22px rgba(20, 184, 166, 0.15);
}

html[data-theme='dark'] .page-nav-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #18c5b2, #10b4b3);
  box-shadow: 0 10px 24px rgba(20, 184, 166, 0.25);
}

html[data-theme='dark'] .page-nav-secondary {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #334155;
}

html[data-theme='dark'] .page-nav-secondary:hover:not(:disabled) {
  background: #243049;
  border-color: #475569;
  color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
</style>
