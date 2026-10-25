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
      <section
        v-if="featuredLoading"
        class="featured-banner featured-skeleton"
        aria-busy="true"
        aria-label="正在加载精选资源"
      >
        <div class="featured-orb featured-orb--teal" aria-hidden="true"></div>
        <div class="featured-orb featured-orb--cyan" aria-hidden="true"></div>
        <div class="featured-content">
          <div class="skel-badge-line"></div>
          <div class="skel-title-line"></div>
          <div class="skel-desc-line"></div>
          <div class="skel-desc-line short"></div>
          <div class="skel-stats-row">
            <div class="skel-stat"></div>
            <div class="skel-stat"></div>
            <div class="skel-stat"></div>
            <div class="skel-stat"></div>
          </div>
          <div class="skel-cta-line"></div>
        </div>
        <div class="featured-visual" aria-hidden="true">
          <div class="visual-card"></div>
        </div>
      </section>

      <section
        v-else-if="featuredResource"
        class="featured-banner"
        aria-labelledby="featured-title"
      >
        <div class="featured-orb featured-orb--teal" aria-hidden="true"></div>
        <div class="featured-orb featured-orb--cyan" aria-hidden="true"></div>

        <div class="featured-content">
          <div class="featured-eyebrow">
            <span class="featured-badge" :class="featuredReason">
              <span class="badge-dot" aria-hidden="true"></span>
              <svg v-if="featuredReason === 'agent'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2l1.6 5.9L19.5 9.5 13.6 11.1 12 17l-1.6-5.9L4.5 9.5 10.4 7.9z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2c1 3.2 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 1-3-2.2 1.2-3 3-3 5a6 6 0 0 0 12 0c0-5.2-4-7.5-6-10.5z"/></svg>
              {{ featuredReason === 'agent' ? 'Agent 精选' : '热门精选' }}
            </span>
            <span class="type-chip">
              <span class="sr-only">资源类型：</span>{{ getCategoryName(featuredResource.category) }}
            </span>
          </div>

          <h2 id="featured-title" class="featured-title">{{ featuredResource.title }}</h2>
          <p class="featured-desc">
            {{ featuredResource.description || '暂无详细描述，点击「查看详情」了解资源内容。' }}
          </p>

          <div class="featured-stats">
            <div class="stat-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              <div class="stat-chip-body">
                <span class="stat-value">{{ formatFileSize(featuredResource.fileSize) }}</span>
                <span class="stat-label">大小</span>
              </div>
            </div>
            <div class="stat-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              <div class="stat-chip-body">
                <span class="stat-value">{{ featuredResource.ratingAvg }}</span>
                <span class="stat-label">推荐指数</span>
              </div>
            </div>
            <div class="stat-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <div class="stat-chip-body">
                <span class="stat-value">{{ featuredResource.viewCount ?? 0 }}</span>
                <span class="stat-label">浏览</span>
              </div>
            </div>
            <div class="stat-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div class="stat-chip-body">
                <span class="stat-value">{{ featuredResource.downloadCount }}</span>
                <span class="stat-label">人转存</span>
              </div>
            </div>
          </div>

          <div class="featured-actions">
            <button type="button" class="featured-cta" @click="openResource(featuredResource)">
              查看详情
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
            </button>
            <button
              type="button"
              class="featured-ghost"
              :disabled="featuredResource.hasDownloaded"
              :title="featuredResource.hasDownloaded ? '该资源已在你的云盘中' : '转存到云盘'"
              @click="collectResource(featuredResource)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {{ featuredResource.hasDownloaded ? '已转存' : '转存到云盘' }}
            </button>
          </div>
        </div>

        <div class="featured-visual" aria-hidden="true">
          <div class="visual-ring"></div>
          <div class="visual-card">
            <div class="card-glow"></div>
            <div class="card-content">
              <div class="card-icon-large" v-html="getResourceIcon(featuredResource.category)"></div>
              <span class="card-type">{{ getCategoryName(featuredResource.category) }}</span>
            </div>
            <div class="card-spark spark-1"></div>
            <div class="card-spark spark-2"></div>
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
import type { ResourceSquareVO, SquareSortBy } from '@/types/resource-square'
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

