<template>
  <AppLayout>
    <div class="prize-management-container">
    <!-- 顶部极简精美头部 -->
    <div class="page-header animate__animated animate__fadeIn">
      <div class="header-left">
        <h2>反馈奖品与卡密管理大厅</h2>
        <p>管理员在此批量导入卡密、处理库存、并审计所有中奖兑换码的发放流水。</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          size="large" 
          :icon="Plus" 
          @click="openCreateDialog"
          class="create-btn"
        >
          批量录入卡密库存
        </el-button>
      </div>
    </div>

    <!-- 顶部磨砂卡片指标看板 -->
    <el-row :gutter="20" class="stats-row animate__animated animate__fadeInUp">
      <el-col :span="8">
        <div class="stats-card card-available">
          <div class="card-icon-box">
            <el-icon><Ticket /></el-icon>
          </div>
          <div class="card-info">
            <span class="card-label">可用卡密库存</span>
            <h3 class="card-value">{{ stats.availableInventory }}</h3>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stats-card card-allocated">
          <div class="card-icon-box">
            <el-icon><Checked /></el-icon>
          </div>
          <div class="card-info">
            <span class="card-label">累计已发放卡密</span>
            <h3 class="card-value">{{ stats.allocatedCount }}</h3>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stats-card card-discarded">
          <div class="card-icon-box">
            <el-icon><Failed /></el-icon>
          </div>
          <div class="card-info">
            <span class="card-label">已作废卡密</span>
            <h3 class="card-value">{{ stats.discardedCount }}</h3>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 卡密总账列表区 -->
    <el-card class="glass-card list-card animate__animated animate__fadeIn" shadow="hover">
      <template #header>
        <div class="card-header-title">
          <el-icon class="header-icon"><List /></el-icon>
          <span>奖品兑换码总账台</span>
          
          <!-- 快捷过滤 -->
          <div class="header-filters">
            <el-select 
              v-model="queryParams.status" 
              placeholder="状态筛选" 
              clearable 
              @change="handleQuery"
              style="width: 130px; margin-right: 12px;"
              size="small"
            >
              <el-option label="未发放 (可用)" :value="0" />
              <el-option label="已发放" :value="1" />
              <el-option label="已废弃" :value="2" />
            </el-select>
            <el-input 
              v-model="queryParams.name" 
              placeholder="搜索奖品名称..." 
              clearable
              :prefix-icon="Search"
              @input="handleQuery"
              style="width: 200px;"
              size="small"
            />
          </div>
        </div>
      </template>

      <el-table 
        v-loading="loading" 
        :data="prizeList" 
        style="width: 100%"
        class="premium-table"
      >
        <el-table-column prop="name" label="奖品名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="prize-name-text">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="prizeCode" label="卡密兑换码" min-width="180">
          <template #default="{ row }">
            <code class="code-badge">{{ row.prizeCode }}</code>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="dark" style="border-radius: 6px;">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="userId" label="获得者" width="130">
          <template #default="{ row }">
            <span v-if="row.userId" class="user-id-text">
              <el-icon style="vertical-align: middle; margin-right: 4px;"><User /></el-icon>
              用户 ID: {{ row.userId }}
            </span>
            <span v-else class="empty-holder">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="feedbackTitle" label="关联反馈标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.feedbackId" class="feedback-link">
              <el-icon style="vertical-align: middle; margin-right: 4px;"><ChatLineRound /></el-icon>
              {{ row.feedbackTitle || ('反馈 ID: ' + row.feedbackId) }}
            </span>
            <span v-else class="empty-holder">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="allocateTime" label="发放时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.allocateTime) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="录入时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              v-if="row.status === 0"
              title="确定要作废该条未发放卡密吗？作废后不可撤销。"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDiscard(row.id)"
            >
              <template #reference>
                <el-button type="danger" link :icon="Delete">作废</el-button>
              </template>
            </el-popconfirm>
            <span v-else class="empty-holder">已锁定</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 批量导入卡密对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="批量导入卡密库存"
      width="520px"
      center
      align-center
      class="premium-dialog"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-position="top"
        style="padding: 10px 0;"
      >
        <el-form-item label="奖品卡密名称" prop="name">
          <el-input 
            v-model="form.name" 
            placeholder="例如：京东卡 10 元、系统 50 积分" 
            size="large"
          />
        </el-form-item>

        <el-form-item prop="rawCodes">
          <template #label>
            <span style="font-weight: 600; display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span>批量录入卡密码 <span style="color: #ef4444;">*</span></span>
              <span style="font-weight: normal; font-size: 12px; color: #94a3b8;">每行输入一个卡密</span>
            </span>
          </template>
          <el-input
            v-model="form.rawCodes"
            type="textarea"
            :rows="8"
            placeholder="卡密_001&#10;卡密_002&#10;卡密_003"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 10px;">
          <el-button @click="dialogVisible = false" size="large" style="border-radius: 10px; width: 120px;">取消</el-button>
          <el-button 
            type="primary" 
            size="large" 
            :loading="submitting" 
            @click="handleSubmit"
            style="border-radius: 10px; width: 140px; background-color: #3b82f6; border-color: #3b82f6;"
          >
            确认录入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { Plus, List, Search, Delete, Ticket, Checked, Failed, User, ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/api/request'

// 基础变量
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  name: '',
  status: undefined as number | undefined
})

