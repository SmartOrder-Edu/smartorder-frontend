<template>
  <div class="prize-management-view animate__animated animate__fadeIn">
    <!-- 顶部极简精美头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="gradient-title">反馈奖品与卡密管理大厅</h2>
        <p class="subtitle">管理员在此进行卡密大宗录入、库存审计、兑换发放流水监管及风控作废操作</p>
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

    <!-- 顶部磨砂 Bento 看板大盘 (指标卡 + 库存 ECharts 环形占比) -->
    <el-row :gutter="20" class="stats-row">
      <!-- 左侧指标栏 -->
      <el-col :span="14">
        <div class="bento-grid">
          <div class="stats-card card-available glass-item">
            <div class="card-icon-box">
              <el-icon><Ticket /></el-icon>
            </div>
            <div class="card-info">
              <span class="card-label">可用卡密库存</span>
              <h3 class="card-value">{{ stats.availableInventory }}</h3>
            </div>
            <div class="glow-effect"></div>
          </div>
          <div class="stats-card card-allocated glass-item">
            <div class="card-icon-box">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="card-info">
              <span class="card-label">累计已发放</span>
              <h3 class="card-value">{{ stats.allocatedCount }}</h3>
            </div>
            <div class="glow-effect"></div>
          </div>
          <div class="stats-card card-discarded glass-item">
            <div class="card-icon-box">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="card-info">
              <span class="card-label">已风控作废</span>
              <h3 class="card-value">{{ stats.discardedCount }}</h3>
            </div>
            <div class="glow-effect"></div>
          </div>
        </div>
      </el-col>
      <!-- 右侧图表栏 -->
      <el-col :span="10">
        <div class="chart-card glass-item">
          <div class="chart-header">
            <span class="chart-title">各品类可用库存占比</span>
            <el-tooltip content="实时可用库存(未发放状态)卡密在总库存中的占比" placement="top">
              <el-icon class="info-icon"><Warning /></el-icon>
            </el-tooltip>
          </div>
          <div ref="pieChartRef" class="inventory-pie-chart"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 卡密总账列表区 -->
    <el-card class="glass-card list-card" shadow="hover">
      <template #header>
        <div class="card-header-title">
          <el-icon class="header-icon"><List /></el-icon>
          <span>卡密发放与流水总账台</span>
          
          <!-- 快捷过滤 -->
          <div class="header-filters">
            <el-select 
              v-model="queryParams.status" 
              placeholder="状态筛选" 
              clearable 
              @change="handleQuery"
              style="width: 140px; margin-right: 12px;"
              size="small"
            >
              <el-option label="可用 (未发放)" :value="0" />
              <el-option label="已发放" :value="1" />
              <el-option label="已作废" :value="2" />
            </el-select>
            <el-input 
              v-model="queryParams.name" 
              placeholder="搜索奖品名称..." 
              clearable
              :prefix-icon="Search"
              @input="handleQuery"
              style="width: 180px;"
              size="small"
            />
          </div>
        </div>
      </template>

      <el-table 
        v-loading="loading" 
        :data="prizeList" 
        style="width: 100%"
        class="admin-table premium-table"
      >
        <el-table-column prop="name" label="奖品名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="prize-name-text">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="prizeCode" label="卡密兑换码" min-width="200">
          <template #default="{ row }">
            <div class="code-badge-wrap">
              <code class="code-badge">{{ row.prizeCode }}</code>
              <el-button 
                type="primary" 
                link 
                :icon="DocumentCopy" 
                class="copy-btn"
                @click="copyToClipboard(row.prizeCode)"
                title="复制卡密"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="卡密状态" width="110">
          <template #default="{ row }">
            <span class="status-indicator" :class="getStatusClass(row.status)">
              <span class="dot"></span>
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="中奖者" width="130">
          <template #default="{ row }">
            <span v-if="row.username" class="user-id-text">
              <el-icon style="vertical-align: middle; margin-right: 4px;"><User /></el-icon>
              {{ row.username }}
            </span>
            <span v-else class="empty-holder">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="feedbackTitle" label="关联反馈与中奖原因" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.feedbackId">
              <!-- 引入 el-popover 悬浮穿透展示反馈细节 -->
              <el-popover
                placement="left"
                :width="360"
                trigger="hover"
                @before-enter="loadFeedbackDetail(row.feedbackId)"
                popper-class="premium-popover"
              >
                <template #reference>
                  <span class="feedback-link">
                    <el-icon style="vertical-align: middle; margin-right: 4px;"><ChatLineRound /></el-icon>
                    {{ row.feedbackTitle || ('反馈 ID: ' + row.feedbackId) }}
                  </span>
                </template>
                
                <!-- 悬浮弹窗内容 -->
                <div v-loading="loadingFeedback" class="popover-feedback-detail">
                  <div v-if="hoverFeedbackDetail" class="popover-content">
                    <div class="popover-header">
                      <span class="popover-type-tag">
                        {{ getFeedbackTypeText(hoverFeedbackDetail.type) }}
                      </span>
                      <span class="popover-score" v-if="hoverFeedbackDetail.aiAnalysisResult">
                        AI可信度: <strong>{{ JSON.parse(hoverFeedbackDetail.aiAnalysisResult).score }}分</strong>
                      </span>
                    </div>
                    <div class="popover-desc">
                      <p class="desc-title">用户反馈内容：</p>
                      <p class="desc-text">“{{ hoverFeedbackDetail.content }}”</p>
                    </div>
                    <div class="popover-reply" v-if="hoverFeedbackDetail.reviewRemark">
                      <p class="desc-title">人工审核意见：</p>
                      <p class="desc-text reply-remark">“{{ hoverFeedbackDetail.reviewRemark }}”</p>
                    </div>
                  </div>
                  <div v-else class="popover-empty">
                    <span>暂未加载到对应的反馈归档记录</span>
                  </div>
                </div>
              </el-popover>
            </div>
            <span v-else class="empty-holder">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="allocateTime" label="发放时间" width="140">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.allocateTime) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="录入时间" width="140">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              v-if="row.status === 0"
              title="确定作废该卡密吗？作废后不可恢复且不予发放。"
              confirm-button-text="作废"
              cancel-button-text="取消"
              confirm-button-type="danger"
              @confirm="handleDiscard(row.id)"
            >
              <template #reference>
                <el-button type="danger" link :icon="Delete" class="discard-action-btn">作废</el-button>
              </template>
            </el-popconfirm>
            <span v-else class="locked-text">
              <el-icon style="vertical-align: middle; margin-right: 2px;"><Lock /></el-icon>已锁定
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          small
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
      class="premium-dialog glass-dialog"
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
            <span class="dialog-textarea-label">
              <span>批量录入卡密码 <span style="color: #f43f5e;">*</span></span>
              <span class="label-hint">每行或使用英文逗号隔开一个卡密</span>
            </span>
          </template>
          <el-input
            v-model="form.rawCodes"
            type="textarea"
            :rows="8"
            placeholder="JD-E-10-XXXXXXXX&#10;JD-E-10-YYYYYYYY&#10;JD-E-10-ZZZZZZZZ"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-actions">
          <el-button @click="dialogVisible = false" size="large" class="dialog-cancel-btn">取消</el-button>
          <el-button 
            type="primary" 
            size="large" 
            :loading="submitting" 
            @click="handleSubmit"
            class="dialog-confirm-btn"
          >
            确认录入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, inject, nextTick, onBeforeUnmount } from 'vue'
