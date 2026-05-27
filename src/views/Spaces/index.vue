<template>
  <AppLayout>
    <div class="spaces-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">学习空间</h1>
          <p class="page-desc">Agent 驱动的学习目标管理中心 — 每个空间独立规划、独立执行</p>
        </div>
        <div class="header-right">
          <el-button type="primary" size="large" @click="goCreateSpace">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 4px">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            与 Agent 对话创建空间
          </el-button>
        </div>
      </div>

      <!-- Stats Bar -->
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

      <!-- Space Cards Grid -->
      <div v-loading="spaceStore.loading" class="spaces-grid">
        <div
          v-for="space in enrichedSpaces"
          :key="space.id"
          class="space-card"
          :class="space.riskStatus"
        >
          <!-- Card Header -->
          <div class="card-head" @click="$router.push(`/space/${space.id}`)">
            <div class="card-head-left">
              <span class="card-emoji">{{ space.icon }}</span>
              <div class="card-name-group">
                <h3 class="card-name">{{ space.name }}</h3>
                <span class="card-type-badge" :style="{ color: space.color, background: space.color + '16' }">
                  {{ typeLabel(space.type) }}
                </span>
              </div>
            </div>
            <div class="card-head-right">
              <span class="risk-badge" :class="space.riskStatus">
                {{ riskLabel(space.riskStatus) }}
              </span>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, space)">
                <button class="card-menu-btn" @click.stop>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="enter">进入空间</el-dropdown-item>
                    <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'active'" command="archive">归档空间</el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'archived'" command="active">取消归档</el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'active'" command="complete">标记完成</el-dropdown-item>
                    <el-dropdown-item v-if="space.status === 'completed'" command="active">重新激活</el-dropdown-item>
                    <el-dropdown-item command="delete" class="danger-item">删除空间</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- Goal -->
          <div class="card-body" @click="$router.push(`/space/${space.id}`)">
            <p class="card-goal" v-if="space.goal">🎯 目标：{{ space.goal }}</p>
            <p class="card-desc" v-else-if="space.description">{{ space.description }}</p>

            <!-- Progress bar -->
            <div class="card-progress">
              <div class="progress-header">
                <span>完成进度</span>
                <span class="progress-value">{{ Math.round(space.progress) }}%</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: space.progress + '%', background: space.color }"
                ></div>
              </div>
            </div>

            <!-- Agent Insight -->
            <div class="card-insight" v-if="space.agentInsight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>{{ space.agentInsight }}</span>
            </div>

            <!-- Meta row -->
            <div class="card-meta-row">
              <div class="meta-item" v-if="space.streakDays > 0">
                <span class="meta-emoji">🔥</span>
                <span>连续{{ space.streakDays }}天</span>
              </div>
              <div class="meta-item" v-if="space._todayTaskCount > 0">
                <span class="meta-emoji">📋</span>
                <span>今日{{ space._todayTaskCount }}个任务</span>
              </div>
              <div class="meta-item" v-if="space.targetEndDate">
                <span class="meta-emoji">📅</span>
                <span>{{ daysLeft(space.targetEndDate) }}</span>
              </div>
            </div>

            <!-- Alert -->
            <div class="card-alert" v-if="space.alert" :class="space.riskStatus">
              {{ space.alert }}
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <button class="action-btn primary" @click.stop="$router.push(`/space/${space.id}`)">
              开始今日任务
            </button>
            <button class="action-btn" @click.stop="$router.push(`/space/${space.id}`)">
              进入空间
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!spaceStore.loading && enrichedSpaces.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" opacity="0.3">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
          </svg>
          <h3 v-if="searchKeyword || activeType !== 'all'">没有找到匹配的学习空间</h3>
          <h3 v-else>还没有学习空间</h3>
          <p v-if="!searchKeyword && activeType === 'all'">点击上方按钮，与 Agent 对话创建你的第一个学习空间</p>
          <p v-else>尝试调整筛选条件</p>
          <el-button v-if="!searchKeyword && activeType === 'all'" type="primary" @click="goCreateSpace">
            🤖 与 Agent 对话创建
          </el-button>
        </div>
      </div>

      <!-- Edit Dialog (keep for quick edits, but creation is Agent-guided) -->
      <el-dialog
        v-model="dialogVisible"
        title="编辑学习空间"
        width="520px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
          <el-form-item label="空间名称" prop="name">
            <el-input v-model="form.name" placeholder="例如：高等数学冲刺" maxlength="100" show-word-limit />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="空间类型" prop="type">
                <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
                  <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
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
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="学习目标">
            <el-input v-model="form.goals" type="textarea" :rows="2" placeholder='["掌握洛必达法则", "完成定积分练习"]' />
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
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存修改</el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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

