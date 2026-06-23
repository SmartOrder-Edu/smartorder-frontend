<template>
  <div
    class="teaching-segment"
    :class="{
      'segment-enter': visible && isNew,
      'segment-past': !isCurrent,
      'segment-current': isCurrent,
      'segment-future': !visible,
    }"
    :ref="(el) => { if (el && isCurrent && segment.focusTarget) applyFocus(el) }"
  >
    <!-- text / formula：markdown + stagger 子元素 -->
    <template v-if="segment.type === 'text' || segment.type === 'formula'">
      <div class="segment-markdown" :class="{ 'teaching-stagger': visible }">
        <MarkdownRenderer :content="segment.markdown" />
      </div>
    </template>

    <!-- diagram：markdown（内嵌 mermaid）+ focus 效果容器 -->
    <template v-else-if="segment.type === 'diagram'">
      <div class="segment-diagram focus-target-container" :class="focusClass">
        <MarkdownRenderer :content="segment.markdown" />
      </div>
    </template>

    <!-- quiz：内嵌弹题 -->
    <template v-else-if="segment.type === 'quiz' && segment.quiz">
      <InlineQuizCard
        :quiz="segment.quiz"
        :disabled="quizState?.answered ?? false"
        @answer="(qid, val) => $emit('quizAnswer', qid, val)"
      />
    </template>

    <!-- pause：过渡指示器 -->
    <template v-else-if="segment.type === 'pause'">
      <div class="segment-pause">
        <span class="pause-dot"></span>
        <span>{{ segment.markdown || 'Agent 正在准备下一段讲解…' }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import InlineQuizCard from './InlineQuizCard.vue'
import type { TeachingSegment, QuizState } from '@/types/study'

const props = defineProps<{
  segment: TeachingSegment
  visible: boolean
  isCurrent: boolean
  quizState?: QuizState | null
}>()

defineEmits<{
  (e: 'quizAnswer', quizId: string, answer: string): void
}>()

// 刚变为可见时播放入场动画
const isNew = ref(false)
watch(
  () => props.isCurrent,
  (cur) => {
    if (cur) {
      isNew.value = true
      setTimeout(() => (isNew.value = false), 450)
    }
  },
  { immediate: true },
)

const focusClass = computed(() => {
  if (!isNew.value || !props.segment.focusTarget) return ''
  const fx = props.segment.focusTarget.effect
  if (fx === 'pulse') return 'focus-pulse'
  if (fx === 'glow-border') return 'focus-glow-border'
  if (fx === 'scale') return 'focus-scale'
  return ''
})

function applyFocus(el: HTMLElement) {
  const target = props.segment.focusTarget
  if (!target || target.scroll === 'none') return
  const inner = el.querySelector(target.selector)
  if (inner) {
    inner.scrollIntoView({ behavior: target.scroll as ScrollBehavior, block: 'center' })
  }
}
</script>

<style scoped lang="scss">
.teaching-segment {
  margin-bottom: 10px;
  border-radius: 12px;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.segment-past {
  opacity: 0.5;
  pointer-events: none;
  transform: scale(0.98);
}

.segment-current {
  opacity: 1;
}

.segment-future {
  display: none;
}

.segment-enter {
  // keyframes in teaching-animations.scss
}

.segment-markdown {
  background: #fff;
  border-radius: 12px;
  padding: 16px 22px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
  line-height: 1.75;
  font-size: 14px;
  color: #334155;

  :deep(.markdown-renderer) {
    h1, h2 { font-size: 17px; margin: 12px 0 6px; color: #0f172a; }
    h3 { font-size: 15px; margin: 10px 0 4px; }
    p { margin: 6px 0; }
    ul, ol { padding-left: 18px; }
    li { margin: 3px 0; }
    blockquote {
      border-left: 3px solid #0bb7aa;
      padding-left: 12px;
      color: #0f766e;
      background: rgba(11, 183, 170, 0.05);
      border-radius: 0 8px 8px 0;
      margin: 8px 0;
    }
    .math-block, .math-inline { font-style: italic; }
  }
}

.segment-diagram {
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  border: 2px solid rgba(15, 23, 42, 0.06);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}

.focus-target-container {
  // targets for focus effect classes from teaching-animations.scss
}

.segment-pause {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(100, 116, 139, 0.06);
  font-size: 13px;
  color: #64748b;

  .pause-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #94a3b8;
    animation: agentDotPulse 1s ease-in-out infinite;
  }
}
</style>
