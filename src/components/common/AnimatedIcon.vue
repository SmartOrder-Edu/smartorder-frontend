<template>
  <div class="animated-icon" :class="[`icon-${type}`, { active: isActive }]">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Dashboard Icon - 动态网格 -->
      <g v-if="type === 'dashboard'">
        <rect class="anim-rect-1" x="3" y="3" width="7" height="7" rx="1"/>
        <rect class="anim-rect-2" x="14" y="3" width="7" height="7" rx="1"/>
        <rect class="anim-rect-3" x="14" y="14" width="7" height="7" rx="1"/>
        <rect class="anim-rect-4" x="3" y="14" width="7" height="7" rx="1"/>
        <circle class="anim-dot" cx="6.5" cy="6.5" r="1.5" fill="currentColor"/>
        <circle class="anim-dot" cx="17.5" cy="6.5" r="1.5" fill="currentColor" style="animation-delay: 0.2s"/>
        <circle class="anim-dot" cx="17.5" cy="17.5" r="1.5" fill="currentColor" style="animation-delay: 0.4s"/>
        <circle class="anim-dot" cx="6.5" cy="17.5" r="1.5" fill="currentColor" style="animation-delay: 0.6s"/>
      </g>

      <!-- AI Tutor Icon - 聊天机器人 -->
      <g v-else-if="type === 'ai-tutor'">
        <circle class="anim-face" cx="12" cy="12" r="10"/>
        <circle class="anim-eye" cx="9" cy="10" r="1.5" fill="currentColor"/>
        <circle class="anim-eye" cx="15" cy="10" r="1.5" fill="currentColor" style="animation-delay: 0.1s"/>
        <path class="anim-smile" d="M8 15s1.5 2 4 2 4-2 4-2"/>
        <path class="anim-spark" d="M19 4l1 1m0-1l-1 1" stroke-width="2"/>
        <path class="anim-spark" d="M5 19l1 1m0-1l-1 1" stroke-width="2" style="animation-delay: 0.3s"/>
      </g>

      <!-- Daily Plan Icon - 动态日历 -->
      <g v-else-if="type === 'daily-plan'">
        <rect class="anim-calendar" x="3" y="4" width="18" height="18" rx="2"/>
        <path class="anim-line-top" d="M16 2v4M8 2v4"/>
        <path class="anim-line" d="M3 10h18"/>
        <circle class="anim-check" cx="8" cy="15" r="1" fill="currentColor"/>
        <circle class="anim-check" cx="12" cy="15" r="1" fill="currentColor" style="animation-delay: 0.2s"/>
        <circle class="anim-check" cx="16" cy="15" r="1" fill="currentColor" style="animation-delay: 0.4s"/>
      </g>

      <!-- Messages Icon - 信封动画 -->
      <g v-else-if="type === 'messages'">
        <path class="anim-envelope" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline class="anim-flap" points="22,6 12,13 2,6"/>
        <circle class="anim-msg-dot" cx="18" cy="6" r="3" fill="currentColor"/>
      </g>

      <!-- Tasks Icon - 任务勾选 -->
      <g v-else-if="type === 'tasks'">
        <path class="anim-clipboard" d="M9 11l3 3L22 4"/>
        <path class="anim-clip" d="M9 11l3 3-2 8"/>
        <rect class="anim-board" x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.3"/>
        <circle class="anim-task-dot" cx="16" cy="8" r="1" fill="currentColor" opacity="0.5"/>
        <circle class="anim-task-dot" cx="16" cy="12" r="1" fill="currentColor" opacity="0.5" style="animation-delay: 0.2s"/>
        <circle class="anim-task-dot" cx="16" cy="16" r="1" fill="currentColor" opacity="0.5" style="animation-delay: 0.4s"/>
      </g>

      <!-- Resources Icon - 书本翻页 -->
      <g v-else-if="type === 'resources'">
        <path class="anim-book-back" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        <path class="anim-page-1" d="M12 6v12"/>
        <path class="anim-page-2" d="M16 6v12"/>
        <path class="anim-sparkle" d="M2 7l1 1m0-1l-1 1" stroke-width="1.5"/>
      </g>

      <!-- Knowledge Base Icon - 数据库 -->
      <g v-else-if="type === 'knowledge-base'">
        <ellipse class="anim-ell-1" cx="12" cy="5" rx="8" ry="3"/>
        <path class="anim-stack-1" d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/>
        <path class="anim-stack-2" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>
        <circle class="anim-data-dot" cx="8" cy="14" r="1" fill="currentColor"/>
        <circle class="anim-data-dot" cx="12" cy="16" r="1" fill="currentColor" style="animation-delay: 0.2s"/>
        <circle class="anim-data-dot" cx="16" cy="14" r="1" fill="currentColor" style="animation-delay: 0.4s"/>
      </g>

      <!-- Exam Icon - 练习测评 -->
      <g v-else-if="type === 'exam'">
        <path class="anim-paper" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline class="anim-fold" points="14 2 14 8 20 8"/>
        <path class="anim-write" d="M9 15l2 2 4-4"/>
        <line class="anim-score" x1="9" y1="12" x2="15" y2="12"/>
        <circle class="anim-star" cx="18" cy="5" r="0.8" fill="currentColor"/>
      </g>

      <!-- Profile Icon - 用户画像 -->
      <g v-else-if="type === 'profile'">
        <circle class="anim-head" cx="12" cy="7" r="4"/>
        <path class="anim-body" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle class="anim-glow" cx="12" cy="7" r="5" stroke-opacity="0.3"/>
        <path class="anim-ring" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-opacity="0.2"/>
      </g>

      <!-- Cloud Drive Icon - 云盘 -->
      <g v-else-if="type === 'cloud-drive'">
        <path class="anim-cloud" d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
        <path class="anim-arrow" d="M12 12v-3M12 12l-2-2M12 12l2-2"/>
        <circle class="anim-rain-1" cx="9" cy="15" r="1" fill="currentColor"/>
        <circle class="anim-rain-2" cx="15" cy="16" r="1" fill="currentColor"/>
      </g>

      <!-- Spaces Icon - 学习空间 -->
      <g v-else-if="type === 'spaces'">
        <rect class="anim-space-1" x="2" y="3" width="8" height="6" rx="1"/>
        <rect class="anim-space-2" x="14" y="3" width="8" height="6" rx="1"/>
        <rect class="anim-space-3" x="2" y="15" width="8" height="6" rx="1"/>
        <rect class="anim-space-4" x="14" y="15" width="8" height="6" rx="1"/>
        <circle class="anim-connect" cx="12" cy="12" r="2" fill="currentColor"/>
      </g>
    </svg>

    <!-- 激活状态光晕 -->
    <div v-if="isActive" class="icon-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: string
  isActive?: boolean
}>()
</script>

