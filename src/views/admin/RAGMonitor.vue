<template>
  <div class="rag-monitor-view">
    <div class="page-header">
      <h1 class="page-title">RAG 引擎监控中心</h1>
      <p class="page-desc">实时监控文件解析、文档切分、向量化处理队列，处理异常解析排队任务</p>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card glass" shadow="hover">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="任务状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option label="等待执行 (pending)" value="pending" />
            <el-option label="执行中 (running)" value="running" />
            <el-option label="成功 (success)" value="success" />
            <el-option label="失败 (failed)" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchJobList(1)">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" :icon="Refresh" @click="fetchJobList(queryParams.page)">刷新数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 主表格卡片 -->
    <el-card class="table-card glass" shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>文件解析异步任务队列 (Knowledge File Jobs)</span>
          <el-tag type="info">每 5 秒自动更新进行中任务</el-tag>
        </div>
      </template>

      <el-table v-loading="loading" :data="jobList" style="width: 100%" class="admin-table">
        <el-table-column prop="id" label="任务 ID" width="90" />
        <el-table-column prop="fileName" label="源文件名" show-overflow-tooltip />
        <el-table-column prop="knowledgeBaseName" label="所属知识库" width="160" show-overflow-tooltip />
        <el-table-column prop="jobType" label="任务类型" width="130">
          <template #default="scope">
            <code class="job-code">{{ scope.row.jobType }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)" effect="dark" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="解析进度" width="180">
          <template #default="scope">
            <div class="progress-wrap">
              <el-progress
                :percentage="scope.row.progress || 0"
                :status="getProgressStatus(scope.row.status)"
                :striped="scope.row.status === 'running'"
                :striped-flow="scope.row.status === 'running'"
                :stroke-width="12"
              />
              <span class="step-text" v-if="scope.row.currentStep">
                {{ scope.row.currentStep }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试" width="80" align="center">
          <template #default="scope">
            <span>{{ scope.row.retryCount }} / 3</span>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="提交用户" width="120" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="showErrorDetail(scope.row)" v-if="scope.row.status === 'failed'">
              查看报错
            </el-button>
            <el-button type="warning" link @click="handleRetryJob(scope.row)" v-if="scope.row.status === 'failed'">
              重试任务
            </el-button>
            <span v-else-if="scope.row.status === 'success'" style="color: #34d399; font-size: 13px;">已就绪</span>
            <span v-else-if="scope.row.status === 'running'" style="color: #fbbf24; font-size: 13px;">解析中...</span>
            <span v-else style="color: rgba(255,255,255,0.4); font-size: 13px;">排队中</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="fetchJobList"
          small
        />
      </div>
    </el-card>

    <!-- Drawer: 异常错误堆栈 -->
    <el-drawer v-model="drawerVisible" title="RAG 向量化解析异常分析" size="45%" destroy-on-close class="error-drawer">
      <div v-if="selectedJob" class="error-drawer-content">
        <div class="drawer-header-meta">
          <h3>
            <el-icon style="vertical-align: middle; color: #ef4444; margin-right: 6px;"><Warning /></el-icon>
            {{ selectedJob.fileName }}
          </h3>
          <p>所属知识库：<strong>{{ selectedJob.knowledgeBaseName }}</strong></p>
        </div>

        <el-descriptions :column="1" border style="margin-top: 16px;">
          <el-descriptions-item label="任务 ID">{{ selectedJob.id }}</el-descriptions-item>
          <el-descriptions-item label="文件 ID">{{ selectedJob.fileId }}</el-descriptions-item>
          <el-descriptions-item label="失败时间">{{ formatTime(selectedJob.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="运行步骤">{{ selectedJob.currentStep || '未知' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 24px; margin-bottom: 8px; color: #f87171;">Java 异常报错堆栈详情 (Error Message)</h4>
        <div class="error-stack-box">
          <pre><code>{{ selectedJob.errorMessage || '没有收集到具体的异常日志。' }}</code></pre>
        </div>

        <div class="drawer-actions" style="margin-top: 24px; display: flex; gap: 12px;">
          <el-button type="warning" @click="handleRetryJob(selectedJob)">重新触发任务解析</el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Refresh, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const loading = ref(false)
const jobList = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  size: 10,
  status: ''
})

// 自动刷新定时器
let timer: number | null = null

// 抽屉详情
const drawerVisible = ref(false)
const selectedJob = ref<any>(null)

const fetchJobList = async (pageIndex?: number) => {
  if (pageIndex) queryParams.page = pageIndex
  loading.value = true
  try {
    const res = await request.get('/admin/rag/jobs', { params: queryParams })
    if (res.data && res.data.code === 200) {
      jobList.value = res.data.data.records
      total.value = res.data.data.total
    } else if (res.data && res.data.records) {
      jobList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('无法加载 RAG 解析任务队列')
  } finally {
    loading.value = false
  }
}

// 静默轮询
const pollJobList = async () => {
  const hasActiveJob = jobList.value.some(j => j.status === 'pending' || j.status === 'running')
  if (!hasActiveJob) return
  
  try {
    const res = await request.get('/admin/rag/jobs', { params: queryParams })
    if (res.data && res.data.code === 200) {
      jobList.value = res.data.data.records
      total.value = res.data.data.total
    } else if (res.data && res.data.records) {
      jobList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.warn('轮询 RAG 队列数据失败')
  }
}

const handleRetryJob = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定重新触发解析文件 "${row.fileName}" 吗？`, '触发重新向量化', {
      confirmButtonText: '确定重试',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.post(`/admin/rag/jobs/retry/${row.id}`)
    if (res.data && res.data.code === 200) {
      ElMessage.success('成功触发！任务已重新放入队列。')
      drawerVisible.value = false
      fetchJobList(queryParams.page)
    } else {
      ElMessage.error(res.data.message || '重新触发任务失败')
    }
  } catch (e) {
    // 取消
  }
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  fetchJobList(1)
}

const resetQuery = () => {
  queryParams.status = ''
  fetchJobList(1)
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'success': return 'success'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '等待中 (pending)'
    case 'running': return '解析中 (running)'
    case 'success': return '成功 (success)'
    case 'failed': return '失败 (failed)'
    default: return status
  }
}

const getProgressStatus = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'failed': return 'exception'
    case 'running': return 'warning'
    default: return ''
  }
}

const formatTime = (timeStr: any) => {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return d.toLocaleString()
}

const showErrorDetail = (row: any) => {
  selectedJob.value = row
  drawerVisible.value = true
}

onMounted(() => {
  fetchJobList(1)
  timer = window.setInterval(pollJobList, 5000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.rag-monitor-view {
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--admin-text-primary) 0%, var(--admin-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  color: var(--admin-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

/* 磨砂玻璃卡片 */
.glass {
  background: var(--admin-card-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--admin-card-border) !important;
  border-radius: 14px !important;
  box-shadow: var(--admin-shadow) !important;
}

.filter-form :deep(.el-form-item__label) {
  color: var(--admin-text-secondary);
}

.filter-form :deep(.el-input__inner), 
.filter-form :deep(.el-select__wrapper) {
  background-color: var(--admin-input-bg) !important;
  border-color: var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--admin-text-primary);
}

/* 表格美化 */
.admin-table {
  background-color: transparent !important;
}

.admin-table :deep(tr) {
  background-color: transparent !important;
  color: var(--admin-text-primary);
}

.admin-table :deep(th.el-table__cell) {
  background-color: var(--admin-table-header-bg) !important;
  color: var(--admin-text-secondary) !important;
  border-bottom: 1px solid var(--admin-card-border) !important;
}

.admin-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--admin-card-border) !important;
}

.admin-table :deep(.el-table__body tr:hover td) {
  background-color: var(--admin-table-hover-bg) !important;
}

.job-code {
  background: rgba(6, 182, 212, 0.12);
  color: #22d3ee;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-text {
  font-size: 11px;
  color: var(--admin-text-secondary);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 抽屉样式 */
.error-stack-box {
  background: var(--admin-pre-bg) !important;
  border: 1px solid var(--admin-card-border) !important;
  border-radius: 10px;
  padding: 16px;
  overflow: auto;
  max-height: 450px;
}

.error-stack-box code {
  color: #f87171;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.drawer-header-meta h3 {
  font-size: 18px;
  color: var(--admin-text-primary);
  margin-bottom: 6px;
}

.drawer-header-meta p {
  color: var(--admin-text-secondary);
  font-size: 13px;
}
</style>
