<template>
  <div :class="['result-panel', panelClass]">
    <!-- 顶部状态栏 -->
    <ResultStatus 
      :status="status" 
      :score="score" 
      :totalScore="question.score"
    />

    <!-- 作答对比卡片 -->
    <ResultInfoCard 
      :userAnswer="userAnswerText" 
      :correctAnswer="correctAnswerText"
    />

    <!-- Judge0/沙箱判题结果：只展示后端裁剪后的安全信息 -->
    <div class="judge-result-panel" v-if="judgeResult">
      <div class="judge-result-header">
        <span class="judge-status-badge" :class="judgeStatusClass">{{ judgeStatusText }}</span>
        <span class="judge-summary-text">
          通过 {{ judgeSummary.passed }}/{{ judgeSummary.total }} 个用例
        </span>
      </div>
      <div class="judge-message" v-if="judgeMessage">
        <pre>{{ judgeMessage }}</pre>
      </div>
      <div class="judge-cases" v-if="judgeCases.length">
        <div v-for="item in judgeCases" :key="String(item.caseId)" class="judge-case-row">
          <div class="case-meta">
            <span class="case-status" :class="`case-${String(item.status || '').toLowerCase()}`">{{ item.status }}</span>
            <span>{{ item.sample ? '样例用例' : '隐藏用例' }}</span>
            <span>{{ item.timeMs || 0 }}ms</span>
            <span>{{ item.memoryKb || 0 }}KB</span>
          </div>
          <pre v-if="item.sample && item.actualOutput" class="case-output">{{ item.actualOutput }}</pre>
        </div>
      </div>
    </div>

    <!-- AI 展开解析触发条 -->
    <AIAnalysisTrigger 
      v-if="hasAnalysis" 
      :expanded="isExpanded"
      @toggle="toggleExpand"
    />

    <!-- AI 深度解析内容面板 -->
    <transition name="fade-slide">
      <div class="ai-analysis-panel" v-if="hasAnalysis && isExpanded">
        <div class="panel-header">
          <div class="panel-title-left">
            <div class="panel-title-icon">
              <!-- 智能星光图标 -->
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="sparkles-icon">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="panel-title-text">AI 深度辅导与解析</span>
          </div>
          <button type="button" class="collapse-analysis-btn" @click="toggleExpand">
            <span>收起解析</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" class="collapse-arrow-icon">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        </div>

        <!-- 1. 核心考点与概览 -->
        <div class="analysis-section summary-section" v-if="analysisSummary">
          <div class="section-title">
            <span class="title-decor"></span>
            <span>核心考点分析</span>
          </div>
          <div class="section-body summary-body" v-html="analysisSummary"></div>
        </div>

        <!-- 2. 推导步骤 -->
        <div class="analysis-section reasoning-section" v-if="parsedAnalysis?.reasoning_steps && parsedAnalysis.reasoning_steps.length">
          <div class="section-title">
            <span class="title-decor"></span>
            <span>解题思路与推理步骤</span>
          </div>
          <div class="section-body">
            <div class="custom-timeline">
              <div v-for="(step, idx) in parsedAnalysis.reasoning_steps" :key="idx" class="timeline-item">
                <div class="timeline-node">
                  <span class="node-num">{{ idx + 1 }}</span>
                </div>
                <div class="timeline-content">
                  <div class="step-title">步骤 {{ idx + 1 }}</div>
                  <div class="step-desc">{{ step }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 主观题评分标准 -->
        <div class="analysis-section rubric-section" v-if="parsedAnalysis?.rubric && parsedAnalysis.rubric.length">
          <div class="section-title">
            <span class="title-decor"></span>
            <span>评分细则与给分标准</span>
          </div>
          <div class="section-body">
            <div class="rubric-table-wrapper">
              <table class="rubric-table">
                <thead>
                  <tr>
                    <th width="25%">评分维度</th>
                    <th width="15%">分值</th>
                    <th width="60%">判定标准与要求</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rub in parsedAnalysis.rubric" :key="rub.id">
                    <td class="font-bold text-slate-800">{{ rub.criterion }}</td>
                    <td><span class="score-badge-inline">{{ rub.points }}分</span></td>
                    <td class="rubric-detail-cell">
                      <div class="rubric-row-desc full-score">
                        <span class="desc-badge full">满分</span>
                        <span class="desc-text">{{ rub.full_credit }}</span>
                      </div>
                      <div class="rubric-row-desc partial-score" v-if="rub.partial_credit">
                        <span class="desc-badge partial">半给分</span>
                        <span class="desc-text">{{ rub.partial_credit }}</span>
                      </div>
                      <div class="rubric-row-desc no-score">
                        <span class="desc-badge none">零分</span>
                        <span class="desc-text">{{ rub.no_credit }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4. 选项深入剖析 -->
        <div class="analysis-section options-analysis-section" v-if="parsedAnalysis?.option_analysis">
          <div class="section-title">
            <span class="title-decor"></span>
            <span>各选项深度解剖</span>
          </div>
          <div class="section-body">
            <div class="options-analysis-grid">
              <div 
                v-for="(optDetail, label) in parsedAnalysis.option_analysis" 
                :key="label" 
                class="opt-analysis-card"
                :class="optDetail.is_correct ? 'is-correct-option' : 'is-wrong-option'"
              >
                <div class="opt-card-header">
                  <span class="opt-label-badge">{{ label }} 选项</span>
                  <span class="opt-status-tag" :class="{ correct: optDetail.is_correct }">
                    {{ optDetail.is_correct ? '正确选项' : '干扰项' }}
                  </span>
                </div>
                <div class="opt-card-body">
                  <div class="analysis-item-row">
                    <span class="row-label">原因剖析：</span>
                    <span class="row-value">{{ optDetail.reason }}</span>
                  </div>
                  <div class="analysis-item-row" v-if="optDetail.misconception">
                    <span class="row-label text-amber-600">误区警示：</span>
                    <span class="row-value">{{ optDetail.misconception }}</span>
                  </div>
                  <div class="analysis-item-row" v-if="optDetail.correction">
                    <span class="row-label text-emerald-600">纠错建议：</span>
                    <span class="row-value">{{ optDetail.correction }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. 填空空位分析 -->
        <div class="analysis-section blank-analysis-section" v-if="parsedAnalysis?.blank_analysis && parsedAnalysis.blank_analysis.length">
          <div class="section-title">
            <span class="title-decor"></span>
            <span>填空题解法分析</span>
          </div>
          <div class="section-body">
            <div class="blank-cards-list">
              <div v-for="blank in parsedAnalysis.blank_analysis" :key="blank.index" class="blank-info-card">
                <div class="blank-card-header">
                  <span class="blank-index-badge">第 {{ blank.index }} 空</span>
                  <span class="blank-accept-answers">
                    可接受的答案形式：<code class="code-answers">{{ formatAcceptedAnswers(blank.accepted_answers) }}</code>
                  </span>
                </div>
                <div class="blank-card-body">
                  <div class="blank-explanation-row">
                    <strong>考点分析：</strong>{{ blank.reason }}
                  </div>
                  <div v-if="blank.common_errors && blank.common_errors.length" class="blank-errors-box">
                    <div class="box-title">典型错误写法与纠错：</div>
                    <div class="errors-grid">
                      <div v-for="(err, eIdx) in blank.common_errors" :key="eIdx" class="error-item-card">
                        <div class="err-header-row">
                          <span class="err-exp-text">错误书写：<code>{{ err.example }}</code></span>
                        </div>
                        <div class="err-detail-text"><strong>原因：</strong>{{ err.reason }}</div>
                        <div class="err-detail-text correction" v-if="err.correction"><strong>建议：</strong>{{ err.correction }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. 避坑指南与常见误区 -->
        <div class="analysis-section warning-section" v-if="hasMisconceptions">
          <div class="section-title text-orange-600">
            <span class="title-decor orange"></span>
            <span>避坑指南与易错警示</span>
          </div>
          <div class="section-body">
            <!-- 易错概念 -->
            <div class="misconception-card" v-if="misconceptions.length > 0">
              <div class="misconception-card-title">易混淆核心误区：</div>
              <ul class="mis-list">
                <li v-for="(mis, mIdx) in misconceptions" :key="mIdx" class="mis-item">
                  <span class="mis-icon">!</span>
                  <span class="mis-text">{{ mis }}</span>
                </li>
              </ul>
            </div>

            <!-- 典型编码/逻辑错误 -->
            <div class="common-errors-container" v-if="parsedAnalysis?.common_errors && parsedAnalysis.common_errors.length">
              <div class="common-errors-title">常见典型错误分析：</div>
              <div class="errors-grid-flow">
                <div v-for="(err, idx) in parsedAnalysis.common_errors" :key="idx" class="common-error-flow-card">
                  <div class="flow-header">
                    <span class="flow-badge">{{ err.label }}</span>
                  </div>
                  <div class="flow-body">
                    <div class="flow-text-row"><strong>产生原因：</strong>{{ err.reason }}</div>
                    <div class="flow-text-row correction" v-if="err.correction"><strong>修正方案：</strong>{{ err.correction }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResultStatus from './ResultStatus.vue'
import ResultInfoCard from './ResultInfoCard.vue'
import AIAnalysisTrigger from './AIAnalysisTrigger.vue'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'
import type { AnswerDetailVO } from '@/api/evaluationSession'

const props = defineProps<{
  question: EvaluationQuestion
  grading?: AnswerDetailVO
  userAnswerText?: string
  correctAnswerText: string
  isCorrectLocal: boolean
  sessionId?: string
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-expand'): void
}>()

const toggleExpand = () => {
  emit('toggle-expand')
}

// 判定作答状态
interface JudgeCaseView {
  caseId?: string | number
  sample?: boolean
  status?: string
  timeMs?: number
  memoryKb?: number
  actualOutput?: string
}

const judgeResult = computed(() => {
  const value = props.grading?.judgeResult
  return value && typeof value === 'object' ? value as Record<string, any> : null
})

const judgeSummary = computed(() => {
  const summary = judgeResult.value?.summary || {}
  return {
    total: Number(summary.total || 0),
    passed: Number(summary.passed || 0)
  }
})

const judgeCases = computed<JudgeCaseView[]>(() => {
  const cases = judgeResult.value?.cases
  return Array.isArray(cases) ? cases : []
})

const judgeStatusText = computed(() => {
  return String(judgeResult.value?.status || 'PENDING')
})

const judgeStatusClass = computed(() => {
  return `judge-${judgeStatusText.value.toLowerCase()}`
})

const judgeMessage = computed(() => {
  return String(judgeResult.value?.compileMessage || judgeResult.value?.runtimeMessage || '').trim()
})

const status = computed(() => {
  const g = props.grading
  if (g && g.status === 'graded') {
    return g.isCorrect ? 'correct' : 'wrong'
  }
  if (g && g.status === 'pending_review') {
    return 'pending'
  }
  if (!props.sessionId) {
    if (props.question.questionType === 'short_answer' || props.question.questionType === 'essay') {
      return 'self_check'
    }
    return props.isCorrectLocal ? 'correct' : 'wrong'
  }
  return 'self_check'
})

// 得分
const score = computed(() => {
  const g = props.grading
  if (g && g.status === 'graded') {
    return g.score ?? 0
  }
  return 0
})

// 结果面板容器的 CSS
const panelClass = computed(() => {
  const s = status.value
  if (s === 'correct') return 'correct-panel'
  if (s === 'wrong') return 'wrong-panel'
  return 'neutral-panel'
})

// 解析并容错获取 analysis 对象
const parsedAnalysis = computed(() => {
  const q = props.question
  if (!q.analysis) return null
  if (typeof q.analysis === 'string') {
    try {
      return JSON.parse(q.analysis)
    } catch {
      return null
    }
  }
  return q.analysis
})

// 核心考点解析
const analysisSummary = computed(() => {
  const analysis = parsedAnalysis.value
  if (analysis && analysis.summary) return analysis.summary
  return props.question.explanation || ''
})

// 检查是否有解析
const hasAnalysis = computed(() => {
  return !!analysisSummary.value || (parsedAnalysis.value && Object.keys(parsedAnalysis.value).length > 0)
})

// 格式化可接受的答案形式
const formatAcceptedAnswers = (answers: any): string => {
  if (Array.isArray(answers)) {
    return answers.join(' 或 ')
  }
  return String(answers || '')
}

// 避坑指南/易错点检查
const hasMisconceptions = computed(() => {
  const analysis = parsedAnalysis.value
  if (!analysis) return false
  const hasMis = Array.isArray(analysis.common_misconceptions) && analysis.common_misconceptions.length > 0
  const hasErrors = Array.isArray(analysis.common_errors) && analysis.common_errors.length > 0
  return hasMis || hasErrors
})

// 易混淆点
const misconceptions = computed(() => {
  const analysis = parsedAnalysis.value
  if (analysis && Array.isArray(analysis.common_misconceptions)) {
    return analysis.common_misconceptions
  }
  return []
})
</script>

<style scoped>
.result-panel {
  margin: 22px 28px 24px;
  padding: 24px;
  border-radius: 22px;
  transition: all 0.25s ease;
}

/* 答错红面板 */
.result-panel.wrong-panel {
  border: 1px solid #fecdd3;
  background: linear-gradient(180deg, #fffafa 0%, #fffdfd 100%);
}

/* 答对绿面板 */
.result-panel.correct-panel {
  border: 1px solid #bbf7d0;
  background: linear-gradient(180deg, #f9fdfa 0%, #ffffff 100%);
}

/* 默认/自测面板 */
.result-panel.neutral-panel {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 智能深度解析面板 */
.judge-result-panel {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fbff;
}

.judge-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.judge-status-badge,
.case-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  background: #e2e8f0;
  color: #334155;
}

.judge-ac,
.case-ac {
  background: #dcfce7;
  color: #166534;
}

.judge-wa,
.judge-ce,
.judge-re,
.judge-tle,
.judge-mle,
.case-wa,
.case-ce,
.case-re,
.case-tle,
.case-mle {
  background: #fee2e2;
  color: #991b1b;
}

.judge-summary-text {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.judge-message pre,
.case-output {
  margin: 10px 0 0;
  padding: 12px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-x: auto;
}

.judge-cases {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.judge-case-row {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.case-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.ai-analysis-panel {
  margin-top: 20px;
  border-radius: 18px;
  background: #ffffff;
  border: 1.5px solid #e2edff;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(53, 84, 138, 0.03);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #edf2f9;
  padding-bottom: 14px;
  margin-bottom: 20px;
}

.panel-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sparkles-icon {
  color: #3b82f6;
}

.panel-title-text {
  font-size: 16px;
  font-weight: 800;
  color: #1e3a8a;
}

.collapse-analysis-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.collapse-analysis-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

/* 解析节定义 */
.analysis-section {
  margin-bottom: 24px;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 12px;
}

.title-decor {
  width: 4px;
  height: 14px;
  background: #3b82f6;
  border-radius: 2px;
}

.title-decor.orange {
  background: #f97316;
}

.section-body {
  font-size: 14px;
  line-height: 1.7;
  color: #475467;
}

.summary-body {
  font-size: 15px;
  color: #334155;
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

/* 推理步骤时间线 */
.custom-timeline {
  display: flex;
  flex-direction: column;
  padding-left: 10px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 18px;
}

.timeline-item::after {
  content: '';
  position: absolute;
  left: 14px;
  top: 28px;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item:last-child::after {
  display: none;
}

.timeline-node {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eff6ff;
  border: 2px solid #bfdbfe;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 750;
  font-size: 12px;
  z-index: 1;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.step-title {
  font-size: 13px;
  font-weight: 800;
  color: #1e40af;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 14px;
  color: #334155;
}

/* 评分标准表格 */
.rubric-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.rubric-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.rubric-table th {
  background: #f8fafc;
  padding: 12px 16px;
  font-weight: 750;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.rubric-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  vertical-align: top;
}

.rubric-table tr:last-child td {
  border-bottom: none;
}

.score-badge-inline {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 750;
}

.rubric-detail-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rubric-row-desc {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.desc-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  flex-shrink: 0;
}

.desc-badge.full {
  background: #dcfce7;
  color: #166534;
}

.desc-badge.partial {
  background: #fef3c7;
  color: #92400e;
}

.desc-badge.none {
  background: #fee2e2;
  color: #991b1b;
}

.desc-text {
  font-size: 13px;
  color: #475569;
}

/* 选项剖析网格 */
.options-analysis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.opt-analysis-card {
  padding: 16px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
}

.opt-analysis-card.is-correct-option {
  border-color: #bbf7d0;
  background: #fcfdfd;
}

.opt-analysis-card.is-wrong-option {
  border-color: #f1f5f9;
  background: #fafbfc;
}

.opt-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.opt-label-badge {
  font-weight: 800;
  color: #334155;
  font-size: 14px;
}

.opt-status-tag {
  font-size: 12px;
  font-weight: 750;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
}

.opt-status-tag.correct {
  background: #dcfce7;
  color: #15803d;
}

.analysis-item-row {
  margin-bottom: 6px;
  font-size: 13.5px;
  line-height: 1.6;
}

.analysis-item-row:last-child {
  margin-bottom: 0;
}

.row-label {
  font-weight: 750;
  color: #475569;
  flex-shrink: 0;
}

.row-value {
  color: #334155;
}

/* 填空分析 */
.blank-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.blank-info-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}

.blank-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.blank-index-badge {
  background: #3b82f6;
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
}

.blank-accept-answers {
  font-size: 13px;
  color: #475569;
}

.code-answers {
  background: #e2e8f0;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.blank-explanation-row {
  font-size: 14px;
  color: #334155;
  margin-bottom: 12px;
}

.blank-errors-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 14px;
}

.box-title {
  font-weight: 800;
  font-size: 13px;
  color: #b45309;
  margin-bottom: 8px;
}

.errors-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.error-item-card {
  background: #ffffff;
  border: 1.5px solid #fef3c7;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
}

.err-header-row {
  margin-bottom: 6px;
  color: #92400e;
  font-weight: 700;
}

.err-detail-text {
  color: #4b5563;
  margin-bottom: 2px;
}

.err-detail-text.correction {
  color: #047857;
}

/* 避坑指南 */
.misconception-card {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.misconception-card-title {
  font-weight: 800;
  color: #c2410c;
  font-size: 14px;
  margin-bottom: 10px;
}

.mis-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mis-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.mis-item:last-child {
  margin-bottom: 0;
}

.mis-icon {
  width: 18px;
  height: 18px;
  background: #ea580c;
  color: #ffffff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}

.mis-text {
  font-size: 13.5px;
  color: #431407;
  line-height: 1.5;
}

.common-errors-container {
  margin-top: 14px;
}

.common-errors-title {
  font-weight: 800;
  font-size: 14px;
  color: #334155;
  margin-bottom: 10px;
}

.errors-grid-flow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.common-error-flow-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  background: #f8fafc;
}

.flow-header {
  margin-bottom: 8px;
}

.flow-badge {
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.flow-body {
  font-size: 13px;
  line-height: 1.5;
}

.flow-text-row {
  margin-bottom: 4px;
  color: #475569;
}

.flow-text-row.correction {
  color: #166534;
  margin-bottom: 0;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 深色模式适配 */
html[data-theme='dark'] .result-panel.wrong-panel {
  border-color: rgba(239, 68, 68, 0.25);
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
}

html[data-theme='dark'] .result-panel.correct-panel {
  border-color: rgba(34, 197, 94, 0.25);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
}

html[data-theme='dark'] .result-panel.neutral-panel {
  border-color: #334155;
  background: #1e293b;
}

html[data-theme='dark'] .ai-analysis-panel {
  background: #151e2d;
  border-color: #243049;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

html[data-theme='dark'] .panel-header {
  border-bottom-color: #243049;
}

html[data-theme='dark'] .panel-title-text {
  color: #38bdf8;
}

html[data-theme='dark'] .panel-title-icon {
  background: #1e293b;
  color: #38bdf8;
}

html[data-theme='dark'] .sparkles-icon {
  color: #38bdf8;
}

html[data-theme='dark'] .collapse-analysis-btn {
  color: #94a3b8;
}

html[data-theme='dark'] .collapse-analysis-btn:hover {
  background: #243049;
  color: #cbd5e1;
}

html[data-theme='dark'] .section-title {
  color: #cbd5e1;
}

html[data-theme='dark'] .summary-body {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .timeline-item::after {
  background: #334155;
}

html[data-theme='dark'] .timeline-node {
  background: #1e293b;
  border-color: #243049;
  color: #38bdf8;
}

html[data-theme='dark'] .timeline-content {
  background: #1e293b;
  border-color: #334155;
}

html[data-theme='dark'] .step-title {
  color: #60a5fa;
}

html[data-theme='dark'] .step-desc {
  color: #cbd5e1;
}

html[data-theme='dark'] .rubric-table-wrapper {
  border-color: #334155;
}

html[data-theme='dark'] .rubric-table th {
  background: #1e293b;
  color: #cbd5e1;
  border-bottom-color: #334155;
}

html[data-theme='dark'] .rubric-table td {
  border-bottom-color: #243049;
  color: #cbd5e1;
}

html[data-theme='dark'] .score-badge-inline {
  background: #1e293b;
  color: #60a5fa;
}

html[data-theme='dark'] .desc-text {
  color: #94a3b8;
}

html[data-theme='dark'] .desc-badge.full {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

html[data-theme='dark'] .desc-badge.partial {
  background: rgba(217, 119, 6, 0.2);
  color: #fbbf24;
}

html[data-theme='dark'] .desc-badge.none {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

html[data-theme='dark'] .opt-analysis-card {
  border-color: #334155;
  background: #1e293b;
}

html[data-theme='dark'] .opt-analysis-card.is-correct-option {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

html[data-theme='dark'] .opt-analysis-card.is-wrong-option {
  border-color: #334155;
  background: #1e293b;
}

html[data-theme='dark'] .opt-card-header {
  border-bottom-color: #334155;
}

html[data-theme='dark'] .opt-label-badge {
  color: #cbd5e1;
}

html[data-theme='dark'] .opt-status-tag {
  background: #334155;
  color: #94a3b8;
}

html[data-theme='dark'] .opt-status-tag.correct {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

html[data-theme='dark'] .row-label {
  color: #94a3b8;
}

html[data-theme='dark'] .row-value {
  color: #cbd5e1;
}

html[data-theme='dark'] .blank-info-card {
  border-color: #334155;
  background: #1e293b;
}

html[data-theme='dark'] .blank-card-header {
  border-bottom-color: #334155;
}

html[data-theme='dark'] .blank-index-badge {
  background: #2563eb;
}

html[data-theme='dark'] .blank-accept-answers {
  color: #94a3b8;
}

html[data-theme='dark'] .code-answers {
  background: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .blank-explanation-row {
  color: #cbd5e1;
}

html[data-theme='dark'] .blank-errors-box {
  background: rgba(217, 119, 6, 0.1);
  border-color: rgba(217, 119, 6, 0.2);
}

html[data-theme='dark'] .box-title {
  color: #fbbf24;
}

html[data-theme='dark'] .error-item-card {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .err-header-row {
  color: #fbbf24;
}

html[data-theme='dark'] .err-detail-text {
  color: #94a3b8;
}

html[data-theme='dark'] .err-detail-text.correction {
  color: #4ade80;
}

html[data-theme='dark'] .misconception-card {
  background: rgba(217, 119, 6, 0.1);
  border-color: rgba(217, 119, 6, 0.2);
}

html[data-theme='dark'] .misconception-card-title {
  color: #fbbf24;
}

html[data-theme='dark'] .mis-text {
  color: #fef3c7;
}

html[data-theme='dark'] .common-errors-title {
  color: #cbd5e1;
}

html[data-theme='dark'] .common-error-flow-card {
  border-color: #334155;
  background: #1e293b;
}

html[data-theme='dark'] .flow-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

html[data-theme='dark'] .flow-text-row {
  color: #cbd5e1;
}

html[data-theme='dark'] .flow-text-row.correction {
  color: #4ade80;
}
</style>
