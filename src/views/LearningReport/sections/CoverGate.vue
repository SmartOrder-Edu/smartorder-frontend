<template>
  <div class="cover-gate" :class="{ entering }">
    <!-- 水彩氛围 blob -->
    <WatercolorOrb color="rgba(11, 183, 170, 0.42)" :size="520" top="-180px" left="-160px" />
    <WatercolorOrb color="rgba(245, 158, 11, 0.32)" :size="440" bottom="-140px" right="-120px" />
    <WatercolorOrb color="rgba(236, 72, 153, 0.16)" :size="360" top="38%" right="8%" />
    <WatercolorOrb color="rgba(59, 130, 246, 0.14)" :size="320" bottom="20%" left="6%" />

    <div class="cover-content">
      <p class="cover-eyebrow">最近 7 天学习报告</p>
      <h1 class="cover-title">
        <span class="title-name">{{ studentName }}</span>
        <span class="title-possessive">的</span>
        <span class="title-object">专属学习周报</span>
      </h1>

      <div class="cover-companion">
        <CompanionMascot
          :src="coverImg"
          size="hero"
          :float="!entering"
          alt="小序正在为你翻阅本周学习轨迹"
        />
      </div>

      <p class="cover-summary">{{ mainConclusion }}</p>

      <transition name="fade">
        <div v-if="!entering" class="cover-actions">
          <button class="cover-cta" @click="handleEnter">
            <component :is="SparklesIconComp" :size="18" />
            <span>开启本周报告</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
          <button class="skip-link" @click="handleSkip">直接进入 ›</button>
        </div>
      </transition>

      <transition name="reveal-fade">
        <div v-if="entering" class="reveal-chip" key="reveal">
          <span class="reveal-pulse-dot"></span>
          <span class="reveal-text">{{ revealText }}</span>
        </div>
      </transition>
    </div>

    <div class="scroll-hint" v-if="!entering">
      <span>向下滑动</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getIcon } from '@/assets/icons/create'
import coverImg from '@/assets/illustrations/cover-companion-reading.png'
import WatercolorOrb from '../components/WatercolorOrb.vue'
import CompanionMascot from '../components/CompanionMascot.vue'

defineProps<{
  studentName: string
  mainConclusion: string
}>()

const emit = defineEmits<{
  enter: []
  skip: []
}>()

const SparklesIconComp = getIcon('SparklesIcon')

const entering = ref(false)
const revealText = ref('AI 学习助手正在解读你的 7 天轨迹')

const revealTexts = [
  'AI 学习助手正在解读你的 7 天轨迹',
  '正在汇总学习行为与测评表现…',
  '正在生成你的专属周报…',
]

let textTimer: ReturnType<typeof setInterval> | null = null
let enterTimer: ReturnType<typeof setTimeout> | null = null
let textIndex = 0

function handleEnter() {
  if (entering.value) return
  entering.value = true
  textIndex = 0
  revealText.value = revealTexts[0]
  textTimer = setInterval(() => {
    textIndex = (textIndex + 1) % revealTexts.length
    revealText.value = revealTexts[textIndex]
  }, 420)
  enterTimer = setTimeout(() => {
    emit('enter')
  }, 1300)
}

function handleSkip() {
  emit('skip')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !entering.value) {
    event.preventDefault()
    handleSkip()
  }
  if ((event.key === 'Enter' || event.key === ' ') && !entering.value) {
    event.preventDefault()
    handleEnter()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (textTimer) clearInterval(textTimer)
  if (enterTimer) clearTimeout(enterTimer)
})
</script>

<style scoped lang="scss">
.cover-gate {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 60%, rgba(236, 253, 251, 0.6), transparent 70%),
    linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-secondary) 100%);
  transition: opacity 0.4s ease;
}

html[data-theme='dark'] .cover-gate {
  background:
    radial-gradient(ellipse at 50% 60%, rgba(11, 183, 170, 0.08), transparent 70%),
    linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-secondary) 100%);
}

.cover-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.3rem;
  padding: 2rem;
  max-width: 720px;
  width: 100%;
}

.cover-eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: var(--primary-deep);
  text-transform: uppercase;
  margin: 0;
  animation: rise-in 0.8s ease 0.1s both;
}

.cover-title {
  margin: 0;
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
  font-size: clamp(36px, 5.5vw, 68px);
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-dark);
  letter-spacing: 0.02em;
  animation: rise-in 0.9s var(--transition-spring, ease) 0.2s both;

  .title-name {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .title-possessive {
    color: var(--text-muted);
    font-size: 0.62em;
    font-weight: 400;
    margin: 0 0.2em;
  }
}

.cover-companion {
  margin: 0.5rem 0;
  animation: rise-in 1s var(--transition-spring, ease) 0.35s both;
  transition: transform 1.2s var(--transition-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.cover-gate.entering .cover-companion {
  transform: scale(1.1);
}

.cover-summary {
  margin: 0;
  font-size: clamp(0.95rem, 1.6vw, 1.1rem);
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 520px;
  animation: rise-in 0.9s ease 0.5s both;
}

.cover-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  margin-top: 0.6rem;
  animation: rise-in 0.9s ease 0.65s both;
}

.cover-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.95rem 2.1rem;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow:
    var(--shadow-glow),
    0 12px 28px rgba(11, 183, 170, 0.28);
  transition: transform 0.25s var(--transition-spring, ease), box-shadow 0.25s ease;

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.25s ease;
  }

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 0 24px rgba(11, 183, 170, 0.32),
      0 16px 36px rgba(11, 183, 170, 0.36);

    svg {
      transform: translateX(3px);
    }
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }
}

.skip-link {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary-deep);
  }
}

.reveal-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 1.5rem;
  padding: 0.8rem 1.4rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  box-shadow: 0 12px 36px rgba(11, 183, 170, 0.14);
  color: var(--primary-deep);
  font-size: 0.9rem;
  font-weight: 600;
}

.reveal-pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.6);
  animation: reveal-pulse 1.4s ease-out infinite;
}

.reveal-text {
  min-width: 200px;
  transition: opacity 0.3s ease;
}

.scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  animation: rise-in 1s ease 1s both;

  svg {
    width: 16px;
    height: 16px;
    animation: hint-down 1.6s ease-in-out infinite;
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes reveal-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.6);
  }
  100% {
    box-shadow: 0 0 0 14px rgba(11, 183, 170, 0);
  }
}

@keyframes hint-down {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(4px);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.reveal-fade-enter-active,
.reveal-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s var(--transition-spring, ease);
}

.reveal-fade-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .cover-eyebrow,
  .cover-title,
  .cover-companion,
  .cover-summary,
  .cover-actions,
  .scroll-hint,
  .scroll-hint svg,
  .reveal-pulse-dot {
    animation: none;
  }
}

@media (max-width: 760px) {
  .cover-content {
    gap: 1rem;
    padding: 1.5rem;
  }

  .cover-companion {
    transform: scale(0.78);
  }
  .cover-gate.entering .cover-companion {
    transform: scale(0.86);
  }
}
</style>