import { Plus, List, Search, Delete, Ticket, CircleCheck, CircleClose, User, ChatLineRound, DocumentCopy, Lock, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/api/request'
import * as echarts from 'echarts'

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

// 注入全局的主题状态
const isDark = inject('isDark', ref(true))

// ECharts 饼图相关
const pieChartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

// 穿透 hover 反馈相关
const hoverFeedbackDetail = ref<any>(null)
const loadingFeedback = ref(false)

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('卡密兑换码已成功复制到剪贴板！')
  }).catch(() => {
    ElMessage.error('复制失败，请手动选取')
  })
}

// 异步加载穿透反馈
const loadFeedbackDetail = async (feedbackId: string) => {
  if (!feedbackId) return
  loadingFeedback.value = true
  hoverFeedbackDetail.value = null
  try {
    const res = await request.get('/admin/feedback/page', { params: { page: 1, size: 50 } })
    if (res && res.records) {
      const found = res.records.find((f: any) => String(f.id) === String(feedbackId))
      if (found) {
        hoverFeedbackDetail.value = found
      }
    }
  } catch (e) {
    console.error('获取穿透反馈失败', e)
  } finally {
    loadingFeedback.value = false
  }
}

const getFeedbackTypeText = (type: number) => {
  switch (type) {
    case 1: return '体验评价'
    case 2: return '功能建议'
    case 3: return 'Bug反馈'
    default: return '用户反馈'
  }
}

