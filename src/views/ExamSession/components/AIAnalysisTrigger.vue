<template>
  <div 
    class="ai-analysis-trigger" 
    :class="{ expanded }"
    @click="handleClick"
  >
    <div class="trigger-content">
      <!-- 闪烁 AI 星光 -->
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="trigger-sparkle-icon">
        <path d="M9.813 15.904L9 21l-.813-5.096L3.09 15 8.187 14.1 9 9l.813 5.1 5.097.9-5.097.904zM19.006 5.006L18.5 8l-.506-2.994L15 4.5l2.994-.506L18.5 1l.506 3.006L22 4.5l-2.994.506z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ expanded ? '收起本题 AI 深度辅导与解析' : '展开本题 AI 深度辅导与解析' }}</span>
      <!-- 展开折叠箭头 -->
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="trigger-arrow-icon">
        <polyline points="6 9 12 15 18 9" v-if="!expanded"></polyline>
        <polyline points="18 15 12 9 6 15" v-else></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  expanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const handleClick = () => {
  emit('toggle')
}
</script>

<style scoped>
.ai-analysis-trigger {
  margin-top: 20px;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 50%, #e0f2fe 100%);
  border: 1.5px solid #b3d4ff;
  color: #2563eb;
  font-weight: 750;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.04);
}

.ai-analysis-trigger::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: none;
}

.ai-analysis-trigger:hover::before {
  transform: translateX(100%);
  transition: transform 1.2s ease-in-out;
}

.ai-analysis-trigger:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #7dd3fc;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.12);
  transform: translateY(-2px);
  color: #0369a1;
}

.ai-analysis-trigger:active {
  transform: translateY(0);
}

.trigger-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 1;
}

.trigger-sparkle-icon {
  color: #0ea5e9;
  animation: shine 2s infinite ease-in-out;
}

.trigger-arrow-icon {
  transition: transform 0.2s ease;
}

@keyframes shine {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
    filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.6));
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .ai-analysis-trigger {
  background: linear-gradient(135deg, #1e293b 0%, #1e293b 50%, #0f172a 100%);
  border-color: #334155;
  color: #38bdf8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

html[data-theme='dark'] .ai-analysis-trigger:hover {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.2);
  color: #7dd3fc;
}

html[data-theme='dark'] .trigger-sparkle-icon {
  color: #38bdf8;
}
</style>
