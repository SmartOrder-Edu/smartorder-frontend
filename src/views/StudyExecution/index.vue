<template>
  <AppLayout>
    <div class="study-execution-page">
      <!-- 返回导航 -->
      <div class="study-nav">
        <button class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <div class="breadcrumb">
          <span>任务中心</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>
          <span class="current">{{ task.title }}</span>
        </div>
      </div>

      <div class="study-container">
        <!-- 左侧：任务步骤 -->
        <aside class="study-sidebar">
          <div class="sidebar-header">
            <h3>学习任务</h3>
            <div class="task-progress-info">
              <span class="progress-text">{{ completedSteps }}/{{ steps.length }} 已完成</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (completedSteps / steps.length * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="steps-list">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="step-item"
              :class="{ active: currentStep === index, completed: step.done }"
              @click="currentStep = index"
            >
              <div class="step-indicator">
                <div class="step-dot">
                  <svg v-if="step.done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-line" v-if="index < steps.length - 1"></div>
              </div>
              <div class="step-content">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-type" :class="step.type">{{ step.typeName }}</span>
              </div>
            </div>
          </div>

          <div class="study-summary">
            <div class="summary-stat">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span class="stat-text">预计 {{ task.minutes }} 分钟</span>
            </div>
            <div class="summary-stat">
              <svg class="stat-icon warm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span class="stat-text">连续学习 12 分钟</span>
            </div>
          </div>
        </aside>

        <!-- 中间：学习内容 -->
        <main class="study-main">
          <div class="content-card">
            <div class="content-header">
              <span class="content-type-badge" :class="currentStepData.type">
                {{ currentStepData.typeName }}
              </span>
              <h2 class="content-title">{{ currentStepData.title }}</h2>
              <p class="content-reason">推荐原因：{{ currentStepData.reason }}</p>
            </div>

            <!-- 复习类型 -->
            <div v-if="currentStepData.type === 'review'" class="content-body review-content">
              <div class="knowledge-card">
                <div class="knowledge-header">
                  <h3>{{ currentStepData.title }}</h3>
                  <el-tag size="small" type="info">核心概念</el-tag>
                </div>
                <div class="knowledge-body">
                  <p><strong>定义：</strong>{{ currentStepData.content?.definition || '进程是程序的一次执行实例，是操作系统进行资源分配和调度的基本单位。' }}</p>
                  <div class="knowledge-divider"></div>
                  <p><strong>特征：</strong></p>
                  <ul class="feature-list">
                    <li v-for="feature in currentStepData.content?.features || ['动态性：进程是程序的一次执行，有创建、运行、消亡的生命周期','并发性：多个进程可在同一时间段内同时运行','独立性：每个进程都有独立的地址空间','异步性：进程按各自独立的、不可预知的速度向前推进']" :key="feature">
                      {{ feature }}
                    </li>
                  </ul>
                  <div class="knowledge-divider"></div>
                  <p><strong>组成部分（PCB）：</strong></p>
                  <div class="pcb-diagram">
                    <div class="pcb-box">
                      <div class="pcb-title">进程控制块 (PCB)</div>
                      <div class="pcb-items">
                        <span>进程标识符 PID</span>
                        <span>进程状态</span>
                        <span>程序计数器 PC</span>
                        <span>寄存器组</span>
                        <span>内存管理信息</span>
                        <span>I/O 状态信息</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 练习类型 -->
            <div v-else-if="currentStepData.type === 'practice'" class="content-body practice-content">
              <div class="quiz-container">
                <div class="quiz-header">
                  <span class="quiz-num">第 {{ currentQuestion + 1 }} 题 / 共 {{ currentStepData.questions?.length || 5 }} 题</span>
                  <span class="quiz-type-tag">{{ currentStepData.content?.type || '同步互斥' }}</span>
                </div>

                <div class="question-card" v-if="currentStepData.questions">
                  <p class="question-text">{{ currentStepData.questions[currentQuestion]?.text }}</p>

                  <div class="options-list">
                    <div
                      v-for="(opt, optIdx) in currentStepData.questions[currentQuestion]?.options"
                      :key="optIdx"
                      class="option-item"
                      :class="{
                        selected: selectedAnswer === optIdx,
                        correct: showResult && optIdx === currentStepData.questions[currentQuestion]?.answer,
                        wrong: showResult && selectedAnswer === optIdx && optIdx !== currentStepData.questions[currentQuestion]?.answer
                      }"
                      @click="!showResult && selectAnswer(optIdx)"
                    >
                      <span class="option-letter">{{ String.fromCharCode(65 + optIdx) }}</span>
                      <span class="option-text">{{ opt }}</span>
                      <span v-if="showResult && optIdx === currentStepData.questions[currentQuestion]?.answer" class="option-icon correct-icon">✓</span>
                      <span v-if="showResult && selectedAnswer === optIdx && optIdx !== currentStepData.questions[currentQuestion]?.answer" class="option-icon wrong-icon">✗</span>
                    </div>
                  </div>

                  <div class="quiz-result" v-if="showResult">
                    <div class="result-message" :class="{ correct: isCorrect }">
                      {{ isCorrect ? '回答正确！' : '回答错误，继续加油！' }}
                    </div>
                    <div class="result-explanation" v-if="!isCorrect">
                      <strong>解析：</strong>{{ currentStepData.questions[currentQuestion]?.explanation }}
                    </div>
                  </div>

                  <div class="quiz-actions">
                    <el-button v-if="!showResult" type="primary" :disabled="selectedAnswer === null" @click="submitAnswer">
                      提交答案
                    </el-button>
                    <el-button v-else @click="nextQuestion">
                      {{ currentQuestion < (currentStepData.questions?.length || 5) - 1 ? '下一题' : '完成练习' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 资源类型 -->
            <div v-else-if="currentStepData.type === 'resource'" class="content-body resource-content">
              <div class="resource-viewer">
                <div class="resource-visual">
                  <div class="visual-diagram">
                    <div class="diagram-node center-node">
                      <span class="node-title">信号量</span>
                      <span class="node-subtitle">Semaphore</span>
                    </div>
                    <div class="diagram-node node-s" @click="showNodeDetail('S')">
                      <span>S</span>
                      <span class="node-label">计数器</span>
                    </div>
                    <div class="diagram-node node-p" @click="showNodeDetail('P')">
                      <span>P()</span>
                      <span class="node-label">wait</span>
                    </div>
                    <div class="diagram-node node-v" @click="showNodeDetail('V')">
                      <span>V()</span>
                      <span class="node-label">signal</span>
                    </div>
                    <div class="diagram-node node-queue">
                      <span>队列</span>
                      <span class="node-label">等待队列</span>
                    </div>

                    <svg class="diagram-lines" viewBox="0 0 400 300">
                      <line x1="200" y1="150" x2="80" y2="80" stroke="var(--primary-color)" stroke-width="2" marker-end="url(#arrow)"/>
                      <line x1="200" y1="150" x2="80" y2="220" stroke="var(--accent-color)" stroke-width="2" marker-end="url(#arrow)"/>
                      <line x1="200" y1="150" x2="320" y2="80" stroke="var(--warning-color)" stroke-width="2" marker-end="url(#arrow)"/>
                      <line x1="200" y1="150" x2="320" y2="220" stroke="#a855f7" stroke-width="2" marker-end="url(#arrow)"/>
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
                        </marker>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div class="resource-text">
                  <h3>信号量机制详解</h3>
                  <p>信号量是一种用于进程同步与互斥的机制，由 Dijkstra 提出。它包含一个整型变量 S 和两个原子操作 P() 和 V()。在操作系统中，信号量分为<strong>计数信号量</strong>和<strong>二值信号量</strong>两类。</p>
                  <div class="op-block p-op">
                    <div class="op-header">P() 操作 (wait)</div>
                    <pre>wait(S) {
  S = S - 1
  if (S < 0) {
    block()  // 阻塞当前进程
  }
}</pre>
                  </div>
                  <div class="op-block v-op">
                    <div class="op-header">V() 操作 (signal)</div>
                    <pre>signal(S) {
  S = S + 1
  if (S <= 0) {
    wakeup()  // 唤醒一个等待进程
  }
}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="content-footer">
              <div class="footer-left">
                <button class="nav-step-btn" :disabled="currentStep === 0" @click="currentStep--">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  上一步
                </button>
                <button class="nav-step-btn" :disabled="currentStep === steps.length - 1" @click="currentStep++">
                  下一步
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              <div class="footer-right">
                <el-button text @click="showAdjustDialog = true">调整难度</el-button>
                <el-button text @click="showWhyDialog = true">为什么是这个任务</el-button>
                <el-button type="primary" @click="markComplete">
                  {{ completedSteps === steps.length ? '完成学习' : '完成当前步骤' }}
                </el-button>
              </div>
            </div>
          </div>
        </main>

        <!-- 右侧：AI 辅导 -->
        <aside class="study-ai-panel">
          <div class="ai-panel-header">
            <span class="panel-title">AI 学习助手</span>
            <span class="panel-badge">在线</span>
          </div>

          <div class="ai-context">
            <div class="context-label">当前上下文</div>
            <div class="context-content">
              <span class="context-tag">{{ currentStepData.title }}</span>
              <span class="context-tag">{{ currentStepData.typeName }}</span>
              <span class="context-tag">理解度：{{ understandingLevel }}%</span>
            </div>
          </div>

          <div class="ai-messages">
            <div
              v-for="(msg, idx) in aiMessages"
              :key="idx"
              class="ai-message"
              :class="msg.role"
            >
              <span class="msg-avatar">
                <svg v-if="msg.role === 'ai'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </span>
              <div class="msg-bubble">
                <p>{{ msg.content }}</p>
              </div>
            </div>
          </div>

          <div class="ai-quick-actions">
            <button
              v-for="action in quickActions"
              :key="action.id"
              class="ai-quick-btn"
              @click="handleAIAction(action)"
            >
              {{ action.label }}
            </button>
          </div>

          <div class="ai-input-wrapper">
            <input
              v-model="aiInput"
              placeholder="有什么不懂的，问 AI..."
              @keyup.enter="sendAI"
            />
            <button class="ai-send-btn" @click="sendAI">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </aside>
      </div>

      <!-- 调整难度对话框 -->
      <el-dialog v-model="showAdjustDialog" title="调整学习难度" width="400px">
        <div class="adjust-difficulty">
          <p class="adjust-label">当前难度：<strong>{{ difficultyLevel }}</strong></p>
          <el-slider v-model="difficultyValue" :min="1" :max="5" :marks="difficultyMarks" />
          <div class="difficulty-desc">
            {{ difficultyDescriptions[difficultyValue - 1] }}
          </div>
        </div>
        <template #footer>
          <el-button @click="showAdjustDialog = false">取消</el-button>
          <el-button type="primary" @click="applyDifficulty">应用</el-button>
        </template>
      </el-dialog>

      <!-- 为什么是这个任务对话框 -->
      <el-dialog v-model="showWhyDialog" title="为什么是这些任务" width="500px">
        <div class="why-content">
          <p>根据你的学习画像分析，系统为你安排这些任务的原因如下：</p>
          <div class="why-reasons">
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>测评数据分析</strong>
                <p>你在上周的"进程同步"测验中正确率仅为 50%，低于平均水平 30 个百分点。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M12 2a8 8 0 0 1 8 8c0 3-2 5-4 7-1 1-2 3-2 5H8c0-2-1-4-2-5-2-2-4-4-4-7a8 8 0 0 1 8-8z"/>
                  <path d="M9 22h6"/>
                  <path d="M12 18v4"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>学习偏好匹配</strong>
                <p>系统分析你的学习记录，发现你更偏好图解和动画形式的学习资源。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>知识图谱依赖</strong>
                <p>线程同步是学习"死锁"章节的前置知识，需要优先掌握。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>目标关联性</strong>
                <p>你的期末目标包含"操作系统期末复习"，当前章节是复习重点之一。</p>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()

const currentStep = ref(0)
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const showAdjustDialog = ref(false)
const showWhyDialog = ref(false)
const difficultyValue = ref(3)
const aiInput = ref('')
const understandingLevel = ref(65)

const difficultyLevel = computed(() => {
  const levels = ['入门', '基础', '适中', '提高', '挑战']
  return levels[difficultyValue.value - 1]
})

const difficultyDescriptions = [
  '详细讲解，简化概念，多用类比和图示',
  '正常讲解，配合示例，帮助理解基础概念',
  '标准讲解，结合实例，强调重点和难点',
  '精简讲解，侧重应用，引入进阶概念',
  '快速讲解，大量练习，直接挑战高难度问题'
]

const difficultyMarks = {
  1: '入门',
  2: '基础',
  3: '适中',
  4: '提高',
  5: '挑战'
}

const task = ref({
  id: route.params.taskId || 1,
  title: '进程与线程的核心概念',
  minutes: 15
})

const steps = ref([
  {
    id: 1, title: '阅读概念讲解', type: 'review', typeName: '复习', done: true,
    reason: '系统检测到你对"进程"概念理解不够深入',
    content: { definition: '进程是程序的一次执行实例，是操作系统资源分配和调度的基本单位。', features: ['动态性', '并发性', '独立性', '异步性'] }
  },
  {
    id: 2, title: '完成同步互斥练习题', type: 'practice', typeName: '练习', done: false,
    reason: '你的 PV 操作正确率上周下降了 15%，需要专项练习',
    questions: [
      { text: 'PV 操作用于解决什么问题？', options: ['文件管理', '进程同步与互斥', '内存分配', '设备管理'], answer: 1, explanation: 'PV 操作是 Dijkstra 提出的用于解决进程同步与互斥问题的经典方法。' },
      { text: '当信号量 S > 0 时，表示？', options: ['有 S 个资源可用', '有 S 个进程在等待', '临界区已加锁', '临界区已解锁'], answer: 0, explanation: '信号量 S 的值表示当前可用资源的数量。' },
      { text: 'P 操作的本质是？', options: ['申请一个资源', '释放一个资源', '创建新进程', '终止进程'], answer: 0, explanation: 'P 操作（wait）将信号量减 1，如果小于 0 则阻塞。' },
      { text: 'V 操作的本质是？', options: ['申请一个资源', '释放一个资源', '创建新进程', '终止进程'], answer: 1, explanation: 'V 操作（signal）将信号量加 1，如果小于等于 0 则唤醒等待队列中的进程。' },
      { text: '二值信号量的取值范围是？', options: ['0 ~ 1', '-1 ~ 0', '0 ~ N', '1 ~ N'], answer: 0, explanation: '二值信号量（互斥锁）只有 0 和 1 两个取值，用于实现互斥。' }
    ]
  },
  {
    id: 3, title: '查看信号量图解讲义', type: 'resource', typeName: '资源', done: false,
    reason: '你偏好可视化学习方式，系统优先推荐图解资源'
  }
])

const currentQuestion = ref(0)
const currentStepData = computed(() => steps.value[currentStep.value])

const completedSteps = computed(() => steps.value.filter(s => s.done).length)

const isCorrect = computed(() => {
  const qs = currentStepData.value.questions
  if (!qs) return false
  return selectedAnswer.value === qs[currentQuestion.value]?.answer
})

const aiMessages = ref([
  { role: 'ai', content: '当前学习内容：进程与线程的核心概念。如果有任何不懂的地方，随时问我。' }
])

const quickActions = [
  { id: 1, label: '举一个生活中的例子' },
  { id: 2, label: '生成对比表格' },
  { id: 3, label: '解释专业术语' },
  { id: 4, label: '推荐相关视频' }
]

const selectAnswer = (idx: number) => {
  selectedAnswer.value = idx
}

const submitAnswer = () => {
  showResult.value = true
}

const nextQuestion = () => {
  if (currentQuestion.value < (currentStepData.value.questions?.length || 5) - 1) {
    currentQuestion.value++
    selectedAnswer.value = null
    showResult.value = false
  }
}

const markComplete = () => {
  steps.value[currentStep.value].done = true
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  }
}

const applyDifficulty = () => {
  showAdjustDialog.value = false
}

const handleAIAction = (action: any) => {
  aiMessages.value.push({ role: 'ai', content: `好的，我来帮你${action.label}...` })
}

const sendAI = () => {
  if (!aiInput.value.trim()) return
  aiMessages.value.push({ role: 'user', content: aiInput.value })
  aiMessages.value.push({ role: 'ai', content: '让我结合你的学习进度为你详细解答...' })
  aiInput.value = ''
}

const showNodeDetail = (node: string) => {}
</script>

<style scoped>
.study-execution-page {
  margin: calc(-1 * var(--spacing-xl)) calc(-1 * var(--spacing-2xl));
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
  background: var(--bg-primary);
}

/* 返回导航 */
.study-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  background: white;
  border-bottom: 1px solid var(--border-light);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--background-color-base);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.breadcrumb .current {
  color: var(--text-dark);
  font-weight: 500;
}

