<template>
  <AppLayout>
    <div class="resources-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">资源中心</h1>
          <p class="page-desc">系统为你推荐和生成的学习资源，AI 会根据你的画像匹配合适的资料</p>
        </div>
        <div class="header-right">
          <el-button @click="showGenerateDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
            </svg>
            AI 生成资源
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
          <el-option label="智能排序" value="relevance" />
          <el-option label="最新资源" value="newest" />
          <el-option label="最短时长" value="shortest" />
          <el-option label="最高推荐" value="rating" />
        </el-select>
      </div>

      <!-- 推荐资源横幅 -->
      <section class="featured-banner" v-if="featuredResource">
        <div class="featured-content">
          <div class="featured-badge">本周精选</div>
          <h2 class="featured-title">{{ featuredResource.title }}</h2>
          <p class="featured-desc">{{ featuredResource.description }}</p>
          <div class="featured-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              {{ featuredResource.minutes }}分钟
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
              {{ featuredResource.rating }} 推荐指数
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              {{ featuredResource.learners }} 人学习
            </span>
          </div>
          <el-button type="primary" @click="openResource(featuredResource)">
            开始学习
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </el-button>
        </div>
        <div class="featured-visual">
          <div class="visual-card">
            <div class="card-glow"></div>
            <div class="card-content">
              <div class="card-icon-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <circle cx="19" cy="5" r="2"/>
                  <circle cx="5" cy="5" r="2"/>
                  <circle cx="19" cy="19" r="2"/>
                  <circle cx="5" cy="19" r="2"/>
                  <line x1="12" y1="9" x2="12" y2="3"/>
                  <line x1="14.5" y1="13.5" x2="17.5" y2="17.5"/>
                  <line x1="9.5" y1="13.5" x2="6.5" y2="17.5"/>
                </svg>
              </div>
              <span class="card-type">思维导图</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 资源网格 -->
      <section class="resources-grid-section">
        <div class="grid-header">
          <h3 class="grid-title">为你推荐的资源</h3>
          <span class="grid-count">共 {{ filteredResources.length }} 个资源</span>
        </div>

        <div class="resources-grid">
          <div
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-card"
            :class="`type-${resource.type}`"
          >
            <div class="card-header-section">
              <div class="card-type-icon" :class="resource.type">
                <span v-html="getResourceIcon(resource.type)"></span>
              </div>
              <div class="card-badges">
                <span v-if="resource.isAI" class="ai-badge">AI 生成</span>
                <span class="type-badge">{{ resource.typeName }}</span>
              </div>
            </div>

            <div class="card-body">
              <h4 class="card-title">{{ resource.title }}</h4>
              <p class="card-desc">{{ resource.description }}</p>

              <div class="card-reason">
                <span class="reason-label">推荐原因：</span>
                <span class="reason-text">{{ resource.reason }}</span>
              </div>

              <div class="card-tags">
                <span v-for="tag in resource.tags" :key="tag" class="card-tag">{{ tag }}</span>
              </div>

              <div class="card-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  {{ resource.minutes }}分钟
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ resource.learners }}
                </span>
                <span class="meta-item rating">
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  {{ resource.rating }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <el-button size="small" type="primary" @click="openResource(resource)">
                打开学习
              </el-button>
              <el-button size="small" text @click="collectResource(resource)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                收藏
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- AI 生成资源对话框 -->
      <el-dialog v-model="showGenerateDialog" title="AI 生成学习资源" width="560px">
        <div class="generate-form">
          <div class="form-item">
            <label>资源类型</label>
            <el-radio-group v-model="generateType">
              <el-radio label="doc">讲解文档</el-radio>
              <el-radio label="mindmap">思维导图</el-radio>
              <el-radio label="video">视频讲义</el-radio>
              <el-radio label="quiz">练习题集</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item">
            <label>知识点</label>
            <el-input v-model="generateTopic" placeholder="例如：进程同步与互斥、PV操作、死锁" />
          </div>
          <div class="form-item">
            <label>风格偏好</label>
            <el-checkbox-group v-model="generateStyles">
              <el-checkbox label="visual">可视化（图解、图表）</el-checkbox>
              <el-checkbox label="simple">简洁易懂</el-checkbox>
              <el-checkbox label="detail">详细深入</el-checkbox>
              <el-checkbox label="code">代码示例</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="form-item">
            <label>生成说明（可选）</label>
            <el-input type="textarea" v-model="generateNote" placeholder="描述你希望资源包含的具体内容..." :rows="2" />
          </div>
        </div>
        <template #footer>
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" :loading="generating" @click="generateResource">
            {{ generating ? '生成中...' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const searchKeyword = ref('')
const activeType = ref('all')
const sortBy = ref('relevance')
const showGenerateDialog = ref(false)
const generating = ref(false)
const generateType = ref('mindmap')
const generateTopic = ref('')
const generateStyles = ref(['visual'])
const generateNote = ref('')

const resourceTypes = [
  { value: 'all', label: '全部', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { value: 'doc', label: '文档', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>' },
  { value: 'mindmap', label: '导图', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>' },
  { value: 'video', label: '视频', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
  { value: 'quiz', label: '练习', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { value: 'case', label: '案例', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>' }
]

const featuredResource = ref({
  id: 0,
  title: '进程与线程完整知识图谱',
  description: 'AI 生成的思维导图，覆盖进程、线程、同步互斥的核心知识点，适合期末复习使用',
  minutes: 25,
  rating: 4.9,
  learners: 1234,
  type: 'mindmap'
})

const resources = ref([
  {
    id: 1, type: 'mindmap', typeName: '思维导图', title: '进程与线程对比图', description: '清晰对比进程与线程的概念、区别、优缺点',
    minutes: 8, learners: 856, rating: 4.8, isAI: true,
    reason: '你更偏好可视化学习方式，且当前处于进程与线程学习阶段',
    tags: ['进程', '线程', '对比', '可视化']
  },
  {
    id: 2, type: 'quiz', typeName: '练习题', title: '同步互斥专项测试（10题）', description: '涵盖 PV 操作、临界区、信号量等核心考点',
    minutes: 15, learners: 623, rating: 4.7, isAI: true,
    reason: '测评发现你的 PV 操作正确率偏低，需要专项训练',
    tags: ['PV操作', '同步', '互斥', '专项']
  },
  {
    id: 3, type: 'video', typeName: '视频讲义', title: '信号量机制动画演示', description: '通过动画直观展示信号量 P/V 操作的执行过程',
    minutes: 10, learners: 1205, rating: 4.9, isAI: true,
    reason: '结合你的测验薄弱点，动画讲解更容易理解',
    tags: ['信号量', '动画', 'PV操作']
  },
  {
    id: 4, type: 'doc', typeName: '文档', title: '进程同步与互斥详解', description: '从理论到实践，系统讲解同步互斥的各种方法',
    minutes: 20, learners: 432, rating: 4.6, isAI: false,
    reason: '理论基础需要扎实，建议结合练习题一起学习',
    tags: ['理论', '同步', '互斥', '经典']
  },
  {
    id: 5, type: 'mindmap', typeName: '思维导图', title: '操作系统内存管理知识图', description: '覆盖分页、分段、虚拟内存等核心概念',
    minutes: 12, learners: 567, rating: 4.7, isAI: true,
    reason: '下一章节为内存管理，提前预习有助理解',
    tags: ['内存', '虚拟内存', '分页', '预习']
  },
  {
    id: 6, type: 'case', typeName: '案例', title: '哲学家就餐问题代码实现', description: 'Python 实现哲学家就餐问题，深入理解死锁',
    minutes: 30, learners: 345, rating: 4.5, isAI: true,
    reason: '你偏好代码示例学习，且已学习相关理论',
    tags: ['死锁', '代码', 'Python', '实践']
  },
  {
    id: 7, type: 'doc', typeName: '文档', title: 'PCB 进程控制块详解', description: '详细介绍 PCB 的组成、作用和操作系统中的实现',
    minutes: 12, learners: 298, rating: 4.4, isAI: false,
    reason: '复习任务关联资源，加深理解',
    tags: ['PCB', '进程', '基础']
  },
  {
    id: 8, type: 'quiz', typeName: '练习题', title: '进程调度算法练习题', description: 'FIFO、SJF、时间片轮转等调度算法练习',
    minutes: 18, learners: 412, rating: 4.6, isAI: false,
    reason: '本周学习任务包含调度算法复习',
    tags: ['调度', '算法', 'FIFO', 'SJF']
  },
  {
    id: 9, type: 'video', typeName: '视频讲义', title: '线程同步与互斥动画讲解', description: '用生活实例和动画讲解互斥锁、条件变量等概念',
    minutes: 15, learners: 789, rating: 4.8, isAI: true,
    reason: '你的学习画像显示视频学习效果最好',
    tags: ['线程', '同步', '动画', '生活实例']
  }
])

const filteredResources = computed(() => {
  let result = resources.value

  if (activeType.value !== 'all') {
    result = result.filter(r => r.type === activeType.value)
  }

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(r =>
      r.title.toLowerCase().includes(kw) ||
      r.tags.some(t => t.toLowerCase().includes(kw)) ||
      r.description.toLowerCase().includes(kw)
    )
  }

  if (sortBy.value === 'newest') {
    result = [...result].sort((a, b) => b.id - a.id)
  } else if (sortBy.value === 'rating') {
    result = [...result].sort((a, b) => b.rating - a.rating)
  } else if (sortBy.value === 'shortest') {
    result = [...result].sort((a, b) => a.minutes - b.minutes)
  }

  return result
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

const openResource = (resource: any) => {
  console.log('Open resource:', resource.title)
}

const collectResource = (resource: any) => {
  console.log('Collect resource:', resource.title)
}

const generateResource = () => {
  generating.value = true
  setTimeout(() => {
    generating.value = false
    showGenerateDialog.value = false
  }, 2500)
}
</script>

<style scoped>
.resources-page {
  max-width: 1100px;
  height: calc(100vh - var(--header-height) - 2 * var(--spacing-xl));
  overflow-y: auto;
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
  background: rgba(59, 91, 219, 0.2);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(59, 91, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(59, 91, 219, 0.3), transparent 70%);
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

.card-type-icon.doc { background: rgba(59, 91, 219, 0.08); color: var(--primary-color); }
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
  background: rgba(59, 91, 219, 0.04);
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
  background: rgba(59, 91, 219, 0.06);
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
