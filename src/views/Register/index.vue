<template>
  <div class="register-page">
    <!-- 背景装饰 -->
    <div class="register-bg">
      <div class="bg-gradient"></div>
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>

    <div class="register-container">
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

          <!-- 标题 -->
          <h2 class="main-title">
            开始你的<br/>
            <span class="accent">智能学习之旅</span>
          </h2>

          <p class="description">
            创建账号后，我们将通过简单的问答为你构建专属的学习画像，
            让 AI 更懂你，提供更精准的学习规划。
          </p>

          <!-- 步骤指示 -->
          <div class="steps-indicator">
            <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
              <div class="step-number">
                <svg v-if="currentStep > 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span v-else>1</span>
              </div>
              <span class="step-label">创建账户</span>
            </div>
            <div class="step-line" :class="{ active: currentStep > 1 }"></div>
            <div class="step-item" :class="{ active: currentStep >= 2 }">
              <div class="step-number">2</div>
              <span class="step-label">学习画像</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="form-section">
        <div class="register-card animate-fade-in-scale">
          <!-- 步骤1：基础注册 -->
          <div v-show="currentStep === 1" class="step-content">
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
                  <template #append>
                    <button
                      type="button"
                      class="send-code-btn"
                      :disabled="countdown > 0 || codeLoading"
                      @click="sendCode"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                    </button>
                  </template>
                </el-input>
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

              <!-- 下一步按钮 -->
              <el-button
                type="primary"
                size="large"
                class="next-btn"
                native-type="submit"
              >
                下一步：初始化学习画像
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </el-button>
            </el-form>
          </div>

          <!-- 步骤2：学习画像初始化 -->
          <div v-show="currentStep === 2" class="step-content">
            <div class="card-header">
              <h2 class="card-title">先让我了解一下你</h2>
              <p class="card-subtitle">知序智学会根据你的目标，为你生成第一版学习路径</p>
            </div>

            <div class="profile-form">
              <!-- 身份选择 -->
              <div class="question-block">
                <h3 class="question-title">
                  <span class="question-num">1</span>
                  你目前的身份是？
                </h3>
                <div class="option-cards">
                  <button
                    v-for="item in identityOptions"
                    :key="item.value"
                    type="button"
                    class="option-card"
                    :class="{ selected: profileData.identity === item.value }"
                    @click="profileData.identity = item.value"
                  >
                    <span class="option-icon" v-html="item.icon"></span>
                    <span class="option-label">{{ item.label }}</span>
                  </button>
                </div>
              </div>

              <!-- 学习方向 -->
              <div class="question-block">
                <h3 class="question-title">
                  <span class="question-num">2</span>
                  你想学习的方向是？
                </h3>
                <div class="option-chips">
                  <button
                    v-for="item in directionOptions"
                    :key="item.value"
                    type="button"
                    class="option-chip"
                    :class="{ selected: profileData.direction === item.value }"
                    @click="profileData.direction = item.value"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>

              <!-- 当前基础 -->
              <div class="question-block">
                <h3 class="question-title">
                  <span class="question-num">3</span>
                  你的当前基础如何？
                </h3>
                <div class="option-chips">
                  <button
                    v-for="item in levelOptions"
                    :key="item.value"
                    type="button"
                    class="option-chip"
                    :class="{ selected: profileData.level === item.value }"
                    @click="profileData.level = item.value"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>

              <!-- 近期目标 -->
              <div class="question-block">
                <h3 class="question-title">
                  <span class="question-num">4</span>
                  你近期目标是什么？
                </h3>
                <div class="option-chips">
                  <button
                    v-for="item in goalOptions"
                    :key="item.value"
                    type="button"
                    class="option-chip"
                    :class="{ selected: profileData.goal === item.value }"
                    @click="profileData.goal = item.value"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>

              <!-- 自由描述 -->
              <div class="question-block">
                <h3 class="question-title">
                  <span class="question-num">5</span>
                  或者，用一段话介绍你自己（选填）
                </h3>
                <p class="question-hint">
                  告诉AI你的专业背景、每天学习时间、擅长和不擅长的领域……系统会根据你的描述，为你构建更精准的学习画像。
                </p>
                <el-input
                  v-model="profileData.selfDescription"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  show-word-limit
                  placeholder="例如：我是计算机专业大三学生，每天有2小时学习时间，Python比较熟但对算法不太熟悉，最近在准备操作系统考试..."
                  class="self-description-input"
                />
              </div>

              <!-- 按钮组 -->
              <div class="btn-group">
                <el-button size="large" class="back-btn" @click="currentStep = 1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  上一步
                </el-button>
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  class="create-btn"
                  @click="handleRegister"
                >
                  生成我的学习路径
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(1)
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)
const formRef = ref<FormInstance>()

const formData = reactive({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const profileData = reactive({
  identity: '',
  direction: '',
  level: '',
  goal: '',
  selfDescription: ''
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

const identityOptions = [
  { value: 'undergraduate', label: '本科生', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
  { value: 'graduate', label: '研究生', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
  { value: 'self', label: '自学者', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>' },
  { value: 'career', label: '转专业学习', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>' }
]

const directionOptions = [
  { value: 'ai', label: '人工智能' },
  { value: 'cs', label: '计算机基础' },
  { value: 'os', label: '操作系统' },
  { value: 'ds', label: '数据结构' },
  { value: 'ee', label: '电子信息' },
  { value: 'other', label: '其他方向' }
]

const levelOptions = [
  { value: 'beginner', label: '刚入门' },
  { value: 'some', label: '学过一点' },
  { value: 'course', label: '有课程基础' },
  { value: 'advanced', label: '想系统进阶' }
]

const goalOptions = [
  { value: 'exam', label: '通过考试' },
  { value: 'project', label: '完成课程项目' },
  { value: 'skill', label: '掌握一门技术' },
  { value: 'competition', label: '准备竞赛/科研' }
]

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
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch {} finally {
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
    currentStep.value = 2
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
      verificationCode: formData.verificationCode,
      identity: profileData.identity || undefined,
      direction: profileData.direction || undefined,
      level: profileData.level || undefined,
      goal: profileData.goal || undefined,
      selfDescription: profileData.selfDescription || undefined
    })
    ElMessage.success('注册成功，正在登录...')
    // 注册成功后自动登录
    await userStore.login(formData.email, formData.password)
    await userStore.fetchUserInfo()
    router.push('/dashboard')
  } catch (error: any) {
    ElMessage.error(error?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
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

/* 发送验证码按钮 */
.send-code-btn {
  padding: 0 var(--spacing-md);
  font-size: 0.875rem;
  color: var(--primary-color);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.send-code-btn:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

.send-code-btn:hover:not(:disabled) {
  color: var(--primary-light);
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

/* 画像表单 */
.profile-form .question-block {
  margin-bottom: var(--spacing-lg);
}

.profile-form .question-block:last-of-type {
  margin-bottom: var(--spacing-md);
}

.question-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

.question-title .question-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  color: white;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 选项卡片 */
.option-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
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
  font-size: 0.8125rem;
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
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-base);
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

/* 自由描述输入 */
.question-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

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
  margin-top: var(--spacing-lg);
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

/* 动画 */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
}
</style>
