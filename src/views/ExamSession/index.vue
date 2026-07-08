<template>
  <AppLayout>
    <div class="exam-paper-container">
      <div class="exam-paper">
        <!-- 头部信息区 -->
        <div class="paper-header">
          <!-- 返回导航 -->
          <div class="back-nav" @click="goBack">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="back-icon">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>返回</span>
          </div>

          <div class="header-top">
            <div class="header-title">
              <span class="icon-doc">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>章节测验</span>
            </div>
            <div class="header-status">
              <span v-if="gradingResult" class="status-done">● 得分: {{ gradingResult.actualScore }}/{{ gradingResult.totalScore }}</span>
              <span v-else-if="showAnswer && !sessionId" class="status-done">● 已完成</span>
              <span v-else-if="showAnswer" class="status-done">● 已提交</span>
              <span v-else class="status-doing">● 待完成</span>
            </div>
          </div>
          
          <h1 class="main-title">{{ examTitle }}</h1>
          
          <div class="paper-meta">
            <span class="meta-item">题量: {{ questions.length }}</span>
            <span class="meta-item">满分: {{ totalScore }}</span>
          </div>
        </div>

        <div v-if="loading" class="loading-box">正在加载题目...</div>
        
        <div v-else-if="!questions.length" class="empty-box">
          暂无题目数据
        </div>
        
        <div v-else class="paper-content">

          <!-- 题型分组列表 -->
          <div v-for="(group, gIndex) in groupedQuestions" :key="group.type" class="question-group">
            <h3 class="group-title">
              {{ numberMap[gIndex] }}、{{ group.typeName }}（共{{ group.questions.length }}题）
            </h3>
            
            <div v-for="(q, qIndex) in group.questions" :key="q.id" class="question-item">
              <!-- 题干 -->
              <div class="q-stem">
                <span class="q-index">{{ q.globalIndex }}</span>
                <span class="q-type-badge" :class="'badge-' + q.questionType">{{ group.typeName }}</span>
                <span class="q-text" v-html="q.stem"></span>
              </div>
              
              <!-- 选择选项区 -->
              <div class="q-options" v-if="getOptions(q).length">
                <div 
                  v-for="opt in getOptions(q)" 
                  :key="opt.label" 
                  class="q-option"
                  :class="{ 
                    selected: isOptionSelected(q, opt.label),
                    correct: showAnswer && isOptionCorrect(q, opt.label),
                    wrong: showAnswer && isOptionWrong(q, opt.label)
                  }"
                  @click="toggleOption(q, opt.label)"
                >
                  <span class="opt-circle">{{ opt.label }}</span>
                  <span class="opt-content">{{ opt.content }}</span>
                </div>
              </div>
              
              <!-- 判断选项区 -->
              <div class="q-options" v-else-if="q.questionType === 'judge'">
                <div 
                  class="q-option" 
                  :class="{ 
                    selected: answers[q.id] === 'true',
                    correct: showAnswer && isJudgeOptionCorrect(q, 'true'),
                    wrong: showAnswer && isJudgeOptionWrong(q, 'true')
                  }" 
                  @click="toggleJudge(q, 'true')"
                >
                  <span class="opt-circle">A</span>
                  <span class="opt-content">正确</span>
                </div>
                <div 
                  class="q-option" 
                  :class="{ 
                    selected: answers[q.id] === 'false',
                    correct: showAnswer && isJudgeOptionCorrect(q, 'false'),
                    wrong: showAnswer && isJudgeOptionWrong(q, 'false')
                  }" 
                  @click="toggleJudge(q, 'false')"
                >
                  <span class="opt-circle">B</span>
                  <span class="opt-content">错误</span>
                </div>
              </div>
              
              <!-- 填空选项区 -->
              <div class="q-fill" v-else-if="q.questionType === 'fill_blank'">
                 <div v-for="(val, idx) in getFillBlankValues(q)" :key="idx" class="fill-row">
                   <span class="fill-label">第{{ idx + 1 }}空：</span>
                   <input 
                     type="text" 
                     :value="val" 
                     @input="e => updateFillBlankValueIndexed(q, idx, (e.target as HTMLInputElement).value)" 
                     placeholder="请填写答案" 
                     :readonly="showAnswer" 
                     class="custom-input" 
                   />
                 </div>
              </div>
              
              <!-- 主观/问答题 -->
              <div class="q-text-answer" v-else>
                 <textarea v-model="answers[q.id]" :readonly="showAnswer" rows="4" placeholder="请输入答案" class="custom-textarea"></textarea>
              </div>
              
              <!-- 解析与结果区 -->
              <div v-if="showAnswer" class="result-box" :class="getResultBoxClass(q)">
                <!-- Session 模式：后端判分结果 -->
                <template v-if="getQuestionGrading(q) && getQuestionGrading(q)!.status === 'graded'">
                  <div class="result-row">
                    <span class="label">判分结果：</span>
                    <span class="value" :class="getQuestionGrading(q)!.isCorrect ? 'correct-answer' : 'wrong-answer'">
                      {{ getQuestionGrading(q)!.isCorrect ? '✓ 正确' : '✗ 错误' }}
                    </span>
                    <span class="label">得分：</span>
                    <span class="value">{{ getQuestionGrading(q)!.score }} / {{ q.score }}</span>
                  </div>
                </template>
                <template v-else-if="getQuestionGrading(q) && getQuestionGrading(q)!.status === 'pending_review'">
                  <div class="result-row">
                    <span class="value pending-badge">⏳ AI 批阅中...</span>
                  </div>
                </template>

                <!-- 旧模式: 客户端判分 -->
                <template v-else-if="!sessionId && q.questionType !== 'short_answer' && q.questionType !== 'essay'">
                  <div class="result-row">
                    <span class="label">我的答案：</span>
                    <span class="value user-answer" :class="{ correct: isCorrect(q), wrong: !isCorrect(q) }">
                      {{ formatUserAnswer(q) || '未作答' }}
                    </span>
                    <span v-if="isCorrect(q)" class="icon-correct">正确</span>
                    <span v-else class="icon-wrong">错误</span>
                  </div>
                  <div class="result-row">
                    <span class="label">正确答案：</span>
                    <span class="value correct-answer">{{ getCorrectAnswer(q) }}</span>
                  </div>
                </template>

                <!-- 答案解析（所有模式都显示） -->
                <div class="result-row explanation" v-if="q.explanation">
                  <div class="label">答案解析：</div>
                  <div class="value">{{ q.explanation }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部药丸按钮操作栏 -->
        <div class="footer-actions" v-if="questions.length">
          <button type="button" class="btn-footer outline" @click="goPrev">上一节</button>
          <button
            v-if="!showAnswer"
            type="button"
            class="btn-footer primary"
            :disabled="isSubmitting"
            @click="submitExam"
          >
            {{ isSubmitting ? '提交中...' : '提交测试' }}
          </button>
          <button 
            v-else 
            type="button" 
            class="btn-footer primary" 
            @click="goNext"
          >
            下一节
          </button>
        </div>

        <!-- 提示未完成弹窗 -->
        <div class="modal-overlay" v-if="showUnfinishedModal" @click.self="showUnfinishedModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <span class="modal-title">提示</span>
              <button type="button" class="modal-close-btn" @click="showUnfinishedModal = false">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              您还有未做完的 <span class="highlight-types">{{ unfinishedTypesText }}</span>，确认提交吗？
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-modal cancel" @click="showUnfinishedModal = false">取消</button>
              <button type="button" class="btn-modal confirm" @click="confirmSubmit">提交</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { fetchEvaluationQuestions, type EvaluationQuestion } from '@/api/evaluationQuestion'
import {
  fetchSessionQuestions,
  startSession,
  submitAnswers,
  getSessionResult,
  submitExamAnswers,
  getExamResult,
  type SessionResultVO,
  type AnswerDetailVO
} from '@/api/evaluationSession'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'

const route = useRoute()
const router = useRouter()

const goBack = () => {
  if (spaceId.value) {
    router.push({ path: '/exam', query: { spaceId: spaceId.value } })
  } else {
    router.back()
  }
}

const loading = ref(false)
const questions = ref<EvaluationQuestion[]>([])
const answers = ref<Record<number, string>>({})
const showAnswer = ref(false)

// 后端判分结果
const gradingResult = ref<SessionResultVO | null>(null)
const isSubmitting = ref(false)

const examTitle = computed(() => String(route.query.title || '章节测验'))
const spaceId = computed(() => route.query.spaceId ? String(route.query.spaceId) : undefined)
const taskId = computed(() => route.query.taskId ? String(route.query.taskId) : undefined)
const sessionId = computed(() => route.query.sessionId ? String(route.query.sessionId) : undefined)
const rawStatus = computed(() => route.query.rawStatus ? String(route.query.rawStatus) : undefined)

const numberMap = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

const totalScore = computed(() => {
  return questions.value.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(1)
})

const groupedQuestions = computed(() => {
  const groups: Record<string, any[]> = {}
  let globalIndex = 1
  
  questions.value.forEach(q => {
    if (!groups[q.questionType]) {
      groups[q.questionType] = []
    }
    const qWithIndex = { ...q, globalIndex: globalIndex++ }
    groups[q.questionType].push(qWithIndex)
  })
  
  const order = ['single_choice', 'multiple_choice', 'fill_blank', 'judge', 'short_answer', 'essay']
  const result: any[] = []
  
  order.forEach(type => {
    if (groups[type] && groups[type].length > 0) {
      result.push({
        type,
        typeName: getQuestionTypeName({ questionType: type } as any),
        questions: groups[type]
      })
    }
  })
  
  Object.keys(groups).forEach(type => {
    if (!order.includes(type)) {
      result.push({
        type,
        typeName: getQuestionTypeName({ questionType: type } as any),
        questions: groups[type]
      })
    }
  })
  
  return result
})

const fetchQuestions = async () => {
  loading.value = true
  try {
    if (sessionId.value) {
      // 有 sessionId → 从 session API 加载题目
      questions.value = await fetchSessionQuestions(sessionId.value)
      // 仅当后端状态为 'todo'（从未开始）时才调用 start接口
      if (rawStatus.value === 'todo') {
        try {
          await startSession(sessionId.value)
        } catch {
          // 忽略异常
        }
      }
    } else if (spaceId.value) {
      // 旧流程：从题库 API 加载（无 session，仅 client-side grading）
      questions.value = await fetchEvaluationQuestions({
        learningSpaceId: spaceId.value,
        limit: 100,
        taskId: taskId.value || undefined
      })
    } else {
      ElMessage.warning('缺少学习空间或会话ID，无法开始测评')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '题目加载失败')
  } finally {
    loading.value = false
  }
}

const getOptions = (q: EvaluationQuestion) => {
  const opts = normalizeQuestionOptions(q.options)
  if (opts.length === 0 && (q.questionType === 'single_choice' || q.questionType === 'multiple_choice')) {
    return [
      { label: 'A', content: '' },
      { label: 'B', content: '' },
      { label: 'C', content: '' },
      { label: 'D', content: '' }
    ]
  }
  return opts
}

const toggleOption = (q: EvaluationQuestion, label: string) => {
  if (showAnswer.value) return
  
  const currentAns = answers.value[q.id] || ''
  
  if (q.questionType === 'single_choice') {
    answers.value[q.id] = label
  } else if (q.questionType === 'multiple_choice') {
    let arr = currentAns ? currentAns.split('、') : []
    if (arr.includes(label)) {
      arr = arr.filter(x => x !== label)
    } else {
      arr.push(label)
    }
    answers.value[q.id] = arr.sort().join('、')
  }
}

const toggleJudge = (q: EvaluationQuestion, val: string) => {
  if (showAnswer.value) return
  answers.value[q.id] = val
}

const isOptionSelected = (q: EvaluationQuestion, label: string) => {
  const ans = answers.value[q.id] || ''
  if (q.questionType === 'single_choice') {
    return ans === label
  }
  return ans.split('、').includes(label)
}

// 选项提交后正误判断
const isOptionCorrect = (q: EvaluationQuestion, label: string) => {
  const correct = getCorrectAnswer(q)
  if (q.questionType === 'single_choice') {
    return correct === label
  }
  if (q.questionType === 'multiple_choice') {
    return correct.split('、').map(s => s.trim()).includes(label)
  }
  return false
}

const isOptionWrong = (q: EvaluationQuestion, label: string) => {
  const selected = isOptionSelected(q, label)
  const correct = isOptionCorrect(q, label)
  return selected && !correct
}

// 判断题提交后正误判断
const isJudgeOptionCorrect = (q: EvaluationQuestion, val: string) => {
  const correct = getCorrectAnswer(q)
  const valText = val === 'true' ? '正确' : '错误'
  return correct === valText
}

const isJudgeOptionWrong = (q: EvaluationQuestion, val: string) => {
  const selected = answers.value[q.id] === val
  const correct = isJudgeOptionCorrect(q, val)
  return selected && !correct
}

// 填空多空动态生成支持
const getBlankCount = (q: EvaluationQuestion) => {
  const matches = q.stem.match(/_+/g)
  if (matches && matches.length > 0) {
    return matches.length
  }
  const correctAns = getCorrectAnswer(q)
  if (correctAns && correctAns !== '无') {
    return correctAns.split('、').length
  }
  return 1
}

const getFillBlankValues = (q: EvaluationQuestion) => {
  const ans = answers.value[q.id] || ''
  const parts = ans.split(';;')
  const count = getBlankCount(q)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(parts[i] || '')
  }
  return result
}

