<template>
  <div class="admin-dashboard-view">
    <!-- 顶部欢迎区 -->
    <div class="dashboard-welcome">
      <div class="welcome-left">
        <h1 class="welcome-title">系统大盘看板</h1>
        <p class="welcome-desc">实时监控 AI 智能体运行、向量化任务队列及系统用户交互数据</p>
      </div>
      <div class="welcome-right">
        <el-button type="primary" :icon="Refresh" @click="fetchAllData" :loading="loading">刷新大盘</el-button>
      </div>
    </div>

    <!-- 数据指标卡片 -->
    <div class="stats-grid" v-loading="loading">
      <div class="stat-glass-card user-card">
        <div class="card-glow"></div>
        <div class="stat-content">
          <div class="stat-label">知序累计学员总数</div>
          <div class="stat-value">{{ stats.userCount }}</div>
          <div class="stat-badge success">在线课堂正常</div>
        </div>
        <div class="stat-icon-wrap">
          <el-icon><User /></el-icon>
        </div>
      </div>

      <div class="stat-glass-card agent-card">
        <div class="card-glow"></div>
        <div class="stat-content">
          <div class="stat-label">今日 Agent 推荐调用</div>
          <div class="stat-value">{{ stats.agentExecutionCount }}</div>
          <div class="stat-badge primary">智能推荐引擎活跃</div>
        </div>
        <div class="stat-icon-wrap">
          <el-icon><Cpu /></el-icon>
        </div>
      </div>

      <div class="stat-glass-card rag-card">
        <div class="card-glow"></div>
        <div class="stat-content">
          <div class="stat-label">排队中 RAG 向量化任务</div>
          <div class="stat-value">{{ stats.pendingRAGJobCount }}</div>
          <div class="stat-badge warning">正在分块嵌入</div>
        </div>
        <div class="stat-icon-wrap">
          <el-icon><Connection /></el-icon>
        </div>
      </div>

      <div class="stat-glass-card feedback-card">
        <div class="card-glow"></div>
        <div class="stat-content">
          <div class="stat-label">待复核学情反馈</div>
          <div class="stat-value">{{ stats.pendingFeedbackCount }}</div>
          <div class="stat-badge danger" v-if="stats.pendingFeedbackCount > 0">需人工审阅</div>
          <div class="stat-badge info" v-else>暂无积压</div>
        </div>
        <div class="stat-icon-wrap">
          <el-icon><ChatLineRound /></el-icon>
        </div>
      </div>
    </div>

    <!-- 图表分析区 -->
    <el-row :gutter="24" class="charts-row">
      <!-- 左侧：AI 趋势折线图 -->
      <el-col :span="16">
        <el-card class="chart-glass-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>近 7 日 AI 工具调用成功与失败趋势</span>
              <el-tag type="success" effect="plain" size="small">实时审计数据</el-tag>
            </div>
          </template>
          <div id="trend-chart" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 右侧：文件格式分布 -->
      <el-col :span="8">
        <el-card class="chart-glass-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>知识库文件格式分布</span>
            </div>
          </template>
          <div id="file-chart" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方反馈占比大盘 -->
    <el-row :gutter="24" class="charts-row" style="margin-top: 24px;">
      <el-col :span="8">
        <el-card class="chart-glass-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>用户反馈类别占比</span>
            </div>
          </template>
          <div id="feedback-chart" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="chart-glass-card quick-links-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>管理便捷工作通道</span>
            </div>
          </template>
          <div class="quick-links-grid">
            <div class="quick-link-item" @click="$router.push('/admin/agent')">
              <el-icon class="link-icon" style="color: #6366f1;"><Cpu /></el-icon>
              <h4>智能体观测中心</h4>
              <p>查看系统每次 Tool 的调用参数、结果及耗时报表</p>
            </div>
            <div class="quick-link-item" @click="$router.push('/admin/rag')">
              <el-icon class="link-icon" style="color: #06b6d4;"><Connection /></el-icon>
              <h4>RAG 任务队列</h4>
              <p>监控文档分块向量化进度，处理出错的知识库任务</p>
            </div>
            <div class="quick-link-item" @click="$router.push('/admin/feedback')">
              <el-icon class="link-icon" style="color: #10b981;"><ChatLineRound /></el-icon>
              <h4>反馈复核决策</h4>
              <p>进行用户意见初审与复核，官方在线实时回信</p>
            </div>
            <div class="quick-link-item" @click="$router.push('/admin/prize')">
              <el-icon class="link-icon" style="color: #f59e0b;"><Present /></el-icon>
              <h4>奖励方案管理</h4>
              <p>向提交优质建议的用户发放兑换奖品</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, inject, watch } from 'vue'
