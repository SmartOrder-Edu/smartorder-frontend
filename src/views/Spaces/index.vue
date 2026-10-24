<template>
  <AppLayout>
    <div class="spaces-page">
      <ParticleBackground />
      <div class="spaces-content">
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
          :style="{ '--space-bg': space.bgColor }"
        >
          <!-- Cover -->
          <div class="card-cover" @click="$router.push(`/space/${space.id}`)">
            <el-image
              v-if="space.coverUrl"
              class="card-cover-img"
              :src="space.coverUrl"
              fit="cover"
            >
              <template #error>
                <div class="card-cover-default" :style="coverStyle(space)">
                  <span>{{ coverInitial(space) }}</span>
                </div>
              </template>
            </el-image>
            <div v-else class="card-cover-default" :style="coverStyle(space)">
              <span>{{ coverInitial(space) }}</span>
            </div>
            <div class="card-cover-shade"></div>
            <span class="card-cover-type">{{ typeLabel(space.type) }}</span>
          </div>

          <!-- Card Header -->
          <div class="card-head" @click="$router.push(`/space/${space.id}`)">
            <div class="card-head-left">
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
            <p class="card-goal" v-if="space.goal"><img src="@/assets/icons/flag.svg" class="goal-icon" alt="" /> 目标：{{ space.goal }}</p>
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
        width="680px"
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
          <el-form-item label="空间封面">
            <div class="cover-field">
              <div class="cover-preview">
                <img v-if="form.coverUrl" :src="form.coverUrl" alt="" />
                <div v-else class="cover-preview-default" :style="coverStyle(form)">
                  <span>{{ coverInitial(form) }}</span>
                </div>
              </div>
              <div class="cover-controls">
                <el-upload
                  class="cover-uploader"
                  action="#"
                  :http-request="handleCoverUpload"
                  :before-upload="beforeCoverUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <button type="button" class="cover-upload-btn" :disabled="coverUploading">
                    <span v-if="coverUploading">上传中...</span>
                    <span v-else>{{ form.coverUrl ? '更换封面图片' : '上传封面图片' }}</span>
                  </button>
                </el-upload>
                <button v-if="form.coverUrl" type="button" class="cover-clear-btn" @click="form.coverUrl = ''">
                  使用默认封面
                </button>
                <div class="cover-presets">
                  <button
                    v-for="preset in coverPresets"
                    :key="preset.type"
                    type="button"
                    class="cover-preset"
                    :class="{ active: form.type === preset.type && !form.coverUrl }"
                    :style="{ background: preset.gradient }"
                    @click="applyDefaultCover(preset.type)"
                  >
                    <span>{{ preset.label }}</span>
                  </button>
                </div>
                <el-collapse class="cover-advanced">
                  <el-collapse-item title="使用图片 URL（高级）" name="url">
                    <el-input
                      v-model="form.coverUrl"
                      placeholder="粘贴图片 URL"
                      clearable
                    />
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import ParticleBackground from '@/components/ParticleBackground.vue'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import { learningSpaceApi } from '@/api/learningSpace'
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

const coverPresets: { type: LearningSpaceType; label: string; gradient: string }[] = [
  { type: 'course', label: '课程', gradient: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)' },
  { type: 'exam', label: '考试', gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)' },
  { type: 'project', label: '项目', gradient: 'linear-gradient(135deg, #d97706 0%, #facc15 100%)' },
  { type: 'career', label: '职业', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
  { type: 'competition', label: '竞赛', gradient: 'linear-gradient(135deg, #dc2626 0%, #fb7185 100%)' },
]

const coverThemeMap = coverPresets.reduce((map, preset) => {
  map[preset.type] = preset
  return map
}, {} as Record<LearningSpaceType, { type: LearningSpaceType; label: string; gradient: string }>)

const typeLabel = (t: LearningSpaceType) => {
  const m: Record<string, string> = { course: '课程', exam: '考试', project: '项目', career: '职业', competition: '竞赛' }
  return m[t] || t
}

const riskLabel = (h: string) => {
  const m: Record<string, string> = { normal: '正常', warning: '需关注', danger: '危险', good: '良好' }
  return m[h] || h
}

function coverTheme(item: { type?: LearningSpaceType }) {
  return coverThemeMap[item.type || 'course'] || coverThemeMap.course
}

function coverStyle(item: { type?: LearningSpaceType }) {
  return {
    '--cover-gradient': coverTheme(item).gradient,
  }
}

function coverInitial(item: { type?: LearningSpaceType; name?: string }) {
  const nameInitial = item.name?.trim()?.slice(0, 1)
  return nameInitial || coverTheme(item).label.slice(0, 1)
}

function applyDefaultCover(type: LearningSpaceType) {
  form.value.type = type
  form.value.coverUrl = ''
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
const coverUploading = ref(false)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  name: '', type: 'course' as LearningSpaceType, description: '', coverUrl: '', goals: '', startDate: '', targetEndDate: '', sortOrder: 0,
})

