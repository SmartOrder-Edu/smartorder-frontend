<template>
  <section class="study-canvas">
    <!-- 步骤标题条 -->
    <header class="canvas-header" v-if="stepStore.currentScriptStep">
      <div class="header-left">
        <span class="phase-tag" :class="stepStore.currentScriptStep.phase">
          {{ phaseLabel(stepStore.currentScriptStep.phase) }}
        </span>
        <div class="header-titles">
          <h2>{{ stepStore.currentScriptStep.title }}</h2>
          <p>{{ stepStore.currentScriptStep.subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <button class="nav-btn" :disabled="stepStore.currentStepIndex === 0" @click="stepStore.prevStep()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15,18 9,12 15,6"/></svg>
          上一步
        </button>
        <button class="nav-btn primary" @click="stepStore.nextStep()" :disabled="stepStore.currentStepIndex >= stepStore.scriptSteps.length - 1">
          下一步
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>
    </header>

    <!-- 画布主体 -->
    <div class="canvas-body" v-if="stepStore.canvasContent">
      <!-- Agent 临时补充讲解条 -->
      <div class="agent-note" v-if="stepStore.canvasContent.agentNote">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>{{ stepStore.canvasContent.agentNote }}</span>
      </div>

      <!-- 渲染分支 -->
      <template v-if="stepStore.canvasContent.type === 'example'">
        <ExampleStage
          :markdown="stepStore.canvasContent.markdown"
          :steps="stepStore.canvasContent.exampleSteps || []"
        />
      </template>

      <template v-else-if="stepStore.canvasContent.type === 'practice' || stepStore.canvasContent.type === 'assessment'">
        <PracticeStage
          :markdown="stepStore.canvasContent.markdown"
          :question="stepStore.canvasContent.question!"
          @submit="onSubmitAnswer"
        />
      </template>

      <template v-else>
        <div class="markdown-stage">
          <MarkdownRenderer :content="stepStore.canvasContent.markdown" />
        </div>
      </template>
    </div>

    <div v-else class="canvas-empty">画布加载中…</div>
  </section>
</template>

<script setup lang="ts">
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExampleStage from './ExampleStage.vue'
import PracticeStage from './PracticeStage.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { ElMessage } from 'element-plus'
import type { ScriptPhaseType } from '@/types/study'

const stepStore = useTaskStepStore()

function phaseLabel(phase: ScriptPhaseType): string {
  const map: Record<ScriptPhaseType, string> = {
    review: '回顾前置',
    example: '动态例子',
    practice: '跟做例题',
    assessment: '掌握判断',
    advanced: '提高 / 补基础',
    summary: '本次总结',
  }
  return map[phase] || phase
}

function onSubmitAnswer(payload: { answer: string; correct: boolean; explanation: string }) {
  if (payload.correct) {
    ElMessage.success('回答正确！Agent 已记录掌握情况。')
  } else {
    ElMessage.warning('答案不对，Agent 已在画布下方给出讲解。')
  }
}
</script>

<style scoped lang="scss">
.study-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.92));
  overflow: hidden;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  .phase-tag {
    flex-shrink: 0;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(11, 183, 170, 0.12);
    color: #0bb7aa;
    &.review { background: rgba(100, 116, 139, 0.12); color: #64748b; }
    &.example { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
    &.practice { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
    &.assessment { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    &.advanced { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    &.summary { background: rgba(16, 185, 129, 0.12); color: #10b981; }
  }

  .header-titles {
    min-width: 0;
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #64748b;
    }
  }
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #0bb7aa;
    color: #0bb7aa;
  }
  &.primary {
    background: linear-gradient(135deg, #0bb7aa, #0284c7);
    color: #fff;
    border-color: transparent;
    &:hover:not(:disabled) { color: #fff; opacity: 0.92; }
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.canvas-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 28px 28px;
}

.agent-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(11, 183, 170, 0.08);
  border-left: 3px solid #0bb7aa;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #0f766e;
  line-height: 1.5;

  svg { flex-shrink: 0; margin-top: 2px; }
}

.markdown-stage {
  background: #fff;
  border-radius: 14px;
  padding: 28px 32px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.canvas-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .canvas-header { padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
  .header-left { width: 100%; }
  .canvas-body { padding: 16px; }
  .markdown-stage { padding: 18px; }
}
</style>
