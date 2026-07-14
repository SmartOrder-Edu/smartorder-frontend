<template>
  <div 
    class="option-item"
    :class="{
      selected: selected && !correct && !wrong,
      correct: correct,
      incorrect: wrong,
      disabled: disabled
    }"
    @click="handleClick"
  >
    <!-- 左侧字母圆圈 -->
    <span class="option-letter">{{ label }}</span>
    <!-- 中间文本 -->
    <span class="option-text" v-html="content"></span>
    <!-- 右侧勾叉 -->
    <div class="option-status-icon" v-if="correct || wrong">
      <!-- 勾 -->
      <svg v-if="correct" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" class="svg-icon svg-correct">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <!-- 叉 -->
      <svg v-if="wrong" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" class="svg-icon svg-wrong">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  content: string
  selected: boolean
  correct: boolean
  wrong: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'select', label: string): void
}>()

const handleClick = () => {
  if (props.disabled) return
  emit('select', props.label)
}
</script>

<style scoped>
.option-item {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 68px;
  padding: 16px 24px;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    background-color 180ms ease;
  cursor: pointer;
  position: relative;
  user-select: none;
  margin-bottom: 14px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.01);
}

.option-item:last-child {
  margin-bottom: 0;
}

/* Hover 状态 */
.option-item:not(.disabled):hover {
  border-color: rgba(20, 184, 166, 0.45);
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.08);
  transform: translateY(-2px);
}

.option-letter {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #475569;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
  transition: all 180ms ease;
}

.option-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.7;
  color: #182230;
  word-break: break-word;
  transition: color 0.18s ease;
  font-weight: 550;
}

.option-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
}

.svg-icon {
  animation: pop-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 选中状态 (Selected) */
.option-item.selected {
  background: #f0f9ff;
  border-color: #7dd3fc;
  box-shadow: 0 6px 16px rgba(125, 211, 252, 0.18);
}

.option-item.selected .option-letter {
  background: #0ea5e9;
  color: #ffffff;
}

.option-item.selected .option-text {
  color: #0369a1;
  font-weight: 700;
}

/* 正确答案状态 (Correct) */
.option-item.correct {
  background: #f0fdf4;
  border-color: #34c759;
  box-shadow: 0 6px 16px rgba(52, 199, 89, 0.15);
}

.option-item.correct .option-letter {
  background: #22c55e;
  color: #ffffff;
}

.option-item.correct .option-text {
  color: #15803d;
  font-weight: 700;
}

.svg-correct {
  color: #22c55e;
}

/* 错误答案状态 (Incorrect) */
.option-item.incorrect {
  background: #fef2f2;
  border-color: #f87171;
  box-shadow: 0 6px 16px rgba(248, 113, 113, 0.15);
}

.option-item.incorrect .option-letter {
  background: #ef4444;
  color: #ffffff;
}

.option-item.incorrect .option-text {
  color: #b91c1c;
  font-weight: 700;
}

.svg-wrong {
  color: #ef4444;
}

/* 禁用状态 */
.option-item.disabled {
  cursor: default;
}

@keyframes pop-in {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .option-item {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

html[data-theme='dark'] .option-letter {
  background: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .option-text {
  color: #cbd5e1;
}

html[data-theme='dark'] .option-item:not(.disabled):hover {
  border-color: rgba(20, 184, 166, 0.5);
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.15);
  background: #243049;
}

html[data-theme='dark'] .option-item.selected {
  background: rgba(14, 165, 233, 0.15);
  border-color: #38bdf8;
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.15);
}

html[data-theme='dark'] .option-item.selected .option-text {
  color: #38bdf8;
}

html[data-theme='dark'] .option-item.correct {
  background: rgba(34, 197, 94, 0.15);
  border-color: #4ade80;
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.15);
}

html[data-theme='dark'] .option-item.correct .option-text {
  color: #4ade80;
}

html[data-theme='dark'] .option-item.incorrect {
  background: rgba(239, 68, 68, 0.15);
  border-color: #f87171;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.15);
}

html[data-theme='dark'] .option-item.incorrect .option-text {
  color: #f87171;
}
</style>
