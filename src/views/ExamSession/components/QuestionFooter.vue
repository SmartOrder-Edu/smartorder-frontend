<template>
  <div class="question-tools">
    <!-- 标记疑问 -->
    <button 
      type="button" 
      class="tool-button flag-btn" 
      :class="{ active: flagged }"
      @click="emit('toggle-flag')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" :fill="flagged ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" class="tool-icon">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
        <line x1="4" y1="22" x2="4" y2="15"></line>
      </svg>
      <span>标记疑问</span>
    </button>
    
    <!-- 收藏 -->
    <button 
      type="button" 
      class="tool-button fav-btn"
      :class="{ active: favorited }"
      @click="emit('toggle-favorite')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" :fill="favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" class="tool-icon">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>收藏</span>
    </button>
    
    <!-- 查看知识点 -->
    <button 
      type="button" 
      class="tool-button kp-btn"
      @click="emit('show-kp')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="tool-icon">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
      <span>查看知识点</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  globalIndex: number
  flagged: boolean
  favorited: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-flag'): void
  (e: 'toggle-favorite'): void
  (e: 'show-kp'): void
}>()
</script>

<style scoped>
.question-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tool-button {
  height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 200ms ease;
  user-select: none;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.01);
}

.tool-button:hover {
  background: #f8fafc;
  border-color: rgba(20, 184, 166, 0.4);
  color: #0f9f91;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.06);
}

.tool-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.tool-button:hover .tool-icon {
  transform: scale(1.08);
}

/* 标记激活状态 */
.flag-btn.active {
  background: #fef2f2;
  border-color: #fecdd3;
  color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.06);
}

.flag-btn.active:hover {
  background: #ffe4e6;
  border-color: #fda4af;
  color: #e11d48;
}

/* 收藏激活状态 */
.fav-btn.active {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.06);
}

.fav-btn.active:hover {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #b45309;
}

/* 深色模式适配 */
html[data-theme='dark'] .tool-button {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .tool-button:hover {
  background: #243049;
  border-color: rgba(20, 184, 166, 0.4);
  color: #2dd4bf;
}

html[data-theme='dark'] .flag-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

html[data-theme='dark'] .flag-btn.active:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

html[data-theme='dark'] .fav-btn.active {
  background: rgba(217, 119, 6, 0.15);
  border-color: rgba(217, 119, 6, 0.25);
  color: #fbbf24;
}

html[data-theme='dark'] .fav-btn.active:hover {
  background: rgba(217, 119, 6, 0.25);
  border-color: rgba(217, 119, 6, 0.35);
  color: #fcd34d;
}
</style>
