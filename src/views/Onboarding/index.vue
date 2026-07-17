<template>
  <div class="onboarding-page">
    <!-- 背景装饰 -->
    <div class="onboarding-bg">
      <div class="bg-gradient"></div>
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>

    <div class="onboarding-container">
      <!-- 稍后完善：始终可见 -->
      <div class="onboarding-header">
        <button class="skip-link" @click="handleSkip">
          稍后完善，直接开始学习
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- 卡片主体 -->
      <div class="onboarding-card animate-fade-in-scale">
        <!-- 进度条 -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-steps">
          <span v-for="(label, i) in stepLabels" :key="i" class="progress-step"
            :class="{ active: currentStep === i, completed: currentStep > i }">
            {{ currentStep > i ? '✓' : i + 1 }}
          </span>
        </div>

        <!-- Step 1: 身份 + 年级 -->
        <div v-if="currentStep === 0" class="step-content">
          <div class="step-header">
            <h2 class="step-title">让我更了解你</h2>
            <p class="step-subtitle">选择你的身份和学习阶段</p>
          </div>

          <div class="question-block">
            <label class="question-label">你的身份是？</label>
            <div class="option-cards">
              <div v-for="opt in identityOptions" :key="opt.value" class="option-card"
                :class="{ selected: profileData.identity === opt.value }" @click="profileData.identity = opt.value">
                <span class="option-icon" v-html="opt.icon"></span>
                <span class="option-label">{{ opt.label }}</span>
              </div>
            </div>
          </div>

          <transition name="slide-fade">
            <div v-if="profileData.identity" class="question-block sub-question">
              <label class="question-label">当前年级？</label>
              <div class="option-chips">
                <span v-for="opt in gradeOptions" :key="opt.value" class="option-chip"
                  :class="{ selected: profileData.grade === opt.value }" @click="profileData.grade = opt.value">{{
                  opt.label }}</span>
              </div>
            </div>
          </transition>

          <button class="next-btn" :disabled="!profileData.identity" @click="currentStep = 1">
            下一步
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Step 2: 学习方向 + 当前水平 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="step-header">
            <h2 class="step-title">你的学习方向是什么？</h2>
            <p class="step-subtitle">这能帮助 AI 精准推荐学习内容</p>
          </div>

          <div class="question-block">
            <label class="question-label">主要学习方向</label>
            <div class="option-chips">
              <span v-for="opt in directionOptions" :key="opt.value" class="option-chip"
                :class="{ selected: profileData.direction === opt.value }" @click="profileData.direction = opt.value">
                <span class="chip-emoji">{{ opt.emoji }}</span>
                {{ opt.label }}
              </span>
            </div>
          </div>

          <transition name="slide-fade">
            <div v-if="profileData.direction === 'other'" class="question-block">
              <label class="question-label">请简要描述你的学习方向</label>
              <el-input v-model="profileData.directionDetail" placeholder="例如：哲学、医学、艺术..." maxlength="30"
                show-word-limit />
            </div>
          </transition>

          <div class="question-block">
            <label class="question-label">你当前的水平如何？</label>
            <div class="option-chips option-chips--described">
              <span v-for="opt in levelOptions" :key="opt.value" class="option-chip option-chip--described"
                :class="{ selected: profileData.level === opt.value }" @click="profileData.level = opt.value">
                <span class="chip-main">{{ opt.label }}</span>
                <span class="chip-desc">{{ opt.desc }}</span>
              </span>
            </div>
          </div>

          <div class="btn-group">
            <button class="back-btn" @click="currentStep = 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              上一步
            </button>
            <button class="next-btn" :disabled="!profileData.direction" @click="currentStep = 2">
              下一步
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Step 3: 学习目标 + 每日时间 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="step-header">
            <h2 class="step-title">你的学习目标是什么？</h2>
            <p class="step-subtitle">设定目标，AI 帮你规划达成路径</p>
          </div>

          <div class="question-block">
            <label class="question-label">近期主要目标</label>
            <div class="option-chips">
              <span v-for="opt in goalOptions" :key="opt.value" class="option-chip"
                :class="{ selected: profileData.goal === opt.value }" @click="profileData.goal = opt.value">
                <span class="chip-emoji">{{ opt.emoji }}</span>
                {{ opt.label }}
              </span>
            </div>
          </div>

          <div class="question-block">
            <label class="question-label">每天可用于学习的时间？</label>
            <div class="option-chips">
              <span v-for="opt in timeOptions" :key="opt.value" class="option-chip option-chip--time"
                :class="{ selected: profileData.dailyStudyTime === opt.value }"
                @click="profileData.dailyStudyTime = opt.value">{{ opt.label }}</span>
            </div>
          </div>

          <div class="btn-group">
            <button class="back-btn" @click="currentStep = 1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              上一步
            </button>
            <button class="create-btn" :loading="loading" :disabled="!profileData.goal" @click="handleComplete">
              完成画像，开始学习
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { studentProfileApi } from '@/api/studentProfile'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const loading = ref(false)
const stepLabels = ['身份信息', '学习方向', '学习目标']

const profileData = reactive({
  identity: '',
  grade: '',
  direction: '',
  directionDetail: '',
  level: '',
  goal: '',
  dailyStudyTime: ''
})

const progressPercent = computed(() => {
  return Math.round(((currentStep.value + 1) / 3) * 100)
})

// ---- 选项数据 ----

const identityOptions = [
  { value: 'undergraduate', label: '本科在读', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { value: 'graduate', label: '研究生在读', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>' },
  { value: 'self', label: '自学提升', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
  { value: 'career', label: '职场人士', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' }
]

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
      { value: 'g3', label: '研三' }
    ]
  }
  return [
    { value: 'beginner', label: '入门阶段' },
    { value: 'intermediate', label: '进阶阶段' },
    { value: 'advanced', label: '高级阶段' }
  ]
})

