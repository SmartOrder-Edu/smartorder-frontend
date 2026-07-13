<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-gradient"></div>
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-blob blob-3"></div>
      <div class="bg-particles">
        <span v-for="i in 40" :key="i" class="particle" :style="getParticleStyle(i)"></span>
      </div>
    </div>

    <div class="login-container">
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

          <!-- 主标题 -->
          <h2 class="main-title">
            <span class="title-line">让 AI 不止回答问题，</span>
            <span class="title-line">而是理解你、规划你、</span>
            <span class="title-line accent">陪伴你完成长期学习目标。</span>
          </h2>

          <!-- 卖点标签 -->
          <div class="feature-tags stagger-children">
            <span class="feature-tag">
              <span class="tag-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 0 10 10"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </span>
              长期学习画像
            </span>
            <span class="feature-tag">
              <span class="tag-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
              </span>
              动态学习路径
            </span>
            <span class="feature-tag">
              <span class="tag-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              多智能体协作
            </span>
            <span class="feature-tag">
              <span class="tag-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              学习效果追踪
            </span>
          </div>

          <!-- 知识图谱动画 -->
          <div class="knowledge-graph">
            <svg viewBox="0 0 400 220" class="graph-svg">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#3b5bdb"/>
                  <stop offset="100%" style="stop-color:#12b886"/>
                </linearGradient>
                <linearGradient id="nodeGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b5bdb"/>
                  <stop offset="100%" style="stop-color:#5c7cfa"/>
                </linearGradient>
                <linearGradient id="nodeGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#12b886"/>
                  <stop offset="100%" style="stop-color:#38d9a9"/>
                </linearGradient>
                <filter id="graphGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <!-- 外层光环 -->
              <circle cx="200" cy="100" r="90" fill="none" stroke="url(#lineGradient)" stroke-width="1" opacity="0.15" class="orbit-ring"/>
              <circle cx="200" cy="100" r="70" fill="none" stroke="url(#lineGradient)" stroke-width="1" opacity="0.2" class="orbit-ring" style="animation-delay: -5s"/>

              <!-- 连接线（带动画） -->
              <g class="connections" stroke="url(#lineGradient)" fill="none" stroke-width="2" stroke-linecap="round">
                <path d="M200,100 Q150,55 95,45" class="connection-path" opacity="0.7"/>
                <path d="M200,100 Q250,55 305,45" class="connection-path" opacity="0.7" style="animation-delay: 0.3s"/>
                <path d="M200,100 Q150,145 95,155" class="connection-path" opacity="0.7" style="animation-delay: 0.6s"/>
                <path d="M200,100 Q250,145 305,155" class="connection-path" opacity="0.7" style="animation-delay: 0.9s"/>
                <path d="M200,100 L200,175" class="connection-path connection-vertical" opacity="0.7" style="animation-delay: 1.2s"/>
              </g>

              <!-- 数据流动点 -->
              <g class="flow-dots">
                <circle r="3" fill="#3b5bdb" class="flow-dot" style="animation-delay: 0s">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M200,100 Q150,55 95,45"/>
                </circle>
                <circle r="3" fill="#12b886" class="flow-dot" style="animation-delay: 1.5s">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M200,100 Q250,55 305,45"/>
                </circle>
                <circle r="3" fill="#12b886" class="flow-dot" style="animation-delay: 0.5s">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M200,100 Q150,145 95,155"/>
                </circle>
                <circle r="3" fill="#3b5bdb" class="flow-dot" style="animation-delay: 2s">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M200,100 Q250,145 305,155"/>
                </circle>
                <circle r="3" fill="#5c7cfa" class="flow-dot" style="animation-delay: 1s">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M200,100 L200,175"/>
                </circle>
              </g>

              <!-- 中心节点 -->
              <g class="center-node" filter="url(#nodeGlow)">
                <circle cx="200" cy="100" r="32" fill="url(#nodeGradientBlue)"/>
                <circle cx="200" cy="100" r="32" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
                <text x="200" y="106" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="system-ui">AI</text>
              </g>

              <!-- 外围节点 -->
              <g class="outer-nodes">
                <g class="node-group" style="animation-delay: 0s">
                  <circle cx="95" cy="45" r="22" fill="url(#nodeGradientBlue)" filter="url(#graphGlow)"/>
                  <circle cx="95" cy="45" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="95" y="49" text-anchor="middle" fill="white" font-size="11" font-weight="600">画像</text>
                </g>
                <g class="node-group" style="animation-delay: 0.4s">
                  <circle cx="305" cy="45" r="22" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="305" cy="45" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="305" y="49" text-anchor="middle" fill="white" font-size="11" font-weight="600">计划</text>
                </g>
                <g class="node-group" style="animation-delay: 0.8s">
                  <circle cx="95" cy="155" r="22" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="95" cy="155" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="95" y="159" text-anchor="middle" fill="white" font-size="11" font-weight="600">任务</text>
                </g>
                <g class="node-group" style="animation-delay: 1.2s">
                  <circle cx="305" cy="155" r="22" fill="url(#nodeGradientBlue)" filter="url(#graphGlow)"/>
                  <circle cx="305" cy="155" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="305" y="159" text-anchor="middle" fill="white" font-size="11" font-weight="600">资源</text>
                </g>
                <g class="node-group" style="animation-delay: 1.6s">
                  <circle cx="200" cy="175" r="18" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="200" cy="175" r="18" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="200" y="179" text-anchor="middle" fill="white" font-size="10" font-weight="600">评估</text>
                </g>
              </g>

              <!-- 漂浮粒子 -->
              <g class="floating-particles">
                <circle cx="150" cy="70" r="2" fill="#3b5bdb" opacity="0.4" class="float-particle" style="animation-delay: 0s"/>
                <circle cx="250" cy="80" r="1.5" fill="#12b886" opacity="0.5" class="float-particle" style="animation-delay: 0.5s"/>
                <circle cx="130" cy="120" r="2" fill="#12b886" opacity="0.3" class="float-particle" style="animation-delay: 1s"/>
                <circle cx="270" cy="130" r="1.5" fill="#3b5bdb" opacity="0.4" class="float-particle" style="animation-delay: 1.5s"/>
                <circle cx="180" cy="50" r="1.5" fill="#5c7cfa" opacity="0.5" class="float-particle" style="animation-delay: 2s"/>
                <circle cx="220" cy="140" r="2" fill="#38d9a9" opacity="0.4" class="float-particle" style="animation-delay: 2.5s"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单区域 -->
      <div class="form-section">
        <div class="login-card animate-fade-in-scale">
          <!-- 卡片头部 -->
          <div class="card-header">
            <h2 class="card-title">欢迎回来</h2>
            <p class="card-subtitle">准备好继续你的学习之旅了吗？</p>
          </div>

          <!-- 登录表单 -->
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <!-- 登录方式切换 -->
            <div class="login-type-tabs">
              <button
                type="button"
                class="tab-btn"
                :class="{ active: loginType === 'password' }"
                @click="loginType = 'password'"
              >
                密码登录
              </button>
              <button
                type="button"
                class="tab-btn"
                :class="{ active: loginType === 'code' }"
                @click="loginType = 'code'"
              >
                验证码登录
              </button>
            </div>

            <!-- 账号输入 -->
            <el-form-item prop="account" class="form-item">
              <el-input
                v-model="formData.account"
                :placeholder="loginType === 'code' ? '请输入手机号' : '请输入邮箱或手机号'"
                size="large"
                clearable
              >
                <template #prefix>
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <!-- 密码输入 -->
            <el-form-item v-if="loginType === 'password'" prop="password" class="form-item">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
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

            <!-- 验证码输入 -->
            <el-form-item v-else prop="code" class="form-item">
              <el-input
                v-model="formData.code"
                placeholder="请输入验证码"
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
                    :disabled="countdown > 0"
                    @click="sendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </button>
                </template>
              </el-input>
            </el-form-item>

            <!-- 附加选项 -->
            <div class="form-options">
              <el-checkbox v-model="formData.remember" label="记住我" />
              <a href="#" class="forgot-link">忘记密码？</a>
            </div>

            <!-- 登录按钮 -->
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-btn"
              native-type="submit"
            >
              <span v-if="!loading">进入学习空间</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form>

          <!-- 第三方登录 -->
          <div class="divider">
            <span class="divider-text">或其他方式登录</span>
          </div>

          <div class="social-login">
            <button type="button" class="social-btn" title="使用GitHub登录" @click="handleGithubLogin">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub登录</span>
            </button>
          </div>

          <!-- 注册入口 -->
          <div class="register-entry">
            <span class="register-text">还没有账号？</span>
            <router-link to="/register" class="register-link">
              创建账号
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginType = ref<'password' | 'code'>('password')
const countdown = ref(0)
const loading = ref(false)
const codeLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  account: '',
  password: '',
  code: '',
  remember: false
})

