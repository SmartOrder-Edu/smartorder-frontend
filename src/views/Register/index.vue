<template>
  <div class="register-page">
    <!-- 背景装饰 -->
    <div class="register-bg">
      <div class="bg-gradient"></div>
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>

    <!-- 注册成功过渡动画 -->
    <transition name="fade">
      <div v-if="showTransition" class="transition-overlay">
        <div class="transition-content">
          <div class="transition-agent-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <h2 class="transition-title">欢迎加入知序智学！</h2>
          <p class="transition-text">正在为你准备个性化学习体验...</p>
          <div class="transition-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </transition>

    <div class="register-container">
      <!-- 移动端顶部简栏 -->
      <div class="mobile-header">
        <img src="/logo.png" alt="知序智学" class="mobile-logo" />
      </div>

      <!-- 左侧品牌区域 -->
      <div class="brand-section animate-fade-in">
        <div class="brand-content">
          <!-- Logo -->
          <div class="logo-wrapper">
            <img src="/logo.png" alt="知序智学" class="logo-img" />
            <div class="logo-text-group">
              <h1 class="logo-text gradient-text">知序智学</h1>
              <span class="logo-subtitle">个性化学习平台</span>
            </div>
          </div>

          <!-- 品牌文案 -->
          <h2 class="main-title">
            开始你的<br/>
            <span class="accent">智能学习之旅</span>
          </h2>
          <p class="description">
            快速创建账号，开启 AI 驱动的个性化学习体验。
            注册后只需简单几步，AI 就能更懂你。
          </p>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="form-section">
        <div class="register-card animate-fade-in-scale">
          <!-- 注册表单 -->
          <div class="step-content">
            <div class="card-header">
              <div class="card-header-row">
                <router-link to="/login" class="back-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  返回登录
                </router-link>
              </div>
              <h2 class="card-title">创建学习账户</h2>
              <p class="card-subtitle">只需几步，开启你的 AI 学习之旅</p>
            </div>

            <el-form
              ref="formRef"
              :model="formData"
              :rules="rules"
              class="register-form"
              @submit.prevent="handleNext"
            >
              <!-- 昵称 -->
              <el-form-item prop="nickname" class="form-item">
                <el-input
                  v-model="formData.nickname"
                  placeholder="给自己起个昵称"
                  size="large"
                >
                  <template #prefix>
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 邮箱 -->
              <el-form-item prop="email" class="form-item">
                <el-input
                  v-model="formData.email"
                  placeholder="输入邮箱地址"
                  size="large"
                >
                  <template #prefix>
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 验证码 -->
              <el-form-item prop="verificationCode" class="form-item">
                <div class="code-input-row">
                  <el-input
                    v-model="formData.verificationCode"
                    placeholder="输入邮箱验证码"
                    size="large"
                    maxlength="6"
                  >
                    <template #prefix>
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </template>
                  </el-input>
                  <button
                    type="button"
                    class="send-code-btn"
                    :disabled="countdown > 0 || codeLoading"
                    @click="sendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </button>
                </div>
              </el-form-item>

              <!-- 密码 -->
              <el-form-item prop="password" class="form-item">
                <el-input
                  v-model="formData.password"
                  type="password"
                  placeholder="设置密码（至少8位，含大小写字母和数字）"
                  size="large"
                  show-password
                >
                  <template #prefix>
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </template>
                </el-input>
                <!-- 密码强度指示器 -->
                <div v-if="formData.password" class="password-strength">
                  <div class="strength-bar">
                    <div
                      class="strength-fill"
                      :class="passwordStrength.level"
                      :style="{ width: passwordStrength.percent + '%' }"
                    ></div>
                  </div>
                  <span class="strength-text" :class="passwordStrength.level">{{ passwordStrength.label }}</span>
                </div>
                <div v-if="formData.password" class="password-checks">
                  <span class="check-item" :class="{ passed: passwordChecks.length }">
                    {{ passwordChecks.length ? '✓' : '○' }} 至少8位
                  </span>
                  <span class="check-item" :class="{ passed: passwordChecks.upper }">
                    {{ passwordChecks.upper ? '✓' : '○' }} 含大写字母
                  </span>
                  <span class="check-item" :class="{ passed: passwordChecks.lower }">
                    {{ passwordChecks.lower ? '✓' : '○' }} 含小写字母
                  </span>
                  <span class="check-item" :class="{ passed: passwordChecks.digit }">
                    {{ passwordChecks.digit ? '✓' : '○' }} 含数字
                  </span>
                </div>
              </el-form-item>

              <!-- 确认密码 -->
              <el-form-item prop="confirmPassword" class="form-item">
                <el-input
                  v-model="formData.confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  size="large"
                  show-password
                >
                  <template #prefix>
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9,12 11,14 15,10"/>
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 服务条款 -->
              <div class="terms-check">
                <el-checkbox v-model="formData.agreeTerms">
                  <span class="terms-text">
                    我已阅读并同意
                    <a href="#" class="terms-link">《用户服务协议》</a>
                    和
                    <a href="#" class="terms-link">《隐私政策》</a>
                  </span>
                </el-checkbox>
              </div>

              <!-- 注册按钮 -->
              <el-button
                type="primary"
                size="large"
                class="next-btn"
                :loading="loading"
                @click="handleRegister"
              >
                立即注册
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </el-button>
            </el-form>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)
