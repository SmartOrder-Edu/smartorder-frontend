<template>
  <AppLayout>
    <div class="resource-detail-page">
      <ParticleBackground />
      <div class="resource-detail-content">
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
              <span>{{ resourceStatusLabel(resourceStatus) }}</span>
              <span v-if="detail.taskTitle">任务：{{ detail.taskTitle }}</span>
            </div>
          </div>
          <el-button v-if="externalUrl && resourceStatus === 'generated'" type="primary" plain @click="openExternal">
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
            <div v-if="resourceStatus === 'generating'" class="generation-state generating">
              <div class="generation-icon"></div>
              <h2>资源正在生成</h2>
              <p>Resource Agent 正在后台生成内容，完成后页面会自动刷新。</p>
            </div>

            <div v-else-if="resourceStatus === 'failed'" class="generation-state failed">
              <div class="generation-icon"></div>
              <h2>资源生成失败</h2>
              <p>{{ generationError || '本次生成没有返回明确错误，可以重新提交生成任务。' }}</p>
              <el-button type="primary" :loading="retrying" @click="handleRetryGeneration">
                重试生成
              </el-button>
            </div>

            <MarkdownRenderer
              v-else-if="renderMode === 'markdown'"
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
              <template v-if="isBilibiliRecommendation">
                <div class="bili-head">
                  <div>
                    <span class="bili-label">B站学习视频推荐</span>
                    <h2>{{ externalData?.title || detail.resource.title }}</h2>
                    <p>{{ externalData?.reason || detail.resource.agentReason }}</p>
                  </div>
                  <el-button v-if="externalUrl" type="primary" plain @click="openExternal">
                    打开搜索入口
                  </el-button>
                </div>

                <div v-if="externalData?.usageAdvice" class="bili-advice">
                  {{ externalData.usageAdvice }}
                </div>

                <div class="bili-video-list">
                  <article
                    v-for="video in bilibiliVideos"
                    :key="video.url || video.title"
                    class="bili-video-card"
                  >
                    <button class="bili-cover" type="button" @click="openVideo(video.url)">
                      <img
                        v-if="video.coverUrl"
                        :src="videoCoverUrl(video.coverUrl)"
                        :alt="video.title"
                        @error="handleCoverError"
                      />
                      <span v-else>暂无封面</span>
                      <strong v-if="video.durationSeconds">{{ formatDuration(video.durationSeconds) }}</strong>
                    </button>
                    <div class="bili-main">
                      <div class="bili-title-row">
                        <h3>{{ video.title }}</h3>
                        <span v-if="video.matchScore" class="bili-score">
                          {{ formatPercent(video.matchScore) }}
                        </span>
                      </div>
                      <div class="bili-meta">
                        <span v-if="video.upName">UP主：{{ video.upName }}</span>
                        <span v-if="video.fitStage">{{ video.fitStage }}</span>
                        <span v-if="video.playCount">{{ formatCount(video.playCount) }}播放</span>
                        <span v-if="video.publishTime">{{ video.publishTime }}</span>
                      </div>
                      <p v-if="video.reason" class="bili-reason">{{ video.reason }}</p>
                      <div class="bili-actions">
                        <el-button type="primary" size="small" @click="openVideo(video.url)">
                          打开 B站观看
                        </el-button>
                      </div>
                    </div>
                  </article>
                </div>

                <el-empty v-if="!bilibiliVideos.length" description="暂无可展示的视频推荐" :image-size="100" />
              </template>

              <template v-else>
                <span class="external-icon">🔗</span>
                <h2>{{ externalData?.title || detail.resource.title }}</h2>
                <p>{{ externalData?.reason || detail.resource.agentReason }}</p>
                <p v-if="externalData?.usageAdvice">{{ externalData.usageAdvice }}</p>
                <el-button type="primary" @click="openExternal">打开外部资源</el-button>
              </template>
            </div>

            <el-empty v-else description="该资源暂无可预览内容" :image-size="100" />
          </section>
        </main>
      </template>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ParticleBackground from '@/components/ParticleBackground.vue'
import { learningResourceApi } from '@/api/learningResource'
import type { ResourceDetailVO, ResourceGenerationJobVO } from '@/types/learningSpace'

const route = useRoute()
const router = useRouter()

const detail = ref<ResourceDetailVO | null>(null)
const generationJob = ref<ResourceGenerationJobVO | null>(null)
const loading = ref(false)
const error = ref('')
const retrying = ref(false)
const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)

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
const resourceStatus = computed(() => {
  const jobStatus = generationJob.value?.status
  if (jobStatus === 'pending' || jobStatus === 'generating') return 'generating'
  if (jobStatus === 'failed' && detail.value?.resource.status !== 'generated') return 'failed'
  return detail.value?.resource.status || 'generated'
})
const generationError = computed(() => generationJob.value?.errorMessage || '')

const quizData = computed<any | null>(() => parseJson(detail.value?.content?.content))
const externalData = computed<any | null>(() => parseJson(detail.value?.content?.content))
const externalUrl = computed(() => externalData.value?.url || detail.value?.resource.url || '')
const isBilibiliRecommendation = computed(() => externalData.value?.type === 'bilibili_recommendation')
const bilibiliVideos = computed<any[]>(() => {
  const videos = externalData.value?.videos
  return Array.isArray(videos) ? videos : []
})

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