// 记住我：恢复上次输入的账号
onMounted(() => {
  const saved = userStore.getRememberedAccount()
  if (saved) {
    formData.account = saved
    formData.remember = true
  }
})

const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ]
}

const getParticleStyle = (index: number) => {
  const size = Math.random() * 8 + 4
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = Math.random() * 10 + 10

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: 0.7
  }
}

const sendCode = async () => {
  if (!formData.account) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  try {
    codeLoading.value = true
    await userApi.sendEmailCode(formData.account)
    ElMessage.success('验证码已发送')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch {} finally {
    codeLoading.value = false
  }
}

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true

    if (loginType.value === 'password') {
      await userStore.login(formData.account, formData.password)
    } else {
      // 验证码登录：后端暂未提供专门接口，仍走密码登录流程
      await userStore.login(formData.account, formData.code)
    }

    // 记住我
    if (formData.remember) {
      userStore.saveRememberedAccount(formData.account)
    } else {
      userStore.clearRememberedAccount()
    }

    // 获取用户信息
    await userStore.fetchUserInfo()

    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error?.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}

// GitHub 登录相关配置
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/oauth/callback/github`

const handleGithubLogin = () => {
  if (!GITHUB_CLIENT_ID) {
    ElMessage.error('系统未配置 GitHub 登录参数')
    return
  }
  // 跳转至真实的 GitHub OAuth 授权页面 (申请 read:user 和 user:email 权限以读取私有主邮箱)
  const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=read:user%20user:email`
  window.location.href = authorizeUrl
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
}