const formRef = ref<FormInstance>()
const showTransition = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const formData = reactive({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 密码强度计算
const passwordChecks = computed(() => ({
  length: formData.password.length >= 8,
  upper: /[A-Z]/.test(formData.password),
  lower: /[a-z]/.test(formData.password),
  digit: /\d/.test(formData.password)
}))

const passwordStrength = computed(() => {
  const checks = passwordChecks.value
  const score = [checks.length, checks.upper, checks.lower, checks.digit].filter(Boolean).length
  if (score <= 1) return { level: 'weak', label: '弱', percent: 25 }
  if (score === 2) return { level: 'weak', label: '较弱', percent: 50 }
  if (score === 3) return { level: 'medium', label: '中等', percent: 75 }
  return { level: 'strong', label: '强', percent: 100 }
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateEmail = (_rule: any, value: string, callback: any) => {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: '密码需包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const sendCode = async () => {
  if (!formData.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(formData.email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  try {
    codeLoading.value = true
    await userApi.sendEmailCode(formData.email)
    ElMessage.success('验证码已发送到您的邮箱')
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error?.message || '验证码发送失败，请稍后重试')
  } finally {
    codeLoading.value = false
  }
}

const handleNext = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (!formData.agreeTerms) {
      ElMessage.warning('请先同意服务条款')
      return
    }
    handleRegister()
  } catch {}
}

const handleRegister = async () => {
  loading.value = true
  try {
    await userStore.register({
      username: formData.nickname,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      verificationCode: formData.verificationCode
    })
    // 显示过渡动画
    showTransition.value = true
    // 注册成功后自动登录
    await userStore.login(formData.email, formData.password)
    await userStore.fetchUserInfo()
    // 延迟跳转，让过渡动画展示
    setTimeout(() => {
      router.push('/onboarding')
    }, 2000)
  } catch (error: any) {
    showTransition.value = false
    ElMessage.error(error?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
}

/* 背景装饰 */
.register-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.register-bg .bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(59, 91, 219, 0.05) 0%,
    rgba(18, 184, 134, 0.05) 100%
  );
}

.register-bg .bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.register-bg .blob-1 {
  width: 500px;
  height: 500px;
  background: rgba(18, 184, 134, 0.12);
  top: -150px;
  right: -100px;
}

.register-bg .blob-2 {
  width: 400px;
  height: 400px;
  background: rgba(59, 91, 219, 0.1);
  bottom: -100px;
  left: -50px;
}

/* 注册过渡动画 */
.transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.transition-content {
  text-align: center;
}

.transition-agent-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-lg);
  border-radius: 50%;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
}

.transition-agent-avatar svg {
  width: 48px;
  height: 48px;
  color: white;
}

.transition-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

.transition-text {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.transition-dots {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.transition-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.transition-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.transition-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* 移动端顶部简栏 */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: var(--spacing-sm) var(--spacing-md);
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
}

.mobile-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.mobile-steps {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.mobile-step {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color-base);
  border: 2px solid var(--border-light);
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.mobile-step.active {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border-color: transparent;
  color: white;
}

.mobile-step.completed {
  background: #12b886;
  border-color: #12b886;
  color: white;
}

.mobile-step-line {
  width: 20px;
  height: 2px;
  background: var(--border-light);
  transition: background var(--transition-base);
}

.mobile-step-line.active {
  background: linear-gradient(90deg, #12b886 0%, #3b5bdb 100%);
}

@media (max-width: 992px) {
  .mobile-header {
    display: flex;
  }
}

/* 容器 */
.register-container {
  display: flex;
  width: 100%;
  max-width: 1100px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl);
  align-items: stretch;
}

@media (max-width: 992px) {
  .register-container {
    flex-direction: column;
    padding: var(--spacing-md);
    padding-top: 60px;
    align-items: center;
    justify-content: center;
  }
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
}

@media (max-width: 992px) {
  .brand-section {
    display: none;
  }
}

.brand-content {
  max-width: 380px;
  width: 100%;
}

/* 返回链接 */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: color var(--transition-base);
}

.back-link svg {
  width: 16px;
  height: 16px;
}

.back-link:hover {
  color: var(--primary-color);
}

/* 跳过画像入口 */
.skip-profile-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-left: auto;
  transition: color var(--transition-base);
}

.skip-profile-link:hover {
  color: var(--primary-color);
}

/* Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.logo-icon {
  width: 52px;
  height: 52px;
  animation: breathe 4s ease-in-out infinite;
}

.logo-icon .logo-svg {
  width: 100%;
  height: 100%;
}

.logo-text-group {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* 主标题 */
.main-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.4;
  margin-bottom: var(--spacing-lg);
}