const updateFillBlankValueIndexed = (q: EvaluationQuestion, index: number, val: string) => {
  if (showAnswer.value) return
  const currentValues = getFillBlankValues(q)
  currentValues[index] = val.trim()
  answers.value[q.id] = currentValues.join(';;')
}

const getCorrectAnswer = (q: EvaluationQuestion) => {
  const text = getQuestionAnswerText(q.correctAnswer)
  return text || '无'
}

const formatUserAnswer = (q: EvaluationQuestion) => {
  let user = answers.value[q.id] || ''
  if (!user) return ''
  
  if (q.questionType === 'judge') {
    return user === 'true' ? '正确' : (user === 'false' ? '错误' : user)
  }
  if (q.questionType === 'fill_blank') {
    return user.replace(/;;/g, ';')
  }
  return user
}

const isCorrect = (q: EvaluationQuestion) => {
  const correct = getCorrectAnswer(q)
  const user = formatUserAnswer(q)
  
  if (!user) return false
  
  if (q.questionType === 'single_choice' || q.questionType === 'judge') {
    return user === correct
  }
  
  if (q.questionType === 'multiple_choice') {
    const sortedUser = user.split('、').map(s=>s.trim()).sort().join('、')
    const sortedCorrect = correct.split('、').map(s=>s.trim()).sort().join('、')
    return sortedUser === sortedCorrect
  }
  
  if (q.questionType === 'fill_blank') {
    const uParts = user.split(';').map(s => s.trim())
    const cParts = correct.split('、').map(s => s.trim()) 
    if (uParts.length !== cParts.length) return false
    for(let i=0; i<uParts.length; i++) {
      if(uParts[i] !== cParts[i]) return false
    }
    return true
  }
  
  return false
}

