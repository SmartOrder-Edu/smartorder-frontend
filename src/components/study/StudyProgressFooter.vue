<template>
  <div class="study-footer-wrapper">
    <!-- 收起态：细进度条 -->
    <div
      class="collapse-bar"
      :class="{ 'is-hover': barHovered }"
      @click="expand"
      @mouseenter="barHovered = true"
      @mouseleave="barHovered = false"
    >
      <div class="collapse-bar-track">
        <div
          class="collapse-bar-fill"
          :style="{ width: `${stepStore.progressPercent}%` }"
        />
      </div>
    </div>

    <!-- 展开态：完整 footer -->
    <Transition name="footer-slide">
      <footer
        v-if="!collapsed"
        class="study-footer"
        @mouseenter="clearCollapseTimer"
        @mouseleave="startCollapseTimer"
      >
        <button class="collapse-btn" @click="collapse" title="收起">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="18,15 12,9 6,15"/>
          </svg>
        </button>

        <div class="footer-grid">
          <!-- 1. 本节完成度 -->
          <div class="footer-cell">
            <div class="cell-label">本节完成度</div>
            <div class="completion-wrap">
              <div class="progress-ring">
                <svg viewBox="0 0 36 36" width="44" height="44">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="3"/>
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="url(#gradFooter)" stroke-width="3"
                    stroke-linecap="round"
                    :stroke-dasharray="`${stepStore.progressPercent}, 100`"
                    transform="rotate(-90 18 18)"
                  />
                  <defs>
                    <linearGradient id="gradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#0bb7aa"/>
                      <stop offset="100%" stop-color="#0284c7"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span class="ring-text">{{ stepStore.progressPercent }}%</span>
              </div>
              <div class="completion-meta">
                <strong>{{ stepStore.completedSteps }}/{{ stepStore.scriptSteps.length }}</strong>
                <span>步已完成</span>
              </div>
            </div>
          </div>

          <!-- 2. 掌握判断 -->
          <div class="footer-cell">
            <div class="cell-label">掌握判断</div>
            <div class="mastery-block" v-if="stepStore.mastery">
              <span class="mastery-badge" :class="stepStore.mastery.level">{{ stepStore.mastery.levelLabel }}</span>
              <span class="mastery-hint">{{ stepStore.mastery.hint }}</span>
            </div>
            <div class="empty-cell" v-else>学习中…</div>
          </div>

          <!-- 3. 下一步建议 -->
          <div class="footer-cell">
            <div class="cell-label">下一步建议</div>
            <div class="suggestion-block" v-if="stepStore.mastery">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
              <span>{{ stepStore.mastery.nextSuggestion }}</span>
            </div>
            <div class="empty-cell" v-else>完成本节后显示</div>
          </div>

          <!-- 4. 保存到学习记录 -->
          <div class="footer-cell actions-cell">
            <button class="save-btn" @click="onSave" :disabled="stepStore.completing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
              </svg>
              保存到学习记录
            </button>
            <button class="complete-btn" @click="onComplete" :disabled="stepStore.completing">
              {{ stepStore.completing ? '正在完成…' : '完成学习' }}
            </button>
          </div>
        </div>
      </footer>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const stepStore = useTaskStepStore()
const router = useRouter()

const collapsed = ref(true)
const barHovered = ref(false)
let collapseTimer: ReturnType<typeof setTimeout> | null = null

function expand() {
  collapsed.value = false
  clearCollapseTimer()
}

function collapse() {
  collapsed.value = true
  clearCollapseTimer()
}

function startCollapseTimer() {
  collapseTimer = setTimeout(() => {
    collapsed.value = true
  }, 2000)
}

function clearCollapseTimer() {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
}

// 当 mastery 有值时自动展开，4 秒后收起
watch(
  () => stepStore.mastery,
  (val) => {
    if (val) {
      collapsed.value = false
      clearCollapseTimer()
      collapseTimer = setTimeout(() => {
        collapsed.value = true
      }, 4000)
    }
  },
)

function onSave() {
  ElMessage.success('当前进度已临时保存到学习记录。')
}

async function onComplete() {
  const ok = await stepStore.completeStudySession()
  if (ok) {
    setTimeout(() => router.back(), 800)
  }
}
</script>

<style scoped lang="scss">
.study-footer-wrapper {
  position: relative;
  flex-shrink: 0;
}

/* ========== 收起态：细进度条 ========== */
.collapse-bar {
  height: 4px;
  cursor: pointer;
  transition: height 0.2s;

  &.is-hover {
    height: 6px;
  }
}

.collapse-bar-track {
  height: 100%;
  background: rgba(15, 23, 42, 0.06);
}

.collapse-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0bb7aa, #0284c7);
  border-radius: 0 2px 2px 0;
  transition: width 0.4s ease;
  min-width: 0;
}

/* ========== 展开态：完整 footer ========== */
.study-footer {
  position: relative;
  background: var(--color-card-bg-secondary);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 14px 24px;
}

.collapse-btn {
  position: absolute;
  top: -28px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-bottom: none;
  background: var(--color-card-bg);
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: #0bb7aa;
  }
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.4fr auto;
  gap: 18px;
  align-items: center;
}

.footer-cell {
  .cell-label {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.empty-cell {
  font-size: 12px;
  color: #cbd5e1;
  font-style: italic;
}

.completion-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-ring {
  position: relative;
  flex-shrink: 0;

  .ring-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #0bb7aa;
  }
}

.completion-meta {
  display: flex;
  flex-direction: column;
  font-size: 11px;
  color: #94a3b8;
  strong {
    font-size: 15px;
    color: #0f172a;
    font-weight: 600;
  }
}

.mastery-block {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mastery-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;

  &.mastered { background: rgba(16, 185, 129, 0.12); color: #059669; }
  &.progressing { background: rgba(11, 183, 170, 0.12); color: #0bb7aa; }
  &.weak { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
  &.unknown { background: rgba(100, 116, 139, 0.12); color: #64748b; }
}

.mastery-hint {
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
}

.suggestion-block {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;

  svg { color: #0bb7aa; flex-shrink: 0; margin-top: 2px; }
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  &:hover:not(:disabled) { border-color: #0bb7aa; color: #0bb7aa; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.complete-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover:not(:disabled) { opacity: 0.92; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* ========== 过渡动画 ========== */
.footer-slide-enter-active {
  transition: all 0.3s ease;
}
.footer-slide-leave-active {
  transition: all 0.25s ease;
}
.footer-slide-enter-from,
.footer-slide-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (max-width: 1024px) {
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
}
@media (max-width: 640px) {
  .footer-grid { grid-template-columns: 1fr; }
  .actions-cell { justify-content: stretch; }
  .save-btn, .complete-btn { flex: 1; justify-content: center; }
}
</style>