<template>
  <el-dialog
    v-model="visible"
    title="修改邮箱"
    width="440px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form :model="form" label-width="80px" label-position="left">
      <!-- 当前邮箱（只读） -->
      <el-form-item label="当前邮箱">
        <el-input :model-value="currentEmail" disabled />
      </el-form-item>

      <!-- 新邮箱 -->
      <el-form-item label="新邮箱" :error="errors.newEmail">
        <el-input
          v-model="form.newEmail"
          placeholder="请输入新邮箱"
          @input="errors.newEmail = ''"
        />
      </el-form-item>

      <!-- 验证码 -->
      <el-form-item label="验证码" :error="errors.code">
        <div class="code-row">
          <el-input
            v-model="form.code"
            placeholder="请输入验证码"
            maxlength="6"
            class="code-input"
            @input="errors.code = ''"
          />
          <el-button
            type="primary"
            :disabled="countdown > 0 || !canSend"
            :loading="sending"
            class="send-btn"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
          </el-button>
        </div>
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
.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input {
  flex: 1;
}

.send-btn {
  flex-shrink: 0;
  min-width: 110px;
}
</style>
