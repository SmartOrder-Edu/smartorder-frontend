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
        <title>动态任务日程图标</title>
        <g class="task-schedule-board">
          <path class="task-binder-ring task-ring-1" d="M7 8H4" />
          <path class="task-binder-ring task-ring-2" d="M7 12H4" />
          <path class="task-binder-ring task-ring-3" d="M7 16H4" />
          <rect class="task-board-outline" x="7" y="3" width="14" height="18" rx="2" />
          <path class="task-schedule-line task-line-1" d="M11 8h6" />
          <path class="task-schedule-line task-line-2" d="M11 12h4" />
          <path class="task-schedule-line task-line-3" d="M11 16h6" />
          <path class="task-highlight task-highlight-1" d="M11 8h6" />
          <path class="task-highlight task-highlight-2" d="M11 12h4" />
          <path class="task-highlight task-highlight-3" d="M11 16h6" />
        </g>
      </g>

      <!-- Resources Icon - 书本翻页 -->
      <g v-else-if="type === 'resources'">
        <title>动态资源广场图标</title>
        <desc>立方体轻微悬浮，底层呼吸，结构线流动，星光闪烁。</desc>
        <g class="resource-platform">
          <path d="M3 16L12 20L21 16" />
        </g>
        <g class="resource-cube-float">
          <path class="resource-cube-outline" d="M12 4L19 7.5V13.5L12 17L5 13.5V7.5Z" />
          <g class="resource-detail-flow">
            <path class="resource-detail-line" d="M12 4V7.5" />
            <path class="resource-detail-line" d="M5 7.5L9 9.2" />
            <path class="resource-detail-line" d="M19 7.5L15 9.2" />
            <path class="resource-detail-line" d="M12 17V14" />
          </g>
        </g>
        <path
          class="resource-sparkle"
          d="M20 2Q20 4 22 4Q20 4 20 6Q20 4 18 4Q20 4 20 2"
          fill="currentColor"
          stroke="none"
        />
      </g>

      <!-- Knowledge Base Icon - 数据库 -->
      <g v-else-if="type === 'knowledge-base'">
        <title>动态知识库管理图标</title>
        <desc>数据库主体轻微悬浮，数据层流动，右侧星光闪烁。</desc>
        <g class="kb-root">
          <ellipse class="kb-top kb-outline" cx="10" cy="7" rx="7" ry="3" />
          <path
            class="kb-outline"
            d="M17 14 V17 C17 18.65 13.86 20 10 20 C6.14 20 3 18.65 3 17 V7"
          />
          <path
            class="kb-layer"
            d="M3 12 C3 13.65 6.14 15 10 15 C12.2 15 14.1 14.4 15.3 13.4"
          />
        </g>
        <circle
          class="kb-spark-glow"
          cx="18"
          cy="10.5"
          r="3.6"
          fill="currentColor"
          stroke="none"
        />
        <path
          class="kb-spark"
          d="M18 7 Q18 10.5 21.5 10.5 Q18 10.5 18 14 Q18 10.5 14.5 10.5 Q18 10.5 18 7 Z"
          fill="currentColor"
          stroke="none"
        />
      </g>

      <!-- Exam Icon - 练习测评 -->
      <g v-else-if="type === 'exam'">
        <title>动态练习评测图标</title>
        <g class="paper">
          <path
            class="spark"
            d="M4 1 Q4 4 7 4 Q4 4 4 7 Q4 4 1 4 Q4 4 4 1 Z"
            fill="currentColor"
            stroke="none"
          />
          <path
            class="outline"
            pathLength="100"
            d="M8 3h6l6 6v2"
          />
          <path
            class="outline outline-fold"
            pathLength="100"
            d="M14 3v4a2 2 0 0 0 2 2h4"
          />
          <path
            class="outline outline-body"
            pathLength="100"
            d="M11 21H6a2 2 0 0 1-2-2V8"
          />
          <path
            class="answer-line answer-line-1"
            pathLength="100"
            d="M8 11h6"
          />
          <path
            class="answer-line answer-line-2"
            pathLength="100"
            d="M8 15h3"
          />
          <circle
            class="badge-ring"
            cx="17"
            cy="17"
            r="4"
          />
          <g class="badge">
            <circle cx="17" cy="17" r="4" />
            <path
              class="check"
              pathLength="100"
              d="M15 17l1.5 1.5 2.5-3"
            />
          </g>
        </g>
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

