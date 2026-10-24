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
                <radialGradient id="ambientGlow" cx="50%" cy="48%" r="62%">
                  <stop offset="0%" style="stop-color:#5c7cfa;stop-opacity:0.18"/>
                  <stop offset="48%" style="stop-color:#12b886;stop-opacity:0.08"/>
                  <stop offset="100%" style="stop-color:#12b886;stop-opacity:0"/>
                </radialGradient>
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

              <ellipse cx="200" cy="102" rx="160" ry="82" fill="url(#ambientGlow)" class="ambient-glow"/>

              <!-- 外层光环 -->
              <circle cx="200" cy="100" r="90" fill="none" stroke="url(#lineGradient)" stroke-width="1" opacity="0.15" class="orbit-ring"/>
              <circle cx="200" cy="100" r="70" fill="none" stroke="url(#lineGradient)" stroke-width="1" opacity="0.2" class="orbit-ring" style="animation-delay: -5s"/>
              <circle cx="200" cy="100" r="50" fill="none" stroke="url(#lineGradient)" stroke-width="0.8" opacity="0.12" class="orbit-ring orbit-ring-soft" style="animation-delay: -9s"/>

              <!-- 连接线（带动画） -->
              <g class="connections" stroke="url(#lineGradient)" fill="none" stroke-width="2" stroke-linecap="round">
                <path d="M200,100 Q150,55 95,45" class="connection-path" opacity="0.7"/>
                <path d="M200,100 Q250,55 305,45" class="connection-path" opacity="0.7" style="animation-delay: 0.3s"/>
                <path d="M200,100 Q150,145 95,155" class="connection-path" opacity="0.7" style="animation-delay: 0.6s"/>
                <path d="M200,100 Q250,145 305,155" class="connection-path" opacity="0.7" style="animation-delay: 0.9s"/>
              </g>

              <!-- 数据流动点 -->
              <g class="flow-dots">
                <circle r="3" fill="#3b5bdb" class="flow-dot">
                  <animate attributeName="opacity" values="0;0.9;0" dur="5.8s" begin="0s" repeatCount="indefinite"/>
                  <animateMotion dur="5.8s" begin="0s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" path="M200,100 Q150,55 95,45"/>
                </circle>
                <circle r="3" fill="#12b886" class="flow-dot">
                  <animate attributeName="opacity" values="0;0.9;0" dur="6.1s" begin="1.15s" repeatCount="indefinite"/>
                  <animateMotion dur="6.1s" begin="1.15s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" path="M200,100 Q250,55 305,45"/>
                </circle>
                <circle r="3" fill="#12b886" class="flow-dot">
                  <animate attributeName="opacity" values="0;0.82;0" dur="6.4s" begin="0.55s" repeatCount="indefinite"/>
                  <animateMotion dur="6.4s" begin="0.55s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" path="M200,100 Q150,145 95,155"/>
                </circle>
                <circle r="3" fill="#3b5bdb" class="flow-dot">
                  <animate attributeName="opacity" values="0;0.82;0" dur="6s" begin="1.75s" repeatCount="indefinite"/>
                  <animateMotion dur="6s" begin="1.75s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" path="M200,100 Q250,145 305,155"/>
                </circle>
                <circle r="2.6" fill="#5c7cfa" class="flow-dot">
                  <animate attributeName="opacity" values="0;0.78;0" dur="5.5s" begin="0.95s" repeatCount="indefinite"/>
                  <animateMotion dur="5.5s" begin="0.95s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" path="M200,132 L200,176"/>
                </circle>
              </g>

              <!-- 中心节点 -->
              <g class="center-node" filter="url(#nodeGlow)">
                <circle cx="200" cy="100" r="46" fill="#5c7cfa" opacity="0.1" class="center-aura"/>
                <circle cx="200" cy="100" r="37" fill="#12b886" opacity="0.12" class="center-aura center-aura-inner"/>
                <circle cx="200" cy="100" r="32" fill="url(#nodeGradientBlue)"/>
                <circle cx="200" cy="100" r="32" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
                <text x="200" y="106" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="system-ui">AI</text>
              </g>

              <!-- 外围节点 -->
              <g class="outer-nodes">
                <g class="node-group" style="animation-delay: 0s">
                  <circle cx="95" cy="45" r="30" fill="#5c7cfa" opacity="0.08" class="node-aura"/>
                  <circle cx="95" cy="45" r="22" fill="url(#nodeGradientBlue)" filter="url(#graphGlow)"/>
                  <circle cx="95" cy="45" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="95" y="49" text-anchor="middle" fill="white" font-size="11" font-weight="600">画像</text>
                </g>
                <g class="node-group" style="animation-delay: 0.4s">
                  <circle cx="305" cy="45" r="30" fill="#38d9a9" opacity="0.08" class="node-aura"/>
                  <circle cx="305" cy="45" r="22" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="305" cy="45" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="305" y="49" text-anchor="middle" fill="white" font-size="11" font-weight="600">计划</text>
                </g>
                <g class="node-group" style="animation-delay: 0.8s">
                  <circle cx="95" cy="155" r="30" fill="#38d9a9" opacity="0.08" class="node-aura"/>
                  <circle cx="95" cy="155" r="22" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="95" cy="155" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="95" y="159" text-anchor="middle" fill="white" font-size="11" font-weight="600">任务</text>
                </g>
                <g class="node-group" style="animation-delay: 1.2s">
                  <circle cx="305" cy="155" r="30" fill="#5c7cfa" opacity="0.08" class="node-aura"/>
                  <circle cx="305" cy="155" r="22" fill="url(#nodeGradientBlue)" filter="url(#graphGlow)"/>
                  <circle cx="305" cy="155" r="22" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="305" y="159" text-anchor="middle" fill="white" font-size="11" font-weight="600">资源</text>
                </g>
                <g class="node-group" style="animation-delay: 1.6s">
                  <circle cx="200" cy="194" r="25" fill="#38d9a9" opacity="0.08" class="node-aura"/>
                  <circle cx="200" cy="194" r="18" fill="url(#nodeGradientGreen)" filter="url(#graphGlow)"/>
                  <circle cx="200" cy="194" r="18" fill="none" stroke="white" stroke-width="1.5" opacity="0.25"/>
                  <text x="200" y="198" text-anchor="middle" fill="white" font-size="10" font-weight="600">评估</text>
                </g>
              </g>

              <path d="M200,132 L200,176" class="evaluation-link" stroke="url(#lineGradient)" fill="none" stroke-width="2.4" stroke-linecap="round"/>

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
            <button type="button" class="social-btn gitee-btn" title="使用Gitee登录" @click="handleGiteeLogin">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>
              </svg>
              <span>Gitee登录</span>
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
import { ElMessage, ElMessageBox } from 'element-plus'
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
  // 验证码请求进行中或倒计时未结束时，不再发送第二次。
  if (codeLoading.value || countdown.value > 0) return
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
  // 表单校验开始即锁定登录入口，避免连续提交并发登录。
  if (loading.value || !formRef.value) return
  loading.value = true
  try {
    await formRef.value.validate()

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

const handleGithubLogin = async () => {
  if (!GITHUB_CLIENT_ID) {
    ElMessage.error('系统未配置 GitHub 登录参数')
    return
  }
  try {
    await ElMessageBox.confirm(
      '系统需要读取您 <span style="color: #1890ff; font-weight: 500;">Github</span> 的 <span style="color: #1890ff; font-weight: 500;">用户名</span> 以及 <span style="color: #1890ff; font-weight: 500;">邮箱</span> 进行第三方登录，是否同意并继续？',
      '授权确认',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '同意',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
  } catch {
    return
  }
  try {
    // 先获取 state 防 CSRF 参数，再由后端校验
    const state = await userApi.getGithubOAuthState()
    const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=read:user%20user:email&state=${encodeURIComponent(state)}`
    window.location.href = authorizeUrl
  } catch {
    ElMessage.error('获取登录参数失败，请稍后再试')
  }
}

// Gitee 登录相关配置
const GITEE_CLIENT_ID = import.meta.env.VITE_GITEE_CLIENT_ID
const GITEE_REDIRECT_URI = import.meta.env.VITE_GITEE_REDIRECT_URI || `${window.location.origin}/oauth/callback/gitee`

const handleGiteeLogin = async () => {
  if (!GITEE_CLIENT_ID) {
    ElMessage.error('系统未配置 Gitee 登录参数')
    return
  }
  try {
    await ElMessageBox.confirm(
      '系统需要读取您 <span style="color: #1890ff; font-weight: 500;">Gitee</span> 的 <span style="color: #1890ff; font-weight: 500;">用户名</span> 以及 <span style="color: #1890ff; font-weight: 500;">邮箱</span> 进行第三方登录，是否同意并继续？',
      '授权确认',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '同意',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
  } catch {
    return
  }
  try {
    const state = await userApi.getGiteeOAuthState()
    const authorizeUrl = `https://gitee.com/oauth/authorize?client_id=${GITEE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITEE_REDIRECT_URI)}&response_type=code&scope=user_info%20emails&state=${encodeURIComponent(state)}`
    window.location.href = authorizeUrl
  } catch {
    ElMessage.error('获取登录参数失败，请稍后再试')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
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
  max-width: 1240px;
  min-height: min(100vh, 840px);
  min-height: min(100dvh, 840px);
  position: relative;
  z-index: 1;
  align-items: center;
  justify-content: space-between;
  gap: clamp(2rem, 5vw, 5rem);
  padding: clamp(1.5rem, 4vw, 4rem);
  margin: auto;
}

@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(1rem, 5vw, 2rem);
    align-items: center;
    justify-content: center;
    gap: 0;
  }
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: clamp(1rem, 3vw, 3rem) 0;
}

@media (max-width: 992px) {
  .brand-section {
    display: none;
  }
}

.brand-content {
  width: 100%;
  max-width: 520px;
  transform: translateY(clamp(1rem, 2vh, 1.75rem));
}

/* Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: clamp(1.25rem, 2.4vw, 2rem);
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
  font-size: clamp(1.25rem, 1.4vw, 1.5rem);
  font-weight: 500;
  line-height: 1.68;
  color: var(--text-dark);
  margin-bottom: clamp(1.25rem, 2.2vw, 2rem);
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  width: min(100%, 430px);
  margin-bottom: clamp(1.5rem, 3vw, 2.75rem);
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 0;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--text-regular);
  white-space: nowrap;
  box-shadow: 0 2px 8px  var(--color-shadow);
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
  max-width: 430px;
  margin: 0;
}

.knowledge-graph .graph-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  transform-box: fill-box;
  transform-origin: center;
  animation: graphBreath 8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  will-change: transform;
}

.knowledge-graph .ambient-glow {
  transform-box: fill-box;
  transform-origin: center;
  animation: ambientBreath 7.5s cubic-bezier(0.45, 0, 0.2, 1) infinite;
}

@keyframes graphBreath {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.012); }
}

@keyframes ambientBreath {
  0%, 100% { opacity: 0.72; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.04); }
}

/* 外层轨道环 */
.knowledge-graph .orbit-ring {
  animation: orbitRotate 46s linear infinite, orbitBreath 7s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.knowledge-graph .orbit-ring-soft {
  animation-duration: 58s, 8.5s;
}

@keyframes orbitRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbitBreath {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.28; }
}

/* 连接线动画 */
.knowledge-graph .connection-path {
  stroke-dasharray: 10 8;
  animation: dashMove 5.6s linear infinite, lineBreath 4.8s ease-in-out infinite;
  filter: drop-shadow(0 0 2px rgba(59, 91, 219, 0.22));
}

.knowledge-graph .connection-vertical {
  stroke-dasharray: 5 5;
  animation: dashMoveVertical 4.8s linear infinite, lineBreath 4.8s ease-in-out infinite;
}

.knowledge-graph .evaluation-link {
  opacity: 0.78;
  filter: drop-shadow(0 0 5px rgba(18, 184, 134, 0.35));
  animation: evaluationLinkBreath 4.8s ease-in-out infinite;
}

@keyframes dashMove {
  to { stroke-dashoffset: -36; }
}

@keyframes dashMoveVertical {
  to { stroke-dashoffset: -20; }
}

@keyframes lineBreath {
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.82; }
}

