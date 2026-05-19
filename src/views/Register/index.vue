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
          <p class="transition-text">AI 导师正在根据你的回答构建学习画像...</p>
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
        <div class="mobile-steps">
          <span class="mobile-step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">1</span>
          <span class="mobile-step-line" :class="{ active: currentStep > 1 }"></span>
          <span class="mobile-step" :class="{ active: currentStep >= 2 }">2</span>
        </div>
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

          <!-- Step 1 品牌文案 -->
          <template v-if="currentStep === 1">
            <h2 class="main-title">
              开始你的<br/>
              <span class="accent">智能学习之旅</span>
            </h2>
            <p class="description">
              创建账号后，我们将通过简单的问答为你构建专属的学习画像，
              让 AI 更懂你，提供更精准的学习规划。
            </p>
          </template>

          <!-- Step 2 品牌文案 -->
          <template v-else>
            <h2 class="main-title">
              AI 导师正在<br/>
              <span class="accent">了解你</span>
            </h2>
            <p class="description">
              回答几个简单的问题，AI 就能为你量身定制学习路径和资源推荐。
              每个问题都可以跳过，之后随时补充。
            </p>
          </template>

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
            <div class="card-header profile-header">
              <div class="card-header-row" v-if="profileStep === 1">
                <a href="javascript:void(0)" class="back-link" @click="currentStep = 1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  返回账号注册
                </a>
                <!-- 跳过画像入口 -->
                <a href="javascript:void(0)" class="skip-profile-link" @click="skipProfile">
                  稍后再说
                </a>
              </div>
              <div class="card-header-row" v-else>
                <a href="javascript:void(0)" class="back-link" @click="profileStep--">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  上一题
                </a>
              </div>

              <!-- Agent 引导 -->
              <div class="agent-greeting">
                <div class="agent-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <div class="agent-bubble">
                  <p>{{ agentGreetingText }}</p>
                </div>
              </div>

              <!-- 进度指示器 -->
              <div class="profile-progress">
                <div class="progress-dots">
                  <button
                    v-for="i in totalProfileSteps"
                    :key="i"
                    class="progress-dot"
                    :class="{
                      active: i === profileStep,
                      completed: i < profileStep,
                      upcoming: i > profileStep
                    }"
                    @click="i < profileStep && (profileStep = i)"
                    :disabled="i > profileStep"
                  >
                    <svg v-if="i < profileStep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    <span v-else>{{ i }}</span>
                  </button>
                </div>
                <span class="progress-text">{{ profileStep }}/{{ totalProfileSteps }}</span>
              </div>
            </div>

            <div class="profile-form">
              <transition name="slide-fade" mode="out-in">
                <!-- Q1: 身份选择 -->
                <div v-if="profileStep === 1" key="q1" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">1</span>
                    你目前的身份是？
                  </h3>
                  <div class="option-cards" role="radiogroup" aria-label="身份选择">
                    <button
                      v-for="item in identityOptions"
                      :key="item.value"
                      type="button"
                      class="option-card"
                      :class="{ selected: profileData.identity === item.value }"
                      role="radio"
                      :aria-checked="profileData.identity === item.value"
                      @click="selectOption('identity', item.value)"
                    >
                      <span class="option-icon" v-html="item.icon"></span>
                      <span class="option-label">{{ item.label }}</span>
                    </button>
                  </div>
                  <!-- 年级追问 -->
                  <transition name="slide-fade">
                    <div v-if="profileData.identity && gradeOptions.length" class="sub-question">
                      <p class="sub-question-label">你的年级是？<span class="optional-tag">选填</span></p>
                      <div class="option-chips">
                        <button
                          v-for="item in gradeOptions"
                          :key="item.value"
                          type="button"
                          class="option-chip"
                          :class="{ selected: profileData.grade === item.value }"
                          @click="profileData.grade = item.value"
                        >
                          {{ item.label }}
                        </button>
                      </div>
                    </div>
                  </transition>
                  <div class="question-actions">
                    <button
                      type="button"
                      class="next-question-btn"
                      :disabled="!profileData.identity"
                      @click="profileStep++"
                    >
                      下一步
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <button type="button" class="skip-btn" @click="skipQuestion">跳过</button>
                  </div>
                </div>

                <!-- Q2: 学习方向 -->
                <div v-else-if="profileStep === 2" key="q2" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">2</span>
                    你想学习的方向是？
                  </h3>
                  <div class="option-chips" role="radiogroup" aria-label="学习方向">
                    <button
                      v-for="item in directionOptions"
                      :key="item.value"
                      type="button"
                      class="option-chip"
                      :class="{ selected: profileData.direction === item.value }"
                      role="radio"
                      :aria-checked="profileData.direction === item.value"
                      @click="selectOption('direction', item.value)"
                    >
                      <span class="chip-emoji">{{ item.emoji }}</span>
                      {{ item.label }}
                    </button>
                  </div>
                  <!-- 补充说明输入框 -->
                  <transition name="slide-fade">
                    <div v-if="profileData.direction" class="detail-input-wrapper">
                      <el-input
                        v-model="profileData.directionDetail"
                        :placeholder="profileData.direction === 'other' ? '请输入你感兴趣的学习方向（必填）' : '可以补充说明，比如具体细方向、感兴趣的课程等（选填）'"
                        size="large"
                        maxlength="200"
                        show-word-limit
                        :class="{ 'is-required': profileData.direction === 'other' }"
                      />
                    </div>
                  </transition>
                  <div class="question-actions">
                    <button
                      type="button"
                      class="next-question-btn"
                      :disabled="!profileData.direction || (profileData.direction === 'other' && !profileData.directionDetail.trim())"
                      @click="profileStep++"
                    >
                      下一步
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <button type="button" class="skip-btn" @click="skipQuestion">跳过</button>
                  </div>
                </div>

                <!-- Q3: 当前基础 -->
                <div v-else-if="profileStep === 3" key="q3" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">3</span>
                    你的当前基础如何？
                  </h3>
                  <div class="option-chips option-chips--described" role="radiogroup" aria-label="当前基础">
                    <button
                      v-for="item in levelOptions"
                      :key="item.value"
                      type="button"
                      class="option-chip option-chip--described"
                      :class="{ selected: profileData.level === item.value }"
                      role="radio"
                      :aria-checked="profileData.level === item.value"
                      @click="selectOption('level', item.value)"
                    >
                      <span class="chip-main">{{ item.label }}</span>
                      <span class="chip-desc">{{ item.desc }}</span>
                    </button>
                  </div>
                  <!-- 补充说明输入框 -->
                  <transition name="slide-fade">
                    <div v-if="profileData.level" class="detail-input-wrapper">
                      <el-input
                        v-model="profileData.levelDetail"
                        placeholder="可以补充说明，比如学过哪些课、掌握到什么程度等（选填）"
                        size="large"
                        maxlength="200"
                        show-word-limit
                      />
                    </div>
                  </transition>
                  <div class="question-actions">
                    <button
                      type="button"
                      class="next-question-btn"
                      :disabled="!profileData.level"
                      @click="profileStep++"
                    >
                      下一步
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <button type="button" class="skip-btn" @click="skipQuestion">跳过</button>
                  </div>
                </div>

                <!-- Q4: 近期目标 -->
                <div v-else-if="profileStep === 4" key="q4" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">4</span>
                    你近期目标是什么？
                  </h3>
                  <div class="option-chips" role="radiogroup" aria-label="近期目标">
                    <button
                      v-for="item in goalOptions"
                      :key="item.value"
                      type="button"
                      class="option-chip"
                      :class="{ selected: profileData.goal === item.value }"
                      role="radio"
                      :aria-checked="profileData.goal === item.value"
                      @click="selectOption('goal', item.value)"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                  <!-- 截止时间追问 -->
                  <transition name="slide-fade">
                    <div v-if="profileData.goal" class="sub-question">
                      <p class="sub-question-label">大概什么时候需要达成？<span class="optional-tag">选填</span></p>
                      <div class="option-chips">
                        <button
                          v-for="item in deadlineOptions"
                          :key="item.value"
                          type="button"
                          class="option-chip"
                          :class="{ selected: profileData.goalDeadline === item.value }"
                          @click="profileData.goalDeadline = item.value"
                        >
                          {{ item.label }}
                        </button>
                      </div>
                    </div>
                  </transition>
                  <!-- 补充说明输入框 -->
                  <transition name="slide-fade">
                    <div v-if="profileData.goal" class="detail-input-wrapper">
                      <el-input
                        v-model="profileData.goalDetail"
                        placeholder="可以补充说明，比如具体哪门考试、什么项目等（选填）"
                        size="large"
                        maxlength="200"
                        show-word-limit
                      />
                    </div>
                  </transition>
                  <div class="question-actions">
                    <button
                      type="button"
                      class="next-question-btn"
                      :disabled="!profileData.goal"
                      @click="profileStep++"
                    >
                      下一步
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <button type="button" class="skip-btn" @click="skipQuestion">跳过</button>
                  </div>
                </div>

                <!-- Q5: 每日学习时间 -->
                <div v-else-if="profileStep === 5" key="q5" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">5</span>
                    你每天大概能花多少时间学习？
                  </h3>
                  <div class="option-chips" role="radiogroup" aria-label="每日学习时间">
                    <button
                      v-for="item in studyTimeOptions"
                      :key="item.value"
                      type="button"
                      class="option-chip option-chip--time"
                      :class="{ selected: profileData.dailyStudyTime === item.value }"
                      role="radio"
                      :aria-checked="profileData.dailyStudyTime === item.value"
                      @click="profileData.dailyStudyTime = item.value"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                  <div class="question-actions">
                    <button
                      type="button"
                      class="next-question-btn"
                      :disabled="!profileData.dailyStudyTime"
                      @click="profileStep++"
                    >
                      下一步
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <button type="button" class="skip-btn" @click="skipQuestion">跳过</button>
                  </div>
                </div>

                <!-- Q6: 自由描述 -->
                <div v-else-if="profileStep === 6" key="q6" class="question-block">
                  <h3 class="question-title">
                    <span class="question-num">6</span>
                    最后，用一段话补充介绍一下自己
                  </h3>
                  <div class="hint-tags">
                    <span class="hint-tag" v-for="tag in descriptionHintTags" :key="tag">{{ tag }}</span>
                  </div>
                  <el-input
                    v-model="profileData.selfDescription"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                    placeholder="例如：我是计算机专业大三学生，每天有2小时学习时间，Python比较熟但对算法不太熟悉，最近在准备操作系统考试..."
                    class="self-description-input"
                  />
                  <!-- 按钮组 -->
                  <div class="btn-group submit-btn-group">
                    <el-button
                      type="primary"
                      size="large"
                      :loading="loading"
                      class="create-btn full-width"
                      @click="handleRegister"
                    >
                      完成注册，开始学习
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </el-button>
                  </div>
                </div>
              </transition>
            </div>
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

