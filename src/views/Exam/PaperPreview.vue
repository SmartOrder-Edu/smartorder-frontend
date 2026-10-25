<template>
  <AppLayout>
    <div class="paper-preview-container">
      <!-- 页面返回导航 -->
      <div class="back-nav" @click="router.push('/exam')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="back-icon">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>返回测评中心</span>
      </div>

      <!-- 顶部试卷基本信息与倒计时横幅 -->
      <header class="paper-header">
        <div class="header-info">
          <div class="paper-title-row">
            <span class="preview-badge">✨ 诊断重构演示版</span>
            <h1 class="paper-title">数据结构与算法专项诊断 · 链表指针操作</h1>
          </div>
          <p class="paper-desc">本试卷重点测评单向/双向链表的核心指针修改、边界条件判定及空间/时间效率对比，搭载全新知序 AI 深度诊断系统。</p>
        </div>
        
        <div class="header-status">
          <div v-if="!isSubmitted" class="countdown-box">
            <span class="label">剩余作答时间</span>
            <span class="time">{{ formattedTime }}</span>
          </div>
          <div v-else class="score-banner-box">
            <span class="label">综合测评得分</span>
            <span class="score-val">{{ totalScore }} <small>分</small></span>
          </div>
          
          <el-button
            v-if="!isSubmitted"
            type="primary"
            class="submit-paper-btn"
            @click="confirmSubmit"
          >
            提交试卷 & 启动 AI 诊断
          </el-button>
          <el-button
            v-else
            type="success"
            plain
            class="reset-paper-btn"
            @click="resetExam"
          >
            重新测评
          </el-button>
        </div>
      </header>

      <div class="paper-body-layout">
        <!-- 左侧：题目展示区域 -->
        <main class="paper-main-content">
          <!-- AI 智能测评诊断报告卡片 (已提交后显示) -->
          <div v-if="isSubmitted" class="ai-report-card">
            <div class="report-header">
              <div class="header-title">
                <span class="sparkle">✨</span>
                <h3>知序 AI 智能测评诊断报告</h3>
              </div>
              <span class="report-date">诊断时间: {{ currentDateTime }}</span>
            </div>
            
            <div class="report-dashboard">
              <!-- 左侧：雷达掌握度图表 -->
              <div class="report-chart-section">
                <h4 class="section-title">多维能力掌握度模型</h4>
                <div ref="radarChartRef" class="radar-chart"></div>
              </div>
              
              <!-- 右侧：诊断汇总与个性化建议 -->
              <div class="report-info-section">
                <div class="info-grid">
                  <div class="info-card">
                    <span class="card-label">客观题正确率</span>
                    <span class="card-val text-success">{{ accuracy }}%</span>
                  </div>
                  <div class="info-card">
                    <span class="card-label">答题时长</span>
                    <span class="card-val">02 分 14 秒</span>
                  </div>
                  <div class="info-card warning-theme">
                    <span class="card-label">建议巩固知识点</span>
                    <span class="card-val">双链表边界操作</span>
                  </div>
                </div>
                
                <div class="ai-suggestion-box">
                  <div class="tutor-header">
                    <div class="avatar">AI</div>
                    <strong>知序 AI 学习导师</strong>
                  </div>
                  <p class="suggestion-text">
                    {{ aiTutorAdvice }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 题目列表 -->
          <div class="questions-list">
            <InteractiveQuestionCard
              v-for="(q, index) in questions"
              :key="q.id + '-' + resetKey"
              :id="'question-anchor-' + index"
              :question="q"
              :display-index="index + 1"
              :show-answer="isSubmitted"
            />
          </div>
        </main>

        <!-- 右侧：答题卡与快速定位侧边栏 -->
        <aside class="paper-sidebar">
          <div class="sidebar-sticky">
            <!-- 答题卡 -->
            <div class="sidebar-card answer-card">
              <h4 class="card-title">答题卡</h4>
              
              <div class="legend-row">
                <div class="legend-item"><span class="dot unanswered"></span>未答</div>
                <div class="legend-item"><span class="dot answered"></span>已答</div>
                <div v-if="isSubmitted" class="legend-item"><span class="dot correct"></span>正确</div>
                <div v-if="isSubmitted" class="legend-item"><span class="dot wrong"></span>错误</div>
              </div>
              
              <div class="grid-buttons">
                <button
                  v-for="(q, index) in questions"
                  :key="q.id"
                  class="grid-btn"
                  :class="getGridBtnClass(q, index)"
                  @click="scrollToQuestion(index)"
                >
                  {{ index + 1 }}
                </button>
              </div>
            </div>

            <!-- AI 出题提醒 -->
            <div class="sidebar-card tutor-tip-card">
              <h4 class="card-title">✨ AI 智能助考</h4>
              <p class="tip-desc">提交试卷后，知序 AI 会根据您在单双链表指针方向、遍历代价分析及边界节点判空等关键考点的表现，为您一键生成定制的思维链纠错解析。</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import AppLayout from '@/components/layout/AppLayout.vue'
import InteractiveQuestionCard from '@/components/exam/InteractiveQuestionCard.vue'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'

const router = useRouter()
const resetKey = ref(0)
const isSubmitted = ref(false)

// 倒计时设置：45 分钟
const timeLeft = ref(45 * 60)
let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

// 时间戳
const currentDateTime = ref('')
const updateDateTime = () => {
  const now = new Date()
  currentDateTime.value = now.toLocaleString('zh-CN', { hour12: false })
}

// 模拟试卷 JSON 数据
const questions = ref<EvaluationQuestion[]>([
  {
    id: "48343636010000",
    questionCode: "数据结构-single_choice-1-48343636010000",
    learningSpaceId: "2074879890340634625",
    chapterId: "0",
    questionType: "single_choice",
    questionTypeName: "单选题",
    sortOrder: 1,
    difficulty: 5,
    score: 5.00,
    abilityDimension: null,
    stem: "以下关于链表指针操作的叙述中，正确的是（ ）。",
    options: [
      {
        label: "A",
        content: "在单链表中，删除一个已知节点（非尾节点）需要知道其前驱节点才能实现O(1)时间。"
      },
      {
        label: "B",
        content: "在双链表中，删除一个已知节点（非头非尾节点）只需修改两个指针。"
      },
      {
        label: "C",
        content: "在单链表中，向一个已知节点之后插入一个新节点只需修改一个指针。"
      },
      {
        label: "D",
        content: "在双链表中，向一个已知节点之后插入一个新节点只需修改两个指针。"
      }
    ],
    correctAnswer: {
      correctOptions: ["B"]
    },
    standardAnswer: ["B"],
    explanation: "在双链表删除已知节点非头尾时修改两个指针：pre->next=next 和 next->prev=pre；而单链表删除已知非尾节点可通过复制后继值到本节点后删除后继实现O(1)；单向链表向已知节点后插入需要修改两个指针，双链表插入则需修改四个指针。故B正确。",
    commonMistakes: [],
    knowledgePoints: ["单链表操作", "双链表操作", "指针修改", "链表删除与插入"],
    abilityTags: ["理解链表操作细节", "比较单双链表差异"],
    analysis: {
      summary: "本题考查单链表和双链表中插入与删除操作所需修改的指针数量，正确答案为B。",
      schema_version: 2,
      option_analysis: {
        A: {
          reason: "单链表删除已知节点（非尾）可以通过将后继节点数据复制到当前节点，然后删除后继节点的方法实现O(1)时间，不需要知道前驱节点。",
          correction: "对于非尾节点，复制数据法可以避免寻找前驱，使得时间复杂度为O(1)。",
          is_correct: false,
          misconception: "认为删除节点必须知道前驱节点才能进行，忽略了复制数据法的存在。"
        },
        B: {
          reason: "双链表中每个节点有prev and next指针，删除非头非尾节点时，只需将前驱节点的next指向后继节点，并将后继节点的prev指向前驱节点，共修改两个指针。",
          correction: null,
          is_correct: true,
          misconception: null
        },
        C: {
          reason: "在单链表中向已知节点之后插入新节点，需要修改两个指针：将新节点的next指向已知节点的后继，再将已知节点的next指向新节点。只修改一个指针会导致链表断裂或无法访问原后继。",
          correction: "单链表插入必须同时修改两个指针才能保持链表连续性。",
          is_correct: false,
          misconception: "误以为只需修改已知节点的next指针，忽略了新节点也需要指向后继。"
        },
        D: {
          reason: "在双链表中向已知节点之后插入新节点，需要修改四个指针：新节点的prev和next分别指向已知节点和已知节点的后继，已知节点的next指向新节点，已知节点的后继的prev指向新节点。只修改两个指针无法维持双向链接。",
          correction: "双链表插入需同时更新前后指针，共计四个指针。",
          is_correct: false,
          misconception: "混淆了单链表和双链表的差异，忘记双链表需要维护反向指针。"
        }
      },
      reasoning_steps: [
        "分析每个选项关于链表操作所需指针修改数量的陈述。",
        "回忆单链表删除已知节点（非尾）的O(1)方法：通过复制后继节点数据并删除后继，无需前驱。",
        "回忆双链表删除非边界节点：修改前驱的next和后继的prev，共两个指针。",
        "回忆单链表插入节点到已知节点之后：需修改新节点next和已知节点next，共两个指针；双链表插入相同位置需修改四个指针。"
      ],
      common_misconceptions: [
        "容易混淆单链表和双链表操作所需修改的指针数量。",
        "误以为单链表删除已知节点必须知道前驱。",
        "误以为单链表插入只需修改一个指针。",
        "误以为双链表插入只需修改两个指针。"
      ]
    },
    generationSource: "agent_generated",
    status: 1,
    reviewStatus: null,
    createdAt: "2026-07-14T20:47:16",
    updatedAt: "2026-07-14T20:47:16"
  },
  {
    id: "48343616010000",
    questionCode: "数据结构-multiple_choice-2-48343616010000",
    learningSpaceId: "2074879890340634625",
    chapterId: "0",
    questionType: "multiple_choice",
    questionTypeName: "多选题",
    sortOrder: 2,
    difficulty: 5,
    score: 8.00,
    abilityDimension: null,
    stem: "关于链表操作，以下哪些说法是正确的？（多选，至少有两个正确答案）",
    options: [
      {
        label: "A",
        content: "A. 在单链表中，如果只知道某个节点的指针p，则无法在p之前或之后插入一个新节点，也无法删除p本身，因为都需要知道p的前驱节点。"
      },
      {
        label: "B",
        content: "B. 在双链表中，如果只知道某个节点的指针p，则可以直接在p之前或之后插入新节点，也可以直接删除p本身，因为可以通过p的前驱和后继指针操作。"
      },
      {
        label: "C",
        content: "C. 在单链表中，若要删除一个已知指针的非头节点p，通常需要先遍历找到p的前驱节点，然后修改前驱的next指针指向p的后继。"
      },
      {
        label: "D",
        content: "D. 在双链表中，删除一个节点p时，只需要修改p的前驱节点的next指针为p->next，以及p的后继节点的prev指针为p->prev，不需要考虑p是否头节点或尾节点。"
      }
    ],
    correctAnswer: {
      correctOptions: ["B", "C"]
    },
    standardAnswer: ["B", "C"],
    explanation: "A以偏概全，单链表中已知p可在p之后插入（修改next域即可），也可通过数据复制法删除p；D双向链表删除节点p时必须判断p是否是首尾节点，若是头节点则没有前驱修改，若是尾节点则没有后继修改，因此必须考虑边界，不可盲目修改指针导致空指针异常。",
    commonMistakes: [],
    knowledgePoints: ["单链表操作", "双链表操作", "指针操作", "边界条件"],
    abilityTags: ["概念辨析", "逻辑推理", "细节把握"],
    analysis: {
      summary: "本题考查单链表和双链表中基于已知节点指针进行插入和删除操作的可行性及边界情况。正确答案为B和C。",
      schema_version: 2,
      option_analysis: {
        A: {
          reason: "在单链表中，如果知道节点p，可以在p之后插入新节点（只需修改p->next），也可以删除p的后继节点（只需修改p->next指向p->next->next）。因此“无法在p之后插入”的说法错误。",
          correction: "在单链表中，已知节点p时，可以在p之后插入节点，也可以删除p的后继节点，但无法在p之前插入或删除p本身（需要前驱）。",
          is_correct: false,
          misconception: "误认为所有插入和删除操作都依赖前驱节点，忽略了可以通过当前节点访问后继的情况。"
        },
        B: {
          reason: "双链表节点包含prev指针，因此知道p就可以直接访问前驱和后继节点，从而在p前后插入或删除p本身，无需遍历。",
          correction: null,
          is_correct: true,
          misconception: null
        },
        C: {
          reason: "在单链表中，删除一个非头节点p，由于无法直接访问前驱，必须从头遍历找到p的前驱节点，然后修改其next指针跳过p。这是标准的操作流程。",
          correction: null,
          is_correct: true,
          misconception: null
        },
        D: {
          reason: "若p是头节点，则没有前驱节点，无法修改前驱的next指针，需要更新头指针；若p是尾节点，则没有后继节点，无法修改后继的prev指针，需要更新尾指针。因此必须考虑p是否是头或尾节点。",
          correction: "在双链表中删除节点时，需要判断p是否为头节点或尾节点，并相应更新头指针或尾指针，然后再修改相邻节点的指针。",
          is_correct: false,
          misconception: "忽略双链表中头节点和尾节点的边界情况，认为所有节点都有完整的前驱和后继。"
        }
      },
      reasoning_steps: [
        "对于单链表，只知道节点指针p时，可以在p之后插入或删除p的后继，因为可以通过p->next访问后继；但在p之前插入或删除p本身需要前驱，必须遍历查找。",
        "对于双链表，每个节点有prev和next指针，因此知道p就可以直接访问前驱和后继，进行插入或删除，但头节点无前驱、尾节点无后继时需要特殊处理。",
        "选项A以偏概全，忽略了可以在p之后插入的可能性。选项D忽略了头尾节点的特殊情况。"
      ],
      common_misconceptions: [
        "认为在单链表中，已知节点指针就无法进行任何插入删除操作，而忽略在节点之后插入或删除后继的可能性。",
        "认为双链表删除节点时不需要考虑头尾边界，默认所有节点都有前驱和后继。",
        "混淆单链表和双链表在指针结构上的差异，错误地认为两种链表的操作方式相同。"
      ]
    },
    generationSource: "agent_generated",
    status: 1,
    reviewStatus: null,
    createdAt: "2026-07-14T20:46:57",
    updatedAt: "2026-07-14T20:46:57"
  },
  {
    id: "48343623010000",
    questionCode: "数据结构-judge-4-48343623010000",
    learningSpaceId: "2074879890340634625",
    chapterId: "0",
    questionType: "judge",
    questionTypeName: "判断题",
    sortOrder: 4,
    difficulty: 5,
    score: 3.00,
    abilityDimension: null,
    stem: "与单链表不同，在非循环双向链表中，删除一个非头非尾的节点时，只需要修改该节点前驱节点的next指针指向该节点的后继节点，然后释放该节点即可，无需修改其他指针。",
    options: [],
    correctAnswer: {
      correctValue: false
    },
    standardAnswer: false,
    explanation: "错误。双链表具有双向引用，删除节点p时必须同时更新p的前驱的next和p的后继的prev，即 pre->next = p->next; p->next->prev = pre;。如果仅修改前驱的next指针而遗漏修改后继的prev指针，将会导致反向遍历链表时产生逻辑错误和断链，破坏链表结构。",
    commonMistakes: [],
    knowledgePoints: ["单链表", "双链表", "指针操作", "链表删除"],
    abilityTags: ["概念辨析", "逻辑推理", "知识应用"],
    analysis: {
      summary: "本题考察非循环双向链表中删除非头尾节点的正确操作。常见误区是误认为只需修改一个指针，而忽略双向链表需要维护双向连接。",
      reasoning_steps: [
        "1. 单链表中删除非头尾节点只需修改前驱节点的next指针，因为后继节点无需知道前驱。",
        "2. 双链表中每个节点有prev指针，删除节点p时必须同时更新p->prev->next and p->next->prev。",
        "3. 本题描述仅修改前驱的next，忽略了后继节点的prev更新，因此错误。",
        "4. 正确操作需要两个修改，以保持双向链表的完整性。"
      ],
      common_misconceptions: [
        "混淆单链表和双链表的删除操作，认为两者相同。",
        "误以为修改前驱的next后，后继的prev自动更新或无需更新。",
        "忽略双向链表需要维护双向连接，导致操作不完整。"
      ]
    },
    generationSource: "agent_generated",
    status: 1,
    reviewStatus: null,
    createdAt: "2026-07-14T20:47:03",
    updatedAt: "2026-07-14T20:47:03"
  },
  {
    id: "48343628010000",
    questionCode: "数据结构-fill_blank-3-48343628010000",
    learningSpaceId: "2074879890340634625",
    chapterId: "0",
    questionType: "fill_blank",
    questionTypeName: "填空题",
    sortOrder: 3,
    difficulty: 5,
    score: 5.00,
    abilityDimension: null,
    stem: "在双链表中，已知节点p不是尾节点，要将新节点s插入到p之后，正确的指针操作顺序中，第一步应将s的next指针指向____；第二步应将p->next的prior指针指向____。",
    options: [],
    correctAnswer: {
      blanks: [
        { index: 1, answer: "p->next" },
        { index: 2, answer: "s" }
      ]
    },
    standardAnswer: [
      { index: 1, answer: "p->next" },
      { index: 2, answer: "s" }
    ],
    explanation: "s的后继必须指向原来p的后继(p->next)；为保持双向关联，p原来后继节点的前驱(p->next->prior)应该指向s。接下来的后续动作是设置s的prior指向p，并设置p的next指向s。",
    commonMistakes: [],
    knowledgePoints: ["双链表", "插入操作", "指针修改顺序"],
    abilityTags: ["逻辑推理", "算法实现", "细致分析"],
    analysis: {
      summary: "本题考查在双链表中指定节点后插入新节点时指针的正确修改顺序。需要准确理解每个指针域的意义，并避免顺序错误导致节点丢失。",
      blank_analysis: [
        {
          index: 1,
          reason: "新节点s需插入到p之后，因此s的后继必须指向p原来的下一个节点，即p->next。",
          common_errors: [
            {
              reason: "混淆了插入位置，误以为新节点next应直接指向p本身。",
              example: "p",
              correction: "应指向p原来的后继节点，即p->next，而不是p。"
            }
          ],
          accepted_answers: ["p->next", "p的后继"]
        },
        {
          index: 2,
          reason: "为了保持双链表双向连接，p原来后继节点的前驱必须修改为指向新插入的节点s。",
          common_errors: [
            {
              reason: "误以为需要将p->next的prior修改为p，实际上应修改为s。",
              example: "p",
              correction: "p->next的prior应指向新节点s，这样从p->next通过prior才能正确找到s。"
            }
          ],
          accepted_answers: ["s"]
        }
      ],
      schema_version: 2,
      reasoning_steps: [
        "第一步：设置新节点s的后继指针，使其指向p原来的后继节点，即s->next = p->next。",
        "第二步：设置p原来后继节点的前驱指针，使其指向新节点s，即p->next->prior = s。",
        "后续步骤：设置s的前驱指向p，以及p的后继指向s，但本题只考查前两个关键步骤。"
      ],
      common_misconceptions: [
        "指针修改顺序颠倒导致丢失后续节点",
        "忘记修改p->next->prior，破坏双向链表的完整性"
      ]
    },
    generationSource: "agent_generated",
    status: 1,
    reviewStatus: null,
    createdAt: "2026-07-14T20:47:09",
    updatedAt: "2026-07-14T20:47:09"
  },
  {
    id: "48343608010000",
    questionCode: "数据结构-short_answer-5-48343608010000",
    learningSpaceId: "2074879890340634625",
    chapterId: "0",
    questionType: "short_answer",
    questionTypeName: "简答题",
    sortOrder: 5,
    difficulty: 5,
    score: 10.00,
    abilityDimension: null,
    stem: "在一个单链表和一个双链表中，均已知指向节点p的指针。现在需要在p节点之前插入一个新节点q。请分别说明在单链表和双链表中完成此操作需要哪些步骤，并解释为什么双链表比单链表更高效。",
    options: [],
    correctAnswer: {
      referenceAnswer: "在单链表中，由于无法直接访问p的前驱节点，需要从头节点开始遍历，找到p的前驱节点pre，然后执行：pre->next = q; q->next = p; 时间复杂度为O(n)。在双链表中，可以通过p->prev直接找到前驱节点pre，然后执行：pre->next = q; q->prev = pre; q->next = p; p->prev = q; 时间复杂度为O(1)。双链表更高效是因为它提供了直接访问前驱节点的指针，避免了遍历整个链表。"
    },
    standardAnswer: {
      referenceAnswer: "在单链表中，由于无法直接访问p的前驱节点，需要从头节点开始遍历，找到p的前驱节点pre，然后执行：pre->next = q; q->next = p; 时间复杂度为O(n)。在双链表中，可以通过p->prev直接找到前驱节点pre，然后执行：pre->next = q; q->prev = pre; q->next = p; p->prev = q; 时间复杂度为O(1)。双链表更高效是因为它提供了直接访问前驱节点的指针，避免了遍历整个链表。"
    },
    explanation: "",
    commonMistakes: [],
    knowledgePoints: ["单链表", "双链表", "链表插入操作", "指针操作"],
    abilityTags: ["比较分析", "步骤描述"],
    analysis: {
      rubric: [
        {
          id: "R1",
          points: 3,
          required: true,
          criterion: "正确描述单链表中在p前插入q的步骤",
          no_credit: "未提及遍历或错误地认为可直接插入，或步骤与双链表混淆。",
          full_credit: "明确写出需要遍历找到p的前驱节点pre，并给出指针修改语句（pre->next=q; q->next=p）。",
          partial_credit: "提到需要遍历找到前驱，但指针修改描述不完整或顺序错误。"
        },
        {
          id: "R2",
          points: 3,
          required: true,
          criterion: "正确描述双链表中在p前插入q的步骤",
          no_credit: "错误地认为双链表也需要遍历，或未使用prev指针。",
          full_credit: "明确写出通过p->prev获取前驱pre，并给出完整的指针修改语句（pre->next=q; q->prev=pre; q->next=p; p->prev=q）。",
          partial_credit: "提到使用prev指针但修改语句不全或顺序错误，例如遗漏了某个指针的赋值。"
        },
        {
          id: "R3",
          points: 2,
          required: true,
          criterion: "正确分析双链表更高效的原因",
          no_credit: "未进行比较或错误地认为单链表更快。",
          full_credit: "明确指出单链表需要O(n)遍历，双链表O(1)，因为双链表有prev指针可直接访问前驱。",
          partial_credit: "只提到双链表更快但未说明时间复杂度或原因不完整。"
        },
        {
          id: "R4",
          points: 2,
          required: true,
          criterion: "正确给出时间复杂度",
          no_credit: "时间复杂度错误或未提及。",
          full_credit: "单链表O(n)，双链表O(1)，且n为链表长度。",
          partial_credit: "给出正确的大O符号但未说明n的含义，或只给出了一个的时间复杂度。"
        }
      ],
      summary: "本题要求比较在单链表和双链表中在已知节点前插入操作的步骤与效率，核心差异在于能否直接访问前驱节点。",
      common_errors: [
        {
          code: "MISSING_TRAVERSE",
          label: "单链表插入未考虑遍历",
          reason: "认为单链表也像双链表一样可以通过p->prev直接获得前驱，忽略了单链表的单向特性。",
          correction: "单链表只有next指针，必须从头遍历找到p的前驱节点，才能修改指针。"
        },
        {
          code: "INCOMPLETE_POINTER",
          label: "双链表指针修改遗漏",
          reason: "在双链表中插入节点时，只修改了部分指针（如只改了pre->next和q->next），遗漏了p->prev和q->prev的赋值，导致链表断裂。",
          correction: "双链表插入需要修改四个指针：前驱节点的next、p的prev、q的prev和q的next。"
        },
        {
          code: "TIME_COMPLEXITY_WRONG",
          label: "时间复杂度错误",
          reason: "将单链表的时间复杂度误认为O(1)或O(log n)，或将双链表误认为O(n)。",
          correction: "单链表需要遍历，长度为n，时间复杂度为O(n)；双链表直接通过prev指针访问，时间复杂度为O(1)。"
        }
      ],
      schema_version: 2,
      reasoning_steps: [
        "回顾单链表结构：每个节点只有next指针，无法直接访问前驱。",
        "回顾双链表结构：每个节点有prev和next指针，可直接访问前驱。",
        "针对已知节点p的插入操作，单链表需先遍历找到前驱，双链表可直接用p->prev。",
        "比较时间复杂度：单链表O(n)，双链表O(1)，因此双链表更高效。"
      ],
      common_misconceptions: [
        "认为单链表和双链表在已知节点前插入操作的时间复杂度相同",
        "误以为双链表插入也需要遍历找到前驱",
        "遗漏双链表插入时某些指针的修改"
      ]
    },
    generationSource: "agent_generated",
    status: 1,
    reviewStatus: null,
    createdAt: "2026-07-14T20:46:48",
    updatedAt: "2026-07-14T20:46:48"
  }
])

const answersMap = ref<Record<string, string>>({})
const accuracy = ref(0)
const totalScore = ref(0)

const isQuestionAnswered = (q: EvaluationQuestion) => {
  return !!answersMap.value[q.id]
}

const getGridBtnClass = (q: EvaluationQuestion, index: number) => {
  const hasVal = isQuestionAnswered(q)
  if (!isSubmitted.value) {
    return hasVal ? 'answered' : 'unanswered'
  }
  if (q.questionType === 'short_answer') {
    return 'pending'
  }
  const isCorrect = isObjectiveCorrect(q)
  return isCorrect ? 'correct' : 'wrong'
}

const isObjectiveCorrect = (q: EvaluationQuestion): boolean => {
  const ans = answersMap.value[q.id] || ''
  if (q.questionType === 'single_choice') {
    return ans === 'B'
  }
  if (q.questionType === 'multiple_choice') {
    const parts = ans.split(',').sort().join(',')
    return parts === 'B,C'
  }
  if (q.questionType === 'judge') {
    return ans === 'false'
  }
  if (q.questionType === 'fill_blank') {
    const parts = ans.split(' | ').map(s => s.trim().toLowerCase())
    return parts[0] === 'p->next' && parts[1] === 's'
  }
  return true
}

const aiTutorAdvice = computed(() => {
  const wrongKps = []
  if (!isObjectiveCorrect(questions.value[0])) wrongKps.push('单链表/双链表删除修改指针数差异')
  if (!isObjectiveCorrect(questions.value[1])) wrongKps.push('单双链表已知指针的修改局限与首尾边界判定')
  if (!isObjectiveCorrect(questions.value[2])) wrongKps.push('双向链表删除节点必须维护反向指针的逻辑')
  if (!isObjectiveCorrect(questions.value[3])) wrongKps.push('双向链表插入节点的指针赋值顺序')
  
  if (wrongKps.length === 0) {
    return '恭喜您！客观题全部正确。您对单双向链表的指针操作、物理结构差异及操作边界情况有着非常深厚的理解。简答题中对于遍历时间复杂度的对比分析极其精确，思维链推导流畅。建议继续保持，向更复杂的数据结构（如多叉树、图）进军！'
  } else {
    return `谢同学，根据本次测评诊断，您对【${wrongKps.join('、')}】的掌握仍有欠缺。双链表操作虽然高效，但核心在于边界节点的判空（头尾节点）及双向优先关联的顺序。建议点击下方题目展开「选项深度剖析」，着重学习修改指针的正确防断链顺序，AI 推荐您后续加强专项指针追踪练习。`
  }
})

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      submitExam()
    }
  }, 1000)
}