/* 页头窄屏：按钮换行下沉，避免与描述文字叠压 */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  .header-right .el-button {
    width: 100%;
    justify-content: center;
  }
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

/* ==================== Agent 精选横幅 ==================== */
/**
 * 设计规范（对齐页面「治愈薄荷」浅色主题）
 * 1. 表面：白 → 薄荷浅底渐变，取代原深色 #0b1424；层级由阴影与边框表达，不再用暗底反白。
 * 2. 品牌：--fp-brand #0a7470 用于小字号文字（徽标底色上 ≥5.0:1）；#0d7d76→#0f766e 用于主按钮实底（白字 ≥4.9:1）。
 * 3. 文字：标题 #0f172a / 正文 #475569 / 辅助 #64748b（在 #ffffff 与 #ecfdfb 上均 ≥4.5:1）。
 * 4. 权重：标题 700 > 实心主按钮 > 数据 chips > 描边次按钮 > 装饰光斑，避免多点抢焦。
 * 5. 尺寸：断点 1100 / 900 / 600 / 420，网格列随宽度收缩，≤900 隐藏纯装饰视觉卡（类型信息已前置为 chip）。
 */
.featured-banner {
  /* 局部令牌：本板块唯一配色入口 */
  --fp-ink: #0f172a;
  --fp-ink-body: #475569;
  --fp-ink-muted: #64748b;
  --fp-brand: #0a7470;
  --fp-brand-deep: #0f766e;
  --fp-border: rgba(11, 183, 170, 0.18);
  --fp-border-soft: rgba(148, 163, 184, 0.22);
  --fp-chip-bg: rgba(255, 255, 255, 0.92);
  --fp-shadow: 0 18px 40px -26px rgba(15, 23, 42, 0.3), 0 2px 6px rgba(15, 23, 42, 0.04);

  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 196px;
  align-items: center;
  gap: clamp(16px, 2.2vw, 32px);
  padding: clamp(20px, 2.6vw, 32px);
  background:
    radial-gradient(120% 150% at 100% 0%, rgba(11, 183, 170, 0.12) 0%, rgba(11, 183, 170, 0) 62%),
    linear-gradient(135deg, #ffffff 0%, #f8fefd 52%, #ecfdfb 100%);
  border: 1px solid var(--fp-border);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--spacing-xl);
  overflow: hidden;
  box-shadow: var(--fp-shadow);
  isolation: isolate;
}

/* 氛围光斑：低饱和薄荷/青色，仅作背景肌理 */
.featured-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
  z-index: 0;
}
.featured-orb--teal {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(11, 183, 170, 0.3) 0%, rgba(11, 183, 170, 0) 70%);
  top: -140px;
  right: -60px;
}
.featured-orb--cyan {
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0) 70%);
  bottom: -150px;
  left: 4%;
}

/* 细密网格底纹：极低对比，提供质感而不干扰文字 */
.featured-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(11, 183, 170, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(11, 183, 170, 0.055) 1px, transparent 1px);
  background-size: 32px 32px;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  z-index: 0;
  pointer-events: none;
}

/* 屏幕阅读器专用文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.featured-content {
  position: relative;
  z-index: 2;
  min-width: 0;
  color: var(--fp-ink);
}

/* 徽标行：主标签（Agent/热门）+ 资源类型，信息前置，移动端不依赖右侧装饰卡 */
.featured-eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.featured-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px 4px 9px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
}
.featured-badge .badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: featuredDotPulse 2.4s ease-in-out infinite;
}
.featured-badge svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
.featured-badge.agent {
  background: rgba(11, 183, 170, 0.1);
  color: var(--fp-brand);
  border: 1px solid rgba(11, 183, 170, 0.24);
}
.featured-badge.hot {
  background: #fff7ed;
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.28);
}
@keyframes featuredDotPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