const riskLabel = (h: string) => {
  const m: Record<string, string> = { normal: '正常', warning: '需关注', danger: '危险', good: '良好' }
  return m[h] || h
}

// --- Stats ---
const statsCards = computed(() => {
  const all = spaceStore.spaces
  return [
    { key: 'all', count: all.length, label: '全部' },
    { key: 'active', count: all.filter(s => s.status === 'active').length, label: '进行中' },
    { key: 'archived', count: all.filter(s => s.status === 'archived').length, label: '已归档' },
    { key: 'completed', count: all.filter(s => s.status === 'completed').length, label: '已完成' },
  ]
})

// --- Enrich spaces with mock data for display ---
const enrichedSpaces = computed(() => {
  return spaceStore.spaces
    .filter(s => {
      if (activeTab.value !== 'all' && s.status !== activeTab.value) return false
      if (activeType.value !== 'all' && s.type !== activeType.value) return false
      if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        if (!s.name.toLowerCase().includes(kw) && !s.goal?.toLowerCase().includes(kw) && !s.description?.toLowerCase().includes(kw)) return false
      }
      return true
    })
    .map(s => {
      // Enrich with mock data for Agent status report-style cards
      const mockEnrichments = getMockEnrichment(s)
      return { ...s, ...mockEnrichments }
    })
})

// Mock data enriched onto space cards (will come from API eventually)
function getMockEnrichment(_space: LearningSpaceDisplay): Partial<typeof _space & { _todayTaskCount: number }> {
  // Simple hash to get a deterministic "mock" value per space
  const id = _space.id
  const streaks = [3, 5, 7, 2, 1, 8, 4]
  const tasks = [2, 3, 1, 4, 2, 3, 0]
  const insights = [
    '你在关键概念上频繁出错，建议今日强化练习',
    '进度保持良好，继续按计划推进',
    '近期学习中断较多，建议恢复学习节奏',
    '',
    '即将到达截止日期，建议增加学习投入',
  ]

  return {
    streakDays: streaks[id % streaks.length],
    agentInsight: _space.status === 'active' ? insights[id % insights.length] : '',
    _todayTaskCount: _space.status === 'active' ? tasks[id % tasks.length] : 0,
    alert: _space.healthStatus === 'danger' ? '进度严重滞后，需立即跟进' : _space.healthStatus === 'warning' ? '进度偏慢，建议增加学习时间' : '',
    riskStatus: _space.healthStatus,
  }
}

function daysLeft(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (d < 0) return `已过期${Math.abs(d)}天`
  return `还剩${d}天`
}

// --- Agent-guided creation ---
function goCreateSpace() {
  router.push({ path: '/ai-tutor', query: { action: 'create_space' } })
}

// --- Edit Dialog (keep for quick edits, not creation) ---
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  name: '', type: 'course' as LearningSpaceType, description: '', goals: '', startDate: '', targetEndDate: '', sortOrder: 0,
})

const form = ref(emptyForm())
const formRules: FormRules = {
  name: [{ required: true, message: '请输入空间名称', trigger: 'blur' }],
}