<style scoped>
.animated-icon {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animated-icon svg {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  stroke: currentColor !important;
}

/* 确保SVG元素可见 */
.animated-icon svg * {
  stroke: currentColor !important;
  fill: none !important;
}

.animated-icon svg circle[fill="currentColor"] {
  fill: currentColor !important;
}

/* 激活状态 */
.animated-icon.active svg {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
  stroke: white !important;
}

.animated-icon.active svg * {
  stroke: white !important;
}

.animated-icon.active svg circle[fill="currentColor"] {
  fill: white !important;
}

.icon-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ========== Dashboard 动画 ========== */
.anim-rect-1, .anim-rect-2, .anim-rect-3, .anim-rect-4 {
  animation: rect-pulse 2s ease-in-out infinite;
}
.anim-rect-2 { animation-delay: 0.1s; }
.anim-rect-3 { animation-delay: 0.2s; }
.anim-rect-4 { animation-delay: 0.3s; }

@keyframes rect-pulse {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.5; }
}

.anim-dot {
  animation: dot-blink 1.5s ease-in-out infinite;
}

@keyframes dot-blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* ========== AI Tutor 动画 ========== */
.anim-face {
  animation: face-float 3s ease-in-out infinite;
}

@keyframes face-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

.anim-eye {
  animation: eye-blink 3s ease-in-out infinite;
}

@keyframes eye-blink {
  0%, 45%, 55%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.1); }
}

.anim-smile {
  animation: smile-wave 2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes smile-wave {
  0%, 100% { d: path('M8 15s1.5 2 4 2 4-2 4-2'); }
  50% { d: path('M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5'); }
}

.anim-spark {
  animation: spark-spin 2s linear infinite;
  transform-origin: center;
}

@keyframes spark-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== Daily Plan 动画 ========== */
.anim-calendar {
  animation: calendar-shake 3s ease-in-out infinite;
}

@keyframes calendar-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-0.5deg); }
  75% { transform: rotate(0.5deg); }
}

.anim-line-top {
  animation: line-bounce 2s ease-in-out infinite;
  transform-origin: top;
}

@keyframes line-bounce {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.1); }
}

.anim-check {
  animation: check-pop 1.5s ease-in-out infinite;
}

@keyframes check-pop {
  0%, 100% { r: 1; }
  50% { r: 1.5; }
}

/* ========== Messages 动画 ========== */
.anim-envelope {
  animation: envelope-float 3s ease-in-out infinite;
}

