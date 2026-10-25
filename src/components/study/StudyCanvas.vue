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
          {{ teachingBadgeLabel }}
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
        <template v-if="stepStore.teachingActive && !stepStore.timelineEnded">
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
          <button
            v-else-if="stepStore.timelineStatus === 'waiting_user' && !stepStore.quizState"
            class="nav-btn primary"
            @click="stepStore.resumeTeaching()"
          >
            {{ continueButtonLabel }}
          </button>
          <button class="nav-btn skip" @click="stepStore.endTeaching()">
            跳过教学
          </button>
        </template>
        <template v-else-if="stepStore.timelineEnded">
          <button class="nav-btn" @click="stepStore.replayTeaching()">
            重放本段
          </button>
          <button class="nav-btn" :disabled="stepStore.currentStepIndex === 0" @click="stepStore.prevStep()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15,18 9,12 15,6"/></svg>
            上一步
          </button>
          <button class="nav-btn primary" @click="stepStore.nextStep()" :disabled="stepStore.currentStepIndex >= stepStore.scriptSteps.length - 1">
            下一步
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>
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
    <div
      class="canvas-body"
      :class="{ 'canvas-waiting': isSegmentEndWaiting }"
      v-if="stepStore.canvasContent"
    >
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
              :revealed-board-block-index="stepStore.getRevealedBoardBlockIndex(seg.id)"
              :revealed-board-item-indexes="stepStore.getRevealedBoardItemIndexes(seg.id)"
              :waiting-for-continue="idx === stepStore.canvasContent.teachingFlow.currentSegmentIndex && isSegmentEndWaiting"
              :timeline-status="stepStore.timelineStatus"
              :feedback-effect="feedbackEffectForSegment(seg.id)"
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
            继续学习
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
          <!-- 教学暂停（非弹题）→ 继续 -->
          <button
            v-else-if="stepStore.isTeachingPaused"
            class="continue-btn continue-btn-pulse"
            @click="stepStore.resumeTeaching()"
          >
            {{ continueButtonLabel }}
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

      <div class="temporary-board-notes" v-if="stepStore.temporaryBoardNotes.length">
        <article
          v-for="note in stepStore.temporaryBoardNotes"
          :key="note.id"
          class="temporary-board-note"
          :class="{ 'temporary-board-note--diagram': note.kind === 'diagram' }"
        >
          <div class="temporary-board-head">
            <span class="temporary-board-dot"></span>
            <h3>{{ note.title }}</h3>
          </div>
          <p class="temporary-board-question" v-if="note.sourceQuestion">
            来自你的提问：{{ note.sourceQuestion }}
          </p>
          <MarkdownRenderer :content="note.content" />
        </article>
      </div>
    </div>

    <div v-else class="canvas-empty">画布加载中…</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExampleStage from './ExampleStage.vue'
import PracticeStage from './PracticeStage.vue'
import TeachingSegmentView from './TeachingSegmentView.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { ElMessage } from 'element-plus'

defineProps<{ scriptCollapsed: boolean; agentCollapsed: boolean }>()
defineEmits<{ (e: 'toggleScript'): void; (e: 'toggleAgent'): void }>()

const stepStore = useTaskStepStore()

const isSegmentEndWaiting = computed(() =>
  stepStore.timelineStatus === 'waiting_user'
  && stepStore.currentWaitReason === 'segment_end_check',
)

const continueButtonLabel = computed(() => {
  const flow = stepStore.currentTeachingFlow
  if (!flow) return '继续讲解'
  if (flow.currentSegmentIndex >= flow.segments.length - 1) return '完成本步学习'
  return '继续讲解'
})

const teachingBadgeLabel = computed(() => {
  if (stepStore.timelineStatus === 'ended') return '讲解完成'
  if (stepStore.timelineStatus === 'waiting_user') return '等待继续'
  if (stepStore.timelineStatus === 'paused') return '已暂停'
  return 'Agent 讲解中'
})

function feedbackEffectForSegment(segmentId: string) {
  const effect = stepStore.feedbackVisualEffect
  if (!effect) return null
  if (effect.segmentId && effect.segmentId !== segmentId) return null
  return effect
}

function bindTimelineAudio(el: Element | ComponentPublicInstance | null) {
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
function onQuizAnswer(_quizId: string, answer: string) {
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
  background: var(--color-card-bg-secondary);
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
  transition: opacity 0.2s ease, background 0.2s ease;
}

.canvas-waiting {
  opacity: 0.97;
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.2), rgba(248, 250, 252, 0));
}

.temporary-board-notes {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.temporary-board-note {
  position: relative;
  padding: 16px 18px 18px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98)),
    radial-gradient(circle at 18px 18px, rgba(14, 165, 233, 0.1) 1px, transparent 1.5px);
  background-size: 100% 100%, 26px 26px;
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.07),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
  animation: boardNoteIn 0.38s cubic-bezier(0.22, 1, 0.36, 1);

  :deep(.markdown-renderer) {
    font-size: 13px;
    color: #1e293b;

    h3 {
      margin: 6px 0 8px;
      font-size: 14px;
    }

    p {
      margin: 6px 0;
    }

    ol,
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    blockquote {
      margin: 10px 0 0;
      padding: 8px 10px;
      border-left: 3px solid rgba(11, 183, 170, 0.4);
      background: rgba(255, 255, 255, 0.66);
      color: #475569;
    }
  }
}

.temporary-board-note--diagram {
  padding: 0;
  overflow: hidden;
  border-color: rgba(14, 165, 233, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98)),
    #fff;
  box-shadow:
    0 22px 54px rgba(14, 165, 233, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;

  .temporary-board-head {
    margin: 0;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.07);
    background:
      linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.92));
  }

  .temporary-board-head h3 {
    color: #0369a1;
    font-size: 13px;
  }

  .temporary-board-dot {
    background: #0ea5e9;
    box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.12);
  }

  .temporary-board-question {
    margin: 12px 16px 0;
    padding: 7px 10px;
    border-radius: 8px;
    background: rgba(14, 165, 233, 0.06);
    color: #475569;
  }

  :deep(.markdown-renderer) {
    padding: 14px 16px 16px;
  }

  :deep(.markdown-renderer > p:first-child) {
    margin-top: 0;
  }

  :deep(.markdown-renderer .mermaid-block) {
    margin: 12px 0 0;
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow:
      0 18px 42px rgba(14, 165, 233, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.92) inset;
  }

  :deep(.markdown-renderer .mermaid-diagram-body) {
    max-height: 620px;
  }
}

.temporary-board-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #0f766e;
  }
}

.temporary-board-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0bb7aa;
  box-shadow: 0 0 0 5px rgba(11, 183, 170, 0.12);
  animation: agentDotPulse 1.6s ease-in-out infinite;
}

.temporary-board-question {
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
}

@keyframes boardNoteIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
