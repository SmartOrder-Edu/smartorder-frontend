<template>
  <AppLayout>
    <div class="resources-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">资源广场</h1>
          <p class="page-desc">浏览学习资源广场，发布你的资源与同学共享；Agent 会根据你的学习画像为你精选一个推荐资源</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showFilePicker = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            发布资源到广场
          </el-button>
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
          <el-option label="最新资源" value="newest" />
          <el-option label="最多转存" value="download" />
          <el-option label="最高推荐" value="rating" />
        </el-select>
      </div>

      <!-- Agent 精选横幅：loading / 数据就绪 / 空 -->
      <section v-if="featuredLoading" class="featured-banner featured-skeleton">
        <div class="featured-content">
          <div class="skel-badge-line"></div>
          <div class="skel-title-line"></div>
          <div class="skel-desc-line"></div>
          <div class="skel-desc-line short"></div>
          <div class="skel-meta-line"></div>
        </div>
        <div class="featured-visual">
          <div class="visual-card"><div class="card-glow"></div></div>
        </div>
      </section>

      <section v-else-if="featuredResource" class="featured-banner">
        <div class="featured-content">
          <div class="featured-badge" :class="featuredReason">
            {{ featuredReason === 'agent' ? 'Agent 精选' : '热门精选' }}
          </div>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ featuredResource.viewCount ?? 0 }} 浏览
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
          <div v-for="n in 6" :key="n" class="resource-card skeleton-card">
            <div class="card-header-section">
              <div class="skel-icon"></div>
              <div class="skel-badge"></div>
            </div>
            <div class="card-body">
              <div class="skel-line skel-title"></div>
              <div class="skel-line skel-desc"></div>
              <div class="skel-line skel-desc-short"></div>
              <div class="skel-line skel-publisher"></div>
              <div class="skel-tags-row">
                <span class="skel-tag"></span>
                <span class="skel-tag"></span>
                <span class="skel-tag skel-tag-sm"></span>
              </div>
              <div class="skel-meta-row">
                <span class="skel-meta"></span>
                <span class="skel-meta"></span>
                <span class="skel-meta skel-meta-sm"></span>
              </div>
            </div>
            <div class="card-footer">
              <span class="skel-btn"></span>
              <span class="skel-btn skel-btn-sm"></span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="squareResources.length === 0" class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
          <p class="empty-title" style="font-size: 1rem; color: #64748b;">暂无资源</p>
          <p class="empty-desc" style="font-size: 0.8125rem; color: #94a3b8;">还没有人发布资源到广场</p>
        </div>

        <div v-else class="resources-grid">
          <div
            v-for="resource in squareResources"
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

              <div class="card-publisher">
                <span class="publisher-label">发布者：</span>
                <span class="publisher-name-text">{{ resource.publisherName || '未知用户' }}</span>
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
                <span class="meta-item views">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ resource.viewCount ?? 0 }}
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
        <div v-if="totalCount > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48]"
            :total="totalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchList"
            @size-change="onSizeChange"
          />
        </div>
      </section>

    </div>

    <!-- 发布流：文件选择 -> 发布表单 -->
    <CloudFilePickerDialog
      v-model:visible="showFilePicker"
      @select="onPickerSelect"
    />
    <PublishToSquareDialog
      v-model:visible="showPublishDialog"
      :file="publishFileTarget"
      @success="onPublishSuccess"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import CloudFilePickerDialog, { type PickedFile } from './components/CloudFilePickerDialog.vue'
import PublishToSquareDialog from '@/views/CloudDrive/components/PublishToSquareDialog.vue'
import { getSquareList, downloadFromSquare, getFeatured } from '@/api/resource-square'
import type { ResourceSquareVO, FeaturedResourceVO, SquareSortBy } from '@/types/resource-square'
import { resourceTypes, getCategoryName, getResourceIcon, formatFileSize } from './constants'

const router = useRouter()

const searchKeyword = ref('')
const activeType = ref('all')
const sortBy = ref<SquareSortBy>('newest')
const isLoading = ref(false)

// 列表数据
const squareResources = ref<ResourceSquareVO[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// Agent 精选
const featuredResource = ref<ResourceSquareVO | null>(null)
const featuredReason = ref<'agent' | 'hot'>('hot')
const featuredLoading = ref(false)

// 发布流
const showFilePicker = ref(false)
const showPublishDialog = ref(false)
const publishFileTarget = ref<PickedFile | null>(null)

const fetchList = async () => {
  isLoading.value = true
  try {
    const res = await getSquareList({
      keyword: searchKeyword.value || undefined,
      category: activeType.value !== 'all' ? activeType.value : undefined,
      sortBy: sortBy.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })
    squareResources.value = res.records || []
    totalCount.value = res.total || 0
  } catch {
    // 错误由请求拦截器统一弹 toast
  } finally {
    isLoading.value = false
  }
}

const fetchFeatured = async () => {
  featuredLoading.value = true
  try {
    const res = await getFeatured()
    if (res) {
      featuredResource.value = res.resource
      featuredReason.value = res.reason
    } else {
      featuredResource.value = null
    }
  } catch {
    // 精选加载失败不影响主列表
    featuredResource.value = null
  } finally {
    featuredLoading.value = false
  }
}

// 搜索防抖 300ms（与筛选/排序分离，避免每次按键都打后端）
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchList()
  }, 300)
})