function openVideo(url: string | undefined) {
  if (!url) {
    ElMessage.info('暂无可打开的视频链接')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatDuration(seconds: number | string | undefined) {
  const value = Number(seconds || 0)
  if (!value) return ''
  const min = Math.floor(value / 60)
  const sec = value % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

function formatCount(count: number | string | undefined) {
  const value = Number(count || 0)
  if (!value) return '0'
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`
  return String(value)
}

function formatPercent(value: number | string | undefined) {
  const score = Number(value || 0)
  if (!score) return ''
  if (score > 1) return `${Math.round(score)}%`
  return `${Math.round(score * 100)}%`
}

function videoCoverUrl(url: string | undefined) {
  if (!url) return ''
  if (!isBilibiliCoverUrl(url)) return url
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  return `${base}/resources/bilibili/cover?url=${base64UrlEncode(url)}`
}

function isBilibiliCoverUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.hdslb.com')
  } catch {
    return false
  }
}

function base64UrlEncode(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function handleCoverError(event: Event) {
  const image = event.target as HTMLImageElement | null
  if (image) image.style.display = 'none'
}

async function loadDetail() {
  if (!resourceId.value) return
  loading.value = true
  error.value = ''
  try {
    await fetchDetail()
  } catch (e: any) {
    error.value = e?.message || '加载学习资源失败'
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function fetchDetail() {
  detail.value = await learningResourceApi.detail(resourceId.value)
  await refreshGenerationJob()
  if (resourceStatus.value === 'generating') {
    startPolling()
  } else {
    stopPolling()
  }
}

async function refreshGenerationJob() {
  generationJob.value = await learningResourceApi.latestGenerationJob(resourceId.value)
}

async function handleRetryGeneration() {
  if (!resourceId.value || retrying.value) return
  retrying.value = true
  try {
    generationJob.value = await learningResourceApi.retryGeneration(resourceId.value)
    if (detail.value) detail.value.resource.status = 'generating'
    startPolling()
    ElMessage.success('已重新提交生成任务')
  } catch (e: any) {
    ElMessage.error(e?.message || '重试生成失败')
  } finally {
    retrying.value = false
  }
}

function startPolling() {
  if (pollingTimer.value) return
  pollingTimer.value = setInterval(async () => {
    try {
      await fetchDetail()
    } catch (e) {
      console.warn('Failed to refresh resource generation status:', e)
    }
  }, 4000)
}

function stopPolling() {
  if (!pollingTimer.value) return
  clearInterval(pollingTimer.value)
  pollingTimer.value = null
}

onMounted(loadDetail)
onUnmounted(stopPolling)
watch(resourceId, () => {
  stopPolling()
  generationJob.value = null
  loadDetail()
})
</script>

<style scoped lang="scss">
.resource-detail-page {
  position: relative;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px;
}

.resource-detail-content {
  position: relative;
  z-index: 1;
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

.generation-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 260px;
  padding: 44px 20px;
  text-align: center;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 1.15rem;
  }

  p {
    max-width: 520px;
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  &.generating .generation-icon {
    border-color: rgba(37, 99, 235, 0.18);
    border-top-color: #2563eb;
    animation: spin 0.9s linear infinite;
  }

  &.failed .generation-icon {
    border-color: rgba(220, 38, 38, 0.18);
    background: #fef2f2;
  }
}

.generation-icon {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.html-content {
  color: #1f2937;
  line-height: 1.7;

  :deep(.generated-resource-html) {
    display: grid;
    gap: 18px;
    max-width: 920px;
    margin: 0 auto;
  }

  :deep(section) {
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  :deep(section:last-child) {
    padding-bottom: 0;
    border-bottom: 0;
  }

  :deep(.hero-block) {
    padding: 18px 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #ecfdfb, #f8fafc);
    border: 1px solid rgba(11, 183, 170, 0.14);
  }

  :deep(h1) {
    margin-top: 0;
    color: #0f172a;
  }

  :deep(h2) {
    margin: 0 0 10px;
    color: #0f172a;
    font-size: 1.05rem;
  }

  :deep(h3) {
    margin: 0 0 6px;
    color: #334155;
    font-size: 0.92rem;
  }

  :deep(p) {
    margin: 0;
  }

  :deep(.note) {
    color: #475569;
  }

  :deep(.goal-list),
  :deep(.step-list),
  :deep(.check-list),
  :deep(.review-list) {
    margin: 0;
    padding-left: 20px;
  }

  :deep(.concept-table) {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
    border-radius: 8px;
    font-size: 0.86rem;
  }

  :deep(.concept-table th),
  :deep(.concept-table td) {
    padding: 10px 12px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    text-align: left;
    vertical-align: top;
  }

  :deep(.concept-table th) {
    background: #f8fafc;
    color: #334155;
  }

  :deep(.comparison-grid) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  :deep(.comparison-grid > div) {
    padding: 13px 14px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.16);
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
  max-width: 920px;
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

.bili-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  text-align: left;

  h2 {
    margin: 6px 0 8px;
  }

  p {
    margin: 0;
  }
}

.bili-label {
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 700;
}

.bili-advice {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  text-align: left;
  font-size: 0.86rem;
  line-height: 1.6;
}

.bili-video-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.bili-video-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
}

.bili-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  strong {
    position: absolute;
    right: 8px;
    bottom: 8px;
    padding: 2px 6px;
    border-radius: 5px;
    background: rgba(15, 23, 42, 0.78);
    color: #ffffff;
    font-size: 0.72rem;
  }
}

.bili-main {
  min-width: 0;
}

.bili-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 1rem;
    line-height: 1.45;
  }
}

.bili-score {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  font-size: 0.72rem;
  font-weight: 700;
}

.bili-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;

  span {
    color: #64748b;
    font-size: 0.76rem;
  }
}

.bili-reason {
  margin: 10px 0 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.55;
}

.bili-actions {
  margin-top: 12px;
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

  .bili-head {
    display: block;
  }

  .bili-video-card {
    grid-template-columns: 1fr;
  }

  .html-content {
    :deep(.comparison-grid) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
