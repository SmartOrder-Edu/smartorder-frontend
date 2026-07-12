<template>
  <AppLayout>
    <div class="exam-questions-page">
      <header class="page-header">
        <div class="header-left">
          <el-button link @click="router.back()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            返回
          </el-button>
          <div class="header-titles">
            <h1>总题库专项刷题</h1>
            <p v-if="spaceName">当前学习空间：{{ spaceName }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button v-if="!isSubmitted" type="primary" class="btn-submit-all" @click="submitAll">
            提交总题库
          </el-button>
          <el-button v-else type="primary" class="btn-reset" @click="resetPractice">
            重新练习
          </el-button>
        </div>
      </header>

      <main class="page-main">
        <div v-if="loading" class="loading-state">
          正在加载题库数据...
        </div>
        <div v-else-if="!questionBank.length" class="empty-state">
          当前空间暂无后端题库数据。
        </div>
        <div v-else class="question-list-container">
          <InteractiveQuestionCard
            v-for="(question, idx) in sortedQuestionBank"
            :key="question.id + '-' + resetKey"
            :question="question"
            :display-index="idx + 1"
            :show-answer="isSubmitted"
          />
        </div>
      </main>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import InteractiveQuestionCard from '@/components/exam/InteractiveQuestionCard.vue'
import { fetchEvaluationQuestions, type EvaluationQuestion } from '@/api/evaluationQuestion'
import { useLearningSpaceStore } from '@/stores/learningSpace'

const router = useRouter()
const route = useRoute()
const learningSpaceStore = useLearningSpaceStore()

const loading = ref(true)
const questionBank = ref<EvaluationQuestion[]>([])
const spaceName = ref('')
const isSubmitted = ref(false)
const resetKey = ref(0)

/** 按 sortOrder 排序后的题目列表（兜底按 id） */
const sortedQuestionBank = computed(() => {
  return [...questionBank.value].sort((a, b) => {
    const sa = a.sortOrder ?? 0
    const sb = b.sortOrder ?? 0
    if (sa !== sb) return sa - sb
    return String(a.id).localeCompare(String(b.id))
  })
})

onMounted(async () => {
  let spaceIdParam = route.query.spaceId
  // 避免将雪花算法 ID 强转为 Number 导致末三位被截断引发精度丢失，直接使用字符串
  let spaceId: any = spaceIdParam ? String(spaceIdParam) : undefined

  // 如果没有带入 spaceId，先加载 spaces 以备展示需要
  if (!spaceId) {
    if (learningSpaceStore.activeSpaces.length === 0) {
      await learningSpaceStore.fetchSpaces('active')
    }
  }

  if (spaceId) {
    // 同样，比对时都转换为字符串，防止强类型判断失效
    const space = learningSpaceStore.activeSpaces.find(s => String(s.id) === String(spaceId))
    if (space) spaceName.value = space.name
  } else {
    spaceName.value = '全部'
  }

  try {
    loading.value = true
    const rawQs = await fetchEvaluationQuestions({
      learningSpaceId: spaceId,
      limit: 100 // 加大数量以获取全部
    })
    questionBank.value = (rawQs || []).filter(q => q.questionType !== 'code')
    console.log('Fetched questions:', questionBank.value)
  } catch (error: any) {
    console.error('Fetch error:', error)
    ElMessage.error(error?.message || '题库加载失败')
  } finally {
    loading.value = false
  }
})

function submitAll() {
  isSubmitted.value = true
  ElMessage.success('提交成功，已为您展示判定结果与解析！')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetPractice() {
  isSubmitted.value = false
  resetKey.value++
  ElMessage.info('已重置状态，您可以重新作答')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.exam-questions-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 16px;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.header-titles h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.header-titles p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.btn-submit-all, .btn-reset {
  padding: 12px 28px;
  font-size: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.3);
  transition: transform 0.2s;
}
.btn-submit-all:hover, .btn-reset:hover {
  transform: translateY(-2px);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 64px 0;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.question-list-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