@keyframes evaluationLinkBreath {
  0%, 100% { opacity: 0.56; stroke-width: 2.1; }
  50% { opacity: 0.9; stroke-width: 2.6; }
}

/* 数据流动点 */
.knowledge-graph .flow-dot {
  filter: drop-shadow(0 0 6px currentColor);
}

/* 中心节点 */
.knowledge-graph .center-node {
  animation: centerPulse 5.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.knowledge-graph .center-aura {
  transform-box: fill-box;
  transform-origin: center;
  animation: auraBreath 5.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
}

.knowledge-graph .center-aura-inner {
  animation-delay: -2.2s;
}

@keyframes centerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.045); }
}

@keyframes auraBreath {
  0%, 100% { opacity: 0.06; transform: scale(0.92); }
  50% { opacity: 0.18; transform: scale(1.08); }
}

/* 外围节点 */
.knowledge-graph .node-group {
  animation: nodePulse 5.2s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.knowledge-graph .node-aura {
  transform-box: fill-box;
  transform-origin: center;
  animation: nodeAuraBreath 5.2s cubic-bezier(0.45, 0, 0.2, 1) infinite;
}

.knowledge-graph .node-group:nth-child(1) { animation-delay: 0s; }
.knowledge-graph .node-group:nth-child(2) { animation-delay: 0.4s; }
.knowledge-graph .node-group:nth-child(3) { animation-delay: 0.8s; }
.knowledge-graph .node-group:nth-child(4) { animation-delay: 1.2s; }
.knowledge-graph .node-group:nth-child(5) { animation-delay: 1.6s; }

@keyframes nodePulse {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-1px) scale(1.045); }
}