// 类型/排序变化即时刷新
watch([activeType, sortBy], () => {
  currentPage.value = 1
  fetchList()
})

const onSizeChange = () => {
  currentPage.value = 1
  fetchList()
}

onMounted(() => {
  fetchList()
  fetchFeatured()
})

const openResource = (resource: ResourceSquareVO) => {
  router.push(`/resource-square/${resource.id}`)
}

const collectResource = async (resource: ResourceSquareVO) => {
  if (resource.hasDownloaded) {
    ElMessage.info('您已转存过该资源，可在云盘根目录查看')
    return
  }
  try {
    await downloadFromSquare(resource.id)
    ElMessage.success('已转存到您的云盘')
    // 仅在请求成功后更新本地态；失败时拦截器已弹 toast，此处不变更
    resource.hasDownloaded = true
    resource.downloadCount++
  } catch {
    // 错误由请求拦截器处理，不乐观变更
  }
}

// 发布流处理
const onPickerSelect = (file: PickedFile) => {
  publishFileTarget.value = file
  showPublishDialog.value = true
}

const onPublishSuccess = () => {
  showPublishDialog.value = false
  publishFileTarget.value = null
  // 新资源可能入选精选，列表与精选均刷新
  fetchList()
  fetchFeatured()
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
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

/* hot 回退：暖色调，诚实标识非 Agent 挑选 */
.featured-badge.hot {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

/* agent 精选：主色 AI 调 */
.featured-badge.agent {
  background: rgba(11, 183, 170, 0.25);
  color: #5eead4;
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
  flex-wrap: wrap;
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

/* 精选横幅 loading 骨架 */
.featured-skeleton {
  pointer-events: none;
}

.featured-skeleton .skel-badge-line,
.featured-skeleton .skel-title-line,
.featured-skeleton .skel-desc-line,
.featured-skeleton .skel-meta-line {
  background: linear-gradient(110deg, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.08) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

.featured-skeleton .skel-badge-line { width: 80px; height: 22px; border-radius: 99px; margin-bottom: 16px; }
.featured-skeleton .skel-title-line { width: 60%; height: 26px; margin-bottom: 16px; }
.featured-skeleton .skel-desc-line { width: 90%; height: 16px; margin-bottom: 10px; }
.featured-skeleton .skel-desc-line.short { width: 50%; }
.featured-skeleton .skel-meta-line { width: 70%; height: 14px; margin-top: 8px; }

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

.card-publisher {
  background: rgba(11, 183, 170, 0.04);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: 0.75rem;
  line-height: 1.5;
}

.publisher-label { color: var(--primary-color); font-weight: 600; }
.publisher-name-text { color: var(--text-secondary); }

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
  flex-wrap: wrap;
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

.card-meta .views {
  color: var(--text-muted);
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

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* ==================== 骨架屏加载动画 ==================== */
.skeleton-card {
  pointer-events: none;
  border: 1px solid #f1f5f9 !important;
  box-shadow: none !important;
}

.skeleton-card:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* 全局骨架扫光动画 */
.skeleton-card .skel-icon,
.skeleton-card .skel-badge,
.skeleton-card .skel-line,
.skeleton-card .skel-tag,
.skeleton-card .skel-meta,
.skeleton-card .skel-btn {
  background: linear-gradient(110deg, #eef2f7 30%, #f8fafc 50%, #eef2f7 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

/* 骨架图标 */
.skel-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px !important;
}

.skel-badge {
  width: 48px;
  height: 18px;
  border-radius: 99px !important;
}

/* 骨架文本行 */
.skel-line {
  height: 14px;
  margin-bottom: 10px;
}

.skel-title {
  width: 75%;
  height: 16px;
}

.skel-desc {
  width: 92%;
}

.skel-desc-short {
  width: 55%;
}

.skel-publisher {
  width: 40%;
  height: 12px;
  margin-top: 12px;
  margin-bottom: 10px;
  background: #f1f5f9 !important;
  animation: none !important;
}

/* 骨架标签行 */
.skel-tags-row {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.skel-tag {
  width: 42px;
  height: 20px;
  border-radius: 4px !important;
}

.skel-tag-sm {
  width: 30px;
}

/* 骨架元信息行 */
.skel-meta-row {
  display: flex;
  gap: 16px;
}

.skel-meta {
  width: 56px;
  height: 12px;
}

.skel-meta-sm {
  width: 32px;
}

/* 骨架按钮 */
.skeleton-card .card-footer {
  display: flex;
  justify-content: space-between;
}

.skel-btn {
  width: 64px;
  height: 28px;
  border-radius: 6px !important;
}

.skel-btn-sm {
  width: 48px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
