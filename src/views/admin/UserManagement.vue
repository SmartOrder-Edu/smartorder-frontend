<template>
  <div class="user-management-view">
    <!-- 顶部标题与刷新操作 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">用户管理</h2>
        <p class="page-subtitle">查看用户总量、检索账号、维护基础资料，并进行管理员授权与账号启停</p>
      </div>
      <el-button type="primary" :icon="Refresh" :loading="loading" @click="refreshAll">刷新用户数据</el-button>
    </div>

    <!-- 用户规模与状态统计 -->
    <div class="stats-grid" v-loading="statsLoading">
      <div class="metric-item total">
        <span class="metric-label">用户总数</span>
        <strong class="metric-value">{{ stats.totalUsers }}</strong>
      </div>
      <div class="metric-item normal">
        <span class="metric-label">正常账号</span>
        <strong class="metric-value">{{ stats.normalUsers }}</strong>
      </div>
      <div class="metric-item disabled">
        <span class="metric-label">禁用账号</span>
        <strong class="metric-value">{{ stats.disabledUsers }}</strong>
      </div>
      <div class="metric-item admin">
        <span class="metric-label">管理员</span>
        <strong class="metric-value">{{ stats.adminUsers }}</strong>
      </div>
      <div class="metric-item student">
        <span class="metric-label">学生用户</span>
        <strong class="metric-value">{{ stats.studentUsers }}</strong>
      </div>
    </div>

    <!-- 用户检索条件 -->
    <el-card class="glass-card filter-card" shadow="hover">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="用户名 / 邮箱 / 手机号"
            clearable
            :prefix-icon="Search"
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="queryParams.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="学生" :value="0" />
            <el-option label="管理员" :value="1" />
            <el-option label="教师" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表总账 -->
    <el-card class="glass-card list-card" shadow="hover">
      <template #header>
        <div class="card-header-title">
          <span>用户总账</span>
          <el-tag size="small" type="info" effect="plain">共 {{ total }} 人</el-tag>
        </div>
      </template>

      <el-table v-loading="loading" :data="userList" class="admin-table" style="width: 100%">
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :src="row.avatarUrl" :size="38">
                {{ (row.username || 'U').slice(0, 1) }}
              </el-avatar>
              <div class="user-meta">
                <span class="user-name">{{ row.username || '未命名用户' }}</span>
                <span class="user-id">ID: {{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" min-width="220">
          <template #default="{ row }">
            <div class="contact-cell">
              <span>{{ row.email || '未绑定邮箱' }}</span>
              <small>{{ row.phone || '未绑定手机号' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" effect="plain">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="账号状态" width="120">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status === 1 ? 'is-normal' : 'is-disabled'">
              <span class="status-dot"></span>
              {{ row.status === 1 ? '正常' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="vipLevel" label="VIP" width="90">
          <template #default="{ row }">Lv.{{ row.vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                :type="row.role === 1 ? 'warning' : 'success'"
                :icon="Medal"
                @click="toggleAdmin(row)"
              >
                {{ row.role === 1 ? '取消管理员' : '设为管理员' }}
              </el-button>
              <el-button
                link
                :type="row.status === 1 ? 'danger' : 'success'"
                :icon="row.status === 1 ? CircleClose : CircleCheck"
                @click="toggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控制 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          small
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 管理员编辑用户资料弹窗 -->
    <el-dialog v-model="dialogVisible" title="编辑用户信息" width="560px" class="admin-user-dialog">
      <el-form ref="formRef" :model="editForm" :rules="rules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="editForm.username" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="头像 URL">
              <el-input v-model="editForm.avatarUrl" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="角色">
              <el-select v-model="editForm.role" style="width: 100%">
                <el-option label="学生" :value="0" />
                <el-option label="管理员" :value="1" />
                <el-option label="教师" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="账号状态">
              <el-select v-model="editForm.status" style="width: 100%">
                <el-option label="正常" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="VIP 等级">
              <el-input-number v-model="editForm.vipLevel" :min="0" :max="99" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="editForm.gender" clearable style="width: 100%">
                <el-option label="未设置" :value="0" />
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日">
              <el-date-picker v-model="editForm.birthday" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="个人简介" prop="bio">
              <el-input v-model="editForm.bio" type="textarea" :rows="3" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  CircleCheck,
  CircleClose,
  Edit,
  Medal,
  Refresh,
  RefreshLeft,
  Search
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { adminUserApi, type AdminUserItem, type AdminUserUpdate } from '@/api/adminUser'

const loading = ref(false)
const statsLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const total = ref(0)
const userList = ref<AdminUserItem[]>([])

// 用户分页检索条件
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  role: undefined as number | undefined,
  status: undefined as number | undefined
})

// 用户管理统计看板数据
const stats = reactive({
  totalUsers: 0,
  normalUsers: 0,
  disabledUsers: 0,
  adminUsers: 0,
  studentUsers: 0
})

// 当前编辑中的表单数据
const editForm = reactive<AdminUserUpdate & { id?: string }>({
  id: undefined,
  username: '',
  email: '',
  phone: '',
  avatarUrl: '',
  gender: 0,
  birthday: '',
  bio: '',
  role: 0,
  vipLevel: 0,
  status: 1
})

const rules = reactive<FormRules>({
  username: [{ max: 20, message: '用户名不能超过20字', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  bio: [{ max: 500, message: '个人简介不能超过500字', trigger: 'blur' }]
})

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await adminUserApi.stats()
    stats.totalUsers = res.totalUsers || 0
    stats.normalUsers = res.normalUsers || 0
    stats.disabledUsers = res.disabledUsers || 0
    stats.adminUsers = res.adminUsers || 0
    stats.studentUsers = res.studentUsers || 0
  } finally {
    statsLoading.value = false
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await adminUserApi.page({
      page: queryParams.page,
      size: queryParams.size,
      keyword: queryParams.keyword || undefined,
      role: queryParams.role,
      status: queryParams.status
    })
    userList.value = (res.records || []).map(item => ({ ...item, id: String(item.id) }))
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchStats(), fetchList()])
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.role = undefined
  queryParams.status = undefined
  handleQuery()
}

const handleSizeChange = (size: number) => {
  queryParams.size = size
  fetchList()
}

const handleCurrentChange = (page: number) => {
  queryParams.page = page
  fetchList()
}

// 打开编辑弹窗并复制当前行，避免未保存输入污染表格数据。
const openEditDialog = (row: AdminUserItem) => {
  Object.assign(editForm, {
    id: row.id,
    username: row.username || '',
    email: row.email || '',
    phone: row.phone || '',
    avatarUrl: row.avatarUrl || '',
    gender: row.gender ?? 0,
    birthday: row.birthday || '',
    bio: row.bio || '',
    role: row.role ?? 0,
    vipLevel: row.vipLevel ?? 0,
    status: row.status ?? 1
  })
  dialogVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.id || !formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await adminUserApi.update(editForm.id, {
      username: editForm.username,
      email: editForm.email,
      phone: editForm.phone,
      avatarUrl: editForm.avatarUrl,
      gender: editForm.gender,
      birthday: editForm.birthday,
      bio: editForm.bio,
      role: editForm.role,
      vipLevel: editForm.vipLevel,
      status: editForm.status
    })
    ElMessage.success('用户信息已更新')
    dialogVisible.value = false
    await refreshAll()
  } finally {
    submitting.value = false
  }
}

// 快捷切换管理员角色，学生/教师统一切到管理员，管理员则降为学生。
const toggleAdmin = async (row: AdminUserItem) => {
  const nextRole = row.role === 1 ? 0 : 1
  const actionText = nextRole === 1 ? '设为管理员' : '取消管理员'
  await ElMessageBox.confirm(`确定要将 ${row.username || row.id} ${actionText}吗？`, '角色确认', {
    type: nextRole === 1 ? 'success' : 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  await adminUserApi.updateRole(row.id, nextRole)
  ElMessage.success('用户角色已更新')
  await refreshAll()
}

// 快捷启用/禁用账号，禁用后用户将不能正常使用登录态业务。
const toggleStatus = async (row: AdminUserItem) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定要${actionText}账号 ${row.username || row.id} 吗？`, '账号状态确认', {
    type: nextStatus === 1 ? 'success' : 'warning',
    confirmButtonText: actionText,
    cancelButtonText: '取消'
  })
  await adminUserApi.updateStatus(row.id, nextStatus)
  ElMessage.success(`账号已${actionText}`)
  await refreshAll()
}

const getRoleText = (role?: number) => {
  if (role === 1) return '管理员'
  if (role === 2) return '教师'
  return '学生'
}

const getRoleTagType = (role?: number) => {
  if (role === 1) return 'danger'
  if (role === 2) return 'warning'
  return 'success'
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.user-management-view {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px;
  color: var(--admin-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  color: var(--admin-text-secondary);
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.metric-item {
  min-height: 92px;
  padding: 18px;
  border: 1px solid var(--admin-card-border);
  border-radius: 12px;
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.metric-label {
  color: var(--admin-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.metric-value {
  color: var(--admin-text-primary);
  font-size: 28px;
  line-height: 1;
}

.metric-item.total { border-color: rgba(99, 102, 241, 0.25); }
.metric-item.normal { border-color: rgba(16, 185, 129, 0.25); }
.metric-item.disabled { border-color: rgba(239, 68, 68, 0.25); }
.metric-item.admin { border-color: rgba(245, 158, 11, 0.25); }
.metric-item.student { border-color: rgba(59, 130, 246, 0.25); }

.glass-card {
  background: var(--admin-card-bg) !important;
  border: 1px solid var(--admin-card-border) !important;
  border-radius: 12px !important;
  box-shadow: var(--admin-shadow) !important;
  margin-bottom: 18px;
}

.glass-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--admin-card-border) !important;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-form :deep(.el-form-item__label) {
  color: var(--admin-text-secondary);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--admin-text-primary);
  font-weight: 700;
}

.admin-table {
  background-color: transparent !important;
  --el-table-border-color: var(--admin-card-border);
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
}

.admin-table :deep(tr) {
  background-color: transparent !important;
  color: var(--admin-text-primary);
}

.admin-table :deep(th.el-table__cell) {
  background-color: var(--admin-table-header-bg) !important;
  color: var(--admin-text-secondary) !important;
  border-bottom: 1px solid var(--admin-card-border) !important;
  font-weight: 600;
}

.admin-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--admin-card-border) !important;
}

.admin-table :deep(.el-table__body tr:hover td) {
  background-color: var(--admin-table-hover-bg) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta,
.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-name {
  color: var(--admin-text-primary);
  font-weight: 700;
}

.user-id,
.contact-cell small {
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.contact-cell span {
  color: var(--admin-text-primary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.status-pill.is-normal { color: #10b981; }
.status-pill.is-normal .status-dot { background: #10b981; }
.status-pill.is-disabled { color: #ef4444; }
.status-pill.is-disabled .status-dot { background: #ef4444; }

.action-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background-color: var(--admin-input-bg) !important;
  border: 1px solid var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
  box-shadow: none !important;
  border-radius: 8px !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--admin-text-primary) !important;
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
