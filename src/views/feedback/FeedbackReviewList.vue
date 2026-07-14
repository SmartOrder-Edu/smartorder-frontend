<template>
  <AppLayout>
    <div class="admin-feedback-container">
    <!-- 头部横幅：科技渐变风 -->
    <div class="admin-header">
      <div class="header-content">
        <h2>用户反馈智能管理台</h2>
        <p>基于 AI + 人工双重审核机制，快速处理用户心声，发掘高价值改进建议</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-num">{{ stats.pendingReview }}</span>
          <span class="stat-label">待复核</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats.aiRejected }}</span>
          <span class="stat-label">AI 已拦截</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats.accepted }}</span>
          <span class="stat-label">已采纳</span>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="反馈类型">
          <el-select v-model="queryParams.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="体验评价" :value="1" />
            <el-option label="功能建议" :value="2" />
            <el-option label="Bug反馈" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option label="待AI初审" :value="0" />
            <el-option label="AI初审通过 (待复核)" :value="1" />
            <el-option label="AI初审驳回" :value="2" />
            <el-option label="人工审核通过" :value="3" />
            <el-option label="人工审核驳回" :value="4" />
            <el-option label="已采纳" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 主体分栏布局 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左侧：反馈列表表格 -->
      <el-col :span="13">
        <el-card class="list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>反馈记录列表</span>
              <el-tag type="info">共 {{ total }} 条</el-tag>
            </div>
          </template>

          <el-table 
            v-loading="loading" 
            :data="feedbackList" 
            highlight-current-row
            @current-change="handleCurrentRowChange"
            style="width: 100%"
            class="feedback-table"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getTypeTagType(scope.row.type)" effect="plain">
                  {{ getTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="反馈内容" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="140">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)" effect="dark">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="提交时间" width="150">
              <template #default="scope">
                {{ formatDateTime(scope.row.createTime) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页器 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="queryParams.page"
              v-model:page-size="queryParams.size"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              small
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：AI分析与人工审核面板 -->
      <el-col :span="11">
        <el-card class="detail-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>反馈详情 & 智能决策辅助</span>
            </div>
          </template>

          <div v-if="selectedRow" class="detail-panel">
            <!-- 反馈基本内容卡片 -->
            <div class="detail-section">
              <h4 class="section-title">反馈原内容</h4>
              <div class="content-box">
                <p class="content-text">{{ selectedRow.content }}</p>
                <div v-if="selectedRow.imageUrls && selectedRow.imageUrls.length > 0" class="image-gallery">
                  <el-image 
                    v-for="(url, index) in selectedRow.imageUrls" 
                    :key="index"
                    :src="url" 
                    :preview-src-list="selectedRow.imageUrls"
                    fit="cover"
                    class="detail-image"
                  />
                </div>
              </div>
            </div>

            <!-- DeepSeek AI 分析报告卡片 -->
            <div class="detail-section ai-section">
              <h4 class="section-title ai-title">
                <el-icon class="ai-icon"><Cpu /></el-icon> DeepSeek AI 初审评估
              </h4>
              <div class="ai-analysis-box" v-if="parsedAiResult">
                <div class="ai-score-row">
                  <span class="ai-score-label">可信度与合规度评分：</span>
                  <el-progress 
                    type="dashboard" 
                    :percentage="parsedAiResult.score || 0" 
                    :color="getScoreColor(parsedAiResult.score)" 
                    :width="70"
                  />
                </div>
                <div class="ai-item">
                  <span class="label">AI 判定结果:</span>
                  <el-tag :type="parsedAiResult.isValid ? 'success' : 'danger'" size="small">
                    {{ parsedAiResult.isValid ? '真实有效' : '建议拦截/无效内容' }}
                  </el-tag>
                </div>
                <div class="ai-item">
                  <span class="label">AI 分析原因:</span>
                  <p class="ai-text-reason">{{ parsedAiResult.reason || '无' }}</p>
                </div>
              </div>
              <div v-else class="ai-empty-box">
                <p>该状态下暂无有效的 AI 初审报告</p>
              </div>
            </div>

            <!-- 人工复核与官方答复表单 -->
            <div class="detail-section review-section" v-if="selectedRow.status === 1 || selectedRow.status === 0">
              <h4 class="section-title">人工复核与官方答复</h4>
              <el-form :model="reviewForm" ref="reviewFormRef" :rules="reviewRules" label-position="top">
                <el-form-item label="复核内部备注 / 驳回理由" prop="reviewRemark">
                  <el-input 
                    v-model="reviewForm.reviewRemark" 
                    type="textarea" 
                    :rows="2" 
                    placeholder="请输入对该反馈的复核意见。如果驳回，此原因将自动通知用户..." 
                  />
                </el-form-item>
                
                <el-form-item label="官方正式答复 (选填，答复将展示在用户的历史反馈中)">
                  <el-input 
                    v-model="reviewForm.replyContent" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入官方正式的答复内容，建议亲切得体..." 
                  />
                </el-form-item>

                <div class="review-actions">
                  <el-button 
                    type="danger" 
                    :icon="Close" 
                    :loading="submittingReview" 
                    @click="submitReview(4)"
                  >
                    人工驳回
                  </el-button>
                  <el-button 
                    type="primary" 
                    :icon="Check" 
                    :loading="submittingReview" 
                    @click="submitReview(3)"
                  >
                    通过复核
                  </el-button>
                  <el-button 
                    type="success" 
                    :icon="Star" 
                    :loading="submittingReview" 
                    @click="submitReview(5)"
                  >
                    采纳为优质建议
                  </el-button>
                </div>
              </el-form>
            </div>

            <!-- 已审核状态下的复核日志 -->
            <div class="detail-section reviewed-section" v-else>
              <h4 class="section-title">复核与答复记录</h4>
              <div class="review-log-box">
                <div class="log-item">
                  <span class="label">最终结果：</span>
                  <el-tag :type="getStatusTagType(selectedRow.status)" size="small">
                    {{ getStatusText(selectedRow.status) }}
                  </el-tag>
                </div>
                <div class="log-item" v-if="selectedRow.reviewRemark">
                  <span class="label">审核备注：</span>
                  <p class="remark-text">{{ selectedRow.reviewRemark }}</p>
                </div>
                <div class="log-item" v-if="selectedRow.replyContent">
                  <span class="label">官方答复：</span>
                  <div class="official-reply-box">
                    <p class="reply-text-content">{{ selectedRow.replyContent }}</p>
                    <span class="reply-time-tag" v-if="selectedRow.replyTime">
                      答复时间：{{ formatDateTime(selectedRow.replyTime) }}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div v-else class="empty-detail">
            <el-empty description="在左侧选择一行以查看详情并进行人工审核决策" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { Search, Refresh, Check, Close, Star, Cpu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/api/request'

// 列表查询条件
const queryParams = reactive({
  page: 1,
  size: 10,
  type: undefined as number | undefined,
  status: undefined as number | undefined
})

const loading = ref(false)
const total = ref(0)
const feedbackList = ref<any[]>([])
const selectedRow = ref<any>(null)
const parsedAiResult = ref<any>(null)

// 审核表单相关
const reviewFormRef = ref<FormInstance>()
const submittingReview = ref(false)
const reviewForm = reactive({
  reviewRemark: '',
  replyContent: ''
})

const reviewRules = reactive<FormRules>({
  reviewRemark: [
    { required: true, message: '请输入内部复核意见或驳回原因', trigger: 'blur' }
  ]
})

// 统计数据
const stats = reactive({
  pendingReview: 0,
  aiRejected: 0,
  accepted: 0
})

// 格式化时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 类型转换
const getTypeText = (type: number) => {
  switch (type) {
    case 1: return '体验评价'
    case 2: return '功能建议'
    case 3: return 'Bug反馈'
    default: return '其他意见'
  }
}

const getTypeTagType = (type: number) => {
  switch (type) {
    case 1: return 'info'
    case 2: return 'success'
    case 3: return 'danger'
    default: return ''
  }
}

// 状态转换
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '待AI初审'
    case 1: return '待人工复核'
    case 2: return 'AI自动驳回'
    case 3: return '有效反馈'
    case 4: return '已驳回'
    case 5: return '已采纳'
    default: return '未知'
  }
}

const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'danger'
    case 3: return 'primary'
    case 4: return 'danger'
    case 5: return 'success'
    default: return ''
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 监听选择行变化，解析 AI 初审报告
watch(selectedRow, (newVal) => {
  if (newVal && newVal.aiAnalysisResult) {
    try {
      parsedAiResult.value = JSON.parse(newVal.aiAnalysisResult)
    } catch (e) {
      console.error('解析AI初审报告失败', e)
      parsedAiResult.value = null
    }
  } else {
    parsedAiResult.value = null
  }
  reviewForm.reviewRemark = ''
  reviewForm.replyContent = ''
})

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/feedback/page', { params: queryParams })
    if (res) {
      feedbackList.value = res.records || []
      total.value = res.total || 0
      if (feedbackList.value.length > 0) {
        // 默认选择第一行
        selectedRow.value = feedbackList.value[0]
      } else {
        selectedRow.value = null
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载统计指标
const fetchStats = async () => {
  try {
    const res = await request.get('/admin/feedback/stats')
    if (res) {
      stats.pendingReview = res.pendingReview || 0
      stats.aiRejected = res.aiRejected || 0
      stats.accepted = res.accepted || 0
    }
  } catch (error) {
    console.error('加载看板统计指标数据失败', error)
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const resetQuery = () => {
  queryParams.type = undefined
  queryParams.status = undefined
  handleQuery()
}

const handleCurrentRowChange = (val: any) => {
  selectedRow.value = val
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  queryParams.page = val
  fetchList()
}

// 提交审核与正式答复
const submitReview = async (status: number) => {
  if (!selectedRow.value) return

  // 驳回时强制要求填写理由
  if (status === 4 && !reviewForm.reviewRemark.trim()) {
    ElMessage.warning('驳回时必须填写驳回原因')
    return
  }

  submittingReview.value = true
  try {
    await request.post(`/admin/feedback/${selectedRow.value.id}/review`, {
      status: status,
      reviewRemark: reviewForm.reviewRemark,
      replyContent: reviewForm.replyContent
    })
    ElMessage.success('操作成功')
    // 局部更新状态
    selectedRow.value.status = status
    selectedRow.value.reviewRemark = reviewForm.reviewRemark
    selectedRow.value.replyContent = reviewForm.replyContent
    selectedRow.value.replyTime = new Date().toISOString()
    
    fetchStats()
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submittingReview.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<style scoped>
.admin-feedback-container {
  padding: 10px 0;
}

/* 渐变头部 */
.admin-header {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  color: #ffffff;
  padding: 25px 40px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px  var(--color-shadow);
}

.header-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
  background: linear-gradient(to right, #ffffff, #a5b4fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-content p {
  color: #9ca3af;
  font-size: 13px;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #818cf8;
}

.stat-label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 过滤面板 */
.filter-card {
  border-radius: 12px;
  margin-bottom: 24px;
  border: none;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

/* 分栏布局 */
.main-content-row {
  margin-top: 12px;
}

.list-card, .detail-card {
  border-radius: 12px;
  border: none;
  min-height: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.feedback-table {
  margin-top: 10px;
  cursor: pointer;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 详情与审核面板 */
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background-color: #fafbfc;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-top: 0;
  margin-bottom: 12px;
  border-left: 4px solid #4f46e5;
  padding-left: 8px;
}

.content-box {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #f3f4f6;
}

.content-text {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  margin: 0;
}

.image-gallery {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.detail-image {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  box-shadow: 0 2px 8px  var(--color-shadow);
  cursor: pointer;
  transition: transform 0.2s;
}

.detail-image:hover {
  transform: scale(1.05);
}

/* AI 部分 */
.ai-section {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
}

.ai-title {
  color: #6d28d9;
  border-left-color: #8b5cf6;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-icon {
  font-size: 18px;
}

.ai-analysis-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-score-label {
  font-size: 13px;
  color: #5b21b6;
  font-weight: 600;
}

.ai-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-item .label {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 600;
}

.ai-text-reason {
  background: var(--color-card-bg-secondary);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #4c1d95;
  line-height: 1.5;
  margin: 0;
  border-left: 3px solid #8b5cf6;
}

.ai-empty-box {
  text-align: center;
  color: #9ca3af;
  padding: 15px 0;
  font-size: 13px;
}

/* 审核表单与动作 */
.review-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.review-actions :deep(.el-button) {
  flex: 1;
  min-width: 100px;
}

.review-log-box {
  background: #ffffff;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.log-item .label {
  color: #6b7280;
  font-weight: 600;
}

.remark-text {
  color: #374151;
  line-height: 1.5;
  margin: 0;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #d1d5db;
}

.official-reply-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reply-text-content {
  color: #166534;
  line-height: 1.5;
  margin: 0;
}

.reply-time-tag {
  font-size: 11px;
  color: #16a34a;
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
}
</style>