.type-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--fp-ink-muted);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--fp-border-soft);
}

.featured-title {
  font-size: clamp(1.25rem, 1.02rem + 0.95vw, 1.75rem);
  font-weight: 700;
  line-height: 1.32;
  margin: 0 0 10px;
  color: var(--fp-ink);
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-desc {
  max-width: 62ch;
  font-size: 0.9375rem;
  color: var(--fp-ink-body);
  margin: 0 0 20px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 数据指标 chips：白底 + 细边框，弱于标题与主按钮 */
.featured-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.stat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  background: var(--fp-chip-bg);
  border: 1px solid var(--fp-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.stat-chip:hover {
  background: #ffffff;
  border-color: rgba(11, 183, 170, 0.38);
  box-shadow: 0 6px 16px -12px rgba(15, 118, 110, 0.6);
}
.stat-chip svg {
  width: 15px;
  height: 15px;
  color: var(--fp-brand);
  flex-shrink: 0;
}
.stat-chip-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}
.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--fp-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stat-label {
  font-size: 0.6875rem;
  color: var(--fp-ink-muted);
  white-space: nowrap;
}

/* 操作按钮：主按钮实心深青（白字 ≥4.9:1），次按钮白底描边 */
.featured-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.featured-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #0d7d76 0%, #0f766e 100%);
  border: 1px solid transparent;
  cursor: pointer;
  box-shadow: 0 10px 24px -14px rgba(15, 118, 110, 0.9);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), filter var(--transition-fast);
}
.featured-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px -14px rgba(15, 118, 110, 1);
  filter: brightness(0.96);
}
.featured-cta:active {
  transform: translateY(0);
  filter: brightness(0.92);
}
.featured-cta:focus-visible,
.featured-ghost:focus-visible {
  outline: 2px solid var(--fp-brand-deep);
  outline-offset: 3px;
}
.featured-cta svg {
  width: 16px;
  height: 16px;
}
.featured-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.32);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}
.featured-ghost:hover:not(:disabled) {
  background: #f0fdfa;
  border-color: rgba(11, 183, 170, 0.45);
  color: var(--fp-brand);
}
.featured-ghost:disabled {
  color: #68748a;
  background: #f8fafc;
  border-color: rgba(148, 163, 184, 0.24);
  cursor: not-allowed;
}
.featured-ghost svg {
  width: 15px;
  height: 15px;
}