// 初始化 ECharts 看板饼图
const initChart = () => {
  if (!pieChartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(pieChartRef.value, isDark.value ? 'dark' : undefined)

  // 整理数据大盘：可用库存的各品类比例
  const countMap: Record<string, number> = {}
  
  // 提取可用状态(status === 0)的卡密
  prizeList.value.forEach((p: any) => {
    if (p.status === 0) {
      countMap[p.name] = (countMap[p.name] || 0) + 1
    }
  })

  let chartData = Object.keys(countMap).map(key => ({
    name: key,
    value: countMap[key]
  }))

  if (chartData.length === 0) {
    chartData = [{ name: '暂无可用库存', value: 0 }]
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 个 ({d}%)',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: 'rgba(99, 102, 241, 0.2)',
      textStyle: {
        color: isDark.value ? '#ffffff' : '#0f172a'
      }
    },
    legend: {
      orient: 'vertical',
      right: '0%',
      top: 'center',
      textStyle: {
        color: isDark.value ? '#94a3b8' : '#475569',
        fontSize: 10,
        fontFamily: 'Inter'
      },
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 6
    },
    series: [
      {
        name: '卡密可用占比',
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark.value ? '#0f172a' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        data: chartData
      }
    ]
  }

  chartInstance.setOption(option)
}

// 监听主题切换，重新绘制图表以改变色系
watch(isDark, () => {
  nextTick(() => {
    initChart()
  })
})

// 监听窗口大小缩放
const handleResize = () => {
  chartInstance?.resize()
}

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

const getStatusClass = (status: number) => {
  switch (status) {
    case 0: return 'status-available'
    case 1: return 'status-allocated'
    case 2: return 'status-discarded'
    default: return 'status-unknown'
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
      prizeList.value.forEach(item => {
        if (item.id !== undefined && item.id !== null) {
          item.id = String(item.id)
        }
      })
      total.value = res.total || 0
      
      // 数据变动后，更新 ECharts 图表
      nextTick(() => {
        initChart()
      })
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
      // 兼容英文逗号、分号及换行分割提取卡密
      const codes = form.rawCodes
        .replace(/[,;，；]/g, '\n')
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
        ElMessage.success(`成功批量录入 ${codes.length} 条可用卡密！`)
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
const handleDiscard = async (id: string) => {
  try {
    await request.post(`/admin/prize/${id}/discard`)
    ElMessage.success('卡密作废风控操作成功')
    fetchStats()
    fetchList()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.prize-management-view {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.gradient-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, #000000 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--admin-text-secondary);
  font-size: 13px;
  margin: 0;
}

.create-btn {
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  background-color: var(--admin-accent) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

/* Bento 大盘 */
.stats-row {
  margin-bottom: 20px;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  height: 100%;
}

.stats-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  overflow: hidden;
  height: 110px;
  box-sizing: border-box;
}

.card-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--admin-text-primary);
  margin: 0;
}

/* 微光流向 */
.glow-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0) 100__
  );
  transform: skewX(-25deg);
  transition: 0.75s;
}
.stats-card:hover .glow-effect {
  left: 150%;
}

/* 卡片定制微光颜色 */
.card-available .card-icon-box { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.card-allocated .card-icon-box { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.card-discarded .card-icon-box { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }

/* 图表卡片 */
.chart-card {
  height: 110px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.info-icon {
  cursor: help;
}

.inventory-pie-chart {
  flex: 1;
  width: 100%;
}

/* 磨砂大底盘 */
.glass-item {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-card-border);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: var(--admin-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-item:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.2);
}

.glass-card {
  background: var(--admin-card-bg) !important;
  border: 1px solid var(--admin-card-border) !important;
  backdrop-filter: blur(20px);
  border-radius: 16px !important;
  box-shadow: var(--admin-shadow) !important;
}



.card-header-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--admin-text-primary);
  width: 100%;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
  color: var(--admin-accent);
}