/* 背景装饰 */
.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.login-bg .bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(11, 183, 170, 0.05) 0%,
    rgba(18, 184, 134, 0.05) 50%,
    rgba(11, 183, 170, 0.08) 100%
  );
}

.login-bg .bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.login-bg .blob-1 {
  width: 700px;
  height: 700px;
  background: rgba(11, 183, 170, 0.15);
  top: -200px;
  right: -150px;
}

.login-bg .blob-2 {
  width: 600px;
  height: 600px;
  background: rgba(18, 184, 134, 0.12);
  bottom: -150px;
  left: -100px;
}

.login-bg .blob-3 {
  width: 500px;
  height: 500px;
  background: rgba(92, 124, 250, 0.1);
  top: 40%;
  left: 25%;
}

.login-bg .bg-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.login-bg .particle {
  position: absolute;
  bottom: -10px;
  background: rgba(11, 183, 170, 0.2);
  border-radius: 50%;
  animation: floatUp 15s ease-in-out infinite;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(20px);
    opacity: 0;
  }
}

/* 容器 */
.login-container {
  display: flex;
  width: 100%;
  max-width: 1100px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl);
}

@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    padding: var(--spacing-lg);
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
  max-width: 420px;
}

/* Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.logo-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.logo-icon {
  width: 64px;
  height: 64px;
  animation: breathe 4s ease-in-out infinite;
}

.logo-icon .logo-svg {
  width: 100%;
  height: 100%;
}

.logo-icon .ring {
  animation: rotate 20s linear infinite;
  transform-origin: center;
}

.logo-icon .ring-1 {
  animation-duration: 25s;
}

.logo-icon .ring-2 {
  animation-duration: 18s;
  animation-direction: reverse;
}

.logo-icon .node {
  animation: nodeGlow 2s ease-in-out infinite;
}

.logo-text-group {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 1.75rem;
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
  font-size: 1.375rem;
  font-weight: 500;
  line-height: 1.7;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xl);
}

.main-title .title-line {
  display: block;
}

.main-title .title-line.accent {
  color: var(--primary-color);
  font-weight: 600;
}

/* 卖点标签 */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-2xl);
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--text-regular);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.feature-tag:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.1);
  transform: translateY(-2px);
}