import { Refresh, User, Cpu, Connection, ChatLineRound, Present } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import request from '@/api/request'

const loading = ref(false)

// 注入来自 AdminLayout.vue 的 isDark 暗黑主题标志
const isDark = inject<any>('isDark', ref(true))

// 汇总卡片数据
const stats = ref({
  userCount: 0,
  agentExecutionCount: 0,
  pendingRAGJobCount: 0,
  pendingFeedbackCount: 0
})

// 图表实例
let trendChartInstance: echarts.ECharts | null = null
let fileChartInstance: echarts.ECharts | null = null
let feedbackChartInstance: echarts.ECharts | null = null

// 监听黑白主题状态变化，动态重新绘制图表，以适配白色/黑色底色
watch(() => isDark.value, async () => {
  await nextTick()
  // 销毁再重建，确保 ECharts 主题自适应更改
  if (latestChartData.value) {
    renderTrendChart(latestChartData.value)
    renderFileChart(latestChartData.value.fileTypeDistribution)
    renderFeedbackChart(latestChartData.value.feedbackTypeDistribution)
  }
})

// 缓存最新的图表数据
const latestChartData = ref<any>(null)

const fetchAllData = async () => {
  loading.value = true
  try {
    // 1. 获取汇总卡片
    const statsRes = await request.get('/admin/dashboard/stats')
    if (statsRes.data && statsRes.data.code === 200) {
      stats.value = statsRes.data.data
    } else {
      stats.value = statsRes.data || stats.value
    }

    // 2. 获取图表分析数据
    const chartsRes = await request.get('/admin/dashboard/charts')
    if (chartsRes.data && chartsRes.data.code === 200) {
      latestChartData.value = chartsRes.data.data
      await nextTick()
      renderTrendChart(latestChartData.value)
      renderFileChart(latestChartData.value.fileTypeDistribution)
      renderFeedbackChart(latestChartData.value.feedbackTypeDistribution)
    }
  } catch (error) {
    console.error('获取后台大盘数据失败', error)
    ElMessage.error('无法加载系统大盘监控数据，请确保后端服务正常运行')
  } finally {
    loading.value = false
  }
}

// 趋势折线图
const renderTrendChart = (data: any) => {
  const chartDom = document.getElementById('trend-chart')
  if (!chartDom) return
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  
  // 明亮模式下采用 default 样式，暗黑模式下采用 dark
  trendChartInstance = echarts.init(chartDom, isDark.value ? 'dark' : undefined)
  
  const textColor = isDark.value ? '#9ca3af' : '#475569'
  const lineColor = isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
  const splitLineColor = isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
  const tooltipBg = isDark.value ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  const tooltipText = isDark.value ? '#f3f4f6' : '#0f172a'

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: lineColor,
      textStyle: { color: tooltipText }
    },
    legend: {
      data: ['成功调用', '失败拦截'],
      textStyle: { color: textColor },
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.trendDates || [],
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLineColor } }
    },
    series: [
      {
        name: '成功调用',
        type: 'line',
        smooth: true,
        data: data.successCounts || [],
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ])
        }
      },
      {
        name: '失败拦截',
        type: 'line',
        smooth: true,
        data: data.failCounts || [],
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0)' }
          ])
        }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 格式分布饼图
