<template>
  <teleport to="body">
    <div 
      v-if="isRendered" 
      class="settings-overlay"
      :class="{ open: isAnimateOpen }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      @click="handleOverlayClick"
    >
      <div 
        ref="modalRef"
        class="settings-modal"
      >
        <!-- 弹窗头部 -->
        <div class="settings-header">
          <span id="settings-title" class="dialog-title">{{ t('settings') }}</span>
          <button 
            class="modal-close-btn" 
            :aria-label="t('closeSettings')"
            @click="closeSettings" 
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 弹窗主体 -->
        <div class="settings-body">
          <!-- 插入 Sidebar 和 Content -->
          <slot></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const { t } = useI18n()
const modalRef = ref<HTMLElement | null>(null)

const isRendered = ref(false)
const isAnimateOpen = ref(false)

let previousActiveElement: HTMLElement | null = null

// 监听弹窗打开状态
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // 记录之前获得焦点的元素
    previousActiveElement = document.activeElement as HTMLElement
    
    // 打开 DOM 并控制滚动
    isRendered.value = true
    document.body.style.overflow = 'hidden'
    
    // 异步加上过渡类名，使过渡生效
    setTimeout(() => {
      isAnimateOpen.value = true
    }, 20)
    
    // 自动聚焦到弹窗的第一个可聚焦元素
    setTimeout(() => {
      if (modalRef.value) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        const focusables = modalRef.value.querySelectorAll<HTMLElement>(focusableSelectors)
        if (focusables.length > 0) {
          focusables[0].focus()
        }
      }
    }, 80)
  } else {
    // 外部直接置为 false 时的同步回退处理
    if (isAnimateOpen.value) {
      isAnimateOpen.value = false
      setTimeout(() => {
        isRendered.value = false
        document.body.style.overflow = ''
      }, 180)
    }
  }
}, { immediate: true })

// 统一的关闭函数
const closeSettings = () => {
  isAnimateOpen.value = false
  setTimeout(() => {
    isRendered.value = false
    document.body.style.overflow = ''
    
    emit('update:modelValue', false)
    emit('close')
    
    // 还原焦点并添加销毁后的 Fallback 逻辑
    if (previousActiveElement && document.body.contains(previousActiveElement)) {
      previousActiveElement.focus()
    } else {
      const fallback = document.querySelector('.sidebar-user-info, .sidebar-avatar-wrap') as HTMLElement
      if (fallback) {
        fallback.focus()
      }
    }
  }, 180)
}

// 遮罩点击校验
const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeSettings()
  }
}

// 焦点锁定 (Focus Lock) 键盘控制与 Esc 关闭
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.modelValue || !isRendered.value) return

  if (e.key === 'Escape') {
    closeSettings()
    e.preventDefault()
  } else if (e.key === 'Tab') {
    if (!modalRef.value) return
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusables = modalRef.value.querySelectorAll<HTMLElement>(focusableSelectors)
    if (focusables.length === 0) return

    const firstFocusable = focusables[0]
    const lastFocusable = focusables[focusables.length - 1]

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
  // 确保卸载时恢复 body 滚动
  document.body.style.overflow = ''
})
</script>

<style lang="scss">
/* 声明全局/弹窗配色样式 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
  opacity: 0;
  transition: opacity 180ms ease;
}

.settings-overlay.open {
  opacity: 1;
}

.settings-modal {
  display: flex;
  flex-direction: column;
  width: 720px;
  height: 470px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  border-radius: 22px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(6px) scale(0.985);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.settings-overlay.open .settings-modal {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 兼容减少动画 */
@media (prefers-reduced-motion: reduce) {
  .settings-overlay,
  .settings-modal {
    transition: none !important;
  }
}

/* 浅色主题配色 */
html[data-theme='light'] .settings-overlay {
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

html[data-theme='light'] .settings-modal {
  background: #ffffff;
  color: #1f2329;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}

/* 深色主题配色 */
html[data-theme='dark'] .settings-overlay {
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

html[data-theme='dark'] .settings-modal {
  background: #2b2d31;
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.48);
}

/* 图标跟随文字颜色 */
.settings-modal svg {
  color: currentColor !important;
  stroke: currentColor !important;
}

/* 深色模式下的文字颜色覆盖 */
html[data-theme='dark'] {
  .dialog-title,
  .settings-title,
  .settings-section-title,
  .section-title,
  .settings-menu-item,
  .theme-option,
  .language-select,
  .item-label,
  .danger-title {
    color: var(--text-primary) !important;
  }

  .settings-menu-item:not(.active),
  .settings-description,
  .section-desc,
  .item-value,
  .danger-box-desc,
  .terms-update-time,
  .terms-paragraph p {
    color: var(--text-secondary) !important;
  }
}

.settings-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  flex-shrink: 0;

  .dialog-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 16px;
  outline: none;

  &:hover {
    background-color: var(--hover-bg);
    color: var(--text-primary);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--el-color-primary);
  }
}

.settings-body {
  flex: 1;
  display: grid;
  grid-template-columns: 170px 1fr;
  min-height: 0;
  overflow: hidden;
}
</style>
