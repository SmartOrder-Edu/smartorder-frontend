<template>
  <AppLayout>
    <div class="spaces-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">学习空间管理</h1>
          <p class="page-desc">管理你的所有学习空间，创建、编辑、归档或标记完成</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="openCreateDialog" size="large">
            <el-icon><Plus /></el-icon>
            <span style="margin-left: 4px;">新建学习空间</span>
          </el-button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div
          v-for="stat in statsCards"
          :key="stat.key"
          class="stat-card"
          :class="{ active: activeTab === stat.key }"
          @click="activeTab = stat.key"
        >
          <span class="stat-value">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索空间名称或目标..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <div class="filter-tags">
          <span
            v-for="t in typeFilters"
            :key="t.key"
            class="filter-chip"
            :class="{ active: activeType === t.key }"
            @click="activeType = t.key"
          >
            {{ t.label }}
          </span>
        </div>
      </div>

      <!-- Space Grid -->
      <div v-loading="spaceStore.loading" class="spaces-grid">
        <div
          v-for="space in filteredSpaces"
          :key="space.id"
          class="space-card"
          :class="space.healthStatus"
        >
          <!-- Card Top -->
          <div class="card-top" @click="$router.push(`/space/${space.id}`)">
            <div class="card-header">
              <span class="card-icon">{{ space.icon }}</span>
              <div class="card-title-group">
                <h3 class="card-name">{{ space.name }}</h3>
                <div class="card-badges">
                  <span class="type-badge" :style="{ color: space.color, background: space.color + '18' }">
                    {{ typeLabel(space.type) }}
                  </span>
                  <span class="health-badge" :class="space.healthStatus">
                    {{ healthLabel(space.healthStatus) }}
                  </span>
                </div>
              </div>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, space)">
                <button class="card-menu-btn" @click.stop>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="enter">
                      <el-icon><Right /></el-icon>进入空间
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>编辑信息
                    </el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'active'" command="archive">
                      <el-icon><Folder /></el-icon>归档空间
                    </el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'archived'" command="active">
                      <el-icon><FolderOpened /></el-icon>取消归档
                    </el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'active'" command="complete">
                      <el-icon><CircleCheck /></el-icon>标记完成
                    </el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'completed'" command="active">
                      <el-icon><RefreshRight /></el-icon>重新激活
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" class="danger">
                      <el-icon><Delete /></el-icon>删除空间
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <p class="card-goal" v-if="space.goal">目标：{{ space.goal }}</p>
            <p class="card-desc" v-else-if="space.description">{{ space.description }}</p>

            <!-- Progress -->
            <div class="card-progress">
              <div class="progress-header">
                <span>完成进度</span>
                <span class="progress-value">{{ Math.round(space.progress) }}%</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: Math.round(space.progress) + '%', background: space.color }"
                ></div>
              </div>
            </div>

            <!-- Meta Info -->
            <div class="card-meta">
              <span v-if="space.targetEndDate">截止 {{ space.targetEndDate }}</span>
              <span v-if="space.actualEndDate" class="meta-done">完成于 {{ space.actualEndDate }}</span>
            </div>
          </div>

          <!-- Card Bottom -->
          <div class="card-bottom">
            <button class="card-btn primary" @click.stop="$router.push(`/space/${space.id}`)">
              进入空间
            </button>
            <button class="card-btn" @click.stop="openEditDialog(space)">编辑</button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!spaceStore.loading && filteredSpaces.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" opacity="0.4">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
          </svg>
          <h3 v-if="searchKeyword || activeType !== 'all'">没有找到匹配的学习空间</h3>
          <h3 v-else>还没有学习空间</h3>
          <p v-if="!searchKeyword && activeType === 'all'">创建你的第一个学习空间，开启智能学习之旅</p>
          <p v-else>尝试调整筛选条件</p>
          <el-button v-if="!searchKeyword && activeType === 'all'" type="primary" @click="openCreateDialog">
            新建学习空间
          </el-button>
        </div>
      </div>

      <!-- Create / Edit Dialog -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEditing ? '编辑学习空间' : '新建学习空间'"
        width="520px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="空间名称" prop="name">
            <el-input v-model="form.name" placeholder="例如：高等数学冲刺" maxlength="100" show-word-limit />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="空间类型" prop="type">
                <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
                  <el-option
                    v-for="t in typeOptions"
                    :key="t.value"
                    :label="t.label"
                    :value="t.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序">
                <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述这个学习空间" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="学习目标">
            <el-input v-model="form.goals" type="textarea" :rows="2" placeholder='["掌握洛必达法则", "完成定积分练习"]' />
            <div class="form-hint">支持 JSON 数组格式，用于 Agent 生成学习路径</div>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="开始日期">
                <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="目标完成日期">
                <el-date-picker v-model="form.targetEndDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditing ? '保存修改' : '创建空间' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Right, Folder, FolderOpened, CircleCheck, RefreshRight, Search } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import type { LearningSpaceDisplay, LearningSpaceType } from '@/api/learningSpace'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const spaceStore = useLearningSpaceStore()