.breadcrumb svg {
  width: 14px;
  height: 14px;
}

/* 主容器 */
.study-container {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  height: calc(100vh - var(--header-height) - 50px);
  overflow: hidden;
}

/* 左侧任务栏 */
.study-sidebar {
  background: white;
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.sidebar-header h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.task-progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, #12b886);
  transition: width 0.5s ease;
}

.steps-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.step-item {
  display: flex;
  gap: var(--spacing-md);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.step-item:hover {
  background: var(--background-color-base);
}

.step-item.active {
  background: rgba(59, 91, 219, 0.06);
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--background-color-base);
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.step-dot svg {
  width: 12px;
  height: 12px;
}

.step-item.completed .step-dot {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.step-item.active .step-dot {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.15);
  color: var(--primary-color);
}

.step-line {
  width: 2px;
  height: 24px;
  background: var(--border-light);
  margin: 2px 0;
}

.step-item.completed .step-line {
  background: var(--accent-color);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}

.step-title {
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.step-type {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.step-type.review { background: rgba(59, 91, 219, 0.1); color: var(--primary-color); }
.step-type.practice { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.step-type.resource { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }

.study-summary {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 0.875rem;
  width: 16px;
  height: 16px;
}

.stat-icon svg {
  width: 100%;
  height: 100%;
}

/* 中间学习区 */
.study-main {
  overflow-y: auto;
  padding: var(--spacing-xl);
}

.content-card {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.content-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.02), rgba(18, 184, 134, 0.02));
}

.content-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.content-type-badge.review { background: rgba(59, 91, 219, 0.1); color: var(--primary-color); }
.content-type-badge.practice { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.content-type-badge.resource { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }

.content-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.content-reason {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.content-body {
  padding: var(--spacing-xl);
}

/* 复习内容 */
.knowledge-card {
  background: var(--background-color-base);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.knowledge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.08), rgba(18, 184, 134, 0.08));
}

.knowledge-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.knowledge-body {
  padding: var(--spacing-xl);
}

.knowledge-body p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-md);
}

