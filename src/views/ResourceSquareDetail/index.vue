<template>
  <AppLayout>
    <div class="resource-detail-page">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-panel">
        <el-skeleton :rows="6" animated />
      </div>

      <!-- 错误 -->
      <el-empty v-else-if="error" description="资源不存在或已下架" :image-size="120">
        <el-button type="primary" @click="$router.push('/resources')">返回资源广场</el-button>
      </el-empty>

      <!-- 内容 -->
      <template v-else-if="detail">
        <button class="back-link" @click="$router.push('/resources')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          返回资源广场
        </button>

        <div class="detail-card">
          <!-- 文件预览区域 -->
          <div class="preview-section" v-if="detail">
            <div class="preview-container">
              <iframe
                :src="previewIframeUrl"
                class="preview-iframe"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
            <div class="preview-actions">
              <el-button size="small" text @click="openInNewWindow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 4px;">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                新窗口预览
              </el-button>
            </div>
          </div>

          <!-- 头部 -->
          <div class="detail-header">
            <div class="detail-type-icon" :class="detail.category">
              <span v-html="getCategoryIcon(detail.category)"></span>
            </div>
            <div class="detail-header-info">
              <h1 class="detail-title">{{ detail.title }}</h1>
              <div class="detail-meta-row">
                <span class="detail-publisher">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ detail.publisherName || '未知用户' }}
                </span>
                <span class="detail-category-tag">{{ getCategoryName(detail.category) }}</span>
                <span class="detail-time">{{ formatTime(detail.createTime) }}</span>
              </div>
            </div>
          </div>

          <!-- 描述 -->
          <div class="detail-section" v-if="detail.description">
            <h3>资源描述</h3>
            <p>{{ detail.description }}</p>
          </div>

          <!-- 标签 -->
          <div class="detail-section" v-if="detail.tags && detail.tags.length > 0">
            <h3>标签</h3>
            <div class="detail-tags">
              <span v-for="tag in detail.tags" :key="tag" class="detail-tag">{{ tag }}</span>
            </div>
          </div>

          <!-- 文件信息 -->
          <div class="detail-section">
            <h3>文件信息</h3>
            <div class="file-info-grid">
              <div class="file-info-item">
                <span class="file-info-label">文件类型</span>
                <span class="file-info-value">{{ detail.fileType || '未知' }}</span>
              </div>
              <div class="file-info-item">
                <span class="file-info-label">文件大小</span>
                <span class="file-info-value">{{ formatFileSize(detail.fileSize) }}</span>
              </div>
              <div class="file-info-item">
                <span class="file-info-label">浏览次数</span>
                <span class="file-info-value">{{ detail.viewCount }}</span>
              </div>
              <div class="file-info-item">
                <span class="file-info-label">转存次数</span>
                <span class="file-info-value">{{ detail.downloadCount }}</span>
              </div>
            </div>
          </div>

          <!-- 评分 -->
          <div class="detail-section">
            <h3>评分</h3>
            <div class="rating-area">
              <div class="rating-avg">
                <span class="rating-num">{{ detail.ratingAvg }}</span>
                <span class="rating-out-of">/ 5.0</span>
                <span class="rating-count">（{{ detail.ratingCount }} 人评分）</span>
              </div>
              <div class="rating-action">
                <span class="rating-label">我的评分：</span>
                <el-rate
                  v-model="myRating"
                  :max="5"
                  @change="handleRate"
                  :disabled="ratingSubmitting"
                  show-score
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <el-button
              type="primary"
              size="large"
              @click="handleDownload"
              :disabled="detail.hasDownloaded"
              :loading="downloadLoading"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right: 6px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ detail.hasDownloaded ? '已转存到云盘' : '转存到我的云盘' }}
            </el-button>
            <el-button size="large" @click="$router.push('/cloud-drive')" v-if="detail.hasDownloaded">
              前往云盘查看
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getSquareDetail, downloadFromSquare, rateSquareResource } from '@/api/resource-square'
import type { ResourceSquareVO } from '@/types/resource-square'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(false)
const detail = ref<ResourceSquareVO | null>(null)
const downloadLoading = ref(false)
const ratingSubmitting = ref(false)
const myRating = ref(0)

