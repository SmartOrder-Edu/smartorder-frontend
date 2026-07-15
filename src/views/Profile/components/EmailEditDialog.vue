<template>
  <el-dialog
    v-model="visible"
    width="440px"
    :close-on-click-modal="false"
    class="custom-dialog email-edit-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <span class="header-icon email-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </span>
        <span class="header-title">修改绑定邮箱</span>
      </div>
    </template>
    <el-form :model="form" label-position="top">
      <!-- 当前邮箱（只读） -->
      <el-form-item>
        <template #label>
          <span class="custom-form-label">
            <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            当前邮箱
          </span>
        </template>
        <el-input :model-value="currentEmail" disabled>
          <template #prefix>
            <span class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
          </template>
        </el-input>
      </el-form-item>

      <!-- 新邮箱 -->
      <el-form-item :error="errors.newEmail">
        <template #label>
          <span class="custom-form-label">
            <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            新邮箱
          </span>
        </template>
        <el-input
          v-model="form.newEmail"
          placeholder="请输入新邮箱"
          clearable
          @input="errors.newEmail = ''"
        >
          <template #prefix>
            <span class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
          </template>
        </el-input>
      </el-form-item>

      <!-- 验证码 -->
      <el-form-item :error="errors.code">
        <template #label>
          <span class="custom-form-label">
            <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            验证码
          </span>
        </template>
        <el-input
          v-model="form.code"
          placeholder="请输入验证码"
          maxlength="6"
          class="code-input"
          @input="errors.code = ''"
        >
          <template #prefix>
            <span class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
          </template>
          <template #suffix>
            <el-button
              link
              :disabled="countdown > 0 || !canSend"
              :loading="sending"
              class="inline-send-btn"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false" :disabled="submitting">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="confirmChange">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  modelValue: boolean
  currentEmail: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const userStore = useUserStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const form = reactive({
  newEmail: '',
  code: ''
})

const errors = reactive({
  newEmail: '',
  code: ''
})

const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const canSend = computed(() => {
  return form.newEmail.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.newEmail.trim())
})

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const sendCode = async () => {
  const email = form.newEmail.trim()
  if (!email) {
    errors.newEmail = '请输入新邮箱'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.newEmail = '邮箱格式不正确'
    return
  }
  if (email === props.currentEmail) {
    errors.newEmail = '新邮箱不能与当前邮箱相同'
    return
  }

  sending.value = true
  try {
    await userApi.sendEmailCode(email)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error: any) {
    ElMessage.error(error?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

const confirmChange = async () => {
  errors.newEmail = ''
  errors.code = ''

  const newEmail = form.newEmail.trim()
  if (!newEmail) {
    errors.newEmail = '请输入新邮箱'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    errors.newEmail = '邮箱格式不正确'
    return
  }
  if (newEmail === props.currentEmail) {
    errors.newEmail = '新邮箱不能与当前邮箱相同'
    return
  }
  if (!form.code.trim()) {
    errors.code = '请输入验证码'
    return
  }

  submitting.value = true
  try {
    await userApi.changeEmail({
      newEmail,
      verificationCode: form.code.trim()
    })
    ElMessage.success('邮箱修改成功')
    visible.value = false
    await userStore.fetchUserInfo()
    emit('success')
  } catch (error: any) {
    ElMessage.error(error?.message || '修改失败')
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  form.newEmail = ''
  form.code = ''
  errors.newEmail = ''
  errors.code = ''
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    handleClosed()
  }
})
</script>

<style scoped>
.code-input {
  width: 100%;
}

/* 输入框前缀图标样式 */
.input-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  margin-right: 6px;
  transition: color 0.2s ease;
}

:deep(.el-input__wrapper.is-focus) .input-icon {
  color: #14b8a6;
}

/* 现代内联发送验证码按钮 */
.inline-send-btn {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #14b8a6 !important;
  height: auto !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
  background: transparent !important;
}

.inline-send-btn:hover:not(:disabled) {
  color: #0d9488 !important;
  background-color: rgba(20, 184, 166, 0.08) !important;
}

.inline-send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.inline-send-btn:disabled {
  color: #94a3b8 !important;
  cursor: not-allowed !important;
  background: transparent !important;
}

/* disabled 态当前邮箱输入框优化 */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f8fafc !important;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
  cursor: not-allowed;
}