// --- Tabs & Filtering ---

const activeTab = ref('all')
const activeType = ref('all')
const searchKeyword = ref('')

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'course', label: '课程' },
  { key: 'exam', label: '考试' },
  { key: 'project', label: '项目' },
  { key: 'career', label: '职业' },
  { key: 'competition', label: '竞赛' },
]

const typeOptions = [
  { value: 'course', label: '📐 课程学习' },
  { value: 'exam', label: '📝 考试备考' },
  { value: 'project', label: '💻 项目实战' },
  { value: 'career', label: '🚀 职业发展' },
  { value: 'competition', label: '🏆 竞赛集训' },
]

const typeLabel = (t: LearningSpaceType) => {
  const m: Record<string, string> = { course: '课程', exam: '考试', project: '项目', career: '职业', competition: '竞赛' }
  return m[t] || t
}

const healthLabel = (h: string) => {
  const m: Record<string, string> = { normal: '正常', warning: '需关注', danger: '有风险', good: '良好' }
  return m[h] || h
}

const statsCards = computed(() => {
  const all = spaceStore.spaces
  return [
    { key: 'all', count: all.length, label: '全部' },
    { key: 'active', count: all.filter(s => s.status === 'active').length, label: '进行中' },
    { key: 'archived', count: all.filter(s => s.status === 'archived').length, label: '已归档' },
    { key: 'completed', count: all.filter(s => s.status === 'completed').length, label: '已完成' },
  ]
})

const filteredSpaces = computed(() => {
  return spaceStore.spaces.filter(s => {
    if (activeTab.value !== 'all' && s.status !== activeTab.value) return false
    if (activeType.value !== 'all' && s.type !== activeType.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      const matchName = s.name.toLowerCase().includes(kw)
      const matchGoal = s.goal.toLowerCase().includes(kw)
      const matchDesc = s.description?.toLowerCase().includes(kw)
      if (!matchName && !matchGoal && !matchDesc) return false
    }
    return true
  })
})

// --- Dialog ---

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  name: '',
  type: 'course' as LearningSpaceType,
  description: '',
  goals: '',
  startDate: '',
  targetEndDate: '',
  sortOrder: 0,
})

const form = ref(emptyForm())

const formRules: FormRules = {
  name: [{ required: true, message: '请输入空间名称', trigger: 'blur' }],
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  form.value = emptyForm()
  dialogVisible.value = true
}