@keyframes envelope-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.anim-flap {
  animation: flap-open 3s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes flap-open {
  0%, 40%, 100% { transform: translateY(0); }
  20% { transform: translateY(-3px); }
}

.anim-msg-dot {
  animation: msg-bounce 2s ease-in-out infinite;
}

@keyframes msg-bounce {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* ========== Tasks 动画 ========== */
.anim-clipboard {
  animation: clip-draw 2s ease-in-out infinite;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
}

@keyframes clip-draw {
  0% { stroke-dashoffset: 20; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -20; }
}

.anim-clip {
  animation: clip-move 2s ease-in-out infinite;
  stroke-dasharray: 30;
}

@keyframes clip-move {
  0% { stroke-dashoffset: 30; opacity: 0; }
  50% { opacity: 1; }
  100% { stroke-dashoffset: -30; opacity: 0; }
}

.anim-task-dot {
  animation: task-fade 2s ease-in-out infinite;
}

@keyframes task-fade {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== Resources 动画 ========== */
.anim-book-back {
  animation: book-open 4s ease-in-out infinite;
}

@keyframes book-open {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(5deg); }
}

.anim-page-1, .anim-page-2 {
  animation: page-turn 3s ease-in-out infinite;
  transform-origin: left;
}

.anim-page-2 {
  animation-delay: 0.15s;
}

@keyframes page-turn {
  0%, 40%, 100% { transform: scaleX(1); opacity: 1; }
  20% { transform: scaleX(0.8); opacity: 0.7; }
}

/* ========== Knowledge Base 动画 ========== */
.anim-ell-1 {
  animation: ell-pulse 2s ease-in-out infinite;
}

@keyframes ell-pulse {
  0%, 100% { ry: 3; }
  50% { ry: 2.5; }
}

.anim-stack-1, .anim-stack-2 {
  animation: stack-rise 2s ease-in-out infinite;
}

@keyframes stack-rise {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.5; }
}

.anim-data-dot {
  animation: data-flow 1.5s ease-in-out infinite;
}

@keyframes data-flow {
  0%, 100% { cy: 14; opacity: 1; }
  50% { cy: 12; opacity: 0.5; }
}

/* ========== Exam 动画 ========== */
.anim-paper {
  animation: paper-shake 3s ease-in-out infinite;
}

@keyframes paper-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-1deg); }
  75% { transform: rotate(1deg); }
}

.anim-fold {
  animation: fold-blink 3s ease-in-out infinite;
  transform-origin: top left;
}

@keyframes fold-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.anim-write {
  stroke-dasharray: 15;
  stroke-dashoffset: 15;
  animation: write-draw 2s ease-in-out infinite;
}

@keyframes write-draw {
  0% { stroke-dashoffset: 15; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -15; }
}

.anim-score {
  animation: score-appear 2s ease-in-out infinite;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
}

@keyframes score-appear {
  0% { stroke-dashoffset: 20; opacity: 0; }
  50% { opacity: 1; }
  100% { stroke-dashoffset: -20; opacity: 0; }
}

.anim-star {
  animation: star-spin 3s linear infinite;
}

@keyframes star-spin {
  from { transform: rotate(0deg) scale(0); }
  50% { transform: rotate(180deg) scale(1); }
  to { transform: rotate(360deg) scale(0); }
}

/* ========== Profile 动画 ========== */
.anim-head {
  animation: head-bob 3s ease-in-out infinite;
}

@keyframes head-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

.anim-body {
  animation: body-breathe 3s ease-in-out infinite;
}

@keyframes body-breathe {
  0%, 100% { stroke-width: 1.5; }
  50% { stroke-width: 2; }
}

.anim-glow {
  animation: glow-expand 2s ease-in-out infinite;
}

@keyframes glow-expand {
  0%, 100% { r: 5; opacity: 0.3; }
  50% { r: 6; opacity: 0.5; }
}

.anim-ring {
  animation: ring-pulse 2s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { stroke-opacity: 0.2; }
  50% { stroke-opacity: 0.4; }
}

/* ========== Cloud Drive 动画 ========== */
.anim-cloud {
  animation: cloud-float 4s ease-in-out infinite;
}

@keyframes cloud-float {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

.anim-arrow {
  animation: arrow-bounce 2s ease-in-out infinite;
  stroke-dasharray: 10;
  stroke-dashoffset: 10;
}

@keyframes arrow-bounce {
  0% { stroke-dashoffset: 10; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -10; }
}

.anim-rain-1, .anim-rain-2 {
  animation: rain-fall 2s ease-in-out infinite;
}

.anim-rain-2 {
  animation-delay: 0.3s;
}

@keyframes rain-fall {
  0% { transform: translateY(-2px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(2px); opacity: 0; }
}

/* ========== Spaces 动画 ========== */
.anim-space-1, .anim-space-2, .anim-space-3, .anim-space-4 {
  animation: space-pulse 3s ease-in-out infinite;
}

.anim-space-2 { animation-delay: 0.2s; }
.anim-space-3 { animation-delay: 0.4s; }
.anim-space-4 { animation-delay: 0.6s; }

@keyframes space-pulse {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.5; }
}

.anim-connect {
  animation: connect-pulse 2s ease-in-out infinite;
}

@keyframes connect-pulse {
  0%, 100% { r: 2; opacity: 1; }
  50% { r: 2.5; opacity: 0.7; }
}

/* 悬停效果 */
.animated-icon:hover svg {
  transform: scale(1.1);
}

.animated-icon.active:hover svg {
  transform: scale(1.05);
}
</style>
