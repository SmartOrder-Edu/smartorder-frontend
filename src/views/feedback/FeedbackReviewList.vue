<template>
  <div class="feedback-review-view animate__animated animate__fadeIn">
    <!-- 头部横幅：科技渐变风 & 指标大盘 -->
    <div class="admin-header glass-panel">
      <div class="header-content">
        <h2 class="gradient-title">用户反馈智能管理台</h2>
        <p class="subtitle">基于 AI 实时初审与人工复核机制，深挖高价值心声，驱动产品持续迭代</p>
      </div>
      <div class="header-stats">
        <div class="stat-card pending">
          <div class="stat-icon-box">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-num">{{ stats.pendingReview }}</span>
            <span class="stat-label">待人工复核</span>
          </div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-icon-box">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-num">{{ stats.aiRejected }}</span>
            <span class="stat-label">AI 自动拦截</span>
          </div>
        </div>
        <div class="stat-card accepted">
          <div class="stat-icon-box">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-num">{{ stats.accepted }}</span>
            <span class="stat-label">已采纳建议</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card glass-card" shadow="hover">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="反馈类型">
          <el-select v-model="queryParams.type" placeholder="全部类型" clearable style="width: 140px">
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
            <el-option label="有效反馈" :value="3" />
            <el-option label="已驳回" :value="4" />
            <el-option label="已采纳" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" class="action-btn" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" class="reset-btn" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 主体分栏布局 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左侧：反馈列表表格 -->
      <el-col :span="12">
        <el-card class="list-card glass-card" shadow="hover">
          <template #header>
            <div class="card-header-title">
              <el-icon class="header-icon"><List /></el-icon>
              <span>反馈记录总账</span>
              <el-tag size="small" type="info" class="total-tag">共 {{ total }} 条</el-tag>
            </div>
          </template>

          <el-table 
            v-loading="loading" 
            :data="feedbackList" 
            highlight-current-row
            @current-change="handleCurrentRowChange"
            style="width: 100%"
            class="admin-table premium-table"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getTypeTagType(scope.row.type)" effect="plain" class="type-tag">
                  {{ getTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="反馈内容" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="130">
              <template #default="scope">
                <span class="status-indicator" :class="getStatusClass(scope.row.status)">
                  <span class="dot"></span>
                  {{ getStatusText(scope.row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="提交时间" width="140">
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
              :page-sizes="[10, 20, 30]"
              layout="total, prev, pager, next"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              small
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：AI分析与人工审核面板 -->
      <el-col :span="12">
        <el-card class="detail-card glass-card" shadow="hover">
          <template #header>
            <div class="card-header-title">
              <el-icon class="header-icon"><Cpu /></el-icon>
              <span>审核详情与 AI 智能辅政</span>
            </div>
          </template>

          <div v-if="selectedRow" class="detail-panel">
            <!-- 反馈基本内容卡片 -->
            <div class="detail-section glass-item">
              <h4 class="section-title">
                <span class="title-decor"></span>
                反馈原始内容
                <span class="user-meta" v-if="selectedRow.userId"> (反馈人ID: {{ selectedRow.userId }})</span>
              </h4>
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
            <div class="detail-section ai-section glass-item">
              <h4 class="section-title ai-title">
                <span class="title-decor ai-decor"></span>
                <el-icon class="ai-icon"><Cpu /></el-icon> DeepSeek AI 初审智能评估报告
              </h4>
              
              <div class="ai-analysis-box" v-if="parsedAiResult">
                <div class="ai-score-dashboard">
                  <!-- 科技感圆环评分 -->
                  <div class="radial-score-container">
                    <svg viewBox="0 0 36 36" class="circular-chart" :class="getScoreColorClass(parsedAiResult.score)">
                      <path class="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path class="circle"
                        :stroke-dasharray="`${parsedAiResult.score || 0}, 100`"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" class="percentage">{{ parsedAiResult.score || 0 }}</text>
                    </svg>
                    <span class="dashboard-label">可信度评分</span>
                  </div>

                  <!-- 细分维度统计 -->
                  <div class="ai-dimensions">
                    <div class="dimension-item">
                      <span class="dim-label">初审判定：</span>
                      <el-tag :type="parsedAiResult.isValid ? 'success' : 'danger'" size="small" class="dim-tag">
                        {{ parsedAiResult.isValid ? '真实有效' : '建议驳回/拦截' }}
                      </el-tag>
                    </div>
                    <div class="dimension-item">
                      <span class="dim-label">情绪等级：</span>
                      <el-tag :type="getEmotionTagType(parsedAiResult.score, parsedAiResult.isValid)" size="small" class="dim-tag">
                        {{ getEmotionText(parsedAiResult.score, parsedAiResult.isValid) }}
                      </el-tag>
                    </div>
                    <div class="dimension-item">
                      <span class="dim-label">建设性评估：</span>
                      <span class="constructive-level" :class="parsedAiResult.score >= 80 ? 'high' : 'low'">
                        {{ parsedAiResult.score >= 80 ? '高价值建议' : '常规内容' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="ai-item">
                  <span class="label">AI 深度分析原因：</span>
                  <p class="ai-text-reason">{{ parsedAiResult.reason || '未生成分析详情' }}</p>
                </div>
              </div>
              
              <div v-else class="ai-empty-box">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <p>当前记录暂无或正在计算 AI 评估报告...</p>
              </div>
            </div>

            <!-- 人工复核与官方答复表单（待审核状态下显示） -->
            <div class="detail-section review-section glass-item" v-if="selectedRow.status === 1 || selectedRow.status === 0">
              <h4 class="section-title">
                <span class="title-decor"></span>
                人工复核与回复
              </h4>
              <el-form :model="reviewForm" :rules="reviewRules" label-position="top">
                
                <!-- 预设回复常用模版（提升录入体验） -->
                <div class="template-selector">
                  <span class="template-label">常用快捷答复：</span>
                  <div class="template-tags">
                    <el-tag 
                      v-for="(tpl, idx) in replyTemplates[selectedRow.type] || replyTemplates[1]" 
                      :key="idx"
                      class="tpl-tag"
                      effect="plain"
                      @click="applyTemplate(tpl)"
                    >
                      {{ tpl.name }}
                    </el-tag>
                  </div>
                </div>

                <el-form-item label="内部复核备注 (如果驳回，此项必填并作为理由展示给用户)" prop="reviewRemark">
                  <el-input 
                    v-model="reviewForm.reviewRemark" 
                    type="textarea" 
                    :rows="2" 
                    placeholder="请输入内部审核备注或驳回意见..." 
                  />
                </el-form-item>
                
                <el-form-item label="正式答复内容 (答复将推送给反馈用户，支持换行)">
                  <el-input 
                    v-model="reviewForm.replyContent" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入官方正式的答复内容，建议客气、诚恳..." 
                  />
                </el-form-item>

                <div class="review-actions">
                  <el-button 
                    type="danger" 
                    class="btn-reject"
                    :loading="submittingReview" 
                    @click="submitReview(4)"
                  >
                    人工驳回
                  </el-button>
                  <el-button 
                    type="primary" 
                    class="btn-approve"
                    :loading="submittingReview" 
                    @click="submitReview(3)"
                  >
                    通过复核
                  </el-button>
                  <el-button 
                    type="success" 
                    class="btn-adopt"
                    :loading="submittingReview" 
                    @click="submitReview(5)"
                  >
                    采纳并赠送卡密
                  </el-button>
                </div>
              </el-form>
            </div>

            <!-- 已审核状态下的历史复核日志（Timeline形式） -->
            <div class="detail-section glass-item" v-else>
              <h4 class="section-title">
                <span class="title-decor"></span>
                复核流水与日志
              </h4>
              <div class="review-timeline">
                <el-timeline>
                  <el-timeline-item timestamp="提交反馈" placement="top" type="info">
                    <p class="timeline-detail">用户提交了该反馈记录。初始状态为待初审。</p>
                  </el-timeline-item>
                  
                  <el-timeline-item 
                    v-if="selectedRow.status >= 2"
                    timestamp="AI 判定" 
                    placement="top" 
                    :type="selectedRow.status === 2 ? 'danger' : 'success'"
                  >
                    <p class="timeline-detail">
                      DeepSeek AI 评估完成。可信度得分: 
                      <strong>{{ parsedAiResult?.score || 60 }}</strong>。
                      判定为: <strong>{{ parsedAiResult?.isValid ? '建议人工复核' : 'AI建议拦截' }}</strong>。
                    </p>
                  </el-timeline-item>

                  <el-timeline-item 
                    timestamp="人工审核完成" 
                    placement="top" 
                    :type="selectedRow.status === 5 ? 'success' : (selectedRow.status === 4 ? 'danger' : 'primary')"
                  >
                    <div class="timeline-log-box">
                      <div class="log-row">
                        <span class="log-label">审核结果：</span>
                        <el-tag :type="getStatusTagType(selectedRow.status)" size="small" class="log-tag">
                          {{ getStatusText(selectedRow.status) }}
                        </el-tag>
                      </div>
                      <div class="log-row" v-if="selectedRow.reviewRemark">
                        <span class="log-label">内部备注：</span>
                        <p class="remark-text">{{ selectedRow.reviewRemark }}</p>
                      </div>
                      <div class="log-row" v-if="selectedRow.replyContent">
                        <span class="log-label">官方答复：</span>
                        <div class="official-reply-container">
                          <p class="reply-text-content">{{ selectedRow.replyContent }}</p>
                          <span class="reply-time" v-if="selectedRow.replyTime">
                            答复时间：{{ formatDateTime(selectedRow.replyTime) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </div>

          <div v-else class="empty-detail">
            <el-empty description="在左侧列表中选择一行记录以开启 AI 智能辅政面板" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Search, Refresh, Bell, CircleClose, Star, Cpu, List, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
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


const submittingReview = ref(false)
const reviewForm = reactive({
  reviewRemark: '',
  replyContent: ''
})

const reviewRules = reactive<FormRules>({
  reviewRemark: [
    { required: true, message: '内部复核备注不能为空', trigger: 'blur' }
  ]
})

// 统计看板数据
const stats = reactive({
  pendingReview: 0,
  aiRejected: 0,
  accepted: 0
})



// 快捷回复模板 (根据类型分类)
const replyTemplates: Record<number, Array<{ name: string; remark: string; reply: string }>> = {
  1: [ // 体验评价
    { 
      name: '一般性回复', 
      remark: '已审阅，予以归档记录。', 
      reply: '您好，非常感谢您的评价！我们已将您的感受登记在案，后续我们会继续改善细节以提升大家的使用体验。' 
    },
    { 
      name: '不相关/情绪驳回', 
      remark: '该评价为无意义情绪宣泄，与产品本身功能无关，不符合采纳标准。', 
      reply: '您好，抱歉没能给您带来完美的体验。若您在实际使用中遇到了系统故障或有建设性意见，欢迎具体描述，我们会第一时间跟进。' 
    }
  ],
  2: [ // 功能建议
    { 
      name: '建议采纳-赠奖', 
      remark: '优质功能建言，经产品评估具有高落地性，决定采纳并赠送京东卡奖品。', 
      reply: '您的想法极具创意和实用价值！这确实是解决当前用户痛点的一个好点子。产品团队已采纳该建议，并计划排期开发。我们特意为您准备了心意小礼，感谢您对本系统的支持！' 
    },
    { 
      name: '建议采纳-常规', 
      remark: '具有参考价值的建议，已录入产品 backlog。', 
      reply: '十分感谢您的精美建言！这是一个很好的优化方向，我们已将其收录至产品需求池，会结合后续迭代规划适度排期。感谢您的理解与关注！' 
    },
    { 
      name: '建议婉拒', 
      remark: '建议与当前产品定位有偏差，或技术成本过高，暂时婉拒。', 
      reply: '感谢您的奇思妙想！但考虑到系统目前的技术架构与核心场景，该功能短时间内恐难以满足，我们会先对该方案进行技术论证。再次感谢您的热情反馈！' 
    }
  ],
  3: [ // BUG 反馈
    { 
      name: 'BUG已复现', 
      remark: 'BUG属实且已复现，已转交开发团队加急修复，同意采纳并赠奖。', 
      reply: '您好，非常抱歉给您点餐带来了不便！您反馈的这个并发同步问题我们技术人员已成功复现。这是一次严重的并发缺陷，感谢您的细心发现！我们正组织加急修复，并为您申请了卡密奖品，请您注意查收。' 
    },
    { 
      name: '无法复现 BUG', 
      remark: '多机型及多账号下未复现该问题，需要联系用户补充环境。', 
      reply: '您好，我们技术团队对您描述的现象进行了多轮排查，目前暂未复现该异常。如果方便的话，建议您能通过意见反馈向我们提供您的手机机型、网络状况或者截图录屏，以便我们精准排错。感谢！' 
    }
  ]
}

// 应用快捷答复模板
const applyTemplate = (tpl: { name: string; remark: string; reply: string }) => {
  reviewForm.reviewRemark = tpl.remark
  reviewForm.replyContent = tpl.reply
}

// 格式化时间 (String接收并规整格式)
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

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
    default: return undefined
  }
}

// 状态文字与样式指示器
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '待AI初审'
    case 1: return '待复核'
    case 2: return 'AI自动驳回'
    case 3: return '有效反馈'
    case 4: return '已驳回'
    case 5: return '已采纳'
    default: return '未知'
  }
}

const getStatusClass = (status: number) => {
  switch (status) {
    case 0: return 'status-pending-ai'
    case 1: return 'status-pending-review'
    case 2: return 'status-ai-rejected'
    case 3: return 'status-valid'
    case 4: return 'status-rejected'
    case 5: return 'status-adopted'
    default: return 'status-unknown'
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
    default: return 'info'
  }
}

// AI 相关辅助函数
const getScoreColorClass = (score: number) => {
  if (score >= 80) return 'green'
  if (score >= 60) return 'orange'
  return 'red'
}

const getEmotionText = (score: number, isValid: boolean) => {
  if (!isValid) return '负面/宣泄'
  if (score >= 85) return '理性/建设性'
  if (score >= 65) return '理性/常规'
  return '中立/轻微不满'
}

const getEmotionTagType = (score: number, isValid: boolean) => {
  if (!isValid) return 'danger'
  if (score >= 85) return 'success'
  return 'warning'
}

// 监听当前行选中
watch(selectedRow, (newVal) => {
  if (newVal && newVal.aiAnalysisResult) {
    try {
      parsedAiResult.value = JSON.parse(newVal.aiAnalysisResult)
    } catch (e) {
      console.error('解析AI报告失败', e)
      parsedAiResult.value = null
    }
  } else {
    parsedAiResult.value = null
  }
  // 清空表单
  reviewForm.reviewRemark = ''
  reviewForm.replyContent = ''
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/feedback/page', { params: queryParams })
    if (res) {
      feedbackList.value = res.records || []
      // 保证ID用 string 类型获取
      feedbackList.value.forEach(item => {
        if (item.id !== undefined && item.id !== null) {
          item.id = String(item.id)
        }
      })
      total.value = res.total || 0
      
      // 保持之前的行选中
      if (feedbackList.value.length > 0) {
        const found = feedbackList.value.find(item => selectedRow.value && String(item.id) === String(selectedRow.value.id))
        selectedRow.value = found || feedbackList.value[0]
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

const fetchStats = async () => {
  try {
    const res = await request.get('/admin/feedback/stats')
    if (res) {
      stats.pendingReview = res.pendingReview || 0
      stats.aiRejected = res.aiRejected || 0
      stats.accepted = res.accepted || 0
    }
  } catch (error) {
    console.error(error)
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
  if (val) {
    selectedRow.value = val
  }
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  queryParams.page = val
  fetchList()
}

// 提交人工审核与答复
const submitReview = async (status: number) => {
  // 审核请求进行中禁止重复提交同一条反馈。
  if (submittingReview.value || !selectedRow.value) return

  if (status === 4 && !reviewForm.reviewRemark.trim()) {
    ElMessage.warning('驳回时必须填写内部复核备注作为驳回原因')
    return
  }

  submittingReview.value = true
  try {
    const res = await request.post(`/admin/feedback/${selectedRow.value.id}/review`, {
      status: status,
      reviewRemark: reviewForm.reviewRemark,
      replyContent: reviewForm.replyContent
    })
    
    if (res) {
      ElMessage.success('审核操作成功并推送到中奖大厅！')
      
      // 联动局部数据
      selectedRow.value.status = status
      selectedRow.value.reviewRemark = reviewForm.reviewRemark
      selectedRow.value.replyContent = res.replyContent || reviewForm.replyContent // 从后端获取闭环的包含卡密的回复内容
      selectedRow.value.replyTime = new Date().toISOString()
      
      fetchStats()
      fetchList()
    }
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
.feedback-review-view {
  min-height: 100%;
}

/* 渐变头部 & 看板 */
.admin-header {
  padding: 24px 32px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.gradient-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, var(--admin-text-primary) 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--admin-text-secondary);
  font-size: 13px;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--admin-card-border);
  backdrop-filter: blur(10px);
  padding: 12px 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.06);
}

.stat-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--admin-text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--admin-text-secondary);
  margin-top: 2px;
}

/* 各状态面板特色背景 */
.stat-card.pending .stat-icon-box { background: rgba(230, 162, 70, 0.15); color: #e6a23c; }
.stat-card.rejected .stat-icon-box { background: rgba(245, 108, 108, 0.15); color: #f56c6c; }
.stat-card.accepted .stat-icon-box { background: rgba(103, 194, 58, 0.15); color: #67c23a; }

/* 磨砂卡片公用 */
.glass-panel {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-card-border);
  backdrop-filter: blur(20px);
  box-shadow: var(--admin-shadow);
}

.glass-card {
  background: var(--admin-card-bg) !important;
  border: 1px solid var(--admin-card-border) !important;
  backdrop-filter: blur(20px);
  border-radius: 16px !important;
  box-shadow: var(--admin-shadow) !important;
  margin-bottom: 20px;
}
.glass-card :deep(.el-card__header) {
  background-color: transparent !important;
  border-bottom: 1px solid var(--admin-card-border) !important;
}

.glass-item {
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid var(--admin-card-border);
  border-radius: 12px;
  padding: 18px;
}

/* 筛选 */
.filter-card {
  border: none;
}
.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.filter-form :deep(.el-form-item__label) {
  color: var(--admin-text-secondary);
  font-weight: 500;
}

/* 按钮微改 */
.action-btn {
  background-color: var(--admin-accent) !important;
  border: none !important;
}
.reset-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--admin-text-primary) !important;
  border: 1px solid var(--admin-card-border) !important;
}

/* 卡片标题 */
.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--admin-text-primary);
}
.header-icon {
  color: var(--admin-accent);
  font-size: 18px;
}
.total-tag {
  background: rgba(99, 102, 241, 0.12) !important;
  color: #818cf8 !important;
  border: none !important;
}

/* 表格样式自适应 */
.admin-table {
  background-color: transparent !important;
  --el-table-border-color: var(--admin-card-border);
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
}
.admin-table :deep(.el-table__inner-wrapper::before) {
  background-color: var(--admin-card-border) !important;
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
  background-color: transparent !important;
  border-bottom: 1px solid var(--admin-card-border) !important;
}
.admin-table :deep(.el-table__body tr:hover td) {
  background-color: var(--admin-table-hover-bg) !important;
}
.admin-table :deep(.el-table__body tr.current-row td) {
  background-color: rgba(99, 102, 241, 0.15) !important;
  border-top: 1px solid rgba(99, 102, 241, 0.3);
  border-bottom: 1px solid rgba(99, 102, 241, 0.3) !important;
}

/* 类型Tag */
.type-tag {
  border-radius: 6px;
}

/* 状态指示点 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}
.status-indicator .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}
.status-pending-ai { color: #94a3b8; }
.status-pending-ai .dot { background-color: #94a3b8; }
.status-pending-review { color: #e6a23c; }
.status-pending-review .dot { background-color: #e6a23c; }
.status-ai-rejected { color: #f56c6c; }
.status-ai-rejected .dot { background-color: #f56c6c; }
.status-valid { color: #3b82f6; }
.status-valid .dot { background-color: #3b82f6; }
.status-rejected { color: #ef4444; }
.status-rejected .dot { background-color: #ef4444; }
.status-adopted { color: #10b981; }
.status-adopted .dot { background-color: #10b981; }

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

/* 右侧详情面板 */
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-text-primary);
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
}

.title-decor {
  width: 4px;
  height: 14px;
  background-color: var(--admin-accent);
  border-radius: 2px;
  margin-right: 8px;
  display: inline-block;
}

.user-meta {
  font-size: 11px;
  color: var(--admin-text-secondary);
  font-weight: 400;
}

.content-box {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--admin-card-border);
  border-radius: 8px;
  padding: 14px;
}

.content-text {
  font-size: 13px;
  color: var(--admin-text-primary);
  line-height: 1.6;
  margin: 0;
}

.image-gallery {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.detail-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--admin-card-border);
  transition: transform 0.2s;
}
.detail-image:hover {
  transform: scale(1.05);
}

/* AI 专区 */
.ai-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
}
.ai-title {
  color: #818cf8;
}
.ai-decor {
  background-color: #818cf8;
}
.ai-icon {
  margin-right: 4px;
  vertical-align: middle;
}