.knowledge-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-lg) 0;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  font-size: 0.9375rem;
  color: var(--text-dark);
}

.feature-list li::before {
  content: '▸';
  color: var(--primary-color);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.pcb-diagram {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}

.pcb-box {
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-width: 280px;
}

.pcb-title {
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
}

.pcb-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--border-light);
}

.pcb-items span {
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  font-size: 0.75rem;
  color: var(--text-dark);
}

/* 练习内容 */
.quiz-container { }

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.quiz-num {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.quiz-type-tag {
  padding: 2px 10px;
  background: rgba(18, 184, 134, 0.1);
  color: var(--accent-color);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.question-card {
  background: var(--background-color-base);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.question-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-lg);
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-item:hover:not(.correct):not(.wrong) {
  border-color: var(--primary-color);
  background: rgba(59, 91, 219, 0.02);
}

.option-item.selected {
  border-color: var(--primary-color);
  background: rgba(59, 91, 219, 0.05);
}

.option-item.correct {
  border-color: var(--accent-color);
  background: rgba(18, 184, 134, 0.05);
}

.option-item.wrong {
  border-color: var(--danger-color);
  background: rgba(239, 68, 68, 0.05);
}

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--background-color-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--text-dark);
}

.option-icon {
  font-size: 1rem;
  font-weight: 700;
}