const form = ref(emptyForm())
const formRules: FormRules = {
  name: [{ required: true, message: '请输入空间名称', trigger: 'blur' }],
}

function openEditDialog(space: LearningSpaceDisplay) {
  editingId.value = space.id
  form.value = {
    name: space.name, type: space.type, description: space.description,
    coverUrl: space.coverUrl || '', goals: space.goals, startDate: space.startDate || '',
    targetEndDate: space.targetEndDate || '', sortOrder: space.sortOrder,
  }
  dialogVisible.value = true
}

function beforeCoverUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('封面图片不能超过 5MB')
    return false
  }
  return true
}

async function handleCoverUpload(options: any) {
  coverUploading.value = true
  try {
    const url = await learningSpaceApi.uploadCover(options.file as File)
    form.value.coverUrl = url
    ElMessage.success('封面已上传')
  } catch (e: any) {
    ElMessage.error(e?.message || '封面上传失败')
  } finally {
    coverUploading.value = false
  }
}

async function handleSubmit() {
  // 表单校验也是异步的，须先锁定提交入口。
  if (submitting.value) return
  submitting.value = true
  try {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
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
  } catch {
    // 用户取消删除
    return
  }
  try {
    await spaceStore.deleteSpace(space.id)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败，请稍后重试')
  }
}

onMounted(() => { spaceStore.fetchSpaces() })
</script>