.header-filters {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* 表格定制 */
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
  font-weight: 600;
  font-size: 13px;
}
.admin-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--admin-card-border) !important;
}
.admin-table :deep(.el-table__body tr:hover td) {
  background-color: var(--admin-table-hover-bg) !important;
}

.prize-name-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text-primary);
}

/* 代码微章复制 */
.code-badge-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.code-badge {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  background-color: rgba(15, 23, 42, 0.3);
  color: var(--admin-text-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--admin-card-border);
}

.copy-btn {
  font-size: 14px;
  color: var(--admin-text-secondary) !important;
}
.copy-btn:hover {
  color: var(--admin-accent) !important;
}

/* 状态指示点 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}
.status-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}
.status-available { color: #10b981; }
.status-available .dot { background-color: #10b981; }
.status-allocated { color: #818cf8; }
.status-allocated .dot { background-color: #818cf8; }
.status-discarded { color: #94a3b8; }
.status-discarded .dot { background-color: #94a3b8; }

.user-id-text {
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.feedback-link {
  font-size: 12px;
  color: var(--admin-accent);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px dashed var(--admin-accent);
  padding-bottom: 1px;
}
.feedback-link:hover {
  color: #818cf8;
}

.empty-holder {
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.locked-text {
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.discard-action-btn {
  color: #f43f5e !important;
}
.discard-action-btn:hover {
  color: #ef4444 !important;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

/* 悬浮 Popover 样式定制 */
.popover-feedback-detail {
  padding: 8px 4px;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--admin-card-border);
  padding-bottom: 6px;
}

.popover-type-tag {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.popover-score {
  font-size: 11px;
  color: var(--admin-text-secondary);
}

.popover-desc {
  margin-bottom: 8px;
}

.desc-title {
  font-size: 11px;
  color: var(--admin-text-secondary);
  font-weight: 600;
  margin: 0 0 4px 0;
}

.desc-text {
  font-size: 12px;
  color: var(--admin-text-primary);
  line-height: 1.4;
  margin: 0;
  background: rgba(0, 0, 0, 0.1);
  padding: 6px 8px;
  border-radius: 4px;
}

.reply-remark {
  color: #34d399;
  background: rgba(52, 211, 153, 0.05);
}

.popover-empty {
  text-align: center;
  color: var(--admin-text-secondary);
  font-size: 11px;
  padding: 10px 0;
}

/* 覆盖输入框样式 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: var(--admin-input-bg) !important;
  border: 1px solid var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
  box-shadow: none !important;
  border-radius: 8px !important;
}
:deep(.el-input__inner) {
  color: var(--admin-text-primary) !important;
}
:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: rgba(99, 102, 241, 0.4) !important;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: var(--admin-accent) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

:deep(.el-select__wrapper) {
  background-color: var(--admin-input-bg) !important;
  border: 1px solid var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
  box-shadow: none !important;
  border-radius: 8px !important;
}
:deep(.el-select__wrapper:hover) {
  border-color: rgba(99, 102, 241, 0.4) !important;
}
:deep(.el-select__wrapper.is-focused) {
  border-color: var(--admin-accent) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}
:deep(.el-select__placeholder) {
  color: var(--admin-text-secondary) !important;
}

/* 批量录入弹窗高级定制 */
.dialog-textarea-label {
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.label-hint {
  font-weight: 400;
  font-size: 11px;
  color: var(--admin-text-secondary);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 10px;
}

.dialog-cancel-btn {
  border-radius: 8px;
  width: 110px;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid var(--admin-card-border) !important;
  color: var(--admin-text-primary) !important;
}
.dialog-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.06) !important;
}

.dialog-confirm-btn {
  border-radius: 8px;
  width: 130px;
  background-color: var(--admin-accent) !important;
  border: none !important;
}
</style>
