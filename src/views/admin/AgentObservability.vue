<template>
  <div class="agent-observability-view">
    <div class="page-header">
      <h1 class="page-title">智能体观测中心</h1>
      <p class="page-desc">全方位审计多智能体系统的工具调用与后台异步资源生成任务日志</p>
    </div>

    <!-- 选项卡切换：工具调用审计 / 资源生成日志 -->
    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- 选项卡1：工具调用审计 -->
      <el-tab-pane label="工具调用审计 (Agent Tool Audit)" name="tool">
        <!-- 筛选卡片 -->
        <el-card class="filter-card glass" shadow="hover">
          <el-form :inline="true" :model="toolQuery" class="filter-form">
            <el-form-item label="工具名称">
              <el-input v-model="toolQuery.toolName" placeholder="如：web_search" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="执行状态">
              <el-select v-model="toolQuery.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="成功 (SUCCESS)" value="SUCCESS" />
                <el-option label="失败 (FAILED)" value="FAILED" />
                <el-option label="超时 (TIMEOUT)" value="TIMEOUT" />
                <el-option label="拒绝 (REJECTED)" value="REJECTED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchTools(1)">查询</el-button>
              <el-button @click="resetToolQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据表格 -->
        <el-card class="table-card glass" shadow="hover" style="margin-top: 16px;">
          <el-table v-loading="toolLoading" :data="toolList" style="width: 100%" class="admin-table">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="userName" label="调用用户" width="120" show-overflow-tooltip />
            <el-table-column prop="toolName" label="工具名称" width="180">
              <template #default="scope">
                <code class="tool-code-tag">{{ scope.row.toolName }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getToolStatusTag(scope.row.status)" effect="dark" size="small">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="durationMs" label="耗时" width="100">
              <template #default="scope">
                <span :class="{ 'slow-span': scope.row.durationMs > 2000 }">
                  {{ scope.row.durationMs ? scope.row.durationMs + 'ms' : '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="调用时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="入参 (Arguments)" show-overflow-tooltip>
              <template #default="scope">
                <span class="json-preview" @click="viewDetail(scope.row, 'arguments')">
                  {{ scope.row.arguments || '无' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="执行结果" show-overflow-tooltip>
              <template #default="scope">
                <span class="json-preview" @click="viewDetail(scope.row, 'result')">
                  {{ scope.row.result || '无' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="showToolAuditDrawer(scope.row)">
                  审计追踪
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="toolQuery.page"
              v-model:page-size="toolQuery.size"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="toolTotal"
              @size-change="handleToolSizeChange"
              @current-change="fetchTools"
              small
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 选项卡2：资源生成进度 -->
      <el-tab-pane label="资源生成进度日志 (Resource Log)" name="resource">
        <!-- 筛选卡片 -->
        <el-card class="filter-card glass" shadow="hover">
          <el-form :inline="true" :model="resQuery" class="filter-form">
            <el-form-item label="资源类型">
              <el-select v-model="resQuery.resourceType" placeholder="全部类型" clearable style="width: 160px">
                <el-option label="课件 (PPT)" value="PPT" />
                <el-option label="文档 (DOC)" value="DOC" />
                <el-option label="测验题 (QUIZ)" value="QUIZ" />
                <el-option label="试卷 (EXAM)" value="EXAM" />
                <el-option label="思维导图 (MINDMAP)" value="MINDMAP" />
              </el-select>
            </el-form-item>
            <el-form-item label="生成状态">
              <el-select v-model="resQuery.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="排队中 (PENDING)" value="PENDING" />
                <el-option label="生成中 (GENERATING)" value="GENERATING" />
                <el-option label="已完成 (COMPLETED)" value="COMPLETED" />
                <el-option label="生成失败 (FAILED)" value="FAILED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchResources(1)">查询</el-button>
              <el-button @click="resetResQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据表格 -->
        <el-card class="table-card glass" shadow="hover" style="margin-top: 16px;">
          <el-table v-loading="resLoading" :data="resList" style="width: 100%" class="admin-table">
            <el-table-column prop="id" label="ID" width="180" />
            <el-table-column prop="spaceId" label="空间ID" width="180" />
            <el-table-column prop="userName" label="创建者" width="120" show-overflow-tooltip />
            <el-table-column prop="resourceType" label="资源类型" width="120">
              <template #default="scope">
                <el-tag :type="getResourceTypeTag(scope.row.resourceType)" effect="plain" size="small">
                  {{ scope.row.resourceType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="资源标题" show-overflow-tooltip />
            <el-table-column prop="status" label="生成状态" width="140">
              <template #default="scope">
                <el-tag :type="getResStatusTag(scope.row.status)" effect="dark" size="small">
                  {{ getResStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="retryCount" label="重试次数" width="100" align="center" />
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="错误信息" show-overflow-tooltip>
              <template #default="scope">
                <span class="error-msg-preview" v-if="scope.row.errorMessage" @click="showErrorMsg(scope.row.errorMessage)">
                  {{ scope.row.errorMessage }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="resQuery.page"
              v-model:page-size="resQuery.size"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="resTotal"
              @size-change="handleResSizeChange"
              @current-change="fetchResources"
              small
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 弹窗/抽屉: 详细的 JSON 查看 -->
    <el-dialog v-model="jsonVisible" :title="jsonTitle" width="60%" destroy-on-close class="json-dialog">
      <div class="json-pre-wrap">
        <pre><code>{{ formattedJson }}</code></pre>
      </div>
    </el-dialog>

    <!-- 抽屉: 工具审计追踪详细卡片 -->
    <el-drawer v-model="drawerVisible" title="智能体工具调用详细链条审计" size="45%" destroy-on-close class="audit-drawer">
      <div v-if="selectedAuditRow" class="drawer-audit-content">
        <div class="drawer-header-info">
          <h3>
            <code class="tool-code-tag">{{ selectedAuditRow.toolName }}</code>
          </h3>
          <el-tag :type="getToolStatusTag(selectedAuditRow.status)" effect="dark">{{ selectedAuditRow.status }}</el-tag>
        </div>

        <el-descriptions :column="1" border class="audit-desc" style="margin-top: 16px;">
          <el-descriptions-item label="审计 ID">{{ selectedAuditRow.id }}</el-descriptions-item>
          <el-descriptions-item label="追踪链路 ID (Trace ID)">
            <code class="uuid-code">{{ selectedAuditRow.traceId }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="会话 ID (Conversation ID)">
            <code class="uuid-code">{{ selectedAuditRow.conversationId }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="调用者昵称">{{ selectedAuditRow.userName }}</el-descriptions-item>
          <el-descriptions-item label="耗费时长">{{ selectedAuditRow.durationMs ? selectedAuditRow.durationMs + ' ms' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审计发生时间">{{ formatTime(selectedAuditRow.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 24px; margin-bottom: 8px;">工具输入参数 (Arguments)</h4>
        <div class="code-box">
          <pre><code>{{ formatJsonString(selectedAuditRow.arguments) }}</code></pre>
        </div>

        <h4 style="margin-top: 20px; margin-bottom: 8px;">工具返回响应 (Result)</h4>
        <div class="code-box">
          <pre><code>{{ formatJsonString(selectedAuditRow.result) }}</code></pre>
        </div>

        <div v-if="selectedAuditRow.errorMessage" style="margin-top: 20px;">
          <h4 style="color: #f87171; margin-bottom: 8px;">异常堆栈 / 失败原因</h4>
          <div class="code-box error-box">
            <pre><code>{{ selectedAuditRow.errorMessage }}</code></pre>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const activeTab = ref('tool')

// 1. 工具审计相关
const toolLoading = ref(false)
const toolList = ref<any[]>([])
const toolTotal = ref(0)
const toolQuery = reactive({
  page: 1,
  size: 10,
  toolName: '',
  status: ''
})

// 2. 资源生成相关
const resLoading = ref(false)
const resList = ref<any[]>([])
const resTotal = ref(0)
const resQuery = reactive({
  page: 1,
  size: 10,
  resourceType: '',
  status: ''
})

// JSON 展示弹窗
const jsonVisible = ref(false)
const jsonTitle = ref('')
const formattedJson = ref('')

// 审计抽屉
const drawerVisible = ref(false)
const selectedAuditRow = ref<any>(null)

const fetchTools = async (pageIndex?: number) => {
  if (pageIndex) toolQuery.page = pageIndex
  toolLoading.value = true
  try {
    const res = await request.get('/admin/agent/tool/list', { params: toolQuery })
    if (res.data && res.data.code === 200) {
      toolList.value = res.data.data.records
      toolTotal.value = res.data.data.total
    } else if (res.data && res.data.records) {
      toolList.value = res.data.records
      toolTotal.value = res.data.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('无法加载工具调用审计日志')
  } finally {
    toolLoading.value = false
  }
}

const fetchResources = async (pageIndex?: number) => {
  if (pageIndex) resQuery.page = pageIndex
  resLoading.value = true
  try {
    const res = await request.get('/admin/agent/resource/list', { params: resQuery })
    if (res.data && res.data.code === 200) {
      resList.value = res.data.data.records
      resTotal.value = res.data.data.total
    } else if (res.data && res.data.records) {
      resList.value = res.data.records
      resTotal.value = res.data.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('无法加载资源生成日志')
  } finally {
    resLoading.value = false
  }
}

const handleToolSizeChange = (val: number) => {
  toolQuery.size = val
  fetchTools(1)
}

const handleResSizeChange = (val: number) => {
  resQuery.size = val
  fetchResources(1)
}

const resetToolQuery = () => {
  toolQuery.toolName = ''
  toolQuery.status = ''
  fetchTools(1)
}

const resetResQuery = () => {
  resQuery.resourceType = ''
  resQuery.status = ''
  fetchResources(1)
}

// 标签色彩映射
const getToolStatusTag = (status: string) => {
  switch (status) {
    case 'SUCCESS': return 'success'
    case 'FAILED': return 'danger'
    case 'TIMEOUT': return 'warning'
    case 'REJECTED': return 'info'
    default: return 'info'
  }
}

const getResourceTypeTag = (type: string) => {
  switch (type) {
    case 'PPT': return 'warning'
    case 'DOC': return 'primary'
    case 'QUIZ': return 'success'
    case 'EXAM': return 'danger'
    default: return 'info'
  }
}

const getResStatusTag = (status: string) => {
  switch (status) {
    case 'PENDING': return 'info'
    case 'GENERATING': return 'warning'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return 'info'
  }
}

const getResStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return '排队等待中'
    case 'GENERATING': return 'AI 生产中'
    case 'COMPLETED': return '生成成功'
    case 'FAILED': return '生成失败'
    default: return status
  }
}

const formatTime = (timeStr: any) => {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return d.toLocaleString()
}

// 辅助格式化 JSON
const formatJsonString = (str: string) => {
  if (!str) return '无'
  try {
    const obj = JSON.parse(str)
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return str
  }
}

// 弹窗展示 JSON
const viewDetail = (row: any, field: string) => {
  jsonTitle.value = field === 'arguments' ? '工具调用参数详细预览' : '工具返回响应结果预览'
  formattedJson.value = formatJsonString(row[field])
  jsonVisible.value = true
}

const showToolAuditDrawer = (row: any) => {
  selectedAuditRow.value = row
  drawerVisible.value = true
}

const showErrorMsg = (msg: string) => {
  ElMessageBox.alert(msg, '错误异常堆栈详情', {
    confirmButtonText: '关闭',
    customClass: 'error-alert-box'
  })
}

onMounted(() => {
  fetchTools(1)
  fetchResources(1)
})
</script>

<style scoped>
.agent-observability-view {
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

/* Tab 切换美化 */
.custom-tabs :deep(.el-tabs__item) {
  color: var(--admin-text-secondary);
  font-size: 15px;
  font-weight: 600;
  height: 48px;
  line-height: 48px;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: var(--admin-accent);
}

.custom-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--admin-accent);
  height: 3px;
  border-radius: 2px;
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

.tool-code-tag {
  background: rgba(99, 102, 241, 0.12);
  color: var(--admin-accent);
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.slow-span {
  color: #f87171;
  font-weight: bold;
}

.json-preview {
  color: #38bdf8;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
}

.json-preview:hover {
  text-decoration: underline;
  color: #0ea5e9;
}

.error-msg-preview {
  color: #f87171;
  cursor: pointer;
}

.error-msg-preview:hover {
  text-decoration: underline;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 弹窗和代码块样式 */
.json-pre-wrap, .code-box {
  background: var(--admin-pre-bg) !important;
  border: 1px solid var(--admin-card-border) !important;
  border-radius: 10px;
  padding: 16px;
  overflow: auto;
  max-height: 400px;
}

pre {
  margin: 0;
}

code {
  color: #38bdf8;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.uuid-code {
  font-family: monospace;
  color: var(--admin-text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
}

.error-box {
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.error-box code {
  color: #f87171;
}

/* Descriptions 暗色与明亮美化 */
.audit-desc :deep(.el-descriptions__label) {
  background: var(--admin-table-header-bg) !important;
  color: var(--admin-text-secondary) !important;
}

.audit-desc :deep(.el-descriptions__content) {
  background: var(--admin-card-bg) !important;
  color: var(--admin-text-primary) !important;
}
</style>
