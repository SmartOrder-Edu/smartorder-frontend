<template>
  <AppLayout>
    <div class="resource-detail-page">
      <div v-if="loading" class="loading-panel">
        <el-skeleton :rows="8" animated />
      </div>

      <el-empty v-else-if="error || !detail" description="学习资源不存在或加载失败" :image-size="120">
        <el-button type="primary" @click="goBack">返回学习空间</el-button>
      </el-empty>

      <template v-else>
        <header class="resource-header">
          <button class="back-btn" type="button" @click="goBack">
            <span>‹</span>
          </button>
          <div class="resource-title-block">
            <span class="resource-eyebrow">{{ detail.spaceName }}</span>
            <h1>{{ detail.resource.title }}</h1>
            <p>{{ detail.resource.description }}</p>
            <div class="resource-meta">
              <span>{{ resourceTypeLabel(detail.resource.resourceType) }}</span>
              <span>{{ sourceLabel }}</span>
              <span v-if="detail.resource.status">{{ resourceStatusLabel(detail.resource.status) }}</span>
              <span v-if="detail.taskTitle">任务：{{ detail.taskTitle }}</span>
            </div>
          </div>
          <el-button v-if="externalUrl" type="primary" plain @click="openExternal">
            打开外部资源
          </el-button>
        </header>

        <main class="resource-body">
          <aside class="resource-side">
            <section class="side-section">
              <span class="side-label">知识点</span>
              <strong>{{ detail.resource.knowledgePoint || '空间通用资料' }}</strong>
            </section>
            <section class="side-section">
              <span class="side-label">使用场景</span>
              <strong>{{ detail.resource.studyScenario || '学习' }}</strong>
            </section>
            <section class="side-section">
              <span class="side-label">Agent 判断</span>
              <p>{{ detail.resource.agentReason || 'Agent 为当前学习目标生成的配套资料。' }}</p>
            </section>
            <section v-if="detail.content" class="side-section">
              <span class="side-label">内容版本</span>
              <strong>v{{ detail.content.version }}</strong>
            </section>
          </aside>

          <section class="content-panel">
            <MarkdownRenderer
              v-if="renderMode === 'markdown'"
              :content="markdownContent"
            />

            <div
              v-else-if="renderMode === 'html'"
              class="html-content"
              v-html="detail.content?.content || ''"
            ></div>

            <div v-else-if="renderMode === 'quiz'" class="quiz-content">
              <div class="quiz-head">
                <span>专项练习</span>
                <strong>{{ quizData?.questions?.length || 0 }} 题</strong>
              </div>
              <article
                v-for="(question, index) in quizData?.questions || []"
                :key="index"
                class="quiz-card"
              >
                <span class="quiz-index">{{ index + 1 }}</span>
                <div class="quiz-main">
                  <h3>{{ question.stem }}</h3>
                  <div v-if="question.options?.length" class="quiz-options">
                    <span v-for="option in question.options" :key="option">{{ option }}</span>
                  </div>
                  <div v-if="question.items?.length" class="quiz-options">
                    <span v-for="item in question.items" :key="item">{{ item }}</span>
                  </div>
                  <p v-if="question.answer"><strong>参考答案：</strong>{{ question.answer }}</p>
                  <p v-if="question.referenceAnswer"><strong>参考答案：</strong>{{ question.referenceAnswer }}</p>
                  <p v-if="question.explanation">{{ question.explanation }}</p>
                </div>
              </article>
            </div>

            <div v-else-if="renderMode === 'external'" class="external-content">
              <span class="external-icon">🔗</span>
              <h2>{{ externalData?.title || detail.resource.title }}</h2>
              <p>{{ externalData?.reason || detail.resource.agentReason }}</p>
              <p v-if="externalData?.usageAdvice">{{ externalData.usageAdvice }}</p>
              <el-button type="primary" @click="openExternal">打开 B站推荐入口</el-button>
            </div>

            <el-empty v-else description="该资源暂无可预览内容" :image-size="100" />
          </section>
        </main>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { learningResourceApi } from '@/api/learningResource'
import type { ResourceDetailVO } from '@/types/learningSpace'

const route = useRoute()
const router = useRouter()

const detail = ref<ResourceDetailVO | null>(null)
const loading = ref(false)
const error = ref('')

const resourceId = computed(() => String(route.params.resourceId || ''))