@keyframes nodeAuraBreath {
  0%, 100% { opacity: 0.04; transform: scale(0.9); }
  50% { opacity: 0.16; transform: scale(1.12); }
}

/* 漂浮粒子 */
.knowledge-graph .float-particle {
  animation: floatParticle 9s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes floatParticle {
  0%, 100% { transform: translateY(0) translateX(0) scale(0.9); opacity: 0.18; }
  35% { transform: translateY(-7px) translateX(4px) scale(1.08); opacity: 0.56; }
  70% { transform: translateY(-3px) translateX(-4px) scale(1); opacity: 0.34; }
}

@media (prefers-reduced-motion: reduce) {
  .knowledge-graph .graph-svg,
  .knowledge-graph .ambient-glow,
  .knowledge-graph .orbit-ring,
  .knowledge-graph .connection-path,
  .knowledge-graph .evaluation-link,
  .knowledge-graph .center-node,
  .knowledge-graph .center-aura,
  .knowledge-graph .node-group,
  .knowledge-graph .node-aura,
  .knowledge-graph .float-particle {
    animation: none;
  }
}

/* 右侧表单区域 */
.form-section {
  flex: 0 0 clamp(420px, 36vw, 480px);
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

@media (max-width: 992px) {
  .form-section {
    flex: none;
    width: 100%;
    max-width: 440px;
    padding: 0;
  }
}

/* 登录卡片 */
.login-card {
  width: 100%;
  padding: clamp(2rem, 3vw, 3rem);
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05),
    0 20px 25px -5px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--color-border);
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--spacing-xl);
    border-radius: var(--radius-xl);
  }
}