const renderFileChart = (data: any[]) => {
  const chartDom = document.getElementById('file-chart')
  if (!chartDom) return
  
  if (fileChartInstance) {
    fileChartInstance.dispose()
  }
  
  fileChartInstance = echarts.init(chartDom, isDark.value ? 'dark' : undefined)
  
  const textColor = isDark.value ? '#9ca3af' : '#475569'
  const sliceBorderColor = isDark.value ? '#111827' : '#ffffff'
  const tooltipBg = isDark.value ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  const tooltipText = isDark.value ? '#f3f4f6' : '#0f172a'

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: tooltipText }
    },
    series: [
      {
        name: '格式占比',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: sliceBorderColor,
          borderWidth: 2
        },
        label: {
          show: true,
          color: textColor
        },
        data: data && data.length > 0 ? data : [{ name: '无数据', value: 0 }]
      }
    ]
  }
  
  fileChartInstance.setOption(option)
}

// 反馈占比饼图
const renderFeedbackChart = (data: any[]) => {
  const chartDom = document.getElementById('feedback-chart')
  if (!chartDom) return
  
  if (feedbackChartInstance) {
    feedbackChartInstance.dispose()
  }
  
  feedbackChartInstance = echarts.init(chartDom, isDark.value ? 'dark' : undefined)
  
  const textColor = isDark.value ? '#9ca3af' : '#475569'
  const tooltipBg = isDark.value ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  const tooltipText = isDark.value ? '#f3f4f6' : '#0f172a'

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: tooltipText }
    },
    series: [
      {
        name: '反馈类别占比',
        type: 'pie',
        radius: '65%',
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 8
        },
        label: {
          show: true,
          color: textColor
        },
        data: data && data.length > 0 ? data : [{ name: '无数据', value: 0 }]
      }
    ]
  }
  
  feedbackChartInstance.setOption(option)
}

const handleResize = () => {
  trendChartInstance?.resize()
  fileChartInstance?.resize()
  feedbackChartInstance?.resize()
}

onMounted(() => {
  fetchAllData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  fileChartInstance?.dispose()
  feedbackChartInstance?.dispose()
})
</script>

<style scoped>
.admin-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  /* 文字渐变，在暗黑和明亮下都表现突出 */
  background: linear-gradient(135deg, var(--admin-text-primary) 0%, var(--admin-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-desc {
  color: var(--admin-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

/* 渐变发光毛玻璃卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-glass-card {
  position: relative;
  background: var(--admin-card-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--admin-card-border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  box-shadow: var(--admin-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-glass-card:hover {
  transform: translateY(-5px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.2);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0) 70%);
  pointer-events: none;
  transition: all 0.3s;
}

.stat-glass-card:hover .card-glow {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.stat-label {
  font-size: 14px;
  color: var(--admin-text-secondary);
  font-weight: 600;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--admin-text-primary);
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.5px;
}

.stat-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  align-self: flex-start;
  margin-top: 4px;
}

.stat-badge.success { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.stat-badge.primary { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.stat-badge.warning { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.stat-badge.danger { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.stat-badge.info { background: rgba(156, 163, 175, 0.12); color: #6b7280; }

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--admin-text-secondary);
  z-index: 2;
  border: 1px solid var(--admin-card-border);
}

.user-card .stat-icon-wrap { color: #6366f1; background: rgba(99, 102, 241, 0.06); }
.agent-card .stat-icon-wrap { color: #10b981; background: rgba(16, 185, 129, 0.06); }
.rag-card .stat-icon-wrap { color: #d97706; background: rgba(245, 158, 11, 0.06); }
.feedback-card .stat-icon-wrap { color: #ef4444; background: rgba(239, 68, 68, 0.06); }

/* 图表卡片 */
.charts-row {
  margin-top: 8px;
}

.chart-glass-card {
  background: var(--admin-card-bg) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid var(--admin-card-border) !important;
  border-radius: 16px !important;
  box-shadow: var(--admin-shadow) !important;
}

.chart-glass-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--admin-card-border);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--admin-text-primary);
}

.chart-box {
  height: 320px;
  width: 100%;
}

/* 工作通道卡片 */
.quick-links-card {
  height: 100%;
}

.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 10px 0;
}

.quick-link-item {
  background: rgba(99, 102, 241, 0.02);
  border: 1px solid var(--admin-card-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-link-item:hover {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
}

.link-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.quick-link-item h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--admin-text-primary);
  margin-bottom: 6px;
}

.quick-link-item p {
  font-size: 12px;
  color: var(--admin-text-secondary);
  line-height: 1.5;
}
</style>