.icon-resources svg,
.icon-tasks svg {
  overflow: visible;
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
.task-schedule-board {
  transform-box: fill-box;
  transform-origin: center;
  animation: task-schedule-board-float 3.2s ease-in-out infinite;
}

.task-board-outline {
  stroke-dasharray: 62;
  stroke-dashoffset: 62;
  animation: task-schedule-outline-draw 1.05s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.task-binder-ring {
  transform-box: fill-box;
  transform-origin: right center;
  stroke-dasharray: 4;
  stroke-dashoffset: 4;
  animation:
    task-schedule-ring-draw 0.38s ease-out forwards,
    task-schedule-ring-pulse 2.4s ease-in-out infinite;
}

.task-ring-1 {
  animation-delay: 0.15s, 0.9s;
}

.task-ring-2 {
  animation-delay: 0.28s, 1.08s;
}

.task-ring-3 {
  animation-delay: 0.41s, 1.26s;
}

.task-schedule-line {
  stroke-dasharray: 8;
  stroke-dashoffset: 8;
  animation:
    task-schedule-write 0.55s ease-out forwards,
    task-schedule-line-breathe 2.7s ease-in-out infinite;
}

.task-line-1 {
  animation-delay: 0.55s, 1.25s;
}

.task-line-2 {
  animation-delay: 0.72s, 1.45s;
}

.task-line-3 {
  animation-delay: 0.89s, 1.65s;
}

.task-highlight {
  opacity: 0;
  stroke-width: 2;
  stroke-dasharray: 1.4 7;
  stroke-dashoffset: 0;
  animation: task-schedule-scan 2.6s ease-in-out infinite;
}

.task-highlight-1 {
  animation-delay: 1.15s;
}

.task-highlight-2 {
  animation-delay: 1.42s;
}

.task-highlight-3 {
  animation-delay: 1.69s;
}

.animated-icon:hover .task-schedule-board,
.animated-icon:hover .task-binder-ring,
.animated-icon:hover .task-schedule-line,
.animated-icon:hover .task-highlight {
  animation-duration: 1.8s;
}

@keyframes task-schedule-board-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.45px); }
}

@keyframes task-schedule-outline-draw {
  0% { stroke-dashoffset: 62; opacity: 0.2; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}

@keyframes task-schedule-ring-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes task-schedule-ring-pulse {
  0%, 100% { transform: scaleX(1); opacity: 0.72; }
  50% { transform: scaleX(1.18); opacity: 1; }
}

@keyframes task-schedule-write {
  to { stroke-dashoffset: 0; }
}

@keyframes task-schedule-line-breathe {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}

@keyframes task-schedule-scan {
  0%, 14% { opacity: 0; stroke-dashoffset: 0; }
  30%, 55% { opacity: 0.7; }
  72%, 100% { opacity: 0; stroke-dashoffset: -8; }
}

@media (prefers-reduced-motion: reduce) {
  .task-schedule-board,
  .task-board-outline,
  .task-binder-ring,
  .task-schedule-line,
  .task-highlight {
    animation: none !important;
    transform: none !important;
    opacity: 1;
    stroke-dashoffset: 0;
  }

  .task-highlight {
    opacity: 0;
  }
}

/* ========== Resources 动画 ========== */
.resource-platform {
  transform-box: fill-box;
  transform-origin: center;
  animation: resource-platform-breathe 3.2s ease-in-out infinite;
}

.resource-cube-float {
  transform-box: fill-box;
  transform-origin: center;
  animation: resource-cube-float 3.2s ease-in-out infinite;
}

.resource-cube-outline,
.resource-detail-line {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: resource-line-draw 1.15s cubic-bezier(0.22, 0.8, 0.25, 1) forwards;
}

.resource-detail-line:nth-child(2) {
  animation-delay: 0.12s;
}

.resource-detail-line:nth-child(3) {
  animation-delay: 0.22s;
}

.resource-detail-line:nth-child(4) {
  animation-delay: 0.32s;
}

.resource-detail-flow {
  animation:
    resource-line-draw 1.15s cubic-bezier(0.22, 0.8, 0.25, 1) forwards,
    resource-detail-pulse 2.6s ease-in-out 1.2s infinite;
}

.resource-sparkle {
  fill: currentColor !important;
  stroke: none !important;
  transform-box: fill-box;
  transform-origin: center;
  animation: resource-sparkle-twinkle 1.8s ease-in-out infinite;
}

.animated-icon:hover .resource-cube-float {
  animation-duration: 1.7s;
}

.animated-icon:hover .resource-sparkle {
  animation-duration: 0.9s;
}

@keyframes resource-line-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes resource-cube-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.75px); }
}

@keyframes resource-platform-breathe {
  0%, 100% { transform: scaleX(1); opacity: 0.72; }
  50% { transform: scaleX(0.91) translateY(0.35px); opacity: 1; }
}

@keyframes resource-detail-pulse {
  0%, 100% { opacity: 0.62; }
  50% { opacity: 1; }
}

@keyframes resource-sparkle-twinkle {
  0%, 100% { transform: scale(0.72) rotate(0deg); opacity: 0.45; }
  45% { transform: scale(1.15) rotate(90deg); opacity: 1; }
  65% { transform: scale(0.92) rotate(135deg); opacity: 0.72; }
}