function openEditDialog(space: LearningSpaceDisplay) {
  editingId.value = space.id
  form.value = {
    name: space.name, type: space.type, description: space.description,
    goals: space.goals, startDate: space.startDate || '',
    targetEndDate: space.targetEndDate || '', sortOrder: space.sortOrder,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (editingId.value) {
      await spaceStore.updateSpace(editingId.value, { ...form.value })
      ElMessage.success('空间已更新')
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
    case 'enter': router.push(`/space/${space.id}`); break
    case 'edit': openEditDialog(space); break
    case 'archive': await doChangeStatus(space, 'archived', '已归档'); break
    case 'active': await doChangeStatus(space, 'active', '已激活'); break
    case 'complete': await doChangeStatus(space, 'completed', '已标记完成'); break
    case 'delete': await handleDelete(space); break
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
      `确定要删除学习空间「${space.name}」吗？`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    await spaceStore.deleteSpace(space.id)
    ElMessage.success('已删除')
  } catch { /* cancelled */ }
}

onMounted(() => { spaceStore.fetchSpaces() })
</script>

<style scoped>
.spaces-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}
.page-desc {
  margin: 6px 0 0;
  color: #8c8ca1;
  font-size: 0.875rem;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.stat-card:hover { border-color: #3b5bdb; }
.stat-card.active { border-color: #3b5bdb; background: #f0f3ff; }
.stat-value { display: block; font-size: 1.75rem; font-weight: 700; color: #1a1a2e; }
.stat-label { display: block; font-size: 0.8125rem; color: #8c8ca1; margin-top: 2px; }

/* Filter */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input { width: 280px; }
.filter-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip {
  padding: 4px 14px;
  border-radius: 99px;
  font-size: 0.8125rem;
  cursor: pointer;
  color: #5a5a72;
  background: #f5f6fa;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.filter-chip:hover { color: #3b5bdb; border-color: #3b5bdb; }
.filter-chip.active { background: #3b5bdb; color: #fff; border-color: #3b5bdb; }

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
  border: 1px solid #e8ecf1;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}
.space-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
.space-card.danger { border-left: 4px solid #ef4444; }
.space-card.warning { border-left: 4px solid #f59e0b; }
.space-card.good { border-left: 4px solid #10b981; }
.space-card.normal { border-left: 4px solid transparent; }

/* Card Head */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
  cursor: pointer;
}
.card-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.card-emoji { font-size: 1.5rem; }
.card-name-group { min-width: 0; }
.card-name { font-size: 0.9375rem; font-weight: 600; color: #1a1a2e; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-type-badge { font-size: 0.6875rem; padding: 1px 8px; border-radius: 99px; }
.card-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.risk-badge {
  font-size: 0.6875rem;
  padding: 2px 10px;
  border-radius: 99px;
  background: #f5f6fa; color: #8c8ca1;
}
.risk-badge.warning { background: #fef3c7; color: #d97706; }
.risk-badge.danger { background: #fee2e2; color: #dc2626; }
.risk-badge.good { background: #d1fae5; color: #059669; }

/* Card Menu */
.card-menu-btn {
  background: none; border: none; cursor: pointer;
  color: #8c8ca1; padding: 4px; border-radius: 6px;
}
.card-menu-btn:hover { background: #f5f6fa; color: #1a1a2e; }

/* Card Body */
.card-body {
  padding: 10px 16px 12px;
  cursor: pointer;
  flex: 1;
}
.card-goal, .card-desc { font-size: 0.8125rem; color: #5a5a72; margin: 0 0 10px; line-height: 1.4; }

/* Progress */
.card-progress { margin-bottom: 10px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: #8c8ca1; margin-bottom: 4px; }
.progress-value { font-weight: 600; color: #1a1a2e; }
.progress-track { height: 6px; background: #f0f1f5; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

/* Agent Insight */
.card-insight {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  margin-bottom: 10px;
  font-size: 0.75rem; color: #5a5a72; line-height: 1.4;
}
.card-insight svg { color: #3b82f6; flex-shrink: 0; margin-top: 1px; }

/* Meta Row */
.card-meta-row { display: flex; gap: 14px; margin-bottom: 6px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #6b7280; }
.meta-emoji { font-size: 13px; }

/* Alert */
.card-alert {
  font-size: 0.75rem; padding: 6px 10px; border-radius: 8px;
  margin-top: 8px;
}
.card-alert.warning { background: #fef3c7; color: #92400e; }
.card-alert.danger { background: #fee2e2; color: #991b1b; }

/* Card Actions */
.card-actions {
  display: flex;
  border-top: 1px solid #e8ecf1;
  padding: 10px 16px;
  gap: 8px;
}
.action-btn {
  flex: 1; padding: 8px 0;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
  background: #fff; color: #5a5a72;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover { background: #f5f6fa; }
.action-btn.primary { background: #3b5bdb; border-color: #3b5bdb; color: #fff; }
.action-btn.primary:hover { opacity: 0.9; }

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 20px;
}
.empty-state h3 { margin: 16px 0 8px; color: #1a1a2e; font-size: 1.0625rem; }
.empty-state p { color: #8c8ca1; margin: 0 0 16px; font-size: 0.875rem; }

/* Danger dropdown item */
:deep(.danger-item) { color: #ef4444 !important; }

/* Responsive */
@media (max-width: 1200px) { .spaces-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .spaces-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .search-input { width: 100%; }
  .page-header { flex-direction: column; gap: 12px; }
}
</style>