@media (max-height: 780px) and (min-width: 993px) {
  .login-container {
    padding-top: var(--spacing-xl);
    padding-bottom: var(--spacing-xl);
  }

  .brand-content {
    max-width: 500px;
    transform: translateY(0.75rem);
  }

  .logo-wrapper,
  .main-title,
  .feature-tags {
    margin-bottom: var(--spacing-lg);
  }

  .knowledge-graph {
    max-width: 370px;
  }

  .login-card {
    padding: var(--spacing-xl);
  }
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
  box-shadow: 0 2px 4px  var(--color-shadow);
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
  gap: var(--spacing-sm);
}

.social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) 12px;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--text-regular);
  cursor: pointer;
  white-space: nowrap;
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

.gitee-btn:hover {
  border-color: #c71d23;
  color: #c71d23;
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

<style lang="scss">
/* =============================================================
   深色模式覆盖样式 - html[data-theme='dark'] 且仅作用于 .login-page
   ============================================================= */
html[data-theme='dark'] {
  /* 登录页专用 CSS 变量 */
  --login-page-bg: #0a1e22;
  --login-panel-bg: #191d27;

  --login-input-bg: #14171d;
  --login-input-hover-bg: #181c23;
  --login-input-focus-bg: #171b22;

  --login-text-primary: #f4f6f8;
  --login-text-secondary: #aab2c0;
  --login-placeholder: #6f7887;

  --login-border: #303641;
  --login-border-hover: #424a58;
  --login-border-focus: #4f7cff;

  --login-icon-color: #8d97a8;
}

/* 整体登录页背景 - 深蓝青渐变 */
html[data-theme='dark'] .login-page {
  background:
    radial-gradient(
      circle at 30% 50%,
      rgba(25, 85, 100, 0.18),
      transparent 46%
    ),
    linear-gradient(
      135deg,
      #07171b 0%,
      #0a2023 52%,
      #082326 100%
    ) !important;
  color: var(--login-text-primary);

  /* 左侧主标题 */
  .main-title {
    color: var(--login-text-primary) !important;
  }

  .main-title .title-line.accent {
    color: var(--primary-color) !important;
  }

  /* Logo 副标题 */
  .logo-subtitle {
    color: var(--login-text-secondary) !important;
  }

  /* 四个功能标签 */
  .feature-tag {
    background: #171c22 !important;
    color: #cbd3de !important;
    border: 1px solid #303742 !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22) !important;

    &:hover {
      background: #20262f !important;
      color: #f5f7fa !important;
      border-color: #414956 !important;
    }
  }

  .feature-tag .tag-icon {
    color: #16c6bd !important;
  }

  /* 登录卡片 */
  .login-card {
    background: #191d27 !important;
    color: var(--login-text-primary) !important;
    border: 1px solid #2d3440 !important;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.42) !important;
  }

  .card-title {
    color: var(--login-text-primary) !important;
  }

  .card-subtitle {
    color: var(--login-text-secondary) !important;
  }

  /* 记住我 */
  .el-checkbox {
    --el-checkbox-text-color: var(--login-text-secondary) !important;
    --el-checkbox-font-weight: 500 !important;

    &.is-checked {
      .el-checkbox__label {
        color: var(--login-border-focus) !important;
      }
      .el-checkbox__inner {
        background-color: var(--login-border-focus) !important;
        border-color: var(--login-border-focus) !important;
      }
    }

    .el-checkbox__inner {
      background-color: transparent !important;
      border-color: var(--login-border) !important;
    }
  }

  /* 链接 */
  .forgot-link {
    color: var(--login-text-secondary) !important;
    &:hover {
      color: var(--login-border-focus) !important;
    }
  }

  .register-text {
    color: var(--login-text-secondary) !important;
  }

  .register-link {
    color: var(--login-border-focus) !important;
    &:hover {
      color: #7fa4ff !important;
    }
  }

  /* 登录方式切换区域 */
  .login-type-tabs {
    background: var(--login-input-bg) !important;
  }

  .tab-btn {
    color: var(--login-text-secondary) !important;
    &:hover:not(.active) {
      color: var(--login-text-primary) !important;
    }
  }

  .tab-btn.active {
    background: #20242e !important;
    color: var(--login-border-focus) !important;
    box-shadow: none !important;
  }

  /* 第三方登录按钮 */
  .social-btn {
    background: transparent !important;
    color: var(--login-text-secondary) !important;
    border: 1px solid var(--login-border) !important;

    &:hover {
      background: var(--login-input-hover-bg) !important;
      border-color: var(--login-border-hover) !important;
      color: var(--login-text-primary) !important;
    }
  }

  /* 普通输入框 */
  .el-input:not(.el-input-group) .el-input__wrapper {
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    height: 44px !important;
    padding: 0 !important;

    background: var(--login-input-bg) !important;
    border: 1px solid var(--login-border) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    overflow: hidden !important;

    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease !important;

    &:hover {
      background: var(--login-input-hover-bg) !important;
      border-color: var(--login-border-hover) !important;
      box-shadow: none !important;
    }

    &.is-focus {
      background: var(--login-input-focus-bg) !important;
      border-color: var(--login-border-focus) !important;
      box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.14) !important;
    }
  }

  .el-input__inner {
    flex: 1 !important;
    min-width: 0 !important;
    height: 100% !important;
    padding: 0 12px !important;

    background: transparent !important;
    color: var(--login-text-primary) !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;

    &::placeholder {
      color: var(--login-placeholder) !important;
    }
  }

  /* 输入框前后缀容器透明化 */
  .el-input__prefix,
  .el-input__suffix {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 42px !important;
    height: 100% !important;
    flex-shrink: 0 !important;
    background: transparent !important;
    color: var(--login-icon-color) !important;
    border: none !important;
  }

  .el-input__prefix-inner,
  .el-input__suffix-inner {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: none !important;
    color: inherit !important;
  }

  /* 清除按钮及密码切换按钮 */
  .el-input__suffix-inner button,
  .el-input__suffix-inner svg {
    background: transparent !important;
    color: var(--login-icon-color) !important;
    border: none !important;
    box-shadow: none !important;

    &:hover {
      color: var(--login-text-primary) !important;
    }
  }

  .input-icon {
    color: var(--login-icon-color) !important;
  }

  /* 验证码输入框 (带 append) */
  .el-input-group--append {
    display: inline-flex !important;
    width: 100% !important;
    height: 44px !important;
    border-radius: 12px !important;
    border: 1px solid var(--login-border) !important;
    background: var(--login-input-bg) !important;
    overflow: hidden !important;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease !important;

    &:hover {
      background: var(--login-input-hover-bg) !important;
      border-color: var(--login-border-hover) !important;
    }

    &:focus-within {
      background: var(--login-input-focus-bg) !important;
      border-color: var(--login-border-focus) !important;
      box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.14) !important;
    }

    .el-input__wrapper {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      height: 100% !important;
      border-radius: 0 !important;
    }

    .el-input-group__append {
      background: transparent !important;
      border: none !important;
      border-left: 1px solid var(--login-border) !important;
      border-radius: 0 !important;
      height: 100% !important;
      padding: 0 var(--spacing-md) !important;
      display: flex !important;
      align-items: center !important;

      button.send-code-btn {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
        color: var(--login-border-focus) !important;
        font-weight: 500 !important;

        &:hover:not(:disabled) {
          color: #7fa4ff !important;
        }

        &:disabled {
          color: var(--login-placeholder) !important;
        }
      }
    }
  }

  /* 自动填充处理 */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-text-fill-color: var(--login-text-primary) !important;
    caret-color: var(--login-text-primary);
    -webkit-box-shadow: 0 0 0 1000px var(--login-input-bg) inset !important;
    box-shadow: 0 0 0 1000px var(--login-input-bg) inset !important;
    transition: background-color 9999s ease-out 0s;
  }

  /* Logo 样式适配 */
  .logo-wrapper {
    display: flex;
    align-items: center;
    background: transparent !important;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .logo-img {
    display: block;
    width: auto;
    height: 66px;
    object-fit: contain;

    background: transparent !important;
    border: none;
    box-shadow: none;
    filter: none !important;
    mix-blend-mode: normal;
  }
}
</style>
