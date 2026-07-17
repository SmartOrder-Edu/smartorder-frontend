<template>
  <div class="quick-agent" :class="{ expanded, 'agent-collapsed': agentCollapsed }">
    <button
      v-if="!expanded"
      class="quick-agent-trigger"
      type="button"
      title="向学习伙伴提问"
      aria-label="向学习伙伴提问"
      @click="expandInput"
    >
      <span class="trigger-glow"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
        <path d="M8 9h8M8 13h5"/>
      </svg>
    </button>

    <form v-else class="quick-agent-form" @submit.prevent="sendMessage">
      <div class="quick-agent-orb">
        <img :src="teacherAvatar" alt="" />
      </div>
      <input
        ref="inputRef"
        v-model="input"
        class="quick-agent-input"
        placeholder="哪里没懂？直接问 Agent..."
        :disabled="stepStore.sendingFeedback"
        @keyup.esc="collapseInput"
      />
      <button
        class="quick-agent-send"
        type="submit"
        title="发送"
        aria-label="发送"
        :disabled="!input.trim() || stepStore.sendingFeedback"
      >
        <span v-if="stepStore.sendingFeedback" class="sending-dots">
          <i></i><i></i><i></i>
        </span>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22,2 15,22 11,13 2,9"/>
        </svg>
      </button>
      <button
        class="quick-agent-close"
        type="button"
        title="收起"
        aria-label="收起提问框"
        @click="collapseInput"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useTaskStepStore } from '@/stores/taskStep'
import teacherAvatar from '@/assets/teacher.png'

defineProps<{ agentCollapsed: boolean }>()
const emit = defineEmits<{ (e: 'openAgentPanel'): void }>()

const stepStore = useTaskStepStore()
const expanded = ref(false)
const input = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function expandInput() {
  expanded.value = true
  emit('openAgentPanel')
  nextTick(() => inputRef.value?.focus())
}

function collapseInput() {
  if (stepStore.sendingFeedback) return
  expanded.value = false
  input.value = ''
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || stepStore.sendingFeedback) return
  input.value = ''
  emit('openAgentPanel')
  await stepStore.sendCustomMessage(text)
  nextTick(() => inputRef.value?.focus())
}
</script>

<style scoped lang="scss">
.quick-agent {
  position: absolute;
  right: 344px;
  bottom: 78px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
  transition: right 0.32s cubic-bezier(0.22, 1, 0.36, 1);

  &.agent-collapsed {
    right: 24px;
  }
}

.quick-agent-trigger,
.quick-agent-form {
  pointer-events: auto;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(11, 183, 170, 0.15);
}

.quick-agent-trigger {
  position: relative;
  width: 54px;
  height: 54px;
  border: none;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  cursor: pointer;
  display: grid;
  place-items: center;
  overflow: hidden;
  animation: quickAgentBreath 2.8s ease-in-out infinite;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 22px 48px rgba(11, 183, 170, 0.28), 0 0 0 1px rgba(11, 183, 170, 0.2);
  }

  svg {
    position: relative;
    z-index: 1;
  }
}

.trigger-glow {
  position: absolute;
  inset: -35%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 58%);
  animation: quickGlowDrift 3.2s ease-in-out infinite;
}

.quick-agent-form {
  width: min(580px, calc(100vw - 42px));
  height: 56px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 34px 28px;
  align-items: center;
  gap: 8px;
  padding: 8px 9px 8px 10px;
  border-radius: 18px;
  border: 1px solid rgba(11, 183, 170, 0.2);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  animation: quickAgentExpand 0.34s cubic-bezier(0.22, 1, 0.36, 1), quickAgentBreath 3.4s ease-in-out infinite;
}

.quick-agent-orb {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  box-shadow: 0 7px 16px rgba(11, 183, 170, 0.22);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.quick-agent-input {
  min-width: 0;
  height: 38px;
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-size: 13px;

  &::placeholder {
    color: #94a3b8;
  }
}

.quick-agent-send,
.quick-agent-close {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

.quick-agent-send {
  color: #fff;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

.quick-agent-close {
  color: #64748b;
  background: transparent;

  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.sending-dots {
  display: inline-flex;
  gap: 3px;

  i {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: currentColor;
    animation: quickTyping 1s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.12s; }
    &:nth-child(3) { animation-delay: 0.24s; }
  }
}

@keyframes quickAgentExpand {
  from {
    width: 54px;
    opacity: 0.72;
    transform: translateY(6px) scale(0.96);
  }
  to {
    width: min(580px, calc(100vw - 42px));
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes quickAgentBreath {
  0%, 100% {
    box-shadow: 0 16px 38px rgba(15, 23, 42, 0.16), 0 0 0 0 rgba(11, 183, 170, 0.28);
  }
  50% {
    box-shadow: 0 20px 46px rgba(11, 183, 170, 0.24), 0 0 0 9px rgba(11, 183, 170, 0.06);
  }
}

@keyframes quickGlowDrift {
  0%, 100% { transform: translate(-18%, -18%) scale(0.82); opacity: 0.75; }
  50% { transform: translate(16%, 12%) scale(1.08); opacity: 1; }
}

@keyframes quickTyping {
  0%, 70%, 100% { transform: translateY(0); opacity: 0.45; }
  35% { transform: translateY(-3px); opacity: 1; }
}

@media (max-width: 1024px) {
  .quick-agent,
  .quick-agent.agent-collapsed {
    right: 16px;
    bottom: 76px;
  }
}
</style>