.correct-icon { color: var(--accent-color); }
.wrong-icon { color: var(--danger-color); }

.quiz-result {
  margin-bottom: var(--spacing-lg);
}

.result-message {
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.result-message.correct {
  background: rgba(18, 184, 134, 0.1);
  color: var(--accent-color);
}

.result-explanation {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding: var(--spacing-md);
  background: rgba(245, 158, 11, 0.06);
  border-radius: var(--radius-md);
}

.quiz-actions {
  display: flex;
  justify-content: center;
}

/* 资源内容 */
.resource-viewer { }

.resource-visual {
  background: var(--background-color-base);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.visual-diagram {
  position: relative;
  height: 280px;
}

.diagram-node {
  position: absolute;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.diagram-node span { display: block; text-align: center; }

.node-label {
  font-size: 0.625rem !important;
  font-weight: 400 !important;
  color: var(--text-muted) !important;
}

.center-node {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(59, 91, 219, 0.3);
}

.center-node .node-title { font-size: 0.875rem; font-weight: 700; }
.center-node .node-subtitle { font-size: 0.5625rem; opacity: 0.8; }

.node-s { width: 80px; height: 70px; background: rgba(59, 91, 219, 0.1); color: var(--primary-color); top: 10%; left: 10%; border: 2px solid rgba(59, 91, 219, 0.3); }
.node-p { width: 80px; height: 70px; background: rgba(18, 184, 134, 0.1); color: var(--accent-color); bottom: 15%; left: 5%; border: 2px solid rgba(18, 184, 134, 0.3); }
.node-v { width: 80px; height: 70px; background: rgba(245, 158, 11, 0.1); color: var(--warning-color); top: 10%; right: 5%; border: 2px solid rgba(245, 158, 11, 0.3); }
.node-queue { width: 80px; height: 70px; background: rgba(168, 85, 247, 0.1); color: #a855f7; bottom: 15%; right: 5%; border: 2px solid rgba(168, 85, 247, 0.3); }

.diagram-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.resource-text h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-md);
  color: var(--text-dark);
}

.resource-text p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-lg);
}

