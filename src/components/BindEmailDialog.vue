<template>
  <el-dialog
    v-model="visible"
    title="绑定邮箱"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="bind-email-dialog"
  >
    <div class="dialog-content">
      <div class="header-icon">
        <el-icon :size="54" color="#409EFF"><Message /></el-icon>
      </div>
      <h3 class="title">欢迎首次使用 GitHub 登录</h3>
      <p class="desc">为了保障您的账号安全及接收重要通知，请绑定您的邮箱地址。</p>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="请输入您的邮箱地址" 
            :prefix-icon="Message" 
            size="large"
          ></el-input>
        </el-form-item>
        <el-form-item prop="code" class="code-item">
          <el-input 
            v-model="form.code" 
            placeholder="请输入验证码" 
            :prefix-icon="Key" 
            size="large"
            maxlength="6"
          >
            <template #append>
              <el-button @click="sendCode" :disabled="countdown > 0" class="send-btn">
                {{ countdown > 0 ? `${countdown}s 后重试` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" size="large" :disabled="loading">暂不绑定 (退出)</el-button>
        <el-button type="primary" @click="handleBind" :loading="loading" size="large">确认绑定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const loading = ref(false)
const countdown = ref(0)
const formRef = ref<FormInstance>()

const form = reactive({
  email: '',
  code: ''
})

const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为 6 位', trigger: 'blur' }
  ]
})

const open = () => {
  visible.value = true
  form.email = ''
  form.code = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const close = () => {
  visible.value = false
}

const sendCode = async () => {
  if (!formRef.value) return
  
  // 仅校验邮箱字段
  await formRef.value.validateField('email', (isValid) => {
    if (isValid) {
      // 模拟发送验证码
      ElMessage.success('验证码已发送至您的邮箱，请注意查收')
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  })
}

const emit = defineEmits(['success', 'cancel'])

const handleBind = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 模拟绑定 API 调用
      setTimeout(() => {
        loading.value = false
        ElMessage.success('邮箱绑定成功！')
        visible.value = false
        emit('success', form.email)
      }, 1000)
    }
  })
}

const handleCancel = () => {
  ElMessage.info('已取消绑定并退出登录')
  visible.value = false
  emit('cancel')
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style scoped lang="scss">
.bind-email-dialog {
  .dialog-content {
    text-align: center;
    padding: 10px 10px 0;

    .header-icon {
      margin-bottom: 20px;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 12px 0;
    }

    .desc {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin: 0 0 30px 0;
      line-height: 1.5;
    }

    .code-item {
      margin-bottom: 10px;
      :deep(.el-input-group__append) {
        padding: 0;
        background-color: transparent;
        .send-btn {
          border: none;
          height: 100%;
          width: 120px;
          border-radius: 0 4px 4px 0;
          color: var(--el-color-primary);
          &:disabled {
            color: var(--el-text-color-placeholder);
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding-top: 10px;
    padding-bottom: 10px;
    
    .el-button {
      width: 140px;
      border-radius: 8px;
    }
  }
}
</style>