/* 环形图表 */
.ai-score-dashboard {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.1);
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.radial-score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
}

.circular-chart {
  display: block;
  max-width: 72px;
  max-height: 72px;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

.circular-chart.green .circle { stroke: #10b981; }
.circular-chart.orange .circle { stroke: #f59e0b; }
.circular-chart.red .circle { stroke: #ef4444; }

.percentage {
  fill: var(--admin-text-primary);
  font-family: monospace;
  font-size: 9.5px;
  text-anchor: middle;
  font-weight: 700;
}

.dashboard-label {
  font-size: 11px;
  color: var(--admin-text-secondary);
  margin-top: 6px;
  font-weight: 500;
}

.ai-dimensions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.dimension-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.dim-label {
  color: var(--admin-text-secondary);
  min-width: 72px;
}

.dim-tag {
  border-radius: 4px;
}

.constructive-level {
  font-weight: 600;
}
.constructive-level.high { color: #10b981; }
.constructive-level.low { color: #94a3b8; }

.ai-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ai-item .label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 600;
}
.ai-text-reason {
  background: rgba(0, 0, 0, 0.15);
  border-left: 3px solid #818cf8;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--admin-text-primary);
  margin: 0;
  border-radius: 0 8px 8px 0;
}

.ai-empty-box {
  text-align: center;
  padding: 24px 0;
  color: var(--admin-text-secondary);
  font-size: 12px;
}
.loading-icon {
  font-size: 20px;
  margin-bottom: 6px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 常用模版选择器 */
.template-selector {
  margin-bottom: 16px;
  background: rgba(99, 102, 241, 0.04);
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-left: 4px solid var(--admin-accent);
}

.template-label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 600;
}

.template-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tpl-tag {
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--admin-card-border);
  color: var(--admin-text-primary);
  border-radius: 6px;
}

.tpl-tag:hover {
  background: rgba(99, 102, 241, 0.15) !important;
  color: #a5b4fc !important;
  border-color: rgba(99, 102, 241, 0.4) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

/* 审核操作 */
.review-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.review-actions :deep(.el-button) {
  flex: 1;
  border-radius: 10px;
  font-weight: 600;
  height: 42px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-reject {
  background: rgba(244, 63, 94, 0.1) !important;
  border: 1px solid rgba(244, 63, 94, 0.2) !important;
  color: #fb7185 !important;
}
.btn-reject:hover {
  background: linear-gradient(135deg, #f43f5e, #e11d48) !important;
  border-color: #f43f5e !important;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4);
}

.btn-approve {
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  color: #60a5fa !important;
}
.btn-approve:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.btn-adopt {
  background: rgba(16, 185, 129, 0.1) !important;
  border: 1px solid rgba(16, 185, 129, 0.2) !important;
  color: #34d399 !important;
}
.btn-adopt:hover {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

/* 审核Timeline风格日志 */
.review-timeline {
  padding: 6px 10px 0 10px;
}
.review-timeline :deep(.el-timeline-item__node) {
  background-color: var(--admin-accent);
}
.review-timeline :deep(.el-timeline-item__tail) {
  border-left-color: var(--admin-card-border);
}

.timeline-detail {
  font-size: 12px;
  color: var(--admin-text-secondary);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.timeline-log-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--admin-card-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.log-row {
  display: flex;
  font-size: 13px;
  line-height: 1.6;
}

.log-label {
  color: var(--admin-text-secondary);
  min-width: 72px;
  font-weight: 600;
}

.log-tag {
  border-radius: 4px;
}

.remark-text {
  color: var(--admin-text-primary);
  margin: 0;
  line-height: 1.6;
}

.official-reply-container {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.15);
  padding: 12px 16px;
  border-radius: 8px;
  flex: 1;
  box-shadow: inset 0 0 12px rgba(16, 185, 129, 0.02);
}

.reply-text-content {
  color: #34d399;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
  font-size: 13px;
}

.reply-time {
  font-size: 10px;
  color: #10b981;
  margin-top: 6px;
  display: block;
}

.empty-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 500px;
}

/* 覆盖输入框背景样式，实现毛玻璃化表单 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: var(--admin-input-bg) !important;
  border: 1px solid var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  padding: 10px 14px !important;
}

:deep(.el-input__inner) {
  color: var(--admin-text-primary) !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: rgba(99, 102, 241, 0.45) !important;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.08) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: var(--admin-accent) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}

:deep(.el-select__wrapper) {
  background-color: var(--admin-input-bg) !important;
  border: 1px solid var(--admin-input-border) !important;
  color: var(--admin-text-primary) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  height: 38px !important;
}
:deep(.el-select__wrapper:hover) {
  border-color: rgba(99, 102, 241, 0.45) !important;
}
:deep(.el-select__wrapper.is-focused) {
  border-color: var(--admin-accent) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}
:deep(.el-select__placeholder) {
  color: var(--admin-text-secondary) !important;
}
</style>