.op-block {
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
}

.op-header {
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 600;
  font-size: 0.875rem;
}

.p-op .op-header { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.v-op .op-header { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }

.op-block pre {
  margin: 0;
  padding: var(--spacing-md);
  background: var(--background-color-base);
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow-x: auto;
  color: var(--text-dark);
}

/* 底部操作栏 */
.content-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--border-light);
  background: var(--background-color-base);
}

.footer-left, .footer-right {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.nav-step-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-step-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.nav-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-step-btn svg {
  width: 14px;
  height: 14px;
}

/* 右侧 AI 面板 */
.study-ai-panel {
  background: white;
  border-left: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-panel-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.panel-badge {
  padding: 2px 8px;
  background: rgba(18, 184, 134, 0.1);
  color: var(--accent-color);
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
}

.ai-context {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.context-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.context-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.context-tag {
  padding: 2px 8px;
  background: rgba(59, 91, 219, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  color: var(--primary-color);
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ai-message {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.ai-message.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(59, 91, 219, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-dark);
}

.ai-message.ai .msg-bubble {
  background: var(--background-color-base);
  border-bottom-left-radius: 4px;
}

.ai-message.user .msg-bubble {
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-quick-actions {
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-top: 1px solid var(--border-light);
}

.ai-quick-btn {
  padding: 4px 10px;
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ai-quick-btn:hover {
  background: rgba(59, 91, 219, 0.06);
  color: var(--primary-color);
}

.ai-input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.ai-input-wrapper input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--background-color-base);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
}

.ai-input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.ai-send-btn {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.ai-send-btn svg {
  width: 12px;
  height: 12px;
  color: white;
}

/* 调整难度 */
.adjust-difficulty .adjust-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.difficulty-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(59, 91, 219, 0.04);
  border-radius: var(--radius-md);
}

/* 为什么对话框 */
.why-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg);
}

.why-reasons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.reason-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.reason-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.reason-text strong {
  font-size: 0.875rem;
  color: var(--text-dark);
  display: block;
  margin-bottom: 4px;
}

.reason-text p {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}
</style>
