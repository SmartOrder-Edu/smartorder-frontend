<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div 
        v-if="modelValue" 
        class="custom-dialog-overlay" 
        role="dialog"
        aria-modal="true"
        :aria-label="t('settings')"
        @click="handleOverlayClick"
      >
        <div 
          ref="modalRef"
          class="custom-dialog-container" 
          @click.stop
        >
          <!-- 弹窗头部 -->
          <div class="custom-dialog-header">
            <span class="dialog-title">{{ t('settings') }}</span>
            <button 
              class="modal-close-btn" 
              :aria-label="t('closeSettings')"
              @click="handleClose" 
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <!-- 弹窗主体 -->
          <div class="custom-dialog-body">
            <!-- 插入 Sidebar 和 Content -->
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
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
let previousActiveElement: HTMLElement | null = null

// 滚动条位置锁定与恢复，焦点锁定控制
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // 记录之前获得焦点的元素
    previousActiveElement = document.activeElement as HTMLElement
    
    // 禁止背景滚动
    document.body.classList.add('modal-open')
    
    // 异步聚焦到弹窗的第一个可聚焦元素
    setTimeout(() => {
      if (modalRef.value) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        const focusables = modalRef.value.querySelectorAll<HTMLElement>(focusableSelectors)
        if (focusables.length > 0) {
          focusables[0].focus()
        }
      }
    }, 50)
  } else {
    // 恢复背景滚动
    document.body.classList.remove('modal-open')
    
    // 还原焦点
    if (previousActiveElement) {
      previousActiveElement.focus()
    }
  }
}, { immediate: true })

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}

// 焦点锁定 (Focus Lock) 键盘控制与 Esc 关闭
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.modelValue) return

  if (e.key === 'Escape') {
    handleClose()
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
  // 防止组件销毁时没有清理滚动锁定
  document.body.classList.remove('modal-open')
})
</script>

<style lang="scss">
/* 声明全局/弹窗配色样式 */
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--mask-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  .custom-dialog-container {
    display: grid;
    grid-template-rows: 60px 1fr;
    width: 720px;
    height: 470px;
    background-color: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 22px;
    box-shadow: 0 12px 32px  var(--color-shadow);
    overflow: hidden;
    max-width: calc(100vw - 48px);
    max-height: calc(100vh - 48px);
    
    @media (max-width: 1024px) {
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 32px);
    }
    
    @media (max-width: 768px) {
      width: calc(100vw - 24px);
      height: 80vh;
      max-width: none;
      max-height: none;
    }
  }

  .custom-dialog-header {
    height: 60px;
    padding: 0 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--panel-bg);
    flex-shrink: 0;

    .dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

  .custom-dialog-body {
    display: grid;
    grid-template-columns: 170px 1fr;
    min-height: 0;
    overflow: hidden;
    background-color: var(--panel-bg);
  }
}

/* 禁止背景滚动的样式定义 */
body.modal-open {
  overflow: hidden !important;
  width: 100%;
}

/* 过渡动画：包含毛玻璃模糊与缩放淡入淡出 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.25, 1, 0.5, 1), backdrop-filter 0.25s cubic-bezier(0.25, 1, 0.5, 1);

  .custom-dialog-container {
    transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);

  .custom-dialog-container {
    transform: scale(0.95) translate3d(0, 10px, 0);
    opacity: 0;
  }
}

.dialog-fade-enter-to,
.dialog-fade-leave-from {
  opacity: 1;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  .custom-dialog-container {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 1;
  }
}
</style>
