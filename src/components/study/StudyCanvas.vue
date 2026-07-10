<template>
  <section class="study-canvas">
    <audio
      class="timeline-audio"
      preload="auto"
      :ref="bindTimelineAudio"
      @ended="stepStore.handleTimelineAudioEnded()"
    />

    <!-- 步骤标题条 -->
    <header class="canvas-header" v-if="stepStore.currentScriptStep">
      <div class="header-left">
        <button
          v-if="scriptCollapsed"
          class="script-toggle-btn"
          @click="$emit('toggleScript')"
          title="展开脚本"
          aria-label="展开学习脚本"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/></svg>
        </button>
        <span class="phase-tag" :class="stepStore.currentScriptStep.phase">
          {{ phaseLabel(stepStore.currentScriptStep.phase) }}
        </span>
        <div class="header-titles">
          <h2>{{ stepStore.currentScriptStep.title }}</h2>
          <p>{{ stepStore.currentScriptStep.subtitle }}</p>
        </div>
        <!-- Agent 讲解中指示器 -->
        <span class="teaching-badge" v-if="stepStore.teachingActive">
          <span class="teaching-dot" v-if="stepStore.timelineStatus === 'playing'"></span>
          {{ stepStore.timelineStatus === 'ended' ? '讲解完成' : 'Agent 讲解中' }}
        </span>
      </div>
      <div class="header-right">
        <button
          v-if="agentCollapsed"
          class="agent-toggle-btn"
          @click="$emit('toggleAgent')"
          title="展开学习伙伴"
          aria-label="展开学习伙伴面板"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><path d="M10 4H3"/><path d="M10 9H3"/><path d="M10 15H3"/><path d="M10 20H3"/></svg>
        </button>
        <!-- 教学模式：隐藏导航，显示"跳过"按钮 -->
        <template v-if="stepStore.teachingActive">
          <button
            v-if="stepStore.timelineStatus === 'playing'"
            class="nav-btn"
            @click="stepStore.pauseTeaching()"
          >
            暂停
          </button>
          <button
            v-else-if="stepStore.timelineStatus === 'paused'"
            class="nav-btn primary"
            @click="stepStore.resumeTeaching()"
          >
            继续
          </button>
          <button class="nav-btn skip" @click="stepStore.endTeaching()">
            跳过教学
          </button>
        </template>
        <template v-else>
          <button class="nav-btn" :disabled="stepStore.currentStepIndex === 0" @click="stepStore.prevStep()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15,18 9,12 15,6"/></svg>
            上一步
          </button>
          <button class="nav-btn primary" @click="stepStore.nextStep()" :disabled="stepStore.currentStepIndex >= stepStore.scriptSteps.length - 1">
            下一步
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </template>
      </div>
    </header>

    <!-- 画布主体 -->
    <div class="canvas-body" v-if="stepStore.canvasContent">
      <!-- Agent 教学模式：分段式讲解 -->
      <template v-if="stepStore.canvasContent.teachingFlow && stepStore.teachingActive">
        <!-- 教学段列表（降序：所有已展示的段 + 当前段） -->
        <div class="teaching-segments">
          <template v-for="(seg, idx) in stepStore.canvasContent.teachingFlow.segments" :key="seg.id">
            <TeachingSegmentView
              v-if="idx <= stepStore.canvasContent.teachingFlow.currentSegmentIndex"
              :segment="seg"
              :visible="true"
              :is-current="idx === stepStore.canvasContent.teachingFlow.currentSegmentIndex"
              :quiz-state="idx === stepStore.canvasContent.teachingFlow.currentSegmentIndex ? stepStore.quizState : null"
              :scene-action="stepStore.getActiveSceneAction(seg.id, idx)"
              @quiz-answer="onQuizAnswer"
            />
          </template>
        </div>

        <!-- 教学控制区 -->
        <div class="teaching-controls">
          <!-- 弹题激活且已回答 → 继续 -->
          <button
            v-if="stepStore.quizState?.answered"
            class="continue-btn continue-btn-pulse"
            @click="stepStore.resumeTeaching()"
          >
            继续讲解
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
          <!-- 教学暂停（非弹题）→ 继续 -->
          <button
            v-else-if="stepStore.isTeachingPaused"
            class="continue-btn continue-btn-pulse"
            @click="stepStore.resumeTeaching()"
          >
            继续
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
          <button
            v-else-if="stepStore.timelineStatus === 'ended'"
            class="continue-btn"
            @click="stepStore.replayTeaching()"
          >
            重放本段
          </button>
        </div>
      </template>

      <!-- 静态模式：无 teachingFlow 时回退 -->
      <template v-else>
        <div class="agent-note" v-if="stepStore.canvasContent.agentNote">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>{{ stepStore.canvasContent.agentNote }}</span>
        </div>

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
      </template>
    </div>

    <div v-else class="canvas-empty">画布加载中…</div>
  </section>