@media (prefers-reduced-motion: reduce) {
  .resource-platform,
  .resource-cube-float,
  .resource-cube-outline,
  .resource-detail-line,
  .resource-detail-flow,
  .resource-sparkle {
    animation: none !important;
    stroke-dashoffset: 0;
  }
}

/* ========== Knowledge Base 动画 ========== */
.kb-root {
  transform-origin: 10px 13px;
  animation: kb-float 3.6s ease-in-out infinite;
}

.kb-top {
  transform-origin: 10px 7px;
  animation: kb-top-pulse 3.6s ease-in-out infinite;
}

.kb-outline {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: kb-draw 1.2s ease-out forwards;
}

.kb-layer {
  stroke-dasharray: 3 2;
  animation: kb-flow 2.2s linear infinite;
}

.kb-spark-glow {
  fill: currentColor !important;
  stroke: none !important;
  opacity: 0;
  transform-origin: 18px 10.5px;
  animation: kb-glow 2.4s ease-in-out infinite;
}

.kb-spark {
  fill: currentColor !important;
  stroke: none !important;
  transform-origin: 18px 10.5px;
  animation: kb-sparkle 2.4s ease-in-out infinite;
}

.animated-icon:hover .kb-root,
.animated-icon:hover .kb-top {
  animation-duration: 1.8s;
}

.animated-icon:hover .kb-layer {
  animation-duration: 1.1s;
}

.animated-icon:hover .kb-spark,
.animated-icon:hover .kb-spark-glow {
  animation-duration: 1.2s;
}

@keyframes kb-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.55px); }
}

@keyframes kb-top-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.035, 1.08); opacity: 0.82; }
}

@keyframes kb-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes kb-flow {
  to { stroke-dashoffset: -10; }
}

@keyframes kb-glow {
  0%, 100% { opacity: 0; transform: scale(0.7); }
  45%, 55% { opacity: 0.18; transform: scale(1.35); }
}

@keyframes kb-sparkle {
  0%, 100% { transform: rotate(0deg) scale(0.86); opacity: 0.7; }
  50% { transform: rotate(90deg) scale(1.12); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .kb-root,
  .kb-top,
  .kb-outline,
  .kb-layer,
  .kb-spark,
  .kb-spark-glow {
    animation: none !important;
  }

  .kb-outline {
    stroke-dashoffset: 0;
  }

  .kb-spark-glow {
    opacity: 0;
  }
}

/* ========== Exam 动画 ========== */
.paper,
.spark,
.badge,
.badge-ring {
  transform-box: fill-box;
  transform-origin: center;
}

.paper {
  animation: paper-float 3.2s ease-in-out infinite;
}

.spark {
  fill: currentColor !important;
  stroke: none !important;
  animation: spark-twinkle 2.1s ease-in-out infinite;
}

.outline {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: outline-draw 1.05s ease-out forwards;
}

.outline-fold {
  animation-delay: 0.12s;
}

.outline-body {
  animation-delay: 0.22s;
}

.answer-line {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
  animation: answer-write 3s ease-in-out infinite;
}

.answer-line-1 {
  animation-delay: 0.45s;
}

.answer-line-2 {
  animation-delay: 0.9s;
}

.badge {
  animation: badge-pulse 2.6s ease-in-out infinite;
}

.badge-ring {
  opacity: 0;
  animation: badge-ripple 2.6s ease-out infinite;
}

.check {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
  animation: check-draw 2.6s ease-in-out infinite;
}

.animated-icon:hover .paper {
  animation-duration: 1.9s;
}

.animated-icon:hover .answer-line {
  animation-duration: 2s;
}

.animated-icon:hover .spark {
  animation-duration: 1.25s;
}

.animated-icon:hover .badge,
.animated-icon:hover .badge-ring,
.animated-icon:hover .check {
  animation-duration: 1.7s;
}

@keyframes paper-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.8px); }
}

@keyframes outline-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes answer-write {
  0%, 12% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  24%, 68% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  88%, 100% {
    stroke-dashoffset: 0;
    opacity: 0.58;
  }
}

@keyframes spark-twinkle {
  0%, 100% {
    transform: scale(0.92) rotate(0deg);
    opacity: 0.72;
  }
  38% {
    transform: scale(1.1) rotate(10deg);
    opacity: 1;
  }
  66% {
    transform: scale(0.96) rotate(-7deg);
    opacity: 0.82;
  }
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  42% { transform: scale(1.07); }
  64% { transform: scale(0.98); }
}

@keyframes badge-ripple {
  0% {
    transform: scale(0.86);
    opacity: 0.28;
  }
  52% {
    transform: scale(1.35);
    opacity: 0;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

@keyframes check-draw {
  0%, 17% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  34%, 76% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0.9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .paper,
  .spark,
  .badge,
  .badge-ring,
  .answer-line,
  .check {
    animation: none !important;
  }

  .outline,
  .answer-line,
  .check {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  .badge-ring {
    opacity: 0;
  }
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