/* 右侧视觉区：浅色“资源卡”剪影，纯装饰 */
.featured-visual {
  position: relative;
  z-index: 2;
  justify-self: end;
  width: 196px;
  height: 196px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.visual-ring {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 1px dashed rgba(11, 183, 170, 0.28);
  animation: featuredSpin 24s linear infinite;
}
.visual-ring::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-color);
  transform: translateX(-50%);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.14);
}
@keyframes featuredSpin {
  to { transform: rotate(360deg); }
}
.visual-card {
  width: 150px;
  height: 150px;
  background: linear-gradient(150deg, #ffffff 0%, #f0fdfa 58%, #ccfbf1 100%);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(11, 183, 170, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 18px 34px -22px rgba(15, 118, 110, 0.55),
    inset 0 1px 0 #ffffff;
  animation: featuredFloat 6s ease-in-out infinite;
}
@keyframes featuredFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, rgba(11, 183, 170, 0.16), transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}
.card-content {
  position: relative;
  text-align: center;
}
.card-icon-large {
  width: 54px;
  height: 54px;
  margin: 0 auto var(--spacing-xs);
  color: var(--fp-brand);
}
.card-icon-large svg {
  width: 100%;
  height: 100%;
}
.card-type {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--fp-ink-muted);
  letter-spacing: 0.02em;
}
.card-spark {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.14);
  opacity: 0;
  animation: featuredSpark 3.5s ease-in-out infinite;
}
.spark-1 {
  top: 14px;
  right: 18px;
  animation-delay: 0.4s;
}
.spark-2 {
  bottom: 20px;
  left: 16px;
  animation-delay: 1.8s;
}
@keyframes featuredSpark {
  0%, 100% { opacity: 0; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 通用 .meta-item（供资源网格使用） */
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.meta-item svg {
  width: 14px;
  height: 14px;
}

/* ==================== 精选横幅 loading 骨架 ==================== */
.featured-skeleton {
  pointer-events: none;
}
.featured-skeleton .featured-orb {
  display: none;
}
.featured-skeleton .visual-card {
  animation: none;
  background: linear-gradient(110deg, #eef7f6 30%, #f8fefd 50%, #eef7f6 70%);
  background-size: 200% 100%;
  border-color: rgba(11, 183, 170, 0.12);
  box-shadow: none;
}
.featured-skeleton .skel-badge-line,
.featured-skeleton .skel-title-line,
.featured-skeleton .skel-desc-line,
.featured-skeleton .skel-cta-line,
.featured-skeleton .skel-stat {
  background: linear-gradient(110deg, var(--skeleton-bg-start) 30%, var(--skeleton-bg-middle) 50%, var(--skeleton-bg-end) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}
.featured-skeleton .skel-badge-line {
  width: 92px;
  height: 24px;
  border-radius: 99px;
  margin-bottom: 18px;
}
.featured-skeleton .skel-title-line {
  width: 62%;
  height: 28px;
  margin-bottom: 14px;
}
.featured-skeleton .skel-desc-line {
  width: 90%;
  height: 15px;
  margin-bottom: 10px;
}
.featured-skeleton .skel-desc-line.short {
  width: 55%;
  margin-bottom: 22px;
}
.featured-skeleton .skel-stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.featured-skeleton .skel-stat {
  width: 96px;
  height: 44px;
  border-radius: 10px;
}
.featured-skeleton .skel-cta-line {
  width: 132px;
  height: 40px;
  border-radius: 99px;
}

/* 精选横幅响应式 */
@media (max-width: 1100px) {
  .featured-banner {
    grid-template-columns: minmax(0, 1fr) 168px;
  }
  .featured-visual {
    width: 168px;
    height: 168px;
  }
  .visual-card {
    width: 132px;
    height: 132px;
  }
  .card-icon-large {
    width: 46px;
    height: 46px;
  }
}

/* ≤900：类型信息已由 .type-chip 承载，隐藏纯装饰视觉卡，单列排版 */
@media (max-width: 900px) {
  .featured-banner {
    grid-template-columns: minmax(0, 1fr);
  }
  .featured-visual {
    display: none;
  }
  .featured-desc {
    max-width: none;
  }
}

@media (max-width: 600px) {
  .featured-banner {
    padding: 18px;
    border-radius: var(--radius-xl);
  }
  .featured-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat-chip {
    padding: 8px 10px;
  }
  .featured-actions {
    gap: 8px;
  }
  .featured-cta,
  .featured-ghost {
    flex: 1 1 132px;
  }
}

@media (max-width: 420px) {
  .featured-title {
    font-size: 1.1875rem;
  }
  .featured-actions {
    flex-direction: column;
  }
  .featured-cta,
  .featured-ghost {
    /* 纵向排列时清掉横向的 flex-basis，避免被当作高度拉伸 */
    flex: 0 0 auto;
    width: 100%;
  }
}

/* 尊重系统“减少动态效果”偏好 */
@media (prefers-reduced-motion: reduce) {
  .visual-ring,
  .visual-card,
  .card-glow,
  .card-spark,
  .featured-badge .badge-dot,
  .featured-banner::before {
    animation: none !important;
  }
  .featured-cta,
  .featured-ghost,
  .stat-chip {
    transition: none;
  }
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
  background: var(--bg-card);
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
  border: 1px solid var(--border-light) !important;
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
  background: linear-gradient(110deg, var(--skeleton-bg-start) 30%, var(--skeleton-bg-middle) 50%, var(--skeleton-bg-end) 70%);
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
  background: var(--skeleton-publisher-bg) !important;
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