const previewIframeUrl = computed(() => {
  if (!detail.value) return ''
  const token = localStorage.getItem('token')
  return `/preview?squareId=${detail.value.id}&name=${encodeURIComponent(detail.value.title)}&size=${detail.value.fileSize}&token=${token}`
})

const openInNewWindow = () => {
  if (!detail.value) return
  const token = localStorage.getItem('token')
  const url = `/preview?squareId=${detail.value.id}&name=${encodeURIComponent(detail.value.title)}&size=${detail.value.fileSize}&token=${token}`
  window.open(url, '_blank')
}

const categoryNameMap: Record<string, string> = {
  doc: '文档',
  mindmap: '思维导图',
  video: '视频讲义',
  quiz: '练习题',
  case: '案例',
}

const getCategoryName = (category: string) => categoryNameMap[category] || category

const getCategoryIcon = (type: string) => {
  const icons: Record<string, string> = {
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    mindmap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>',
    case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>'
  }
  return icons[type] || icons.doc
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const formatTime = (timeStr: string): string => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const dayMs = 86400000
  if (diff < dayMs) return '今天'
  if (diff < 2 * dayMs) return '昨天'
  if (diff < 7 * dayMs) return Math.floor(diff / dayMs) + '天前'
  return timeStr.split('T')[0] || timeStr.split(' ')[0] || timeStr
}

const fetchDetail = async () => {
  loading.value = true
  error.value = false
  try {
    const id = route.params.id as string
    const res = await getSquareDetail(id)
    detail.value = res
    myRating.value = res.userRating || 0
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const handleDownload = async () => {
  if (!detail.value || detail.value.hasDownloaded) return
  downloadLoading.value = true
  try {
    await downloadFromSquare(detail.value.id)
    ElMessage.success('已转存到您的云盘根目录')
    detail.value.hasDownloaded = true
    detail.value.downloadCount++
  } catch {
    // 错误由拦截器处理
  } finally {
    downloadLoading.value = false
  }
}

const handleRate = async (val: number) => {
  if (!detail.value) return
  ratingSubmitting.value = true
  try {
    await rateSquareResource(detail.value.id, { rating: val })
    ElMessage.success('评分成功')
    // 刷新详情以获取最新平均分
    await fetchDetail()
  } catch {
    // 错误由拦截器处理
    myRating.value = detail.value.userRating || 0 // 还原
  } finally {
    ratingSubmitting.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.resource-detail-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.loading-panel {
  padding: 60px 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2563eb;
}

.detail-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #f1f5f9;
}

.preview-section {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.preview-container {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  position: relative;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.detail-type-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-type-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.detail-type-icon.doc { background: rgba(11, 183, 170, 0.1); color: #0bb7aa; }
.detail-type-icon.mindmap { background: rgba(18, 184, 134, 0.1); color: #12b886; }
.detail-type-icon.video { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.detail-type-icon.quiz { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.detail-type-icon.case { background: rgba(236, 72, 153, 0.1); color: #ec4899; }

.detail-header-info {
  flex: 1;
  min-width: 0;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
  line-height: 1.3;
}

.detail-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-publisher {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #64748b;
}

.detail-category-tag {
  padding: 2px 10px;
  background: #f1f5f9;
  border-radius: 99px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
}

.detail-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px;
}

.detail-section p {
  font-size: 0.9375rem;
  color: #475569;
  line-height: 1.7;
  margin: 0;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  padding: 4px 12px;
  background: rgba(11, 183, 170, 0.06);
  border-radius: 99px;
  font-size: 0.8125rem;
  color: #0bb7aa;
}

.file-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.file-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
}

.file-info-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.file-info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.rating-area {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.rating-avg {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.rating-num {
  font-size: 2rem;
  font-weight: 700;
  color: #f59e0b;
}

.rating-out-of {
  font-size: 0.875rem;
  color: #94a3b8;
}

.rating-count {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 4px;
}

.rating-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-label {
  font-size: 0.875rem;
  color: #475569;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 640px) {
  .file-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .detail-card {
    padding: 20px;
  }
}
</style>
