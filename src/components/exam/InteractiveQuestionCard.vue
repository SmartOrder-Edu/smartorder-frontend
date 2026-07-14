<template>
  <article class="interactive-question-card" :class="{ 'has-console': showAnswer && hasAnalysis }">
    <!-- 题目元数据 -->
    <div class="question-meta">
      <span class="type-badge">{{ question.questionTypeName || getQuestionTypeLabel(question.questionType) }}</span>
      <span class="difficulty-badge">难度 {{ question.difficulty || '-' }}</span>
      <span class="score-badge">{{ question.score || 0 }} 分</span>
    </div>

    <!-- 题干 -->
    <h3 class="question-stem">
      <span v-if="displayIndex" class="q-display-index">{{ displayIndex }}.</span>
      <span v-html="question.stem"></span>
    </h3>

    <!-- 交互式答题区 -->
    <div class="question-interaction">
      <!-- 选择题 (单选 / 多选) -->
      <div v-if="currentOptions.length" class="options-list">
        <button
          v-for="option in currentOptions"
          :key="option.label"
          type="button"
          class="option-button"
          :class="{
            selected: selectedOptions.includes(option.label) && !showAnswer,
            correct: showAnswer && correctOptionsList.includes(option.label),
            wrong: showAnswer && selectedOptions.includes(option.label) && !correctOptionsList.includes(option.label)
          }"
          :disabled="showAnswer"
          @click="toggleOption(option.label)"
        >
          <span class="option-label-circle">{{ option.label }}</span>
          <strong class="option-content-text">{{ option.content }}</strong>

          <!-- 反馈状态图标 -->
          <span v-if="showAnswer && correctOptionsList.includes(option.label)" class="feedback-icon correct">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="12" height="12">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <span v-else-if="showAnswer && selectedOptions.includes(option.label) && !correctOptionsList.includes(option.label)" class="feedback-icon wrong">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="10" height="10">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
        </button>
      </div>

      <!-- 判断题 -->
      <div v-else-if="question.questionType === 'judge'" class="judge-list">
        <button
          type="button"
          class="option-button judge-btn"
          :class="{
            selected: textAnswer === 'true' && !showAnswer,
            correct: showAnswer && answerText === '正确',
            wrong: showAnswer && textAnswer === 'true' && answerText !== '正确'
          }"
          :disabled="showAnswer"
          @click="selectJudge('true')"
        >
          正确
          <span v-if="showAnswer && answerText === '正确'" class="feedback-icon correct">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span v-else-if="showAnswer && textAnswer === 'true' && answerText !== '正确'" class="feedback-icon wrong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
        </button>
        <button
          type="button"
          class="option-button judge-btn"
          :class="{
            selected: textAnswer === 'false' && !showAnswer,
            correct: showAnswer && answerText === '错误',
            wrong: showAnswer && textAnswer === 'false' && answerText !== '错误'
          }"
          :disabled="showAnswer"
          @click="selectJudge('false')"
        >
          错误
          <span v-if="showAnswer && answerText === '错误'" class="feedback-icon correct">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span v-else-if="showAnswer && textAnswer === 'false' && answerText !== '错误'" class="feedback-icon wrong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
        </button>
      </div>

      <!-- 填空题 (支持多空框) -->
      <div v-else-if="question.questionType === 'fill_blank'" class="fill-blank-section">
        <div v-if="blanksList.length > 0" class="fill-blank-inputs">
          <div v-for="(blank, idx) in blanksList" :key="idx" class="blank-input-row">
            <span class="blank-label">（第 {{ idx + 1 }} 空）</span>
            <el-input
              v-model="blankAnswers[idx]"
              :disabled="showAnswer"
              :placeholder="showAnswer ? '未作答' : '请在此填入答案...'"
              class="blank-input"
              @input="onBlankInput"
            >
              <template #append v-if="showAnswer">
                <span class="blank-feedback" :class="isBlankCorrect(idx) ? 'correct' : 'wrong'">
                  {{ isBlankCorrect(idx) ? '正确' : `标准: ${blank.answer}` }}
                </span>
              </template>
            </el-input>
          </div>
        </div>
        <el-input
          v-else
          v-model="textAnswer"
          type="text"
          :disabled="showAnswer"
          placeholder="请在此填入答案..."
          class="custom-single-input"
        />
      </div>

      <!-- 代码题 -->
      <div v-else-if="question.questionType === 'code'" class="code-answer-section">
        <select v-model="codeLang" :disabled="showAnswer" class="lang-select">
          <option value="c11">C (C11)</option>
          <option value="cpp17">C++ (C++17)</option>
        </select>
        <CodeEditor
          v-model="textAnswer"
          :readonly="showAnswer"
          :language="codeLang"
          placeholder="// 在此编写代码...&#10;#include <stdio.h>&#10;&#10;int main() {&#10;    // 你的代码&#10;    return 0;&#10;}"
          :show-footer="false"
        />
      </div>

      <!-- 简答题 / 主观问答题 -->
      <div v-else class="short-answer-section">
        <el-input
          v-model="textAnswer"
          type="textarea"
          :rows="5"
          :disabled="showAnswer"
          placeholder="请在此整理并填入您的答题步骤或思路描述..."
          class="custom-textarea"
        />
      </div>
    </div>

    <!-- 结果反馈与解析面板 -->
    <div v-if="showAnswer" class="answer-panel">
      <!-- 判定结果 Banner -->
      <div
        v-if="question.questionType !== 'short_answer' && question.questionType !== 'code'"
        class="answer-result-banner"
        :class="{ 'is-correct': isCurrentAnswerCorrect }"
      >
        <span class="banner-icon">
          <svg v-if="isCurrentAnswerCorrect" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
        <span class="banner-title">{{ isCurrentAnswerCorrect ? '回答正确！' : '回答错误，请查阅下方 AI 深度诊断解析' }}</span>
      </div>

      <!-- 简答题/主观题的 AI 自动反馈 Banner -->
      <div v-else class="answer-result-banner short-answer-banner">
        <span class="banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span class="banner-title">简答题主观评阅 · 参考标准答案与评分细则如下</span>
      </div>

      <!-- 参考答案展示区 -->
      <div class="answer-reference">
        <span class="ref-label">参考答案</span>
        <div class="ref-value" v-html="formattedAnswerText"></div>
      </div>

      <!-- 答案解析展示区 -->
      <div class="explanation-box">
        <span class="explanation-label">题目解析</span>
        <div class="explanation-content" v-html="formattedExplanationText"></div>
      </div>

      <!-- ==================== AI 深度诊断剖析控制台 ==================== -->
      <div v-if="hasAnalysis" class="ai-console-wrapper">
        <div class="ai-console-header">
          <div class="console-title">
            <span class="sparkle-icon">✨</span>
            <span>知序 AI 智能精析</span>
          </div>
          <!-- 玻璃拟态风格 Tab 页签 -->
          <div class="console-tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.value"
              class="console-tab-btn"
              :class="{ active: activeConsoleTab === tab.value }"
              @click="activeConsoleTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="ai-console-content">
          <!-- Tab 1: 💡 思维链推理 -->
          <div v-if="activeConsoleTab === 'reasoning'" class="tab-panel reasoning-panel">
            <div class="timeline-wrapper">
              <div v-for="(step, idx) in analysisData.reasoning_steps" :key="idx" class="timeline-item">
                <div class="timeline-node">
                  <span class="node-num">{{ idx + 1 }}</span>
                </div>
                <div class="timeline-content">
                  <p>{{ step }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 2: 🔍 选项深度剖析 (选择题专享) -->
          <div v-if="activeConsoleTab === 'options' && analysisData.option_analysis" class="tab-panel options-analysis-panel">
            <!-- 选项卡快速切换 -->
            <div class="option-tab-headers">
              <button
                v-for="(info, label) in analysisData.option_analysis"
                :key="label"
                class="option-pill"
                :class="{
                  active: activeOptionDetailTab === label,
                  'is-correct': info.is_correct,
                  'is-wrong': !info.is_correct
                }"
                @click="activeOptionDetailTab = label"
              >
                选项 {{ label }}
                <span class="pill-dot"></span>
              </button>
            </div>
            <!-- 对应选项的深度剖析卡片 -->
            <div v-if="selectedOptionDetail" class="option-detail-card" :class="{ 'is-correct': selectedOptionDetail.is_correct }">
              <div class="detail-header">
                <span class="badge" :class="selectedOptionDetail.is_correct ? 'correct' : 'wrong'">
                  {{ selectedOptionDetail.is_correct ? '正确选项' : '干扰选项' }}
                </span>
                <span class="option-title">选项 {{ activeOptionDetailTab }} 解析</span>
              </div>
              <div class="detail-body">
                <div class="detail-row">
                  <span class="row-label">剖析原因</span>
                  <p class="row-text">{{ selectedOptionDetail.reason }}</p>
                </div>
                <div v-if="selectedOptionDetail.correction" class="detail-row correction-row">
                  <span class="row-label">纠正指引</span>
                  <p class="row-text">{{ selectedOptionDetail.correction }}</p>
                </div>
                <div v-if="selectedOptionDetail.misconception" class="detail-row misconception-row">
                  <span class="row-label">常见误区</span>
                  <p class="row-text">{{ selectedOptionDetail.misconception }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: 🎯 评分细则 (主观/简答题专享) -->
          <div v-if="activeConsoleTab === 'rubrics' && analysisData.rubric" class="tab-panel rubrics-panel">
            <p class="panel-subtitle">AI 智能评分细则，对照诊断您的回答得分点：</p>
            <div class="rubric-cards-grid">
              <div
                v-for="rubric in analysisData.rubric"
                :key="rubric.id"
                class="rubric-card"
                :class="{ 'is-required': rubric.required }"
              >
                <div class="rubric-card-header">
                  <div class="header-left">
                    <span class="rubric-id">{{ rubric.id }}</span>
                    <span class="rubric-criterion">{{ rubric.criterion }}</span>
                  </div>
                  <span class="rubric-points">+{{ rubric.points }} 分</span>
                </div>
                <div class="rubric-card-body">
                  <div class="level-box full-credit">
                    <span class="level-badge green">满分要求</span>
                    <p>{{ rubric.full_credit }}</p>
                  </div>
                  <div v-if="rubric.partial_credit" class="level-box partial-credit">
                    <span class="level-badge blue">部分得分</span>
                    <p>{{ rubric.partial_credit }}</p>
                  </div>
                  <div class="level-box no-credit">
                    <span class="level-badge red">零分警示</span>
                    <p>{{ rubric.no_credit }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: ⚠️ 避坑指南与误区 -->
          <div v-if="activeConsoleTab === 'pitfalls'" class="tab-panel pitfalls-panel">
            <!-- 常见错误分析 -->
            <div v-if="analysisData.common_errors && analysisData.common_errors.length > 0" class="section-group">
              <h4 class="section-title">常见错误剖析</h4>
              <div class="errors-list">
                <div v-for="(err, idx) in analysisData.common_errors" :key="idx" class="error-detail-item">
                  <div class="item-header">
                    <span class="error-badge">{{ err.label }}</span>
                    <span class="error-code">Code: {{ err.code }}</span>
                  </div>
                  <div class="item-body">
                    <div class="body-block">
                      <span class="sub-label">错误成因：</span>
                      <p>{{ err.reason }}</p>
                    </div>
                    <div class="body-block highlight">
                      <span class="sub-label">纠偏方案：</span>
                      <p>{{ err.correction }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 常见误区 -->
            <div v-if="analysisData.common_misconceptions && analysisData.common_misconceptions.length > 0" class="section-group">
              <h4 class="section-title">概念与认知误区</h4>
              <ul class="misconceptions-list">
                <li v-for="(mis, idx) in analysisData.common_misconceptions" :key="idx">
                  <span class="warning-dot">⚠️</span>
                  <p>{{ mis }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史遗留常见错误分析 (兼容旧版数据，如果无 analysis 时渲染) -->
      <div v-if="!hasAnalysis && question.commonMistakes?.length" class="common-mistakes">
        <h4 class="mistakes-title">常见错误分析</h4>
        <div
          v-for="(mistake, idx) in question.commonMistakes"
          :key="idx"
          class="mistake-item"
        >
          <span class="mistake-option">{{ mistake.option || mistake.label || 'A' }}</span>
          <div class="mistake-body">
            <p class="mistake-reason">{{ mistake.reason }}</p>
            <p v-if="mistake.example" class="mistake-example">例：{{ mistake.example }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签区域 -->
    <div v-if="question.tags?.length || question.knowledgePoints?.length || question.abilityTags?.length" class="question-tags">
      <span v-for="kp in question.knowledgePoints" :key="'kp-'+kp" class="tag-kp">{{ kp }}</span>
      <span v-for="at in question.abilityTags" :key="'at-'+at" class="tag-ability">{{ at }}</span>
      <span v-for="tag in question.tags" :key="tag" class="tag-normal">{{ tag }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'
import CodeEditor from '@/components/exam/CodeEditor.vue'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'

const props = defineProps<{
  question: EvaluationQuestion
  displayIndex?: number
  showAnswer: boolean
}>()

const selectedOptions = ref<string[]>([])
const textAnswer = ref('')
const codeLang = ref('c11')

// 填空题专属数据管理
const blankAnswers = ref<string[]>([])

const currentOptions = computed(() => normalizeQuestionOptions(props.question.options))
const answerText = computed(() => getQuestionAnswerText(props.question.correctAnswer))

// 格式化参考答案（换行转换等，简答题友好）
const formattedAnswerText = computed(() => {
  const rawText = answerText.value || '暂无参考答案'
  return rawText.replace(/\n/g, '<br/>')
})

// 格式化解析文本（支持 explanation 和 analysis.summary 兜底）
const formattedExplanationText = computed(() => {
  const rawText = props.question.explanation || (props.question.analysis as any)?.summary || '暂无解析'
  return rawText.replace(/\n/g, '<br/>')
})

// 解析 analysis 深度数据
const analysisData = computed<any>(() => props.question.analysis || {})
const hasAnalysis = computed(() => {
  const analysis = props.question.analysis
  if (!analysis) return false
  return (
    (Array.isArray(analysis.reasoning_steps) && analysis.reasoning_steps.length > 0) ||
    (analysis.option_analysis && Object.keys(analysis.option_analysis).length > 0) ||
    (Array.isArray(analysis.rubric) && analysis.rubric.length > 0) ||
    (Array.isArray(analysis.common_errors) && analysis.common_errors.length > 0) ||
    (Array.isArray(analysis.common_misconceptions) && analysis.common_misconceptions.length > 0)
  )
})

// 控制台页签选择
const activeConsoleTab = ref('reasoning')

// 选项解析页签选择 (默认 'A')
const activeOptionDetailTab = ref('A')
const selectedOptionDetail = computed(() => {
  const optAnalysis = analysisData.value.option_analysis
  if (!optAnalysis) return null
  return optAnalysis[activeOptionDetailTab.value] || null
})

// 获取填空题的标准填空数
const blanksList = computed<any[]>(() => {
  if (props.question.questionType !== 'fill_blank') return []
  const answer = props.question.correctAnswer
  if (answer && typeof answer === 'object' && Array.isArray((answer as any).blanks)) {
    return (answer as any).blanks
  }
  return []
})

// 初始化填空题的输入框
const initBlanks = () => {
  if (props.question.questionType === 'fill_blank' && blanksList.value.length > 0) {
    blankAnswers.value = new Array(blanksList.value.length).fill('')
  }
}

// 监听填空题输入，拼接为 textAnswer 抛出
const onBlankInput = () => {
  textAnswer.value = blankAnswers.value.join(' | ')
}

// 判定填空题某一空是否回答正确
const isBlankCorrect = (index: number) => {
  const standardObj = blanksList.value[index]
  const userText = (blankAnswers.value[index] || '').trim()
  if (!standardObj) return false
  
  // 支持字符串大小写和去空格对比
  const standardAnswer = String(standardObj.answer || '').trim()
  return userText.toLowerCase() === standardAnswer.toLowerCase()
}

// 可用的 AI 页签列表
const availableTabs = computed(() => {
  const list = []
  if (analysisData.value.reasoning_steps?.length > 0) {
    list.push({ label: '💡 思维推理步骤', value: 'reasoning' })
  }
  if (analysisData.value.option_analysis && Object.keys(analysisData.value.option_analysis).length > 0) {
    list.push({ label: '🔍 选项深度剖析', value: 'options' })
  }
  if (analysisData.value.rubric?.length > 0) {
    list.push({ label: '🎯 评分细则 (Rubric)', value: 'rubrics' })
  }
  if (
    (analysisData.value.common_errors?.length > 0) ||
    (analysisData.value.common_misconceptions?.length > 0)
  ) {
    list.push({ label: '⚠️ 易错避坑指南', value: 'pitfalls' })
  }
  return list
})

// 当页签列表更新时，若当前的 activeConsoleTab 不在列表中，默认指向第一个
watch(availableTabs, (newList) => {
  if (newList.length > 0) {
    const exists = newList.some(tab => tab.value === activeConsoleTab.value)
    if (!exists) {
      activeConsoleTab.value = newList[0].value
    }
  }
}, { immediate: true })

// 监听 question 变化以重置或初始化
watch(() => props.question, () => {
  selectedOptions.value = []
  textAnswer.value = ''
  initBlanks()
  // 重置选项剖析的默认 Tab
  if (analysisData.value.option_analysis) {
    const keys = Object.keys(analysisData.value.option_analysis)
    if (keys.length > 0) {
      activeOptionDetailTab.value = keys.includes('B') && !keys.includes('A') ? keys[0] : 'A'
    }
  }
}, { immediate: true })

onMounted(() => {
  initBlanks()
})

const isMultiChoice = computed(() => props.question.questionType === 'multiple_choice')
const correctOptionsList = computed(() => {
  if (!props.question.correctAnswer || typeof props.question.correctAnswer !== 'object') return []
  const answerMap = props.question.correctAnswer as Record<string, any>
  if (Array.isArray(answerMap.correctOptions)) {
    return answerMap.correctOptions.map(String)
  }
  return []
})

const isCurrentAnswerCorrect = computed(() => {
  // 1. 选择题判定
  if (currentOptions.value.length > 0) {
    if (correctOptionsList.value.length === 0) return false
    if (selectedOptions.value.length !== correctOptionsList.value.length) return false
    return selectedOptions.value.every(opt => correctOptionsList.value.includes(opt))
  }
  // 2. 判断题判定
  if (props.question.questionType === 'judge') {
    if (textAnswer.value === 'true' && answerText.value === '正确') return true
    if (textAnswer.value === 'false' && answerText.value === '错误') return true
    return false
  }
  // 3. 填空题判定：每个空都必须答对
  if (props.question.questionType === 'fill_blank') {
    if (blanksList.value.length > 0) {
      return blanksList.value.every((_, idx) => isBlankCorrect(idx))
    }
    return textAnswer.value.trim() === answerText.value.trim()
  }
  // 简答、代码等主观题暂由 AI 进行判分展示，前端答题正确性校验兜底为 true
  return true
})

function getQuestionTypeLabel(type: string | undefined): string {
  return getQuestionTypeName(props.question)
}

function toggleOption(label: string) {
  if (props.showAnswer) return
  if (isMultiChoice.value) {
    const idx = selectedOptions.value.indexOf(label)
    if (idx > -1) {
      selectedOptions.value.splice(idx, 1)
    } else {
      selectedOptions.value.push(label)
    }
  } else {
    selectedOptions.value = [label]
  }
  textAnswer.value = selectedOptions.value.join(',')
}

function selectJudge(val: string) {
  if (props.showAnswer) return
  textAnswer.value = val
}
</script>

<style scoped>
.interactive-question-card {
  background: var(--color-card-bg-secondary, #ffffff);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(11, 183, 170, 0.06);
  border-color: rgba(11, 183, 170, 0.2);
}

.interactive-question-card.has-console {
  border-bottom: 3px solid rgba(11, 183, 170, 0.3);
}

.question-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.type-badge {
  background: linear-gradient(135deg, #0bb7aa, #0d9488);
  color: white;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.2);
}

.difficulty-badge, .score-badge {
  background: rgba(11, 183, 170, 0.08);
  color: #0bb7aa;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.score-badge {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}

.question-stem {
  font-size: 16px;
  color: var(--text-primary, #1e293b);
  line-height: 1.7;
  font-weight: 600;
  margin-bottom: 24px;
}

.q-display-index {
  color: #0bb7aa;
  font-weight: 700;
  margin-right: 6px;
}

.question-interaction {
  margin-bottom: 20px;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  background: var(--bg-card, #ffffff);
  border: 1.5px solid var(--border-default, #e2e8f0);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.option-button:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: #0bb7aa;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.08);
  background: rgba(11, 183, 170, 0.01);
}

.option-label-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary, #f1f5f9);
  border-radius: 50%;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.option-content-text {
  font-weight: 500;
  color: var(--text-primary, #334155);
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}

/* 选项状态 */
.option-button.selected {
  background: rgba(11, 183, 170, 0.04);
  border-color: #0bb7aa;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.1);
}
.option-button.selected .option-label-circle {
  background: #0bb7aa;
  color: white;
}

.option-button.correct {
  background: rgba(16, 185, 129, 0.08);
  border-color: #10b981;
}
.option-button.correct .option-label-circle {
  background: #10b981;
  color: white;
}

.option-button.wrong {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
}
.option-button.wrong .option-label-circle {
  background: #ef4444;
  color: white;
}

.feedback-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  flex-shrink: 0;
}
.feedback-icon.correct { background: #10b981; }
.feedback-icon.wrong { background: #ef4444; }

/* 判断题 */
.judge-list {
  display: flex;
  gap: 16px;
}
.judge-btn {
  flex: 1;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  padding: 18px;
}

/* 填空题 */
.fill-blank-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fill-blank-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.blank-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.blank-label {
  font-size: 14px;
  color: var(--text-primary, #475569);
  font-weight: 600;
  min-width: 80px;
}
.blank-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 8px 12px;
  border: 1.5px solid var(--border-default, #e2e8f0);
  box-shadow: none;
  background: var(--bg-secondary, #f8fafc);
}
.blank-input :deep(.el-input__wrapper.is-focus) {
  border-color: #0bb7aa;
  background: var(--bg-card, #ffffff);
}
.blank-feedback {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}
.blank-feedback.correct {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.blank-feedback.wrong {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
.custom-single-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 12px 16px;
}

/* 代码题 */
.code-answer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lang-select {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--border-default, #e2e8f0);
  font-weight: 600;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #1e293b);
}

/* 主观简答题 */
.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 12px;
  background: var(--bg-secondary, #f8fafc);
  border: 1.5px solid var(--border-default, #e2e8f0);
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: none;
  transition: all 0.3s;
  color: var(--text-primary, #334155);
}
.custom-textarea :deep(.el-textarea__inner:focus) {
  background: var(--bg-card, #ffffff);
  border-color: #0bb7aa;
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
}

/* ==================== 解析面板 ==================== */
.answer-panel {
  background: linear-gradient(180deg, var(--bg-secondary, #f8fafc) 0%, var(--bg-primary, #f1f5f9) 100%);
  border-radius: 14px;
  padding: 24px;
  margin-top: 24px;
  border: 1px solid var(--border-default, #e2e8f0);
  animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.answer-result-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.06);
  border-left: 4px solid #ef4444;
  color: #ef4444;
}
.answer-result-banner.is-correct {
  background: rgba(16, 185, 129, 0.06);
  border-left-color: #10b981;
  color: #10b981;
}
.short-answer-banner {
  background: rgba(99, 102, 241, 0.06);
  border-left-color: #6366f1;
  color: #6366f1;
}

.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: currentColor;
  color: white;
  border-radius: 50%;
}
.banner-title {
  font-weight: 700;
  font-size: 14px;
}

.answer-reference {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  background: var(--bg-card, #ffffff);
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border-default, #e2e8f0);
}
.ref-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  font-weight: 700;
  white-space: nowrap;
  background: var(--bg-secondary, #f1f5f9);
  padding: 3px 8px;
  border-radius: 6px;
}
.ref-value {
  font-size: 15px;
  color: var(--success-color, #10b981);
  font-weight: 700;
  line-height: 1.6;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
}

.explanation-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  background: var(--bg-card, #ffffff);
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border-default, #e2e8f0);
}
.explanation-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  font-weight: 700;
  align-self: flex-start;
  background: var(--bg-secondary, #f1f5f9);
  padding: 3px 8px;
  border-radius: 6px;
}
.explanation-content {
  font-size: 14px;
  color: var(--text-primary, #334155);
  line-height: 1.6;
}

/* ==================== AI 智能解析控制台样式 ==================== */
.ai-console-wrapper {
  background: var(--bg-card, #ffffff);
  border-radius: 12px;
  border: 1.5px solid rgba(11, 183, 170, 0.15);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(11, 183, 170, 0.02);
}

.ai-console-header {
  background: linear-gradient(90deg, rgba(11, 183, 170, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%);
  padding: 14px 20px;
  border-bottom: 1px solid rgba(11, 183, 170, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.console-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0d9488;
  font-size: 15px;
}
.sparkle-icon {
  font-size: 16px;
  animation: shine 2s infinite ease-in-out;
}
@keyframes shine {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

.console-tabs {
  display: flex;
  background: var(--bg-secondary, #f1f5f9);
  padding: 4px;
  border-radius: 8px;
  gap: 2px;
}

.console-tab-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748b);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.console-tab-btn.active {
  background: var(--bg-card, #ffffff);
  color: #0bb7aa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.ai-console-content {
  padding: 20px;
}

/* Tab 1: 思维推理面板 */
.timeline-wrapper {
  position: relative;
  padding-left: 24px;
}
.timeline-wrapper::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: linear-gradient(180deg, #0bb7aa 0%, #818cf8 100%);
  opacity: 0.3;
}

.timeline-item {
  position: relative;
  margin-bottom: 18px;
}
.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-node {
  position: absolute;
  left: -24px;
  top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--bg-card, #ffffff);
  border: 2px solid #0bb7aa;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
}
.node-num {
  font-size: 10px;
  color: #0bb7aa;
  font-weight: 800;
}

.timeline-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary, #334155);
  line-height: 1.6;
}

/* Tab 2: 选项对比剖析 */
.option-tab-headers {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-default, #f1f5f9);
  padding-bottom: 10px;
}
.option-pill {
  border: 1.5px solid var(--border-default, #e2e8f0);
  background: var(--bg-card, #ffffff);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-regular, #475569);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.option-pill.active {
  border-color: #0bb7aa;
  background: rgba(11, 183, 170, 0.03);
  color: #0bb7aa;
}
.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: #cbd5e1;
}
.option-pill.is-correct.active .pill-dot { background: #10b981; }
.option-pill.is-wrong.active .pill-dot { background: #ef4444; }

.option-detail-card {
  background: var(--bg-secondary, #f8fafc);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--border-default, #e2e8f0);
}
.option-detail-card.is-correct {
  border-left: 4px solid #10b981;
}
.option-detail-card:not(.is-correct) {
  border-left: 4px solid #ef4444;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.detail-header .badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.detail-header .badge.correct { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.detail-header .badge.wrong { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.option-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row-label {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  font-weight: 700;
}
.row-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-primary, #334155);
  line-height: 1.6;
}
.correction-row .row-text { color: #0d9488; font-weight: 500; }
.misconception-row .row-text { color: #b45309; }

/* Tab 3: 评分细则 */
.panel-subtitle {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 0 0 14px 0;
  font-weight: 500;
}
.rubric-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rubric-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-default, #e2e8f0);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
}
.rubric-card.is-required {
  border-left: 3px solid #6366f1;
}

.rubric-card-header {
  background: var(--bg-secondary, #f8fafc);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rubric-card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rubric-id {
  font-size: 11px;
  font-weight: 800;
  color: #4f46e5;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
.rubric-criterion {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}
.rubric-points {
  font-size: 13px;
  font-weight: 800;
  color: #0d9488;
}

.rubric-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.level-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.level-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.level-badge.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.level-badge.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.level-badge.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.level-box p {
  margin: 0;
  font-size: 13px;
  color: var(--text-regular, #475569);
  line-height: 1.5;
}

/* Tab 4: 避坑指南 */
.section-group {
  margin-bottom: 20px;
}
.section-group:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary, #1e293b);
  margin: 0 0 12px 0;
  border-bottom: 1.5px solid var(--border-default, #f1f5f9);
  padding-bottom: 6px;
}
.errors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.error-detail-item {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 14px;
}
.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.error-badge {
  font-size: 12px;
  font-weight: 700;
  color: #b45309;
  background: #fde68a;
  padding: 2px 8px;
  border-radius: 4px;
}
.error-code {
  font-size: 11px;
  color: #92400e;
  font-weight: 600;
  font-family: monospace;
}
.item-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.body-block {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 6px;
}
.body-block:last-child {
  margin-bottom: 0;
}
.body-block.highlight {
  color: #047857;
  background: rgba(52, 211, 153, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
}
.body-block .sub-label {
  font-weight: 700;
}

.misconceptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.misconceptions-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  padding: 10px 14px;
  border-radius: 8px;
}
.misconceptions-list p {
  margin: 0;
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
}

/* 兼容旧的常见错误 */
.common-mistakes {
  margin-top: 20px;
}
.mistakes-title {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.mistake-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  margin-bottom: 8px;
}
.mistake-option {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #f59e0b;
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.mistake-body {
  flex: 1;
}
.mistake-reason {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #92400e;
  font-weight: 600;
}
.mistake-example {
  margin: 0;
  font-size: 12px;
  color: #a16207;
  font-style: italic;
}

/* 标签区 */
.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.question-tags span {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.tag-kp {
  background: rgba(11, 183, 170, 0.08);
  color: #0bb7aa;
}
.tag-ability {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}
.tag-normal {
  background: #f1f5f9;
  color: #64748b;
}

/* ==================== 深色模式覆盖 ==================== */
html[data-theme='dark'] {
  .interactive-question-card {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .option-button {
    background: #171e2a;
    border-color: #2b3645;
    &:not(:disabled):hover {
      background: rgba(11, 183, 170, 0.05);
    }
  }
  .option-label-circle {
    background: #202936;
    color: #b5c0ce;
  }
  .option-content-text {
    color: #f4f7fb;
  }
  .answer-panel {
    background: linear-gradient(180deg, #171e2a 0%, #111722 100%);
    border-color: #2b3645;
  }
  .answer-reference {
    background: #111722;
    border-color: #2b3645;
  }
  .explanation-box {
    background: #111722;
    border-color: #2b3645;
  }
  .explanation-label {
    background: #202936;
    color: #b5c0ce;
  }
  .explanation-content {
    color: #b5c0ce;
  }
  .ai-console-wrapper {
    background: #171e2a;
    border-color: rgba(11, 183, 170, 0.3);
  }
  .console-tabs {
    background: #111722;
  }
  .console-tab-btn.active {
    background: #171e2a;
  }
  .timeline-node {
    background: #171e2a;
  }
  .timeline-content p {
    color: #b5c0ce;
  }
  .option-pill {
    background: #111722;
    border-color: #2b3645;
    color: #b5c0ce;
    &.active {
      background: rgba(11, 183, 170, 0.08);
    }
  }
  .option-detail-card {
    background: #111722;
    border-color: #2b3645;
  }
  .option-title {
    color: #f4f7fb;
  }
  .row-text {
    color: #b5c0ce;
  }
  .rubric-card {
    background: #171e2a;
    border-color: #2b3645;
  }
  .rubric-card-header {
    background: #111722;
    border-color: #2b3645;
  }
  .rubric-criterion {
    color: #f4f7fb;
  }
  .level-box p {
    color: #b5c0ce;
  }
  .error-detail-item {
    background: #2b2212;
    border-color: #4b3d22;
    color: #f4f7fb;
  }
  .error-badge {
    background: #d97706;
    color: white;
  }
  .error-code {
    color: #fbbf24;
  }
  .body-block.highlight {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }
  .misconceptions-list li {
    background: #2d1818;
    border-color: #4c1d1d;
  }
  .misconceptions-list p {
    color: #fca5a5;
  }
  .blank-input :deep(.el-input__wrapper) {
    background: #111722;
    border-color: #2b3645;
  }
}
</style>