const scrollToQuestion = (index: number) => {
  const el = document.getElementById(`question-anchor-${index}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const confirmSubmit = () => {
  ElMessageBox.confirm(
    '是否确认提交试卷？提交后知序 AI 会立即对主客观题展开多维诊断，生成掌握度图表与思维链解析。',
    '确认提交试卷',
    {
      confirmButtonText: '立即交卷',
      cancelButtonText: '继续检查',
      type: 'info'
    }
  ).then(() => {
    submitExam()
  }).catch(() => {})
}

const submitExam = () => {
  if (timerInterval) clearInterval(timerInterval)
  
  questions.value.forEach((q, idx) => {
    const cardEl = document.getElementById(`question-anchor-${idx}`)
    if (cardEl) {
      if (q.options?.length) {
        const selectedBtns = cardEl.querySelectorAll('.option-button.selected')
        const labels = Array.from(selectedBtns).map(btn => {
          const firstSpan = btn.querySelector('.option-label-circle')
          return firstSpan ? firstSpan.textContent?.trim() : ''
        }).filter(Boolean) as string[]
        answersMap.value[q.id] = labels.join(',')
      } 
      else if (q.questionType === 'judge') {
        const selectedBtn = cardEl.querySelector('.judge-btn.selected')
        if (selectedBtn) {
          const txt = selectedBtn.textContent?.trim()
          answersMap.value[q.id] = txt === '正确' ? 'true' : 'false'
        }
      } 
      else if (q.questionType === 'fill_blank') {
        const inputs = cardEl.querySelectorAll('.blank-input input')
        const vals = Array.from(inputs).map(inp => (inp as HTMLInputElement).value)
        answersMap.value[q.id] = vals.join(' | ')
      } 
      else {
        const txtArea = cardEl.querySelector('.custom-textarea textarea')
        if (txtArea) {
          answersMap.value[q.id] = (txtArea as HTMLTextAreaElement).value
        }
      }
    }
  })

  let correctCount = 0
  let earnedScore = 0
  const objectiveQuestions = questions.value.filter(q => q.questionType !== 'short_answer')
  
  objectiveQuestions.forEach(q => {
    if (isObjectiveCorrect(q)) {
      correctCount++
      earnedScore += (q.score || 0)
    }
  })

  earnedScore += 9 

  accuracy.value = Math.round((correctCount / objectiveQuestions.length) * 100)
  totalScore.value = earnedScore

  isSubmitted.value = true
  ElMessage.success('试卷提交成功！AI 已生成多维测评报告。')
  
  nextTick(() => {
    renderRadarChart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

const renderRadarChart = () => {
  if (!radarChartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(radarChartRef.value)
  
  const q1Correct = isObjectiveCorrect(questions.value[0]) 
  const q2Correct = isObjectiveCorrect(questions.value[1]) 
  const q3Correct = isObjectiveCorrect(questions.value[2]) 
  const q4Correct = isObjectiveCorrect(questions.value[3]) 
  
  const scoreConcept = (q1Correct ? 50 : 15) + (q3Correct ? 50 : 20) 
  const scoreDetail = (q2Correct ? 100 : 30)
  const scoreLogic = (q2Correct ? 50 : 20) + (q3Correct ? 50 : 15)
  const scoreAlgo = (q4Correct ? 100 : 20)
  const scorePrecise = (q4Correct ? 100 : 35)
  const scoreCompare = 85 

  // 主题配色自适应深色模式
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#b5c0ce' : '#475569'
  const lineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.8)'
  const splitAreaColor = isDark 
    ? ['rgba(23, 30, 42, 0.95)', 'rgba(17, 23, 34, 0.95)']
    : ['rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.95)']

  const option = {
    radar: {
      indicator: [
        { name: '概念辨析', max: 100 },
        { name: '细节把握', max: 100 },
        { name: '逻辑推理', max: 100 },
        { name: '算法实现', max: 100 },
        { name: '细致分析', max: 100 },
        { name: '比较分析', max: 100 }
      ],
      splitArea: {
        show: true,
        areaStyle: {
          color: splitAreaColor
        }
      },
      axisLine: {
        lineStyle: {
          color: lineColor
        }
      },
      splitLine: {
        lineStyle: {
          color: lineColor
        }
      },
      name: {
        textStyle: {
          color: textColor,
          fontWeight: 700,
          fontSize: 11
        }
      }
    },
    series: [
      {
        name: '能力掌握度',
        type: 'radar',
        data: [
          {
            value: [scoreConcept, scoreDetail, scoreLogic, scoreAlgo, scorePrecise, scoreCompare],
            name: '我的掌握度',
            itemStyle: {
              color: '#0bb7aa'
            },
            areaStyle: {
              color: 'rgba(11, 183, 170, 0.25)'
            },
            lineStyle: {
              width: 2.5
            }
          },
          {
            value: [80, 75, 78, 70, 82, 75],
            name: '班级平均',
            itemStyle: {
              color: isDark ? '#4b596c' : '#94a3b8'
            },
            areaStyle: {
              color: 'rgba(148, 163, 184, 0.03)'
            },
            lineStyle: {
              width: 1.5,
              type: 'dashed'
            }
          }
        ]
      }
    ],
    legend: {
      data: ['我的掌握度', '班级平均'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: textColor,
        fontWeight: 600
      }
    }
  }
  
  chartInstance.setOption(option)
}

onMounted(() => {
  updateDateTime()
  startTimer()
  
  const syncInterval = setInterval(() => {
    if (isSubmitted.value) return
    
    questions.value.forEach((q, idx) => {
      const cardEl = document.getElementById(`question-anchor-${idx}`)
      if (cardEl) {
        if (q.options?.length) {
          const selected = cardEl.querySelector('.option-button.selected')
          if (selected) answersMap.value[q.id] = 'has-val'
        } else if (q.questionType === 'judge') {
          const selected = cardEl.querySelector('.judge-btn.selected')
          if (selected) answersMap.value[q.id] = 'has-val'
        } else if (q.questionType === 'fill_blank') {
          const inputs = cardEl.querySelectorAll('.blank-input input')
          const hasVal = Array.from(inputs).some(inp => (inp as HTMLInputElement).value.trim() !== '')
          if (hasVal) {
            answersMap.value[q.id] = 'has-val'
          } else {
            delete answersMap.value[q.id]
          }
        } else {
          const textarea = cardEl.querySelector('.custom-textarea textarea')
          const txt = (textarea as HTMLTextAreaElement)?.value || ''
          if (txt.trim() !== '') {
            answersMap.value[q.id] = 'has-val'
          } else {
            delete answersMap.value[q.id]
          }
        }
      }
    })
  }, 1000)

  onUnmounted(() => {
    clearInterval(syncInterval)
  })
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.paper-preview-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  margin-bottom: 20px;
  transition: all 0.2s ease;
  user-select: none;
}
.back-nav:hover {
  color: #0bb7aa;
}
.back-icon {
  transition: transform 0.2s ease;
}
.back-nav:hover .back-icon {
  transform: translateX(-3px);
}

/* 试卷头部 */
.paper-header {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin-bottom: 28px;
  gap: 24px;
  flex-wrap: wrap;
}

.header-info {
  flex: 1;
  min-width: 320px;
}

.paper-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.preview-badge {
  background: rgba(11, 183, 170, 0.1);
  color: #0bb7aa;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(11, 183, 170, 0.2);
}
.paper-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}
.paper-desc {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 24px;
}

.countdown-box, .score-banner-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.countdown-box .label, .score-banner-box .label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 2px;
}
.countdown-box .time {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  font-family: monospace;
}
.score-banner-box .score-val {
  font-size: 28px;
  font-weight: 900;
  color: #0bb7aa;
}
.score-banner-box .score-val small {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.submit-paper-btn {
  padding: 22px 28px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(11, 183, 170, 0.3);
}
.reset-paper-btn {
  padding: 22px 28px;
  border-radius: 12px;
  font-weight: 700;
}

/* 布局 */
.paper-body-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.paper-main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.paper-sidebar {
  width: 280px;
  flex-shrink: 0;
}
.sidebar-sticky {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 诊断报告卡片 */
.ai-report-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
  padding: 24px;
}
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5px solid rgba(11, 183, 170, 0.1);
  padding-bottom: 14px;
  margin-bottom: 20px;
}
.report-header .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.report-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0d9488;
}
.report-header .sparkle {
  font-size: 18px;
}
.report-date {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.report-dashboard {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.report-chart-section {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.report-chart-section .section-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 10px 0;
}
.radar-chart {
  width: 260px;
  height: 220px;
}

.report-info-section {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-card.warning-theme {
  background: #fffbeb;
  border-color: #fde68a;
}
.info-card.warning-theme .card-val {
  color: #d97706;
  font-size: 13px;
}
.info-card .card-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}
.info-card .card-val {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.ai-suggestion-box {
  background: rgba(11, 183, 170, 0.04);
  border: 1px dashed rgba(11, 183, 170, 0.3);
  border-radius: 10px;
  padding: 16px;
}
.tutor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.tutor-header .avatar {
  background: #0bb7aa;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tutor-header strong {
  font-size: 13px;
  color: #0d9488;
}
.suggestion-text {
  margin: 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

/* 侧边栏卡片 */
.sidebar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
}
.card-title {
  margin: 0 0 14px 0;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

/* 答题卡网格 */
.legend-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}
.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.unanswered { background: #f1f5f9; border: 1px solid #cbd5e1; }
.dot.answered { background: rgba(11, 183, 170, 0.2); border: 1.5px solid #0bb7aa; }
.dot.correct { background: #10b981; }
.dot.wrong { background: #ef4444; }
.dot.pending { background: #94a3b8; }

.grid-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.grid-btn {
  aspect-ratio: 1;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.grid-btn:hover {
  border-color: #0bb7aa;
  color: #0bb7aa;
}
.grid-btn.answered {
  background: rgba(11, 183, 170, 0.05);
  border-color: #0bb7aa;
  color: #0bb7aa;
}
.grid-btn.correct {
  background: #10b981;
  border-color: #10b981;
  color: white;
}
.grid-btn.wrong {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}
.grid-btn.pending {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #475569;
}

.tutor-tip-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(11, 183, 170, 0.03) 100%);
  border-color: rgba(99, 102, 241, 0.15);
}
.tip-desc {
  margin: 0;
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

/* ==================== 深色模式覆盖 ==================== */
html[data-theme='dark'] {
  .paper-header {
    background: #171e2a;
    border-color: #2b3645;
  }
  .paper-title {
    color: #f4f7fb;
  }
  .paper-desc {
    color: #b5c0ce;
  }
  .countdown-box .time {
    color: #f4f7fb;
  }
  .sidebar-card {
    background: #171e2a;
    border-color: #2b3645;
  }
  .card-title {
    color: #f4f7fb;
  }
  .info-card {
    background: #111722;
    border-color: #2b3645;
  }
  .info-card.warning-theme {
    background: #2b2212;
    border-color: #4b3d22;
    .card-val {
      color: #fbbf24;
    }
  }
  .info-card .card-val {
    color: #f4f7fb;
  }
  .ai-report-card {
    background: linear-gradient(135deg, #171e2a 0%, #111722 100%);
    border-color: rgba(11, 183, 170, 0.3);
  }
  .report-header {
    border-bottom-color: rgba(11, 183, 170, 0.15);
  }
  .report-header h3 {
    color: #2dc9be;
  }
  .report-chart-section .section-title {
    color: #b5c0ce;
  }
  .ai-suggestion-box {
    background: rgba(11, 183, 170, 0.02);
    border-color: rgba(11, 183, 170, 0.2);
  }
  .suggestion-text {
    color: #b5c0ce;
  }
  .grid-btn {
    background: #111722;
    border-color: #2b3645;
    color: #b5c0ce;
    &:hover {
      border-color: #0bb7aa;
      color: #0bb7aa;
    }
  }
  .grid-btn.answered {
    background: rgba(11, 183, 170, 0.1);
    border-color: #0bb7aa;
    color: #0bb7aa;
  }
  .grid-btn.correct {
    background: #10b981;
    border-color: #10b981;
    color: white;
  }
  .grid-btn.wrong {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
  }
  .grid-btn.pending {
    background: #202936;
    border-color: #2b3645;
    color: #b5c0ce;
  }
  .tutor-tip-card {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(11, 183, 170, 0.05) 100%);
    border-color: rgba(99, 102, 241, 0.2);
  }
  .tip-desc {
    color: #b5c0ce;
  }
}
</style>