.main-title .accent {
  background: linear-gradient(135deg, #12b886 0%, #38d9a9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 描述 */
.description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: var(--spacing-2xl);
}

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  align-items: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.step-item .step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--background-color-base);
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.step-item .step-number svg {
  width: 18px;
  height: 18px;
}

.step-item .step-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  transition: color var(--transition-base);
}

.step-item.active .step-number {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border-color: transparent;
  color: white;
}

.step-item.active .step-label {
  color: var(--text-dark);
}

.step-item.completed .step-number {
  background: #12b886;
  border-color: #12b886;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border-light);
  margin: 0 var(--spacing-md);
  transition: background var(--transition-base);
}

.step-line.active {
  background: linear-gradient(90deg, #12b886 0%, #3b5bdb 100%);
}

/* 右侧表单区域 */
.form-section {
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

@media (max-width: 992px) {
  .form-section {
    flex: none;
    width: 100%;
    max-width: 440px;
    padding: var(--spacing-lg) 0;
  }
}

/* 注册卡片 */
.register-card {
  width: 100%;
  max-width: 440px;
  padding: var(--spacing-xl);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.card-header-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #ef4444;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.strong {
  background: #12b886;
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
}

.strength-text.weak {
  color: #ef4444;
}

.strength-text.medium {
  color: #f59e0b;
}

.strength-text.strong {
  color: #12b886;
}

.password-checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.check-item {
  font-size: 0.6875rem;
  color: var(--text-muted);
  transition: color var(--transition-base);
}

.check-item.passed {
  color: #12b886;
}

/* 表单 */
.register-form .form-item {
  margin-bottom: var(--spacing-md);
}

.register-form :deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 0.75rem;
}

.register-form .input-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

/* 验证码输入行 */
.code-input-row {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
}

.code-input-row .el-input {
  flex: 1;
}

@media (max-width: 480px) {
  .code-input-row {
    flex-direction: column;
  }
  .send-code-btn {
    width: 100%;
  }
}

/* 发送验证码按钮 */
.send-code-btn {
  flex-shrink: 0;
  padding: 0 var(--spacing-md);
  height: 40px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary-color);
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-base);
}

.send-code-btn:disabled {
  color: var(--text-muted);
  border-color: var(--border-light);
  background: var(--background-color-base);
  cursor: not-allowed;
}

.send-code-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

/* 服务条款 */
.terms-check {
  margin-bottom: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.terms-check .terms-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.terms-link {
  color: var(--primary-color);
}

.terms-link:hover {
  text-decoration: underline;
}

/* 下一步按钮 */
.next-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-lg) !important;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%) !important;
  border: none !important;
  transition: all var(--transition-base);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: var(--spacing-sm) !important;
  margin-top: var(--spacing-md);
}

.next-btn svg {
  width: 18px;
  height: 18px;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 91, 219, 0.3);
}

/* Agent 引导 */
.agent-greeting {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  text-align: left;
}

.agent-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.agent-avatar svg {
  width: 100%;
  height: 100%;
  color: white;
}

.agent-bubble {
  background: #f0f4ff;
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  position: relative;
}

.agent-bubble p {
  margin: 0;
}

/* 进度指示器 (步进点) */
.profile-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.progress-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  background: white;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all var(--transition-base);
  padding: 0;
}

.progress-dot svg {
  width: 14px;
  height: 14px;
}

.progress-dot.completed {
  background: #12b886;
  border-color: #12b886;
  color: white;
  cursor: pointer;
}

