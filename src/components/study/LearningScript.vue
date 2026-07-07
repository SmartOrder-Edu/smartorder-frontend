<template>
  <aside class="learning-script" :class="{ collapsed: collapsed }">
    <!-- 收起态：竖条 -->
    <div class="collapsed-strip">
      <button class="collapse-toggle" @click="toggleCollapse" title="展开脚本" aria-label="展开学习脚本">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </button>
      <div class="mini-progress" :title="`进度 ${stepStore.progressPercent}%`">
        <svg class="progress-ring" viewBox="0 0 36 36" width="36" height="36">
          <circle class="progress-ring-track" cx="18" cy="18" r="14"
            fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="3" />
          <circle class="progress-ring-fill" cx="18" cy="18" r="14"
            fill="none" stroke="#0bb7aa" stroke-width="3"
            :stroke-dasharray="`${stepStore.progressPercent * 0.88} 88`"
            stroke-dashoffset="0"
            stroke-linecap="round"
            transform="rotate(-90 18 18)" />
        </svg>
        <span class="mini-progress-text">{{ stepStore.progressPercent }}%</span>
      </div>
    </div>

    <!-- 展开态：完整侧边栏 -->
    <div class="script-header">
      <div class="script-title-row">
        <svg class="script-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <h3>本次学习脚本</h3>
        <button class="collapse-toggle collapse-toggle--in-header" @click="toggleCollapse" title="收起脚本" aria-label="收起学习脚本">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
      </div>
      <div class="script-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: stepStore.progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">
          {{ stepStore.completedSteps }}/{{ stepStore.scriptSteps.length }} 步 · 预计 {{ stepStore.totalEstimatedMinutes }} 分钟
        </span>
      </div>
    </div>

    <!-- 脚本步骤 -->
    <div class="script-steps" v-if="stepStore.scriptSteps.length">
      <div
        v-for="(step, index) in stepStore.scriptSteps"
        :key="step.id"
        class="script-step"
        :class="{
          active: stepStore.currentStepIndex === index,
          teaching: stepStore.currentStepIndex === index && stepStore.teachingActive,
          completed: step.status === 'completed',
          skipped: step.status === 'skipped',
        }"
        @click="$emit('jump', index)"
      >
        <div class="step-marker">
          <div class="marker-dot">
            <svg v-if="step.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <svg v-else-if="step.status === 'skipped'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="marker-line" v-if="index < stepStore.scriptSteps.length - 1"></div>
        </div>
        <div class="step-body">
          <div class="step-phase-row">
            <span class="phase-badge" :class="step.phase">{{ phaseLabel(step.phase) }}</span>
            <span class="step-time">{{ step.estimatedMinutes }} 分钟</span>
          </div>
          <div class="step-title">{{ step.title }}</div>
          <div class="step-subtitle">{{ step.subtitle }}</div>
        </div>
      </div>
    </div>
    <div v-else class="script-empty">脚本加载中…</div>
  </aside>
</template>

<script setup lang="ts">
import { useTaskStepStore } from '@/stores/taskStep'

defineEmits<{ (e: 'jump', index: number): void }>()

const collapsed = defineModel<boolean>('collapsed', { default: false })

const stepStore = useTaskStepStore()

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    review: '回顾',
    example: '例子',
    practice: '练习',
    assessment: '测评',
    advanced: '提高',
    summary: '总结',
    diagnostic: '诊断',
    targeted_review: '补弱',
    diagnose_gap: '定位',
    rebuild_foundation: '补基础',
    guided_practice: '跟做',
  }
  return map[phase] || phase
}
</script>

<style scoped lang="scss">
.learning-script {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
  flex-shrink: 0;
  position: relative;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  transition: width 0.3s ease;
  overflow: hidden;

  &.collapsed {
    width: 44px;
  }
}

// ======= 收起态竖条（绝对定位，不占 flex 空间）=======
.collapsed-strip {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 16px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.collapsed .collapsed-strip {
  opacity: 1;
  visibility: visible;
}

.collapse-toggle {
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

.collapse-toggle--in-header {
  margin-left: auto;
}

// Mini 圆形进度
.mini-progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .progress-ring { display: block; }

  .progress-ring-fill {
    transition: stroke-dasharray 0.4s ease;
  }

  .mini-progress-text {
    position: absolute;
    font-size: 9px;
    font-weight: 600;
    color: #0bb7aa;
    line-height: 1;
  }
}

// ======= 展开态内容淡入淡出 =======
.script-header,
.script-steps,
.script-empty {
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.collapsed .script-header,
.collapsed .script-steps,
.collapsed .script-empty {
  opacity: 0;
  visibility: hidden;
}

.script-header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.script-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .script-icon { color: var(--primary-color, #0bb7aa); }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
}

.script-progress {
  .progress-bar {
    height: 6px;
    background: rgba(15, 23, 42, 0.06);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #0bb7aa, #0284c7);
    transition: width 0.4s ease;
  }
  .progress-text {
    font-size: 12px;
    color: #64748b;
  }
}

.script-steps {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 18px;
}

.script-step {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover { background: rgba(11, 183, 170, 0.06); }
  &.active {
    background: rgba(11, 183, 170, 0.12);
    .step-title { color: #0bb7aa; font-weight: 600; }
    .marker-dot { background: #0bb7aa; color: #fff; border-color: #0bb7aa; }
  }
  &.teaching {
    border-left: 3px solid #0bb7aa;
    .step-title::after {
      content: ' · 教学中';
      font-size: 10px;
      color: #0bb7aa;
      font-weight: 500;
      animation: agentDotPulse 1s ease-in-out infinite;
    }
  }
  &.completed .marker-dot { background: #10b981; color: #fff; border-color: #10b981; }
  &.skipped {
    opacity: 0.55;
    .marker-dot { background: #cbd5e1; color: #fff; border-color: #cbd5e1; }
  }
}

.step-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;

  .marker-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #cbd5e1;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .marker-line {
    width: 2px;
    flex: 1;
    min-height: 16px;
    background: rgba(15, 23, 42, 0.08);
    margin: 4px 0;
  }
}

.step-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 6px;
}

.step-phase-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .phase-badge {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 999px;
    font-weight: 500;
    background: rgba(11, 183, 170, 0.12);
    color: #0bb7aa;
    &.review { background: rgba(100, 116, 139, 0.12); color: #64748b; }
    &.example { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
    &.practice { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
    &.assessment { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    &.advanced { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    &.summary { background: rgba(16, 185, 129, 0.12); color: #10b981; }
  }
  .step-time {
    font-size: 11px;
    color: #94a3b8;
  }
}

.step-title {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  margin-bottom: 2px;
}
.step-subtitle {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}

.script-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .learning-script {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);

    &.collapsed {
      width: 100% !important;
    }
  }
  .collapse-toggle--in-header,
  .collapsed-strip {
    display: none;
  }
}
</style>