<style scoped>
.spaces-page {
  position: relative;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
}
.spaces-content {
  position: relative;
  z-index: 1;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  background: transparent;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
.page-desc {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
}
.header-right .el-button {
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 0.95rem;
  height: auto;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2);
  border: none;
  background: linear-gradient(135deg, #4361ee 0%, #3b5bdb 100%);
  transition: all 0.3s ease;
}
.header-right .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
  background: linear-gradient(135deg, #3b5bdb 0%, #304ecc 100%);
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--color-card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px  var(--color-shadow);
}
.stat-card:hover { 
  transform: translateY(-4px); 
  border-color: rgba(67, 97, 238, 0.4); 
  box-shadow: 0 12px 24px rgba(67, 97, 238, 0.06); 
}
.stat-card.active { 
  border-color: #4361ee; 
  background: linear-gradient(145deg, #ffffff, #f0f4ff); 
  box-shadow: 0 8px 24px rgba(67, 97, 238, 0.15); 
  transform: translateY(-2px);
}
html[data-theme='dark'] .stat-card {
  border-color: rgba(255, 255, 255, 0.12);
}
html[data-theme='dark'] .stat-card.active {
  background: var(--panel-bg, rgba(26, 26, 46, 0.8));
  border-color: #4361ee;
}
html[data-theme='dark'] .stat-value {
  color: #f4f7fb;
}
.stat-value { display: block; font-size: 1.75rem; font-weight: 700; color: #0f172a; line-height: 1.1; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
.stat-label { display: block; font-size: 0.8125rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.02em; }

/* Filter */
.filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.search-input { width: 320px; }
.search-input :deep(.el-input__wrapper) { 
  border-radius: 12px; 
  box-shadow: 0 2px 8px  var(--color-shadow); 
  padding: 4px 12px;
  background: var(--color-card-bg);
}
.search-input :deep(.el-input__wrapper.is-focus) { 
  box-shadow: 0 0 0 1px #4361ee, 0 4px 12px rgba(67,97,238,0.1); 
}
.filter-tags { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-chip {
  padding: 8px 18px;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.2s;
  box-shadow: 0 2px 4px  var(--color-shadow);
}
.filter-chip:hover { color: #4361ee; border-color: rgba(67, 97, 238, 0.4); background: #f8faff; }
.filter-chip.active { background: #4361ee; color: #fff; border-color: #4361ee; box-shadow: 0 4px 12px rgba(67, 97, 238, 0.25); }

/* Grid */
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3xl);
  min-height: 300px;
}

/* Card */
.space-card {
  background: var(--space-bg, #ffffff);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 12px 24px rgba(0, 0, 0, 0.06);
}
.space-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 1px 2px rgba(11, 183, 170, 0.06),
    0 8px 16px rgba(0, 0, 0, 0.06),
    0 20px 40px rgba(11, 183, 170, 0.08);
  border-color: rgba(67, 97, 238, 0.3);
  filter: brightness(0.99);
}

/* AI Glowing Top Line */
.space-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(11, 183, 170, 0.6), transparent);
  opacity: 0.4;
  transition: opacity 0.4s, box-shadow 0.4s;
}
.space-card:hover::before {
  opacity: 1;
  box-shadow: 0 0 12px rgba(11, 183, 170, 0.3);
}
.space-card.danger::before { background: linear-gradient(90deg, transparent, #ef4444, transparent); opacity: 0.8; }
.space-card.warning::before { background: linear-gradient(90deg, transparent, #f59e0b, transparent); opacity: 0.8; }
.space-card.good::before { background: linear-gradient(90deg, transparent, #10b981, transparent); opacity: 0.8; }

/* Card Head */
.card-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  min-height: 150px;
  overflow: hidden;
  cursor: pointer;
  background: #f8fafc;
}
.card-cover-img,
.card-cover-default {
  width: 100%;
  height: 100%;
  display: block;
}
.card-cover-default {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.42), transparent 25%),
    radial-gradient(circle at 84% 18%, rgba(255, 255, 255, 0.24), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(15, 23, 42, 0.15)),
    var(--cover-gradient);
  color: #ffffff;
}
.card-cover-default::before {
  content: '';
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 16px;
}
.card-cover-default::after {
  content: '';
  position: absolute;
  right: -34px;
  bottom: -38px;
  width: 116px;
  height: 116px;
  border-radius: 50%;
  border: 22px solid rgba(255, 255, 255, 0.16);
}
.card-cover-default span {
  position: relative;
  z-index: 1;
  font-size: 2.35rem;
  font-weight: 900;
  letter-spacing: 0;
}
.card-cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.24));
  pointer-events: none;
}
.card-cover-type {
  position: absolute;
  left: 16px;
  bottom: 14px;
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(10px);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  cursor: pointer;
}
.card-head-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}
.card-name-group { min-width: 0; }
.card-name { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.02em;}
.card-type-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 8px; font-weight: 600;}
.card-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.risk-badge {
  font-size: 0.7rem;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  background: #f1f5f9; color: #64748b;
  border: 1px solid var(--color-border);
}
.risk-badge.warning { background: #fef3c7; color: #b45309; border-color: #fde68a; }
.risk-badge.danger { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
.risk-badge.good { background: #d1fae5; color: #047857; border-color: #a7f3d0; }

/* Card Menu */
.card-menu-btn {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; padding: 6px; border-radius: 8px;
  transition: all 0.2s;
}
.card-menu-btn:hover { background: #f1f5f9; color: #0f172a; }

/* Card Body */
.card-body {
  padding: 0 24px 20px;
  cursor: pointer;
  flex: 1;
}
.card-goal, .card-desc { 
  font-size: 0.875rem; color: #475569; margin: 0 0 20px; line-height: 1.6; 
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; 
}
.card-goal {
  font-weight: 600;
  color: #1e40af;
  background: linear-gradient(to right, #eff6ff, #ffffff);
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 3px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}
.goal-icon {
  width: 1.1em;
  height: 1.1em;
  flex-shrink: 0;
}

/* Progress - Tech AI Style */
.card-progress { margin-bottom: 20px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; color: #64748b; margin-bottom: 8px; }
.progress-value { font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.progress-track { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.progress-fill { 
  height: 100%; border-radius: 99px; 
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); 
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
}
.progress-fill::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}
.space-card:hover .progress-fill::after {
  opacity: 1;
  animation: shimmer 1.5s ease-in-out 1;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Agent Insight - Deep Tech Feel */
.card-insight {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px;
  background: rgba(239, 246, 255, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(191, 219, 254, 0.4);
  margin-bottom: 20px;
  font-size: 0.8125rem; font-weight: 500; color: #1e3a8a; line-height: 1.5;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.04);
}
.card-insight svg { color: #3b82f6; flex-shrink: 0; margin-top: 2px; animation: pulseSpark 2.5s infinite ease-in-out; }
@keyframes pulseSpark {
  0% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5)); }
  50% { transform: scale(1.1); opacity: 0.7; filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8)); }
  100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5)); }
}

/* Meta Row */
.card-meta-row { display: flex; gap: 18px; margin-bottom: 10px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; color: #64748b; }
.meta-emoji { font-size: 14px; opacity: 0.8; }

/* Alert */
.card-alert {
  font-size: 0.75rem; padding: 10px 14px; border-radius: 10px;
  margin-top: 14px; font-weight: 600; display: inline-block; width: 100%; box-sizing: border-box;
}
.card-alert.warning { background: linear-gradient(to right, #fffbeb, #ffffff); color: #92400e; border: 1px solid #fde68a; }
.card-alert.danger { background: linear-gradient(to right, #fef2f2, #ffffff); color: #991b1b; border: 1px solid #fecaca; }

/* Card Actions */
.card-actions {
  display: flex;
  background: rgba(248, 250, 252, 0.5);
  padding: 14px 24px;
  gap: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}
.action-btn {
  flex: 1; padding: 12px 0;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff; color: #475569;
  font-size: 0.875rem; font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 2px 4px  var(--color-shadow);
}
.action-btn:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 4px 6px  var(--color-shadow); }
.action-btn.primary { 
  background: linear-gradient(135deg, #4361ee 0%, #3b5bdb 100%);
  border: none; color: #ffffff; 
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.2); 
}
.action-btn.primary:hover { 
  background: linear-gradient(135deg, #3b5bdb 0%, #304ecc 100%);
  transform: translateY(-2px); 
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.4), inset 0 1px 0 rgba(255,255,255,0.2); 
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  background: var(--color-card-bg-secondary);
  border: 2px dashed rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  margin-top: 10px;
}
.empty-state svg {
  color: #d1d5db;
  margin-bottom: 8px;
}
.empty-state h3 { margin: 16px 0 8px; color: #334155; font-size: 1.125rem; font-weight: 700; }
.empty-state p { color: #94a3b8; margin: 0 0 24px; font-size: 0.95rem; }
.empty-state .el-button {
  border-radius: 12px;
  padding: 12px 28px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2);
  background: linear-gradient(135deg, #4361ee 0%, #3b5bdb 100%);
  border: none;
}
.empty-state .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
}

/* Danger dropdown item */
:deep(.danger-item) { color: #ef4444 !important; }

/* Cover editor */
.cover-field {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
  width: 100%;
}
.cover-preview {
  position: relative;
  width: 240px;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}
.cover-preview img,
.cover-preview-default {
  width: 100%;
  height: 100%;
}
.cover-preview img {
  display: block;
  object-fit: cover;
}
.cover-preview-default {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.4), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(15, 23, 42, 0.12)),
    var(--cover-gradient);
  color: #ffffff;
}
.cover-preview-default::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 10px;
}
.cover-preview-default::after {
  content: '';
  position: absolute;
  right: -22px;
  bottom: -24px;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 13px solid rgba(255, 255, 255, 0.16);
}
.cover-preview-default span {
  position: relative;
  z-index: 1;
  font-size: 2rem;
  font-weight: 900;
}
.cover-controls {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}
.cover-uploader {
  width: 100%;
}
.cover-upload-btn,
.cover-clear-btn {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.cover-upload-btn {
  border: 0;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(11, 183, 170, 0.2);
}
.cover-upload-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(11, 183, 170, 0.26);
}
.cover-upload-btn:disabled {
  cursor: wait;
  opacity: 0.72;
}
.cover-clear-btn {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: #ffffff;
  color: #475569;
}
.cover-clear-btn:hover {
  border-color: rgba(11, 183, 170, 0.36);
  color: #0a9e94;
}
.cover-presets {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.cover-preset {
  min-width: 0;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  color: #ffffff;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.cover-preset:hover,
.cover-preset.active {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}
.cover-preset span {
  display: block;
  overflow: hidden;
  padding: 0 5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 800;
}
.cover-advanced {
  border-top: 0;
  border-bottom: 0;
}
.cover-advanced :deep(.el-collapse-item__header) {
  height: 34px;
  border-bottom: 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}
.cover-advanced :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
}
.cover-advanced :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

/* Responsive */
@media (max-width: 1200px) { .spaces-grid { grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); } }
@media (max-width: 768px) {
  .spaces-grid { grid-template-columns: 1fr; gap: var(--spacing-lg); }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .search-input { width: 100%; }
  .page-header { flex-direction: column; gap: 12px; }
  .cover-field { grid-template-columns: 1fr; }
  .cover-preview { width: 100%; }
  .cover-presets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