const renderMode = computed(() => {
  const contentType = detail.value?.content?.contentType
  if (contentType === 'html') return 'html'
  if (contentType === 'json' && detail.value?.resource.resourceType === 'quiz') return 'quiz'
  if (contentType === 'external_link') return 'external'
  if (contentType === 'markdown') return 'markdown'
  return 'empty'
})

const markdownContent = computed(() => detail.value?.content?.content || '')

const quizData = computed<any | null>(() => parseJson(detail.value?.content?.content))
const externalData = computed<any | null>(() => parseJson(detail.value?.content?.content))
const externalUrl = computed(() => externalData.value?.url || detail.value?.resource.url || '')

const sourceLabel = computed(() => {
  const resource = detail.value?.resource
  if (!resource) return ''
  if (resource.source === 'curated') return resource.resourceType === 'link' ? 'AI筛选' : '精选'
  if (resource.isAiGenerated) return 'AI生成'
  return '用户上传'
})

function parseJson(raw: string | undefined) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function resourceTypeLabel(type: string) {
  const m: Record<string, string> = {
    doc: '文档',
    html: 'HTML',
    mind_map: '思维导图',
    quiz: '练习题',
    image: '图解',
    video: '视频脚本',
    link: 'B站推荐',
    ppt: 'PPT',
  }
  return m[type] || type
}

function resourceStatusLabel(status: string) {
  const m: Record<string, string> = { planned: '待生成', generating: '生成中', generated: '可使用', failed: '失败' }
  return m[status] || status
}

function goBack() {
  const spaceId = detail.value?.resource.spaceId
  if (spaceId) {
    router.push({ path: `/space/${spaceId}`, query: { tab: 'resources' } })
    return
  }
  router.push('/resources')
}

function openExternal() {
  if (!externalUrl.value) {
    ElMessage.info('暂无可打开的外部链接')
    return
  }
  window.open(externalUrl.value, '_blank', 'noopener,noreferrer')
}

async function loadDetail() {
  if (!resourceId.value) return
  loading.value = true
  error.value = ''
  try {
    detail.value = await learningResourceApi.detail(resourceId.value)
  } catch (e: any) {
    error.value = e?.message || '加载学习资源失败'
    detail.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
watch(resourceId, loadDetail)
</script>

<style scoped lang="scss">
.resource-detail-page {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px;
}

.loading-panel,
.content-panel,
.resource-side,
.resource-header {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.resource-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 20px;
  border-radius: 18px;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  color: #475569;
  font-size: 26px;
  cursor: pointer;
}

.resource-title-block {
  min-width: 0;

  h1 {
    margin: 4px 0 6px;
    color: #0f172a;
    font-size: 1.45rem;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.6;
  }
}

.resource-eyebrow,
.side-label {
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 800;
}

.resource-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  span {
    padding: 3px 9px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 700;
  }
}

.resource-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}

.resource-side {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
}

.side-section {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: #1f2937;
    font-size: 0.9rem;
    line-height: 1.45;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.78rem;
    line-height: 1.55;
  }
}

.content-panel {
  min-width: 0;
  padding: 24px;
  border-radius: 16px;
}

.html-content {
  color: #1f2937;
  line-height: 1.7;

  :deep(h1) {
    margin-top: 0;
    color: #0f172a;
  }

  :deep(h2) {
    color: #0f172a;
    font-size: 1.05rem;
  }
}

.quiz-content {
  display: grid;
  gap: 14px;
}

.quiz-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);

  span {
    color: #0a9e94;
    font-weight: 800;
  }
}

.quiz-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.quiz-index {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #ecfdfb;
  color: #0a9e94;
  font-weight: 800;
}

.quiz-main {
  h3 {
    margin: 3px 0 10px;
    color: #0f172a;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  p {
    margin: 8px 0 0;
    color: #475569;
    font-size: 0.82rem;
    line-height: 1.55;
  }
}

.quiz-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 5px 10px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid rgba(148, 163, 184, 0.16);
    color: #334155;
    font-size: 0.78rem;
  }
}

.external-content {
  max-width: 620px;
  margin: 20px auto;
  text-align: center;

  h2 {
    margin: 12px 0 8px;
    color: #0f172a;
  }

  p {
    color: #64748b;
    line-height: 1.6;
  }
}

.external-icon {
  display: inline-flex;
  width: 54px;
  height: 54px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #f1f5f9;
  font-size: 26px;
}

@media (max-width: 900px) {
  .resource-header,
  .resource-body {
    grid-template-columns: 1fr;
  }

  .back-btn {
    width: 100%;
  }
}
</style>