const total = ref(0)
const prizeList = ref<any[]>([])

// 看板统计指标
const stats = reactive({
  availableInventory: 0,
  allocatedCount: 0,
  discardedCount: 0
})

// 批量生成表单
const form = reactive({
  name: '',
  rawCodes: ''
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入奖品名称', trigger: 'blur' }
  ],
  rawCodes: [
    { required: true, message: '卡密列表不能为空', trigger: 'blur' }
  ]
})

// 格式化时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '可用 (未发放)'
    case 1: return '已发放'
    case 2: return '已作废'
    default: return '未知'
  }
}

const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'success'
    case 1: return 'primary'
    case 2: return 'info'
    default: return undefined
  }
}

// 加载看板指标统计
const fetchStats = async () => {
  try {
    const res = await request.get('/admin/prize/stats')
    if (res) {
      stats.availableInventory = res.availableInventory || 0
      stats.allocatedCount = res.allocatedCount || 0
      stats.discardedCount = res.discardedCount || 0
    }
  } catch (error) {
    console.error(error)
  }
}

// 加载列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/prize/page', { params: queryParams })
    if (res) {
      prizeList.value = res.records || []
      total.value = res.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  queryParams.page = val
  fetchList()
}

// 开启批量导入弹窗
const openCreateDialog = () => {
  form.name = ''
  form.rawCodes = ''
  dialogVisible.value = true
}

// 确认批量录入卡密
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 一行一个提取卡密
      const codes = form.rawCodes
        .split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0)
      
      if (codes.length === 0) {
        ElMessage.warning('请输入有效的卡密兑换码')
        return
      }

      submitting.value = true
      try {
        await request.post('/admin/prize/create', {
          name: form.name,
          prizeCodes: codes
        })
        ElMessage.success(`成功导入 ${codes.length} 条卡密库存！`)
        dialogVisible.value = false
        fetchStats()
        fetchList()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 作废卡密
const handleDiscard = async (id: number) => {
  try {
    await request.post(`/admin/prize/${id}/discard`)
    ElMessage.success('卡密已成功废弃作废')
    fetchStats()
    fetchList()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<style scoped>
.prize-management-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 10px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.header-left p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.create-btn {
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  background-color: #3b82f6 !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transition: all 0.2s;
}

.create-btn:hover {
  background-color: #2563eb !important;
  transform: translateY(-1px);
}

/* 磨砂卡片指标看板 */
.stats-row {
  margin-bottom: 30px;
}

.stats-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01), 0 1px 3px rgba(0, 0, 0, 0.01);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px  var(--color-shadow);
}

.card-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* 各卡片微光定制 */
.card-available .card-icon-box {
  background-color: #eff6ff;
  color: #3b82f6;
}
.card-allocated .card-icon-box {
  background-color: #ecfdf5;
  color: #10b981;
}
.card-discarded .card-icon-box {
  background-color: #fef2f2;
  color: #ef4444;
}

/* 总账大卡片 */
.glass-card {
  border-radius: 24px;
  background: #ffffff;
  border: none !important;
  box-shadow: 0 10px 30px  var(--color-shadow);
  padding: 24px;
}

.card-header-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  width: 100%;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #3b82f6;
}

.header-filters {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* 表格定制 */
.premium-table :deep(.el-table__header-wrapper) th {
  background-color: #f8fafc !important;
  color: #475569 !important;
  font-weight: 600;
  font-size: 13px;
  padding: 12px 0;
}

.premium-table :deep(.el-table__row) td {
  padding: 14px 0;
}

.prize-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.code-badge {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}

.user-id-text {
  font-size: 13px;
  color: #64748b;
}

.feedback-link {
  font-size: 13px;
  color: #3b82f6;
  font-weight: 500;
}

.empty-holder {
  color: #94a3b8;
  font-size: 13px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 输入框圆角与边框对齐 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 10px !important;
  background-color: #ffffff;
  border: 1px solid #cbd5e1 !important;
  box-shadow: none !important;
  padding: 8px 12px;
}

:deep(.el-textarea__inner) {
  padding: 12px;
  font-family: inherit;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #94a3b8 !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
}
</style>
