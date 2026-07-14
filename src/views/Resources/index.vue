<template>
  <AppLayout>
    <div class="resources-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">资源中心</h1>
          <p class="page-desc">系统为你推荐和生成的学习资源，AI 会根据你的画像匹配合适的资料</p>
        </div>
      </div>

      <!-- 筛选与搜索 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索资源标题、标签..." prefix-icon="Search" clearable style="max-width: 320px;" />
        <div class="filter-group">
          <span class="filter-label">类型</span>
          <div class="filter-tags">
            <span
              v-for="type in resourceTypes"
              :key="type.value"
              class="filter-chip"
              :class="{ active: activeType === type.value }"
              @click="activeType = type.value"
            >
              <span class="type-icon" v-html="type.icon"></span>
              {{ type.label }}
            </span>
          </div>
        </div>
        <el-select v-model="sortBy" style="width: 140px;">
          <el-option label="智能排序" value="relevance" />
          <el-option label="最新资源" value="newest" />
          <el-option label="最短时长" value="shortest" />
          <el-option label="最高推荐" value="rating" />
        </el-select>
      </div>

      <!-- 推荐资源横幅 -->
      <section class="featured-banner" v-if="featuredResource">
        <div class="featured-content">
          <div class="featured-badge">热门推荐</div>
          <h2 class="featured-title">{{ featuredResource.title }}</h2>
          <p class="featured-desc">{{ featuredResource.description || '暂无描述' }}</p>
          <div class="featured-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              {{ formatFileSize(featuredResource.fileSize) }}
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
              {{ featuredResource.ratingAvg }} 推荐指数
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              {{ featuredResource.downloadCount }} 人转存
            </span>
          </div>
          <el-button type="primary" @click="openResource(featuredResource)">
            查看详情
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </el-button>
        </div>
        <div class="featured-visual">
          <div class="visual-card">
            <div class="card-glow"></div>
            <div class="card-content">
              <div class="card-icon-large" v-html="getResourceIcon(featuredResource.category)"></div>
              <span class="card-type">{{ getCategoryName(featuredResource.category) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 资源网格 -->
      <section class="resources-grid-section">
        <div class="grid-header">
          <h3 class="grid-title">广场资源</h3>
          <span class="grid-count">共 {{ totalCount }} 个资源</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="resources-grid">
          <div v-for="n in 6" :key="n" class="resource-card skeleton-card"></div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredResources.length === 0" class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
          <p class="empty-title" style="font-size: 1rem; color: #64748b;">暂无资源</p>
          <p class="empty-desc" style="font-size: 0.8125rem; color: #94a3b8;">还没有人发布资源到广场</p>
        </div>

        <div v-else class="resources-grid">
          <div
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-card"
            :class="`type-${resource.category}`"
          >
            <div class="card-header-section">
              <div class="card-type-icon" :class="resource.category">
                <span v-html="getResourceIcon(resource.category)"></span>
              </div>
              <div class="card-badges">
                <span class="type-badge">{{ getCategoryName(resource.category) }}</span>
              </div>
            </div>

            <div class="card-body">
              <h4 class="card-title">{{ resource.title }}</h4>
              <p class="card-desc">{{ resource.description || '暂无描述' }}</p>

              <div class="card-reason">
                <span class="reason-label">发布者：</span>
                <span class="reason-text">{{ resource.publisherName || '未知用户' }}</span>
              </div>

              <div class="card-tags">
                <span v-for="tag in resource.tags" :key="tag" class="card-tag">{{ tag }}</span>
              </div>

              <div class="card-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  {{ formatFileSize(resource.fileSize) }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ resource.downloadCount }}
                </span>
                <span class="meta-item rating">
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  {{ resource.ratingAvg }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <el-button size="small" type="primary" @click="openResource(resource)">
                查看详情
              </el-button>
              <el-button size="small" text @click="collectResource(resource)" :disabled="resource.hasDownloaded">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {{ resource.hasDownloaded ? '已转存' : '转存' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalCount > pageSize" style="display: flex; justify-content: center; margin-top: 24px;">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCount"
            layout="prev, pager, next"
            @current-change="fetchList"
          />
        </div>
      </section>

    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getSquareList, downloadFromSquare } from '@/api/resource-square'
import type { ResourceSquareVO } from '@/types/resource-square'

const router = useRouter()

const searchKeyword = ref('')
const activeType = ref('all')
const sortBy = ref('newest')
const isLoading = ref(false)

// 真实数据
const squareResources = ref<ResourceSquareVO[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 12

const resourceTypes = [
  { value: 'all', label: '全部', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { value: 'doc', label: '文档', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>' },
  { value: 'mindmap', label: '导图', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>' },
  { value: 'video', label: '视频', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
  { value: 'quiz', label: '练习', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { value: 'case', label: '案例', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>' }
]

const featuredResource = computed(() => {
  // 取评分最高或下载最多的资源作为精选
  return squareResources.value.length > 0 ? squareResources.value[0] : null
})

const filteredResources = computed(() => {
  return squareResources.value
})

const categoryNameMap: Record<string, string> = {
  doc: '文档',
  mindmap: '思维导图',
  video: '视频讲义',
  quiz: '练习题',
  case: '案例',
}

const getCategoryName = (category: string) => categoryNameMap[category] || category

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

const fetchList = async () => {
  isLoading.value = true
  try {
    const res = await getSquareList({
      keyword: searchKeyword.value || undefined,
      category: activeType.value !== 'all' ? activeType.value : undefined,
      sortBy: sortBy.value as any,
      pageNum: currentPage.value,
      pageSize,
    })
    squareResources.value = res.records || []
    totalCount.value = res.total || 0
  } catch {
    // 错误由拦截器处理
  } finally {
    isLoading.value = false
  }
}

// 搜索/筛选/排序变化时重新加载
watch([searchKeyword, activeType, sortBy], () => {
  currentPage.value = 1
  fetchList()
})

onMounted(() => {
  fetchList()
})

const getResourceIcon = (type: string) => {
  const icons: Record<string, string> = {
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    mindmap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>'
  }
  return icons[type] || icons.doc
}

const openResource = (resource: ResourceSquareVO) => {
  router.push(`/resources/${resource.id}`)
}

const collectResource = async (resource: ResourceSquareVO) => {
  if (resource.hasDownloaded) {
    ElMessage.info('您已转存过该资源，可在云盘根目录查看')
    return
  }
  try {
    await downloadFromSquare(resource.id)
    ElMessage.success('已转存到您的云盘')
    resource.hasDownloaded = true
    resource.downloadCount++
  } catch {
    // 错误由拦截器处理
  }
}
</script>

<style scoped>
.resources-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.filter-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  background: var(--background-color-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.filter-chip:hover {
  background: white;
  border-color: var(--border-light);
}

.filter-chip.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.type-icon { font-size: 0.875rem; }

/* 推荐横幅 */
.featured-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
  padding: var(--spacing-2xl);
  background: linear-gradient(135deg, #0f1629 0%, #1a1f4e 50%, #2d3a8c 100%);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-xl);
  overflow: hidden;
  position: relative;
}

.featured-badge {
  position: absolute;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  padding: 4px 12px;
  background: rgba(18, 184, 134, 0.2);
  color: #38d9a9;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.featured-content {
  flex: 1;
  color: white;
}

.featured-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-md);
}

.featured-desc {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 var(--spacing-lg);
  line-height: 1.6;
}

.featured-meta {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.featured-visual {
  flex-shrink: 0;
}

.visual-card {
  width: 160px;
  height: 160px;
  background: rgba(11, 183, 170, 0.2);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(11, 183, 170, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(11, 183, 170, 0.3), transparent 70%);
  animation: glowPulse 3s ease-in-out infinite;
}

.card-content {
  position: relative;
  text-align: center;
}

.card-icon-large {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-sm);
  color: rgba(255, 255, 255, 0.8);
}

.card-icon-large svg { width: 100%; height: 100%; }

.card-type {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 资源网格 */
.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.grid-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.grid-count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.resource-card {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
}

.resource-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.card-type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-type-icon.doc { background: rgba(11, 183, 170, 0.08); color: var(--primary-color); }
.card-type-icon.mindmap { background: rgba(18, 184, 134, 0.08); color: var(--accent-color); }
.card-type-icon.video { background: rgba(245, 158, 11, 0.08); color: var(--warning-color); }
.card-type-icon.quiz { background: rgba(168, 85, 247, 0.08); color: #a855f7; }
.card-type-icon.case { background: rgba(236, 72, 153, 0.08); color: #ec4899; }

.card-type-icon :deep(svg) { width: 20px; height: 20px; }

.card-badges {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.ai-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  border-radius: var(--radius-full);
  font-size: 0.5625rem;
  font-weight: 600;
}

.type-badge {
  padding: 2px 8px;
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 0.5625rem;
  font-weight: 600;
}

.card-body {
  flex: 1;
  padding: var(--spacing-lg);
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.card-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  line-height: 1.5;
}

.card-reason {
  background: rgba(11, 183, 170, 0.04);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: 0.75rem;
  line-height: 1.5;
}

.reason-label { color: var(--primary-color); font-weight: 600; }
.reason-text { color: var(--text-secondary); }

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-md);
}

.card-tag {
  padding: 2px 8px;
  background: rgba(11, 183, 170, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.5625rem;
  color: var(--primary-color);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.card-meta .meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.card-meta .meta-item svg {
  width: 12px;
  height: 12px;
}

.card-meta .rating {
  color: #f59e0b;
}

.card-meta .rating svg {
  width: 10px;
  height: 10px;
}

.card-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-footer .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.generate-form .form-item {
  margin-bottom: var(--spacing-lg);
}

.generate-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 1024px) {
  .resources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>