const currentStep = ref(1)
const profileStep = ref(1)
const totalProfileSteps = 6
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

const profileData = reactive({
  identity: '',
  grade: '',
  direction: '',
  directionDetail: '',
  level: '',
  levelDetail: '',
  goal: '',
  goalDetail: '',
  goalDeadline: '',
  dailyStudyTime: '',
  selfDescription: ''
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

// Agent 引导文案
const agentGreetingText = computed(() => {
  const greetings: Record<number, string> = {
    1: '你好！我是你的 AI 学习助手，先让我了解一下你~',
    2: '了解你的方向，才能推荐最合适的学习资源',
    3: '基础不同，学习路径也会不同哦',
    4: '目标越清晰，规划越精准',
    5: '合理的时间安排是高效学习的关键',
    6: '最后一步！更多信息 = 更懂你的 AI'
  }
  return greetings[profileStep.value] || '让我了解一下你'
})

// 年级选项（根据身份动态生成）
const gradeOptions = computed(() => {
  if (profileData.identity === 'undergraduate') {
    return [
      { value: 'freshman', label: '大一' },
      { value: 'sophomore', label: '大二' },
      { value: 'junior', label: '大三' },
      { value: 'senior', label: '大四' }
    ]
  }
  if (profileData.identity === 'graduate') {
    return [
      { value: 'g1', label: '研一' },
      { value: 'g2', label: '研二' },
      { value: 'g3', label: '研三+' }
    ]
  }
  return []
})

// Q6 结构化提示标签
const descriptionHintTags = ['专业年级', '每天可用时间', '擅长领域', '薄弱环节', '考试日期']

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

// 身份选项（差异化图标）
const identityOptions = [
  { value: 'undergraduate', label: '本科生', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
  { value: 'graduate', label: '研究生', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>' },
  { value: 'self', label: '自学者', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { value: 'career', label: '转专业学习', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' }
]

// 学习方向（扩展）
const directionOptions = [
  { value: 'ai', label: '人工智能', emoji: '🤖' },
  { value: 'cs', label: '计算机基础', emoji: '💻' },
  { value: 'ds', label: '数据结构与算法', emoji: '🧮' },
  { value: 'ee', label: '电子信息', emoji: '⚡' },
  { value: 'business', label: '经济管理', emoji: '📊' },
  { value: 'humanities', label: '人文社科', emoji: '📖' },
  { value: 'design', label: '艺术设计', emoji: '🎨' },
  { value: 'other', label: '其他方向', emoji: '📌' }
]

// 当前基础（语义清晰化）
const levelOptions = [
  { value: 'beginner', label: '零基础', desc: '完全没接触过' },
  { value: 'some', label: '入门阶段', desc: '了解基本概念' },
  { value: 'course', label: '有基础', desc: '上过课/做过练习' },
  { value: 'advanced', label: '较熟练', desc: '有项目/实操经验' }
]

// 近期目标（增加升学）
const goalOptions = [
  { value: 'exam', label: '通过考试' },
  { value: 'project', label: '完成课程项目' },
  { value: 'skill', label: '掌握一门技术' },
  { value: 'grad', label: '考研/保研' },
  { value: 'competition', label: '准备竞赛/科研' }
]

// 截止时间
const deadlineOptions = [
  { value: '1week', label: '1周内' },
  { value: '1month', label: '1个月内' },
  { value: 'semester', label: '本学期内' },
  { value: 'longterm', label: '长期目标' }
]

// 每日学习时间
const studyTimeOptions = [
  { value: 'lt30', label: '不到30分钟' },
  { value: '30to60', label: '30-60分钟' },
  { value: '1to2', label: '1-2小时' },
  { value: '2to3', label: '2-3小时' },
  { value: 'gt3', label: '3小时以上' }
]

const selectOption = (type: 'identity' | 'direction' | 'level' | 'goal', val: string) => {
  profileData[type] = val
  // 切换身份时重置年级
  if (type === 'identity') {
    profileData.grade = ''
  }
}

const skipQuestion = () => {
  if (profileStep.value < totalProfileSteps) {
    profileStep.value++
  }
}

const skipProfile = () => {
  handleRegister()
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
      grade: profileData.grade || undefined,
      direction: profileData.direction || undefined,
      directionDetail: profileData.directionDetail?.trim() || undefined,
      level: profileData.level || undefined,
      levelDetail: profileData.levelDetail?.trim() || undefined,
      goal: profileData.goal || undefined,
      goalDetail: profileData.goalDetail?.trim() || undefined,
      goalDeadline: profileData.goalDeadline || undefined,
      dailyStudyTime: profileData.dailyStudyTime || undefined,
      selfDescription: profileData.selfDescription || undefined
    })
    // 显示过渡动画
    showTransition.value = true
    // 注册成功后自动登录
    await userStore.login(formData.email, formData.password)
    await userStore.fetchUserInfo()
    // 延迟跳转，让过渡动画展示
    setTimeout(() => {
      router.push('/dashboard')
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
