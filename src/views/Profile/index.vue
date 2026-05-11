<template>
  <AppLayout>
    <div class="profile-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">学习画像</h1>
          <p class="page-desc">系统通过学习行为分析，构建你的个性化学习特征</p>
        </div>
        <div class="header-right">
          <el-button @click="openEditDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑画像
          </el-button>
        </div>
      </div>

      <!-- 用户基本信息 -->
      <section class="section user-info-card">
        <div class="user-header">
          <div class="user-avatar-large">
            <img :src="userInfo.avatar || '/default-avatar.png'" alt="头像" />
            <label class="avatar-edit" :class="{ uploading }">
              <svg v-if="!uploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span v-else class="upload-spinner"></span>
              <input type="file" accept="image/*" hidden @change="handleAvatarChange" />
            </label>
          </div>
          <div class="user-details">
            <h2 class="user-name">{{ userInfo.name }}</h2>
            <div class="user-tags">
              <span class="user-tag">{{ userInfo.identity }}</span>
              <span class="user-tag">{{ userInfo.direction }}</span>
              <span class="user-tag level">{{ userInfo.level }}</span>
            </div>
            <p class="user-goal">
              <span class="goal-label">学习目标：</span>
              {{ userInfo.goal }}
            </p>
            <div class="user-meta">
              <span>加入学习 {{ userInfo.joinDays }} 天</span>
              <span>·</span>
              <span>完成 {{ userInfo.completedTasks }} 个任务</span>
              <span>·</span>
              <span>学习 {{ userInfo.totalHours }} 小时</span>
            </div>
          </div>
          <div class="user-score-card">
            <div class="score-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-light)" stroke-width="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="url(#profileGrad)" stroke-width="6"
                  stroke-linecap="round"
                  :stroke-dasharray="`${userInfo.overallMastery * 2.136} 213.6`"
                  transform="rotate(-90 40 40)"/>
                <defs>
                  <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b5bdb"/>
                    <stop offset="100%" style="stop-color:#12b886"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="score-text">
                <span class="score-value">{{ userInfo.overallMastery }}</span>
                <span class="score-label">掌握度</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="profile-grid">
        <!-- 学习偏好 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
                </svg>
              </span>
              学习偏好分析
            </h3>
          </div>

          <div class="preference-list">
            <div class="pref-item">
              <div class="pref-header">
                <span class="pref-label">内容形式偏好</span>
                <span class="pref-value">{{ preferences.contentStyle }}</span>
              </div>
              <div class="pref-bar">
                <div class="pref-bar-fill" style="width: 85%"></div>
              </div>
              <div class="pref-tags">
                <span v-for="tag in preferences.contentTags" :key="tag" class="pref-tag">{{ tag }}</span>
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-header">
                <span class="pref-label">学习时段</span>
                <span class="pref-value">{{ preferences.learningTime }}</span>
              </div>
              <div class="time-chart">
                <div
                  v-for="(hour, idx) in preferences.weeklyActivity"
                  :key="idx"
                  class="hour-bar"
                  :style="{ height: hour + '%' }"
                  :title="`周${idx === 0 ? '一' : idx === 1 ? '二' : idx === 2 ? '三' : idx === 3 ? '四' : idx === 4 ? '五' : idx === 5 ? '六' : '日'} ${hour}%`"
                >
                  <span class="hour-label">{{ ['一', '二', '三', '四', '五', '六', '日'][idx] }}</span>
                </div>
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-header">
                <span class="pref-label">学习节奏</span>
                <span class="pref-value">{{ preferences.learningPace }}</span>
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-header">
                <span class="pref-label">理解深度</span>
                <span class="pref-value">{{ preferences.depthPreference }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 知识掌握雷达 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
                  <polyline points="17,6 23,6 23,12"/>
                </svg>
              </span>
              知识点掌握雷达
            </h3>
          </div>

          <div class="radar-chart">
            <svg viewBox="0 0 300 300">
              <defs>
                <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b5bdb;stop-opacity:0.3"/>
                  <stop offset="100%" style="stop-color:#12b886;stop-opacity:0.3"/>
                </linearGradient>
              </defs>

              <!-- 背景网格 -->
              <g class="radar-grid">
                <polygon v-for="level in [0.2, 0.4, 0.6, 0.8, 1]"
                  :key="level"
                  :points="getRadarPolygon(150, 150, 120 * level)"
                  fill="none" stroke="var(--border-light)" stroke-width="1"
                />
              </g>

              <!-- 轴线 -->
              <line v-for="(axis, idx) in radarAxes" :key="idx"
                :x1="150" :y1="150"
                :x2="150 + 120 * Math.cos((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                :y2="150 + 120 * Math.sin((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                stroke="var(--border-light)" stroke-width="1"
              />

              <!-- 数据区域 -->
              <polygon
                :points="getRadarDataPoints()"
                fill="url(#radarFill)"
                stroke="url(#profileGrad)"
                stroke-width="2"
              />

              <!-- 数据点 -->
              <circle v-for="(point, idx) in getRadarDataPointsArray()" :key="idx"
                :cx="point.x" :cy="point.y" r="5"
                fill="#3b5bdb"
                stroke="white"
                stroke-width="2"
              />

              <!-- 标签 -->
              <text v-for="(axis, idx) in radarAxes" :key="'label-' + idx"
                :x="150 + 140 * Math.cos((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                :y="150 + 140 * Math.sin((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="11"
                fill="var(--text-secondary)"
              >
                {{ axis.name }}
              </text>

              <!-- 数值 -->
              <text v-for="(axis, idx) in radarAxes" :key="'value-' + idx"
                :x="150 + 160 * Math.cos((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                :y="150 + 160 * Math.sin((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                text-anchor="middle"
                font-size="10"
                fill="var(--primary-color)"
                font-weight="600"
              >
                {{ axis.value }}%
              </text>
            </svg>
          </div>
        </section>

        <!-- 薄弱点分析 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </span>
              薄弱知识点
              <span class="section-badge warning">{{ weakPoints.length }} 个</span>
            </h3>
          </div>

          <div class="weak-list">
            <div
              v-for="(wp, idx) in weakPoints"
              :key="wp.id"
              class="weak-item"
            >
              <div class="weak-rank">{{ idx + 1 }}</div>
              <div class="weak-info">
                <div class="weak-header">
                  <span class="weak-name">{{ wp.name }}</span>
                  <span class="weak-rate" :style="{ color: getWeakColor(wp.rate) }">{{ wp.rate }}%</span>
                </div>
                <div class="weak-bar">
                  <div class="weak-bar-fill" :style="{ width: wp.rate + '%', background: getWeakColor(wp.rate) }"></div>
                </div>
                <div class="weak-meta">
                  <span>错误次数：{{ wp.wrongCount }}</span>
                  <span>上次出现：{{ wp.lastAppear }}</span>
                  <span>建议：{{ wp.suggestion }}</span>
                </div>
              </div>
              <el-button size="small" type="primary" @click="$router.push('/study/' + wp.id)">
                去巩固
              </el-button>
            </div>
          </div>
        </section>

        <!-- 学习行为分析 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
                  <polyline points="17,6 23,6 23,12"/>
                </svg>
              </span>
              学习行为分析
            </h3>
          </div>

          <div class="behavior-grid">
            <div class="behavior-card">
              <div class="b-icon accent-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div class="b-info">
                <span class="b-value">{{ behaviorStats.streak }}</span>
                <span class="b-label">连续学习天数</span>
              </div>
            </div>
            <div class="behavior-card">
              <div class="b-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div class="b-info">
                <span class="b-value">{{ behaviorStats.avgDaily }}</span>
                <span class="b-label">日均学习时长</span>
              </div>
            </div>
            <div class="behavior-card">
              <div class="b-icon primary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div class="b-info">
                <span class="b-value">{{ behaviorStats.tasksThisWeek }}</span>
                <span class="b-label">本周任务数</span>
              </div>
            </div>
            <div class="behavior-card">
              <div class="b-icon success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div class="b-info">
                <span class="b-value">{{ behaviorStats.completionRate }}%</span>
                <span class="b-label">任务完成率</span>
              </div>
            </div>
          </div>

          <div class="trend-section">
            <h4>学习趋势（近30天）</h4>
            <div class="trend-chart">
              <svg viewBox="0 0 600 100" class="trend-svg">
                <defs>
                  <linearGradient id="trendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b5bdb;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#3b5bdb;stop-opacity:0"/>
                  </linearGradient>
                </defs>
                <path :d="trendAreaPath" fill="url(#trendFill)"/>
                <path :d="trendLinePath" fill="none" stroke="#3b5bdb" stroke-width="2"/>
              </svg>
            </div>
          </div>
        </section>
      </div>

      <!-- 各学习空间画像 -->
      <section class="section space-profiles-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            各学习空间画像
            <span class="section-badge">AI 持续分析</span>
          </h3>
        </div>

        <div class="space-profile-grid">
          <div
            v-for="sp in spaceProfiles"
            :key="sp.id"
            class="space-profile-card"
          >
            <div class="sp-card-header">
              <span class="sp-icon">{{ sp.icon }}</span>
              <div class="sp-header-info">
                <h4 class="sp-name">{{ sp.name }}</h4>
                <span class="sp-status" :class="sp.status">{{ sp.statusLabel }}</span>
              </div>
              <span class="sp-progress-text">{{ sp.mastery }}%</span>
            </div>

            <div class="sp-progress">
              <div class="sp-progress-bar" :style="{ width: sp.mastery + '%', background: sp.color }"></div>
            </div>

            <div class="sp-details">
              <div class="sp-detail-row">
                <span class="sp-detail-label">强项</span>
                <div class="sp-tags">
                  <span v-for="s in sp.strengths" :key="s" class="sp-tag strength">{{ s }}</span>
                </div>
              </div>
              <div class="sp-detail-row">
                <span class="sp-detail-label">薄弱</span>
                <div class="sp-tags">
                  <span v-for="w in sp.weaknesses" :key="w" class="sp-tag weakness">{{ w }}</span>
                </div>
              </div>
              <div class="sp-detail-row">
                <span class="sp-detail-label">偏好</span>
                <span class="sp-detail-value">{{ sp.preference }}</span>
              </div>
              <div class="sp-detail-row">
                <span class="sp-detail-label">节奏</span>
                <span class="sp-detail-value">{{ sp.pace }}</span>
              </div>
            </div>

            <div class="sp-alert" v-if="sp.alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ sp.alert }}
            </div>
          </div>
        </div>
      </section>

      <!-- 编辑画像对话框 -->
      <el-dialog v-model="showEditDialog" title="编辑用户资料" width="520px">
        <div class="edit-form">
          <div class="form-item">
            <label>昵称</label>
            <el-input v-model="editData.username" placeholder="请输入昵称" />
          </div>
          <div class="form-item">
            <label>性别</label>
            <el-select v-model="editData.gender" style="width: 100%;">
              <el-option label="未设置" :value="0" />
              <el-option label="男" :value="1" />
              <el-option label="女" :value="2" />
            </el-select>
          </div>
          <div class="form-item">
            <label>生日</label>
            <el-date-picker
              v-model="editData.birthday"
              type="date"
              placeholder="选择日期"
              style="width: 100%;"
              value-format="YYYY-MM-DD"
            />
          </div>
          <div class="form-item">
            <label>个人简介</label>
            <el-input type="textarea" v-model="editData.bio" :rows="3" placeholder="介绍一下自己..." />
          </div>
        </div>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="saveProfile">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/stores/user'

const userStore = useUserStore()
const showEditDialog = ref(false)

// 各学习空间画像
const spaceProfiles = ref([
  {
    id: 'math', name: '高等数学', icon: '📐', status: 'warning', statusLabel: '需关注',
    mastery: 42, color: '#3b82f6',
    strengths: ['函数概念', '极限计算'],
    weaknesses: ['洛必达法则', '证明题'],
    preference: '例题驱动、分步讲解',
    pace: '中速，需要反复练习',
    alert: '洛必达法则适用条件连续出错，正确率降至40%'
  },
  {
    id: 'english', name: '英语四级', icon: '📝', status: 'normal', statusLabel: '稳定',
    mastery: 61, color: '#10b981',
    strengths: ['词汇记忆', '阅读理解'],
    weaknesses: ['听力理解', '写作'],
    preference: '短时高频、碎片化复习',
    pace: '匀速，每日坚持',
    alert: ''
  },
  {
    id: 'se', name: '软件工程', icon: '💻', status: 'danger', statusLabel: '有风险',
    mastery: 35, color: '#f59e0b',
    strengths: ['实践能力', '团队协作'],
    weaknesses: ['需求文档', 'UML建模'],
    preference: '案例驱动、动手实践',
    pace: '偏慢，项目型推进',
    alert: '项目延期1天'
  },
  {
    id: 'os', name: '操作系统', icon: '⚙️', status: 'good', statusLabel: '良好',
    mastery: 70, color: '#8b5cf6',
    strengths: ['进程概念', '内存管理'],
    weaknesses: ['PV操作', '同步互斥'],
    preference: '图解辅助、对比记忆',
    pace: '较快，概念理解强',
    alert: ''
  }
])
const uploading = ref(false)

const editData = reactive({
  username: '',
  gender: 0,
  birthday: '',
  bio: ''
})

const userInfo = computed(() => {
  const u = userStore.userInfo
  if (!u) {
    return {
      name: '未登录',
      avatar: '',
      identity: '',
      direction: '',
      level: '',
      goal: '',
      joinDays: 0,
      completedTasks: 0,
      totalHours: 0,
      overallMastery: 0
    }
  }
  return {
    name: u.username || '用户',
    avatar: u.avatarUrl || '',
    identity: u.role === 1 ? '教师' : '学生',
    direction: '',
    level: '',
    goal: u.bio || '还没有填写个人简介',
    joinDays: 0,
    completedTasks: 0,
    totalHours: 0,
    overallMastery: 0
  }
})

const preferences = ref({
  contentStyle: '可视化优先（图解 > 视频 > 纯文字）',
  contentTags: ['思维导图', '动画演示', '代码示例', '生活类比'],
  learningTime: '晚上 8-10 点',
  learningPace: '稳扎稳打型（每天30-60分钟）',
  depthPreference: '理解原理 + 注重应用',
  weeklyActivity: [65, 45, 80, 30, 70, 90, 55]
})

const radarAxes = ref([
  { name: '概念理解', value: 72 },
  { name: '计算分析', value: 58 },
  { name: '代码实现', value: 45 },
  { name: '综合应用', value: 63 },
  { name: '错题复习', value: 40 },
  { name: '知识迁移', value: 55 }
])

const weakPoints = ref([
  { id: 1, name: 'PV操作', rate: 35, wrongCount: 12, lastAppear: '2天前', suggestion: '专项练习' },
  { id: 2, name: '死锁条件', rate: 42, wrongCount: 8, lastAppear: '3天前', suggestion: '图解记忆' },
  { id: 3, name: '页面置换算法', rate: 50, wrongCount: 5, lastAppear: '5天前', suggestion: '对比练习' },
  { id: 4, name: '进程状态转换', rate: 55, wrongCount: 4, lastAppear: '1周前', suggestion: '画图理解' },
  { id: 5, name: '调度算法', rate: 58, wrongCount: 3, lastAppear: '1周前', suggestion: '计算练习' }
])

const behaviorStats = ref({
  streak: 12,
  avgDaily: '45分钟',
  tasksThisWeek: 8,
  completionRate: 85
})

// 生成学习趋势数据
const trendData = [30, 45, 35, 50, 40, 60, 55, 70, 65, 50, 45, 60, 75, 70, 80, 65, 55, 70, 85, 75, 60, 70, 80, 75, 85, 70, 60, 80, 90, 85]

const trendLinePath = computed(() => {
  const max = Math.max(...trendData)
  const min = Math.min(...trendData)
  const range = max - min || 1
  const w = 600 / (trendData.length - 1)
  const h = 80

  return trendData.map((v, i) => {
    const x = i * w
    const y = h - ((v - min) / range * h) + 10
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const trendAreaPath = computed(() => {
  return trendLinePath.value + ` L ${600} 100 L 0 100 Z`
})

const getRadarPolygon = (cx: number, cy: number, r: number) => {
  const n = 6
  return Array.from({ length: n }, (_, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

const getRadarDataPointsArray = () => {
  const cx = 150, cy = 150, r = 120
  const n = radarAxes.value.length
  return radarAxes.value.map((axis, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2
    return {
      x: cx + r * (axis.value / 100) * Math.cos(angle),
      y: cy + r * (axis.value / 100) * Math.sin(angle)
    }
  })
}

const getRadarDataPoints = () => {
  return getRadarDataPointsArray()
    .map(p => `${p.x},${p.y}`)
    .join(' ')
}

const getWeakColor = (rate: number) => {
  if (rate >= 60) return '#ef4444'
  if (rate >= 40) return '#f59e0b'
  return '#64748b'
}

const saveProfile = async () => {
  try {
    await userStore.updateProfile({
      username: editData.username,
      gender: editData.gender,
      birthday: editData.birthday || undefined,
      bio: editData.bio
    })
    ElMessage.success('资料更新成功')
    showEditDialog.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败')
  }
}

const handleAvatarChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、GIF、WebP 格式')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  try {
    uploading.value = true
    await userStore.uploadAvatar(file)
    ElMessage.success('头像更新成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const openEditDialog = () => {
  const u = userStore.userInfo
  if (u) {
    editData.username = u.username || ''
    editData.gender = u.gender ?? 0
    editData.birthday = u.birthday || ''
    editData.bio = u.bio || ''
  }
  showEditDialog.value = true
}

onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
  } catch {}
})
</script>

<style scoped>
.profile-page {
  max-width: 1100px;
  height: calc(100vh - var(--header-height) - 2 * var(--spacing-xl));
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

/* 用户信息卡片 */
.user-info-card {
  margin-bottom: var(--spacing-xl);
}

.user-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.user-avatar-large {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid white;
}

.avatar-edit.uploading {
  pointer-events: none;
  opacity: 0.8;
}

.avatar-edit svg {
  width: 14px;
  height: 14px;
  color: white;
}

.upload-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.user-tags {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.user-tag {
  padding: 2px 10px;
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.user-tag.level {
  background: rgba(18, 184, 134, 0.08);
  color: var(--accent-color);
}

.user-goal {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.goal-label {
  font-weight: 600;
  color: var(--text-dark);
}

.user-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.user-score-card {
  flex-shrink: 0;
}

.score-ring {
  width: 100px;
  height: 100px;
  position: relative;
}

.score-ring svg {
  width: 100%;
  height: 100%;
}

.score-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
}

.score-label {
  font-size: 0.625rem;
  color: var(--text-muted);
}

/* 画像网格 */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
}

.section-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.section-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
.section-icon svg { width: 100%; height: 100%; }
.section-icon.warning-icon { color: var(--warning-color); }

.section-badge {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
}

.section-badge.warning {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

/* 学习偏好 */
.pref-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.pref-item {}

.pref-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.pref-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.pref-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.pref-bar {
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.pref-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, #12b886);
  border-radius: var(--radius-full);
}

.pref-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pref-tag {
  padding: 2px 8px;
  background: rgba(59, 91, 219, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  color: var(--primary-color);
}

.time-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  height: 50px;
}

.hour-bar {
  flex: 1;
  background: linear-gradient(180deg, #3b5bdb, #12b886);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  transition: height 0.3s ease;
}

.hour-label {
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

/* 雷达图 */
.radar-chart {
  display: flex;
  justify-content: center;
}

.radar-chart svg {
  max-width: 300px;
  height: auto;
}

/* 薄弱点 */
.weak-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.weak-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.weak-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.weak-info {
  flex: 1;
}

.weak-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.weak-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.weak-rate {
  font-size: 0.875rem;
  font-weight: 700;
}

.weak-bar {
  height: 4px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.weak-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
}

.weak-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 学习行为 */
.behavior-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.behavior-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.b-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.b-icon svg { width: 20px; height: 20px; }
.b-icon.accent-icon { color: var(--accent-warm); }
.b-icon.primary-icon { color: var(--primary-color); }
.b-icon.success-icon { color: var(--accent-color); }

.b-info {
  display: flex;
  flex-direction: column;
}

.b-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1;
}

.b-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.trend-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-md);
}

.trend-svg {
  width: 100%;
  height: 100px;
}

/* 编辑表单 */
.edit-form .form-item {
  margin-bottom: var(--spacing-lg);
}

.edit-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .behavior-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  .user-tags {
    justify-content: center;
  }
  .user-meta {
    justify-content: center;
  }
}

/* 各学习空间画像 */
.space-profiles-section {
  margin-top: var(--spacing-lg);
}

.space-profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.space-profile-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
}

.sp-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.sp-icon { font-size: 1.25rem; flex-shrink: 0; }

.sp-header-info {
  flex: 1;
  min-width: 0;
}

.sp-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.sp-status {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  &.normal { color: var(--primary-color); background: rgba(59, 91, 219, 0.06); }
  &.warning { color: var(--warn-color); background: rgba(245, 158, 11, 0.06); }
  &.danger { color: var(--danger-color); background: rgba(239, 68, 68, 0.06); }
  &.good { color: var(--accent-color); background: rgba(16, 185, 129, 0.06); }
}

.sp-progress-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark);
  flex-shrink: 0;
}

.sp-progress {
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
  overflow: hidden;
}

.sp-progress-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

.sp-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sp-detail-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.sp-detail-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  min-width: 32px;
  flex-shrink: 0;
}

.sp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sp-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);

  &.strength { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  &.weakness { background: rgba(239, 68, 68, 0.06); color: #ef4444; }
}

.sp-detail-value {
  font-size: 0.75rem;
  color: var(--text-regular);
}

.sp-alert {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: var(--spacing-sm);
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.04);
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  color: var(--danger-color);
  svg { flex-shrink: 0; margin-top: 1px; }
}
</style>