.feature-tag .tag-icon {
  width: 16px;
  height: 16px;
  color: var(--primary-color);
}

.feature-tag .tag-icon svg {
  width: 100%;
  height: 100%;
}

/* 知识图谱 */
.knowledge-graph {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.knowledge-graph .graph-svg {
  width: 100%;
  height: auto;
}

/* 外层轨道环 */
.knowledge-graph .orbit-ring {
  animation: orbitRotate 30s linear infinite;
  transform-origin: center;
}

@keyframes orbitRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 连接线动画 */
.knowledge-graph .connection-path {
  stroke-dasharray: 8 4;
  animation: dashMove 2s linear infinite;
}

.knowledge-graph .connection-vertical {
  stroke-dasharray: 6 4;
  animation: dashMoveVertical 1.8s linear infinite;
}

@keyframes dashMove {
  to { stroke-dashoffset: -24; }
}

@keyframes dashMoveVertical {
  to { stroke-dashoffset: -20; }
}

/* 数据流动点 */
.knowledge-graph .flow-dot {
  filter: drop-shadow(0 0 4px currentColor);
}

/* 中心节点 */
.knowledge-graph .center-node {
  animation: centerPulse 3s ease-in-out infinite;
}

@keyframes centerPulse {
  0%, 100% { transform: scale(1); filter: url(#nodeGlow); }
  50% { transform: scale(1.08); filter: url(#nodeGlow); }
}

/* 外围节点 */
.knowledge-graph .node-group {
  animation: nodePulse 3s ease-in-out infinite;
  transform-origin: center;
}

.knowledge-graph .node-group:nth-child(1) { animation-delay: 0s; }
.knowledge-graph .node-group:nth-child(2) { animation-delay: 0.4s; }
.knowledge-graph .node-group:nth-child(3) { animation-delay: 0.8s; }
.knowledge-graph .node-group:nth-child(4) { animation-delay: 1.2s; }
.knowledge-graph .node-group:nth-child(5) { animation-delay: 1.6s; }

@keyframes nodePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 漂浮粒子 */
.knowledge-graph .float-particle {
  animation: floatParticle 6s ease-in-out infinite;
}

@keyframes floatParticle {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  25% { transform: translateY(-8px) translateX(4px); opacity: 0.6; }
  50% { transform: translateY(-4px) translateX(-4px); opacity: 0.4; }
  75% { transform: translateY(-12px) translateX(2px); opacity: 0.5; }
}

/* 右侧表单区域 */
.form-section {
  flex: 0 0 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

@media (max-width: 992px) {
  .form-section {
    flex: none;
    width: 100%;
    max-width: 420px;
    padding: var(--spacing-lg) 0;
  }
}

/* 登录卡片 */
.login-card {
  width: 100%;
  padding: var(--spacing-2xl);
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05),
    0 20px 25px -5px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 登录表单 */
.login-form .form-item {
  margin-bottom: var(--spacing-lg);
}

.login-form .input-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

/* 登录方式切换 */
.login-type-tabs {
  display: flex;
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: var(--spacing-lg);
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn.active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.tab-btn:hover:not(.active) {
  color: var(--text-primary);
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

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
}

.forgot-link {
  color: var(--primary-color);
}

.forgot-link:hover {
  color: var(--primary-light);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-lg) !important;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%) !important;
  border: none !important;
  transition: all var(--transition-base);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(11, 183, 170, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-lg) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-light);
}

.divider-text {
  padding: 0 var(--spacing-md);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 社交登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.social-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-base);
}

.social-btn svg {
  width: 18px;
  height: 18px;
}

.social-btn:hover {
  background: var(--background-color-base);
  border-color: var(--primary-light);
  color: var(--primary-color);
}

/* 注册入口 */
.register-entry {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  text-align: center;
  font-size: 0.875rem;
}

.register-text {
  color: var(--text-secondary);
}

.register-link {
  margin-left: var(--spacing-xs);
  color: var(--primary-color);
  font-weight: 500;
}

.register-link:hover {
  color: var(--primary-light);
  text-decoration: underline;
}

/* 动画 */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes nodeGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}
</style>