.progress-dot.active {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border-color: transparent;
  color: white;
}

.progress-dot.upcoming {
  opacity: 0.5;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* 画像表单 */
.profile-form .question-block {
  margin-bottom: var(--spacing-md);
}

.profile-form .question-block:last-of-type {
  margin-bottom: var(--spacing-sm);
}

.profile-header {
  margin-bottom: var(--spacing-lg) !important;
}

.question-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
}

.question-title .question-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  color: white;
  font-size: 0.6875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 问题操作区（下一步 + 跳过） */
.question-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.skip-btn {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-base);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.skip-btn:hover {
  color: var(--primary-color);
}

/* 子问题（年级、截止时间） */
.sub-question {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--border-light);
}

.sub-question-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.optional-tag {
  display: inline-block;
  font-size: 0.625rem;
  color: var(--text-muted);
  background: var(--background-color-base);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  margin-left: var(--spacing-xs);
  font-weight: 400;
}

/* 选项卡片 */
.option-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

@media (max-width: 480px) {
  .option-cards {
    grid-template-columns: 1fr;
  }
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-sm);
  background: var(--background-color-base);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.option-card .option-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.option-card .option-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.option-card .option-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-regular);
}

.option-card:hover {
  background: white;
  border-color: var(--border-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.option-card.selected {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
}

.option-card.selected .option-label {
  color: var(--primary-color);
}

/* 选项胶囊 */
.option-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.option-chip {
  padding: 6px var(--spacing-md);
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-base);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chip-emoji {
  font-size: 0.875rem;
}

.option-chip:hover {
  background: white;
  border-color: var(--border-light);
  color: var(--text-primary);
}

.option-chip.selected {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* 带描述的选项胶囊 */
.option-chips--described {
  flex-direction: column;
  gap: var(--spacing-xs);
}

.option-chip--described {
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.chip-main {
  font-weight: 500;
}

.chip-desc {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.option-chip--described.selected .chip-desc {
  color: rgba(255, 255, 255, 0.8);
}

/* 时间选项 */
.option-chip--time {
  min-width: 100px;
  justify-content: center;
}

/* Q6 提示标签 */
.hint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.hint-tag {
  font-size: 0.6875rem;
  color: var(--primary-color);
  background: #f0f4ff;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

/* 自由描述输入 */
.self-description-input :deep(.el-textarea__inner) {
  border-radius: var(--radius-lg);
  background: var(--background-color-base);
  border: 2px solid transparent;
  transition: all var(--transition-base);
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
}

.self-description-input :deep(.el-textarea__inner:focus) {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
}

.self-description-input :deep(.el-textarea__inner:hover) {
  background: white;
  border-color: var(--border-light);
}

.self-description-input :deep(.el-input__count) {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.btn-group .el-button {
  flex: 1;
  height: 48px;
  font-size: 1rem;
  border-radius: var(--radius-lg) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: var(--spacing-sm) !important;
}

.btn-group .el-button svg {
  width: 18px;
  height: 18px;
}

.btn-group .back-btn {
  background: var(--background-color-base) !important;
  border: 1px solid var(--border-light) !important;
  color: var(--text-regular) !important;
}

.btn-group .back-btn:hover {
  background: white !important;
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.btn-group .create-btn {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%) !important;
  border: none !important;
}

.btn-group .create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 91, 219, 0.3);
}

/* 补充说明输入框（视觉降级） */
.detail-input-wrapper {
  margin-top: var(--spacing-md);
}

.detail-input-wrapper :deep(.el-input__wrapper) {
  border-radius: var(--radius-lg);
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid var(--border-light);
  box-shadow: none !important;
  transition: all var(--transition-base);
}

.detail-input-wrapper :deep(.el-input__wrapper:hover) {
  background: white;
  border-color: var(--primary-color);
}

.detail-input-wrapper :deep(.el-input__wrapper.is-focus) {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1) !important;
}

.detail-input-wrapper :deep(.el-input__count) {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.detail-input-wrapper.is-required :deep(.el-input__wrapper) {
  border-color: var(--border-light);
}

/* 下一题按钮 */
.next-question-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 44px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.next-question-btn svg {
  width: 16px;
  height: 16px;
}

.next-question-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 91, 219, 0.3);
}

.next-question-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 画像进度条 (保留旧样式兼容) */
.profile-progress-bar {
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  margin-top: 1.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from {
  transform: translateX(15px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-15px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.submit-btn-group {
  margin-top: 2rem;
}

.full-width {
  width: 100%;
}

/* 动画 */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
}
</style>