:deep(.el-input.is-disabled .el-input__inner) {
  color: #64748b !important;
  -webkit-text-fill-color: #64748b !important;
  cursor: not-allowed;
}

:deep(.el-input.is-disabled) .input-icon {
  color: #cbd5e1;
}

/* 深色模式适配 */
html[data-theme='dark'] .inline-send-btn:hover:not(:disabled) {
  background-color: rgba(20, 184, 166, 0.15) !important;
  color: #14b8a6 !important;
}

html[data-theme='dark'] .inline-send-btn:disabled {
  color: #4b5563 !important;
}

html[data-theme='dark'] :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #151b25 !important;
  box-shadow: 0 0 0 1px #2c3745 inset !important;
}

html[data-theme='dark'] :deep(.el-input.is-disabled .el-input__inner) {
  color: #64748b !important;
  -webkit-text-fill-color: #64748b !important;
}

html[data-theme='dark'] :deep(.el-input.is-disabled) .input-icon {
  color: #4b5563;
}

/* 对话框通用美化 */
:deep(.custom-dialog) {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03) !important;
}

:deep(.custom-dialog .el-dialog__header) {
  padding: 20px 24px 14px !important;
  margin-right: 0 !important;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.custom-dialog .el-dialog__body) {
  padding: 24px 24px 12px !important;
}

:deep(.custom-dialog .el-dialog__footer) {
  padding: 12px 24px 20px !important;
  border-top: 1px solid #f1f5f9;
}

/* 弹窗头部排版 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.08);
}

.header-title {
  font-size: 16px;
  font-weight: 650;
  color: #1f2937;
}

/* 输入框细节美化 */
:deep(.custom-dialog .el-form-item) {
  margin-bottom: 22px;
}

:deep(.custom-dialog .el-form-item__label) {
  font-weight: 550;
  color: #4b5563;
  padding-bottom: 6px !important;
}

/* 现代垂直表单的 label 自定义设计 */
.custom-form-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  transition: all 0.2s ease;
}

.label-icon {
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

/* 容器获获焦时提亮 label，带来更佳互动感 */
:deep(.el-form-item:focus-within) .custom-form-label {
  color: #111827;
}

:deep(.el-form-item:focus-within) .label-icon {
  color: #14b8a6;
}

:deep(.custom-dialog .el-input__wrapper) {
  border-radius: 8px !important;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
  padding: 4px 12px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.custom-dialog .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset !important;
}

:deep(.custom-dialog .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #14b8a6 inset, 0 0 0 3px rgba(20, 184, 166, 0.12) !important;
}

/* 按钮圆角优化 */
:deep(.custom-dialog .el-button) {
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-weight: 500;
  height: 34px;
}

:deep(.custom-dialog .el-button--primary) {
  background-color: #14b8a6 !important;
  border-color: #14b8a6 !important;
  color: #ffffff !important;
}

:deep(.custom-dialog .el-button--primary:hover) {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
}

/* 深色模式弹窗适配 */
html[data-theme='dark'] :deep(.custom-dialog) {
  background-color: #1a222e !important;
}

html[data-theme='dark'] :deep(.custom-dialog .el-dialog__header),
html[data-theme='dark'] :deep(.custom-dialog .el-dialog__footer) {
  border-color: #2c3745 !important;
}

html[data-theme='dark'] .header-title {
  color: #f5f7fa;
}

html[data-theme='dark'] :deep(.custom-dialog .el-form-item__label) {
  color: #b4bdca;
}

html[data-theme='dark'] .custom-form-label {
  color: #b4bdca;
}

html[data-theme='dark'] :deep(.el-form-item:focus-within) .custom-form-label {
  color: #f5f7fa;
}

html[data-theme='dark'] :deep(.custom-dialog .el-input__wrapper) {
  background-color: #151b25 !important;
  box-shadow: 0 0 0 1px #2c3745 inset !important;
}

html[data-theme='dark'] :deep(.custom-dialog .el-input__wrapper .el-input__inner) {
  color: #f5f7fa !important;
}

html[data-theme='dark'] :deep(.custom-dialog .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #14b8a6 inset, 0 0 0 3px rgba(20, 184, 166, 0.25) !important;
}
</style>