const showUnfinishedModal = ref(false)
const unfinishedTypesText = ref('')

const isQuestionAnswered = (q: EvaluationQuestion) => {
  const ans = answers.value[q.id]
  if (!ans) return false
  if (q.questionType === 'fill_blank') {
    const vals = getFillBlankValues(q)
    return vals.length > 0 && vals.every(v => v.trim() !== '')
  }
  return ans.trim() !== ''
}

const submitExam = () => {
  const unfinishedTypes: string[] = []
  groupedQuestions.value.forEach(group => {
    const hasUnanswered = group.questions.some(q => !isQuestionAnswered(q))
    if (hasUnanswered) {
      unfinishedTypes.push(group.typeName)
    }
  })

  if (unfinishedTypes.length > 0) {
    unfinishedTypesText.value = unfinishedTypes.join('、')
    showUnfinishedModal.value = true
  } else {
    doSubmitExam()
  }
}

const confirmSubmit = () => {
  showUnfinishedModal.value = false
  doSubmitExam()
}

const buildUserAnswer = (q: EvaluationQuestion): Record<string, unknown> => {
  const userAns = answers.value[q.id] || ''
  switch (q.questionType) {
    case 'single_choice':
      return { selectedOptions: userAns ? [userAns] : [] }
    case 'multiple_choice':
      return { selectedOptions: userAns ? userAns.split('、').filter(Boolean) : [] }
    case 'judge': {
      const val = userAns === 'true' ? '正确' : userAns === 'false' ? '错误' : userAns
      return { value: val }
    }
    case 'fill_blank':
      return { blanks: userAns ? userAns.split(';;') : [] }
    default:
      return { text: userAns }
  }
}