const directionOptions = [
  { value: 'ai', label: '人工智能', emoji: '🤖' },
  { value: 'cs', label: '计算机科学', emoji: '💻' },
  { value: 'ds', label: '数据科学', emoji: '📊' },
  { value: 'ee', label: '电子工程', emoji: '⚡' },
  { value: 'business', label: '商科管理', emoji: '💼' },
  { value: 'humanities', label: '人文社科', emoji: '📚' },
  { value: 'design', label: '设计艺术', emoji: '🎨' },
  { value: 'other', label: '其他方向', emoji: '🌟' }
]

const levelOptions = [
  { value: 'beginner', label: '零基础入门', desc: '完全没接触过，从零开始' },
  { value: 'some', label: '略知一二', desc: '了解基本概念，缺乏系统学习' },
  { value: 'course', label: '系统学过', desc: '上过课或有项目经验' },
  { value: 'advanced', label: '较为熟练', desc: '能独立完成项目，准备进阶' }
]

const goalOptions = [
  { value: 'exam', label: '备考冲刺', emoji: '📝' },
  { value: 'project', label: '做项目', emoji: '🛠️' },
  { value: 'skill', label: '掌握技能', emoji: '🎯' },
  { value: 'grad', label: '考研/留学', emoji: '🎓' },
  { value: 'competition', label: '参加竞赛', emoji: '🏆' }
]

const timeOptions = [
  { value: 'lt30', label: '<30分钟' },
  { value: '30to60', label: '30-60分钟' },
  { value: '1to2', label: '1-2小时' },
  { value: '2to3', label: '2-3小时' },
  { value: 'gt3', label: '>3小时' }
]

// ---- Actions ----

const handleSkip = async () => {
  try {
    await studentProfileApi.initProfile({})
    await userStore.fetchUserInfo()
  } catch {
    // 如果接口失败，设置本地标志以绕过路由守卫
    if (userStore.userInfo) {
      userStore.userInfo.profileInitialized = true
    }
  }
  router.push('/dashboard')
}

const handleComplete = async () => {
  loading.value = true
  try {
    await studentProfileApi.initProfile({
      identity: profileData.identity || undefined,
      grade: profileData.grade || undefined,
      direction: profileData.direction || undefined,
      directionDetail: profileData.directionDetail || undefined,
      level: profileData.level || undefined,
      goal: profileData.goal || undefined,
      dailyStudyTime: profileData.dailyStudyTime || undefined
    })
    // 刷新用户信息以获取 profileInitialized = true
    await userStore.fetchUserInfo()
    ElMessage.success('画像创建成功！AI 已更了解你的学习需求')
    router.push('/dashboard')
  } catch (error: any) {
    ElMessage.error(error?.message || '画像创建失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding-page {
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
.onboarding-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.onboarding-bg .bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
      rgba(11, 183, 170, 0.05) 0%,
      rgba(18, 184, 134, 0.05) 100%);
}

.onboarding-bg .bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.onboarding-bg .blob-1 {
  width: 500px;
  height: 500px;
  background: rgba(18, 184, 134, 0.12);
  top: -150px;
  right: -100px;
}

.onboarding-bg .blob-2 {
  width: 400px;
  height: 400px;
  background: rgba(11, 183, 170, 0.1);
  bottom: -100px;
  left: -50px;
}

/* 容器 */
.onboarding-container {
  width: 100%;
  max-width: 520px;
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl);
}

/* 顶部跳过链接 */
.onboarding-header {
  text-align: right;
  margin-bottom: var(--spacing-md);
}

.skip-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-base);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.skip-link:hover {
  color: var(--primary-color);
}

.skip-link svg {
  transition: transform var(--transition-fast);
}

.skip-link:hover svg {
  transform: translateX(3px);
}

/* 卡片 */
.onboarding-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border);
}

/* 进度条 */
.progress-bar {
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  margin-bottom: var(--spacing-md);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb 0%, #12b886 100%);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-steps {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.progress-step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--background-color-base);
  border: 2px solid var(--border-light);
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.progress-step.active {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border-color: transparent;
  color: white;
}

.progress-step.completed {
  background: #12b886;
  border-color: #12b886;
  color: white;
}

/* Step 内容 */
.step-content {
  animation: fadeIn 0.3s ease;
}

.step-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.step-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
}

.step-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 问题块 */
.question-block {
  margin-bottom: var(--spacing-lg);
}

.question-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

.sub-question {
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--border-light);
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
  padding: var(--spacing-md) var(--spacing-sm);
  background: var(--background-color-base);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.option-card .option-icon {
  width: 32px;
  height: 32px;
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
  box-shadow: 0 2px 8px var(--color-shadow);
}

.option-card.selected {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
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

/* 按钮 */
.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  margin-top: var(--spacing-lg);
}

.next-btn svg {
  width: 18px;
  height: 18px;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(11, 183, 170, 0.3);
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-group {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.btn-group .back-btn {
  flex: 1;
  height: 48px;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  background: var(--background-color-base);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-group .back-btn:hover {
  background: white;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-group .back-btn svg {
  width: 16px;
  height: 16px;
}

.btn-group .next-btn {
  flex: 2;
  margin-top: 0;
}

.create-btn {
  flex: 2;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  background: linear-gradient(135deg, #12b886 0%, #38d9a9 100%);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  cursor: pointer;
  transition: all var(--transition-base);
}

.create-btn svg {
  width: 18px;
  height: 18px;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(18, 184, 134, 0.3);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-8px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