</template>

<script setup lang="ts">
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExampleStage from './ExampleStage.vue'
import PracticeStage from './PracticeStage.vue'
import TeachingSegmentView from './TeachingSegmentView.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { ElMessage } from 'element-plus'

defineProps<{ scriptCollapsed: boolean; agentCollapsed: boolean }>()
defineEmits<{ (e: 'toggleScript'): void; (e: 'toggleAgent'): void }>()

const stepStore = useTaskStepStore()

function bindTimelineAudio(el: Element | null) {
  stepStore.setTimelineAudioElement(el instanceof HTMLAudioElement ? el : null)
}

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    review: '回顾前置',
    example: '动态例子',
    practice: '跟做例题',
    assessment: '掌握判断',
    advanced: '提高 / 补基础',
    summary: '本次总结',
    diagnostic: '诊断',
    targeted_review: '定向补弱',
    diagnose_gap: '定位卡点',
    rebuild_foundation: '补基础',
    guided_practice: '跟做练习',
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

/** 教学流弹题提交 → 转到 store 处理 */
function onQuizAnswer(quizId: string, answer: string) {
  stepStore.submitQuizAnswer(answer)
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

.timeline-audio {
  display: none;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  flex-wrap: nowrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;

  .script-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #fff;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      border-color: #0bb7aa;
      color: #0bb7aa;
      background: rgba(11, 183, 170, 0.08);
    }
  }

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
    flex: 1 1 auto;
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 650;
      color: #0f172a;
      white-space: normal;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.3;
    }
    p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #64748b;
    }
  }
}

.teaching-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(11, 183, 170, 0.1);
  border: 1px solid rgba(11, 183, 170, 0.25);
  font-size: 11px;
  font-weight: 600;
  color: #0bb7aa;

  .teaching-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #0bb7aa;
    animation: agentDotPulse 1s ease-in-out infinite;
  }
}

.header-right {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
  margin-left: auto;
}

.agent-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    border-color: #0bb7aa;
    color: #0bb7aa;
    background: rgba(11, 183, 170, 0.08);
  }
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
  &.skip {
    color: #94a3b8;
    font-size: 12px;
    &:hover { color: #ef4444; border-color: #ef4444; }
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.canvas-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 28px;
}

// ---- 教学段列表 ----
.teaching-segments {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ---- 教学控制区 ----
.teaching-controls {
  display: flex;
  justify-content: center;
  padding: 20px 0 8px;
}

.continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 28px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(11, 183, 170, 0.25);
  transition: all 0.2s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(11, 183, 170, 0.35); }
}

// ---- 静态模式 ----
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
  .canvas-header {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  .header-left { width: 100%; flex: 1 1 100%; }
  .header-right { width: 100%; justify-content: flex-end; margin-left: 0; }
  .canvas-body { padding: 16px; }
  .markdown-stage { padding: 18px; }
}

</style>