const doSubmitExam = async () => {
  isSubmitting.value = true
  try {
    // 构建提交 payload
    const answerItems = questions.value.map(q => ({
      questionId: q.id,
      userAnswer: buildUserAnswer(q),
      answerDurationSeconds: 0,
      usedHint: 0
    }))

    if (sessionId.value) {
      // 后端 session 模式：调用 submit API
      const result = await submitAnswers(sessionId.value, { answers: answerItems })
      gradingResult.value = result
      ElMessage.success(`提交成功！客观题得分: ${result.objectiveScore}/${result.objectiveTotal}${result.subjectivePending > 0 ? `，${result.subjectivePending}道主观题等待AI批阅` : ''}`)
    } else if (taskId.value) {
      // 任务模式：直接提交到后端判分
      const result = await submitExamAnswers(taskId.value, spaceId.value, { answers: answerItems })
      gradingResult.value = result as any
      ElMessage.success(`提交成功！客观题得分: ${result.objectiveScore}/${result.objectiveTotal}${result.subjectivePending > 0 ? `，${result.subjectivePending}道主观题等待AI批阅` : ''}`)
    } else {
      // 旧流程：仅 client-side grading
      ElMessage.success('提交测试成功（本地判分）')
    }

    showAnswer.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 如果有主观题待判分，启动轮询
    if (gradingResult.value && gradingResult.value.subjectivePending > 0) {
      startPollingResult()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const startPollingResult = () => {
  if (!sessionId.value && !taskId.value) return
  pollingTimer = setInterval(async () => {
    try {
      let result
      if (sessionId.value) {
        result = await getSessionResult(sessionId.value)
      } else if (taskId.value) {
        result = await getExamResult(taskId.value)
      } else {
        return
      }
      gradingResult.value = result as any
      if (result.subjectivePending === 0) {
        if (pollingTimer) clearInterval(pollingTimer)
        pollingTimer = null
        ElMessage.success('全部题目批阅完成！')
      }
    } catch {
      // 轮询失败忽略
    }
  }, 3000)
}

// 从 gradingResult 中获取某题的判分详情
const getQuestionGrading = (q: EvaluationQuestion): AnswerDetailVO | undefined => {
  return gradingResult.value?.detail?.find(d => d.questionId === q.id)
}

// 结果框样式
const getResultBoxClass = (q: EvaluationQuestion) => {
  const g = getQuestionGrading(q)
  if (g && g.status === 'graded') {
    return g.isCorrect ? 'correct-bg' : 'wrong-bg'
  }
  if (g && g.status === 'pending_review') return 'neutral-bg'
  if (!sessionId.value) {
    // 旧模式客户端判分
    if (q.questionType === 'short_answer' || q.questionType === 'essay') return 'neutral-bg'
    return isCorrect(q) ? 'correct-bg' : 'wrong-bg'
  }
  return 'neutral-bg'
}

const goPrev = () => {
  router.back()
}

const goNext = () => {
  router.back()
}

onMounted(fetchQuestions)

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.exam-paper-container {
  background-color: #f7f9fa;
  min-height: calc(100vh - 60px);
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 返回导航 */
.back-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.2s ease;
  user-select: none;
  width: fit-content;
}

.back-nav:hover {
  color: #1890ff;
}

.back-icon {
  transition: transform 0.2s ease;
}

.back-nav:hover .back-icon {
  transform: translateX(-3px);
}

.exam-paper {
  background: #fff;
  width: 100%;
  max-width: 960px;
  border: 1px solid #eef1f6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
  min-height: 800px;
  padding: 40px 60px;
  border-radius: 8px;
  box-sizing: border-box;
}

/* Header */
.paper-header {
  border-bottom: 1px solid #f1f5f9;
  padding: 0 0 28px 0;
  margin-bottom: 36px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.icon-doc {
  display: flex;
  align-items: center;
  color: #94a3b8;
}

.header-status {
  font-size: 13px;
  font-weight: 600;
}

.status-done {
  color: #2f9e44;
  background: #ebfbee;
  border: 1px solid #c3fae8;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-doing {
  color: #f76707;
  background: #fff4e6;
  border: 1px solid #ffe8cc;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.main-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 14px 0;
  line-height: 1.4;
  letter-spacing: -0.5px;
  position: relative;
  padding-left: 14px;
}

.main-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  background: linear-gradient(180deg, #1890ff 0%, #00d2ff 100%);
  border-radius: 2px;
}

.paper-meta {
  font-size: 13px;
  color: #64748b;
  display: flex;
  gap: 20px;
}



/* Content */
.question-group {
  margin-bottom: 48px;
}

.group-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 24px 0;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
  line-height: 1.2;
}

.question-item {
  background: #f8fafc;
  border: 1px solid #eef1f6;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 24px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-item:hover {
  background: #fff;
  border-color: #cbd5e1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.q-stem {
  font-size: 15px;
  line-height: 1.6;
  color: #0f172a;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
}

.q-index {
  font-size: 16px;
  font-weight: 700;
  color: #1890ff;
  margin-right: 8px;
  flex-shrink: 0;
}

/* 题型专属精致 Badge 标签 */
.q-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  margin-right: 8px;
  line-height: 1.2;
  letter-spacing: 0.5px;
  align-self: flex-start;
  margin-top: 2px;
}

.badge-single_choice {
  background-color: #e0f2fe;
  color: #0369a1;
}

.badge-multiple_choice {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.badge-judge {
  background-color: #ccfbf1;
  color: #0f766e;
}

.badge-fill_blank {
  background-color: #ffedd5;
  color: #c2410c;
}

.badge-short_answer, .badge-essay {
  background-color: #fce7f3;
  color: #be185d;
}

.q-text {
  flex: 1;
  word-break: break-word;
  color: #0f172a;
}

/* Options */
.q-options {
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.q-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eef1f6;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.q-option:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(4px);
  color: #1e293b;
}

.opt-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* Selected */
.q-option.selected {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  font-weight: 600;
}

.q-option.selected .opt-circle {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

/* Correct state (submitted) */
.q-option.correct {
  background: #f6ffed;
  border-color: #52c41a;
  color: #52c41a;
  font-weight: 600;
}

.q-option.correct .opt-circle {
  background: #52c41a;
  border-color: #52c41a;
  color: #fff;
}

/* Wrong state (submitted) */
.q-option.wrong {
  background: #fff2f0;
  border-color: #ff4d4f;
  color: #ff4d4f;
  font-weight: 600;
}

.q-option.wrong .opt-circle {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

.opt-content {
  flex: 1;
  line-height: 1.5;
}

/* Inputs (Fill blank & text answers) */
.q-fill {
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fill-label {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  width: 58px;
  flex-shrink: 0;
}

.q-text-answer {
  padding-left: 0;
}

.custom-input {
  flex: 1;
  max-width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 1px solid #e2e8f0;
  background-color: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.custom-textarea {
  width: 100%;
  max-width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  background-color: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.custom-input:focus, .custom-textarea:focus {
  border-color: #1890ff;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12);
}

.custom-input:read-only, .custom-textarea:read-only {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
}

/* Result Box */
.result-box {
  margin-top: 24px;
  padding: 20px 24px;
  font-size: 14px;
  color: #334155;
  line-height: 1.8;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.result-box.correct-bg {
  background-color: #f6ffed;
  border-color: #d9f7be;
}

.result-box.wrong-bg {
  background-color: #fff2f0;
  border-color: #ffccc7;
}

.result-box.neutral-bg {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.result-row {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.result-row:last-child {
  margin-bottom: 0;
}

.result-row .label {
  font-weight: 700;
  color: #0f172a;
  width: 75px;
  flex-shrink: 0;
}

.result-row .value {
  flex: 1;
}

.user-answer {
  margin-right: 12px;
  color: #334155;
  font-weight: 500;
}

.user-answer.correct {
  color: #52c41a;
}

.user-answer.wrong {
  color: #f5222d;
}

.correct-answer {
  color: #52c41a;
  font-weight: 700;
}

.wrong-answer {
  color: #f5222d;
  font-weight: 700;
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f76707;
  font-weight: 600;
  background: #fff4e6;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  border: 1px solid #ffe8cc;
}

.icon-correct {
  color: #52c41a;
  font-size: 13px;
  font-weight: 700;
}

.icon-wrong {
  color: #f5222d;
  font-size: 13px;
  font-weight: 700;
}

.explanation {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #cbd5e1;
}

/* Footer & Buttons */
.footer-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #eef1f6;
}

.btn-footer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 32px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.btn-footer.outline {
  border: 1px solid #1890ff;
  background: #fff;
  color: #1890ff;
}

.btn-footer.outline:hover {
  background: #e6f7ff;
}

.btn-footer.primary {
  border: none;
  background: #1890ff;
  color: #fff;
}

.btn-footer.primary:hover {
  background: #40a9ff;
}

.loading-box, .empty-box {
  text-align: center;
  padding: 100px 0;
  color: #94a3b8;
  font-size: 15px;
}

@media (max-width: 768px) {
  .exam-paper {
    padding: 24px 20px;
  }
}

/* Modal Dialog Style */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: #fff;
  width: 90%;
  max-width: 440px;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
  padding: 28px 28px 24px;
  box-sizing: border-box;
  margin-bottom: 80px;
  animation: modalFadeIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #475569;
  transform: rotate(90deg);
}

.modal-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 28px;
  text-align: left;
}

.highlight-types {
  color: #f76707;
  font-weight: 700;
  background-color: #fff4e6;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #ffe8cc;
  margin: 0 4px;
  display: inline-block;
  line-height: 1.2;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.btn-modal.cancel {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
}

.btn-modal.cancel:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.btn-modal.confirm {
  border: none;
  background: #1890ff;
  color: #fff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.btn-modal.confirm:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
}

@keyframes modalFadeIn {
  from {
    transform: scale(0.95) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