function openEditDialog(space: LearningSpaceDisplay) {
  isEditing.value = true
  editingId.value = space.id
  form.value = {
    name: space.name,
    type: space.type,
    description: space.description,
    goals: space.goals,
    startDate: space.startDate || '',
    targetEndDate: space.targetEndDate || '',
    sortOrder: space.sortOrder,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      await spaceStore.updateSpace(editingId.value, { ...form.value })
      ElMessage.success('空间已更新')
    } else {
      await spaceStore.createSpace({ ...form.value })
      ElMessage.success('学习空间创建成功')
    }
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// --- Card Actions ---

async function handleCommand(cmd: string, space: LearningSpaceDisplay) {
  switch (cmd) {
    case 'enter':
      router.push(`/space/${space.id}`)
      break
    case 'edit':
      openEditDialog(space)
      break
    case 'archive':
      await doChangeStatus(space, 'archived', '已归档')
      break
    case 'active':
      await doChangeStatus(space, 'active', '已激活')
      break
    case 'complete':
      await doChangeStatus(space, 'completed', '已标记完成')
      break
    case 'delete':
      await handleDelete(space)
      break
  }
}

async function doChangeStatus(space: LearningSpaceDisplay, status: string, label: string) {
  try {
    await spaceStore.changeSpaceStatus(space.id, status as any)
    ElMessage.success(label)
  } catch (e: any) {
    ElMessage.error(e.message || '状态变更失败')
  }
}

async function handleDelete(space: LearningSpaceDisplay) {
  try {
    await ElMessageBox.confirm(
      `确定要删除学习空间「${space.name}」吗？删除后可在数据库恢复。`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    await spaceStore.deleteSpace(space.id)
    ElMessage.success('已删除')
  } catch {
    // cancelled
  }
}

// --- Lifecycle ---

onMounted(() => {
  spaceStore.fetchSpaces()
})
</script>

<style scoped>
.spaces-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-2xl, 24px);
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl, 20px);
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark, #1a1a2e);
  margin: 0;
}
.page-desc {
  margin: 6px 0 0;
  color: var(--text-muted, #8c8ca1);
  font-size: 0.875rem;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: var(--spacing-lg, 16px);
}
.stat-card {
  background: #fff;
  border: 1px solid var(--border-light, #e8ecf1);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.stat-card:hover {
  border-color: var(--primary-color, #3b5bdb);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.06));
}
.stat-card.active {
  border-color: var(--primary-color, #3b5bdb);
  background: #f0f3ff;
}
.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-dark, #1a1a2e);
}
.stat-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8ca1);
  margin-top: 2px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: var(--spacing-lg, 16px);
  flex-wrap: wrap;
}
.search-input {
  width: 280px;
}
.filter-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-chip {
  padding: 4px 14px;
  border-radius: var(--radius-full, 999px);
  font-size: 0.8125rem;
  cursor: pointer;
  color: var(--text-secondary, #5a5a72);
  background: #f5f6fa;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.filter-chip:hover {
  color: var(--primary-color, #3b5bdb);
  border-color: var(--primary-color, #3b5bdb);
}
.filter-chip.active {
  background: var(--primary-color, #3b5bdb);
  color: #fff;
  border-color: var(--primary-color, #3b5bdb);
}

/* Grid */
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  min-height: 300px;
}

/* Card */
.space-card {
  background: #fff;
  border: 1px solid var(--border-light, #e8ecf1);
  border-radius: var(--radius-xl, 14px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}
.space-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.1));
}
.space-card.danger {
  border-left: 4px solid #ef4444;
}
.space-card.warning {
  border-left: 4px solid #f59e0b;
}
.space-card.good {
  border-left: 4px solid #10b981;
}
.space-card.normal {
  border-left: 4px solid transparent;
}

.card-top {
  padding: 16px 16px 12px;
  cursor: pointer;
  flex: 1;
}
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
  border-radius: var(--radius-md, 10px);
}
.card-title-group {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark, #1a1a2e);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-badges {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.type-badge {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full, 999px);
}
.health-badge {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full, 999px);
  background: #f5f6fa;
  color: var(--text-muted, #8c8ca1);
}
.health-badge.warning { background: #fef3c7; color: #d97706; }
.health-badge.danger { background: #fee2e2; color: #dc2626; }
.health-badge.good { background: #d1fae5; color: #059669; }

.card-menu-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #8c8ca1);
  padding: 4px;
  border-radius: var(--radius-sm, 6px);
  transition: all 0.15s;
}
.card-menu-btn:hover {
  background: #f5f6fa;
  color: var(--text-dark, #1a1a2e);
}

.card-goal {
  font-size: 0.8125rem;
  color: var(--text-secondary, #5a5a72);
  margin: 10px 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-desc {
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8ca1);
  margin: 10px 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-progress {
  margin-top: 12px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted, #8c8ca1);
  margin-bottom: 4px;
}
.progress-value {
  font-weight: 600;
  color: var(--text-dark, #1a1a2e);
}
.progress-track {
  height: 6px;
  background: #f0f1f5;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.card-meta {
  margin-top: 10px;
  font-size: 0.75rem;
  color: var(--text-muted, #8c8ca1);
  display: flex;
  gap: 8px;
}
.meta-done {
  color: #10b981;
}

/* Card Bottom */
.card-bottom {
  display: flex;
  border-top: 1px solid var(--border-light, #e8ecf1);
  padding: 10px 16px;
  gap: 8px;
}
.card-btn {
  flex: 1;
  padding: 7px 0;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-light, #e8ecf1);
  background: #fff;
  font-size: 0.8125rem;
  cursor: pointer;
  color: var(--text-secondary, #5a5a72);
  transition: all 0.15s;
}
.card-btn:hover {
  background: #f5f6fa;
}
.card-btn.primary {
  background: var(--primary-color, #3b5bdb);
  border-color: var(--primary-color, #3b5bdb);
  color: #fff;
}
.card-btn.primary:hover {
  opacity: 0.9;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 20px;
}
.empty-state h3 {
  margin: 16px 0 8px;
  color: var(--text-dark, #1a1a2e);
  font-size: 1.0625rem;
}
.empty-state p {
  color: var(--text-muted, #8c8ca1);
  margin: 0 0 16px;
  font-size: 0.875rem;
}

/* Form Hint */
.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8ca1);
  margin-top: -4px;
}

/* Dropdown danger */
:deep(.danger) {
  color: #ef4444 !important;
}

/* Responsive */
@media (max-width: 1200px) {
  .spaces-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-row { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .spaces-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .search-input { width: 100%; }
  .page-header { flex-direction: column; gap: 12px; }
}
</style>
