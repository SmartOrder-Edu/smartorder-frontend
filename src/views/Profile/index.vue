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
            编辑资料
          </el-button>
        </div>
      </div>

      <!-- 画像完整度概览 -->
      <section class="section completeness-bar" v-if="profileData">
        <div class="completeness-info">
          <span class="completeness-label">画像完整度</span>
          <span class="completeness-value">{{ profileData.profileCompleteness ?? 0 }}%</span>
        </div>
        <el-progress
          :percentage="profileData.profileCompleteness ?? 0"
          :stroke-width="8"
          :show-text="false"
          color="linear-gradient(90deg, #3b5bdb, #12b886)"
        />
        <div class="completeness-meta">
          <span>置信度：{{ profileData.profileConfidenceScore ?? 0 }}%</span>
          <span>v{{ profileData.profileVersion ?? 1 }}</span>
          <span v-if="profileData.updatedAt">更新于 {{ formatTime(profileData.updatedAt) }}</span>
        </div>
      </section>

      <!-- 账户与安全整体区域 -->
      <section class="section account-security-container" v-if="userStore.userInfo">
        <!-- 顶部用户信息 Header -->
        <ProfileHeader
          :user-info="userInfoHeaderData"
          :uploading="uploading"
          @avatar-change="handleAvatarChange"
        />



        <!-- 主体双栏内容 -->
        <div class="security-content">
          <!-- 左侧：账户凭证 -->
          <CredentialSection
            :user-info="userCredentialData"
            @edit-profile="openEditDialog"
            @change-email="showEmailDialog = true"
          />

          <!-- 右侧：第三方账号绑定 -->
          <QuickLoginBindingSection
            :gitee-bound="isProviderBound('gitee')"
            :github-bound="isProviderBound('github')"
            :gitee-info="getProviderInfo('gitee')"
            :github-info="getProviderInfo('github')"
            @bind="handleBind"
            @unbind="handleUnbind"
          />
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

          <div v-if="hasPreference" class="preference-list">
            <!-- 资源偏好 -->
            <div class="pref-item" v-if="preferences.resourceTypes.length > 0">
              <div class="pref-header">
                <span class="pref-label">内容形式偏好</span>
              </div>
              <div class="pref-tags">
                <span v-for="tag in preferences.resourceTypes" :key="tag" class="pref-tag">{{ tag }}</span>
              </div>
            </div>

            <!-- 讲解偏好 -->
            <div class="pref-item" v-if="preferences.explanationStyle">
              <div class="pref-header">
                <span class="pref-label">讲解方式</span>
                <span class="pref-value">{{ preferences.explanationStyle }}</span>
              </div>
            </div>

            <!-- 练习偏好 -->
            <div class="pref-item" v-if="preferences.practiceStyle">
              <div class="pref-header">
                <span class="pref-label">练习偏好</span>
                <span class="pref-value">{{ preferences.practiceStyle }}</span>
              </div>
            </div>

            <!-- 反馈偏好 -->
            <div class="pref-item" v-if="preferences.feedbackStyle">
              <div class="pref-header">
                <span class="pref-label">反馈偏好</span>
                <span class="pref-value">{{ preferences.feedbackStyle }}</span>
              </div>
            </div>

            <!-- 交互偏好 -->
            <div class="pref-item" v-if="preferences.interactionStyle">
              <div class="pref-header">
                <span class="pref-label">交互模式</span>
                <span class="pref-value">{{ preferences.interactionStyle }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无学习偏好数据" :image-size="80" />
        </section>

        <!-- 能力雷达图 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
                  <polyline points="17,6 23,6 23,12"/>
                </svg>
              </span>
              综合能力雷达
              <span class="section-badge" v-if="abilityProfile?.overallLevel">
                {{ levelLabels[abilityProfile.overallLevel] || abilityProfile.overallLevel }}
              </span>
            </h3>
          </div>

          <el-skeleton v-if="profileLoading" :rows="5" animated />
          <div v-else-if="radarAxes.length > 0" class="ability-radar-content">
            <div class="radar-summary">
              <span class="summary-label">综合得分</span>
              <strong>{{ Math.round(abilityProfile?.overallScore || 0) }}</strong>
              <span>/ 100</span>
              <p>{{ abilitySummary }}</p>
            </div>
          <div class="radar-chart">
            <svg viewBox="0 -20 300 340" aria-label="六维综合能力雷达图">
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
              <line v-for="(axis, idx) in radarAxes" :key="'axis-' + idx"
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
              <circle v-for="(point, idx) in getRadarDataPointsArray()" :key="'point-' + idx"
                :cx="point.x" :cy="point.y" r="5"
                fill="#3b5bdb"
                stroke="white"
                stroke-width="2"
              />

              <!-- 维度名称与分数：置于图形外圈，避免数据点和文字互相遮挡 -->
              <text v-for="(axis, idx) in radarAxes" :key="'label-' + idx"
                :x="150 + 140 * Math.cos((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                :y="150 + 140 * Math.sin((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2) - 5"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="12"
                font-weight="600"
                fill="var(--text-dark)"
              >
                {{ axis.name }}
              </text>

              <!-- 数值 -->
              <text v-for="(axis, idx) in radarAxes" :key="'value-' + idx"
                :x="150 + 160 * Math.cos((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2)"
                :y="150 + 140 * Math.sin((idx * 2 * Math.PI / radarAxes.length) - Math.PI / 2) + 16"
                text-anchor="middle"
                font-size="13"
                fill="#10bdb7"
                font-weight="700"
              >
                {{ axis.evaluated ? axis.value : '待评估' }}
              </text>
            </svg>
          </div>
          </div>
          <el-empty v-else description="完成学习任务后，将生成六维综合能力雷达" :image-size="80" />
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
              常见误区
              <span class="section-badge warning" v-if="weakPoints.length > 0">{{ weakPoints.length }} 个</span>
            </h3>
          </div>

          <div v-if="weakPoints.length > 0" class="weak-list">
            <div
              v-for="(wp, idx) in weakPoints"
              :key="wp.id"
              class="weak-item"
            >
              <div class="weak-rank">{{ idx + 1 }}</div>
              <div class="weak-info">
                <div class="weak-header">
                  <span class="weak-name">{{ wp.title }}</span>
                  <span class="weak-severity" :class="wp.severity">
                    {{ severityLabels[wp.severity] || wp.severity }}
                  </span>
                </div>
                <p class="weak-desc" v-if="wp.description">{{ wp.description }}</p>
                <div class="weak-symptoms" v-if="wp.symptoms.length > 0">
                  <span class="symptom-label">典型症状：</span>
                  <span v-for="s in wp.symptoms" :key="s" class="symptom-tag">{{ s }}</span>
                </div>
                <div class="weak-meta">
                  <span v-if="wp.frequency">频率：{{ frequencyLabels[wp.frequency] || wp.frequency }}</span>
                  <span v-if="wp.lastObserved">最近出现：{{ formatTime(wp.lastObserved) }}</span>
                </div>
                <div class="weak-actions" v-if="wp.actions.length > 0">
                  <span class="action-label">建议：</span>
                  <span v-for="a in wp.actions" :key="a" class="action-tag">{{ a }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无常见误区数据" :image-size="80" />
        </section>

        <!-- 学习目标 -->
        <section class="section profile-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </span>
              学习目标
            </h3>
          </div>

          <div v-if="learningGoals.length > 0" class="goals-list">
            <div v-for="goal in learningGoals" :key="goal.goalId" class="goal-item">
              <div class="goal-header">
                <span class="goal-title">{{ goal.title || '未命名目标' }}</span>
                <div class="goal-badges">
                  <span class="goal-priority" :class="(goal.priority || '').toLowerCase()">
                    {{ priorityLabels[goal.priority || ''] || goal.priority }}
                  </span>
                  <span class="goal-status" :class="(goal.status || '').toLowerCase()">
                    {{ statusLabels[goal.status || ''] || goal.status }}
                  </span>
                </div>
              </div>
              <p class="goal-desc" v-if="goal.description">{{ goal.description }}</p>
              <div class="goal-progress" v-if="goal.progress">
                <el-progress
                  :percentage="Math.round(goal.progress.progressPercent ?? 0)"
                  :stroke-width="6"
                  color="linear-gradient(90deg, #3b5bdb, #12b886)"
                />
                <span class="progress-detail">
                  {{ goal.progress.completedCriteriaCount ?? 0 }} / {{ goal.progress.totalCriteriaCount ?? 0 }} 项标准达成
                </span>
              </div>
              <div class="goal-meta">
                <span v-if="goal.deadline">截止：{{ goal.deadline }}</span>
                <span v-if="goal.weeklyTimeBudgetMinutes">每周 {{ goal.weeklyTimeBudgetMinutes }} 分钟</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无学习目标数据" :image-size="80" />
        </section>
      </div>

      <!-- 元认知画像 -->
      <section class="section metacognitive-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </span>
            元认知画像
            <span class="section-badge" v-if="metacognitiveProfile?.overallLevel">
              {{ levelLabels[metacognitiveProfile.overallLevel] || metacognitiveProfile.overallLevel }}
            </span>
          </h3>
        </div>

        <div v-if="hasMetacognitive" class="metacognitive-grid">
          <!-- 综合得分 -->
          <div class="meta-score-card" v-if="metacognitiveProfile?.overallScore != null">
            <div class="meta-score-value">{{ Math.round(metacognitiveProfile.overallScore) }}</div>
            <div class="meta-score-label">元认知综合得分</div>
          </div>

          <!-- 各维度得分 -->
          <div class="meta-dimensions" v-if="metaDimensions.length > 0">
            <div v-for="dim in metaDimensions" :key="dim.code" class="meta-dim-item">
              <div class="meta-dim-header">
                <span class="meta-dim-name">{{ dim.name }}</span>
                <span class="meta-dim-score">{{ dim.score }}</span>
              </div>
              <el-progress
                :percentage="dim.score ?? 0"
                :stroke-width="6"
                :show-text="false"
                :color="getMetaColor(dim.score ?? 0)"
              />
              <div class="meta-dim-footer">
                <span class="meta-dim-level" v-if="dim.level">{{ levelLabels[dim.level] || dim.level }}</span>
                <span class="meta-dim-trend" v-if="dim.trend">
                  {{ trendIcons[dim.trend] || '' }} {{ trendLabels[dim.trend] || dim.trend }}
                </span>
              </div>
            </div>
          </div>

          <!-- 信心校准 -->
          <div class="calibration-card" v-if="metacognitiveProfile?.calibrationStatistics">
            <h4 class="calibration-title">信心校准</h4>
            <div class="calibration-stats">
              <div class="calib-item">
                <span class="calib-label">自预测正确率</span>
                <span class="calib-value">{{ formatPercent(metacognitiveProfile.calibrationStatistics.selfPredictedAccuracyRate) }}%</span>
              </div>
              <div class="calib-item">
                <span class="calib-label">实际正确率</span>
                <span class="calib-value">{{ formatPercent(metacognitiveProfile.calibrationStatistics.actualAccuracyRate) }}%</span>
              </div>
              <div class="calib-item">
                <span class="calib-label">校准偏差</span>
                <span class="calib-value" :class="calibrationStatusClass">{{ formatPercent(metacognitiveProfile.calibrationStatistics.calibrationGap) }}%</span>
              </div>
              <div class="calib-item">
                <span class="calib-label">校准状态</span>
                <span class="calib-value calib-status" :class="calibrationStatusClass">
                  {{ calibrationLabels[metacognitiveProfile.calibrationStatistics.calibrationStatus || ''] || metacognitiveProfile.calibrationStatistics.calibrationStatus }}
                </span>
              </div>
            </div>
          </div>

          <!-- 推荐支持 -->
          <div class="support-card" v-if="metacognitiveProfile?.recommendedSupport">
            <h4 class="support-title">推荐支持策略</h4>
            <div class="support-items">
              <div class="support-item" v-if="metacognitiveProfile.recommendedSupport.planningSupportLevel">
                <span class="support-label">规划支持</span>
                <span class="support-value">{{ metacognitiveProfile.recommendedSupport.planningSupportLevel }}</span>
              </div>
              <div class="support-item" v-if="metacognitiveProfile.recommendedSupport.reflectionPromptFrequency">
                <span class="support-label">反思提示频率</span>
                <span class="support-value">{{ metacognitiveProfile.recommendedSupport.reflectionPromptFrequency }}</span>
              </div>
              <div class="support-interventions" v-if="metacognitiveProfile.recommendedSupport.recommendedInterventions?.length">
                <span class="support-label">推荐干预：</span>
                <span v-for="item in metacognitiveProfile.recommendedSupport.recommendedInterventions" :key="item" class="intervention-tag">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无元认知画像数据" :image-size="80" />
      </section>

      <!-- 学科画像 -->
      <section class="section space-profiles-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            学科画像
            <span class="section-badge" v-if="subjectProfileList.length > 0">{{ subjectProfileList.length }} 个学科</span>
          </h3>
        </div>

        <div v-if="subjectProfileList.length > 0" class="space-profile-grid">
          <div
            v-for="sp in subjectProfileList"
            :key="sp.subjectId"
            class="space-profile-card"
          >
            <div class="sp-card-header">
              <div class="sp-header-info">
                <h4 class="sp-name">{{ sp.subjectName }}</h4>
                <span class="sp-status" :class="sp.statusClass">{{ sp.statusLabel }}</span>
              </div>
              <span class="sp-progress-text" v-if="sp.mastery != null">{{ sp.mastery }}%</span>
            </div>

            <div class="sp-progress" v-if="sp.mastery != null">
              <div class="sp-progress-bar" :style="{ width: sp.mastery + '%', background: sp.color }"></div>
            </div>

            <div class="sp-details">
              <!-- 知识掌握 -->
              <div class="sp-detail-row" v-if="sp.chapters.length > 0">
                <span class="sp-detail-label">章节</span>
                <div class="sp-tags">
                  <span v-for="ch in sp.chapters" :key="ch.name" class="sp-tag" :class="ch.mastery >= 60 ? 'strength' : 'weakness'">
                    {{ ch.name }} ({{ ch.mastery }}%)
                  </span>
                </div>
              </div>

              <!-- 易错点 -->
              <div class="sp-detail-row" v-if="sp.misconceptions.length > 0">
                <span class="sp-detail-label">易错</span>
                <div class="sp-tags">
                  <span v-for="m in sp.misconceptions" :key="m" class="sp-tag weakness">{{ m }}</span>
                </div>
              </div>

              <!-- 偏好覆盖 -->
              <div class="sp-detail-row" v-if="sp.preferenceOverride">
                <span class="sp-detail-label">偏好</span>
                <span class="sp-detail-value">{{ sp.preferenceOverride }}</span>
              </div>

              <!-- 元数据 -->
              <div class="sp-meta" v-if="sp.confidence != null">
                <span>置信度：{{ Math.round((sp.confidence ?? 0) * 100) }}%</span>
                <span v-if="sp.completeness != null">完整度：{{ sp.completeness }}%</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无学科画像数据" :image-size="80" />
      </section>

      <!-- 编辑资料对话框 -->
      <el-dialog v-model="showEditDialog" title="编辑资料" width="480px" :close-on-click-modal="false">
        <el-form :model="editData" label-width="80px" label-position="left">
          <el-form-item label="昵称" :error="editErrors.username">
            <el-input
              v-model="editData.username"
              placeholder="请输入昵称（最多20字）"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="个人简介" :error="editErrors.bio">
            <el-input
              v-model="editData.bio"
              type="textarea"
              :rows="4"
              placeholder="介绍一下自己（最多500字）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
        </template>
      </el-dialog>

      <!-- 修改邮箱对话框 -->
      <EmailEditDialog
        v-model="showEmailDialog"
        :current-email="currentEmail"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { studentProfileApi } from '@/api/studentProfile'
import type {
  StudentProfileData,
  AbilityProfile,
  MetacognitiveProfile,
  SubjectProfile
} from '@/api/studentProfile'

// 账户与安全子组件
import ProfileHeader from './components/ProfileHeader.vue'
import CredentialSection from './components/CredentialSection.vue'
import QuickLoginBindingSection from './components/QuickLoginBindingSection.vue'
import EmailEditDialog from './components/EmailEditDialog.vue'

const userStore = useUserStore()
const showEditDialog = ref(false)
const showEmailDialog = ref(false)
const profileLoading = ref(false)
const profileData = ref<StudentProfileData | null>(null)

// ====== 标签映射 ======
const levelLabels: Record<string, string> = {
  BEGINNER: '入门', DEVELOPING: '发展中', PROFICIENT: '熟练', ADVANCED: '精通',
  OVERCONFIDENT: '过度自信', UNDERCONFIDENT: '信心不足', WELL_CALIBRATED: '校准良好'
}

const severityLabels: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' }
const frequencyLabels: Record<string, string> = { FREQUENT: '频繁', OCCASIONAL: '偶尔', RARE: '罕见' }
const priorityLabels: Record<string, string> = { HIGH: '高优先', MEDIUM: '中优先', LOW: '低优先' }
const statusLabels: Record<string, string> = { IN_PROGRESS: '进行中', COMPLETED: '已完成', PAUSED: '已暂停' }
const trendIcons: Record<string, string> = { IMPROVING: '↑', STABLE: '→', DECLINING: '↓' }
const trendLabels: Record<string, string> = { IMPROVING: '提升中', STABLE: '稳定', DECLINING: '下降中' }
const calibrationLabels: Record<string, string> = {
  OVERCONFIDENT: '过度自信', UNDERCONFIDENT: '信心不足', WELL_CALIBRATED: '校准良好'
}

const resourceTypeLabels: Record<string, string> = {
  VIDEO: '视频', TEXT: '文本', DIAGRAM: '图表', CODE_EXAMPLE: '代码示例',
  CODE_TRACE: '代码追踪', INTERACTIVE: '交互式', QUIZ: '测验'
}

// ====== 计算属性：用户信息 ======
const userInfo = computed(() => {
  const u = userStore.userInfo
  const bg = profileData.value?.learningBackground
  const goals = profileData.value?.learningGoals
  const ability = profileData.value?.abilityProfile
  const constraints = bg?.learningConstraints

  if (!u) {
    return { name: '未登录', avatar: '', identity: '', direction: '', level: '', goal: '', joinDays: 0, weeklyMinutes: 0, overallMastery: 0 }
  }

  const eduLevelLabels: Record<string, string> = {
    UNDERGRADUATE: '本科生', GRADUATE: '研究生', DOCTORAL: '博士生', SELF_TAUGHT: '自学者'
  }

  // 获取主目标
  let goalText = u.bio || '还没有填写个人简介'
  if (goals?.primaryGoalId && goals.goals?.[goals.primaryGoalId]) {
    goalText = goals.goals[goals.primaryGoalId].title || goalText
  }

  return {
    name: u.username || '用户',
    avatar: u.avatarUrl || '',
    identity: eduLevelLabels[bg?.education?.educationLevel || ''] || (u.role === 1 ? '教师' : '学生'),
    direction: bg?.education?.majorName || '',
    level: bg?.currentLevelDetail || '',
    goal: goalText,
    joinDays: 0,
    weeklyMinutes: constraints?.weeklyAvailableMinutes ?? 0,
    overallMastery: ability?.overallScore != null ? Math.round(ability.overallScore) : 0
  }
})

// 传给 ProfileHeader 的数据
const userInfoHeaderData = computed(() => {
  return {
    name: userInfo.value.name,
    avatar: userInfo.value.avatar,
    identity: userInfo.value.identity,
    goal: userInfo.value.goal,
    weeklyMinutes: userInfo.value.weeklyMinutes
  }
})

const currentEmail = computed(() => userStore.userInfo?.email || '')

// 传给 CredentialSection 的数据
const userCredentialData = computed(() => {
  const u = userStore.userInfo
  return {
    id: u ? String(u.id) : '',
    username: u ? u.username : '',
    email: u ? u.email : '',
    bio: u ? u.bio : ''
  }
})

// ====== 计算属性：学习偏好 ======
const hasPreference = computed(() => !!profileData.value?.learningPreference)

const preferences = computed(() => {
  const pref = profileData.value?.learningPreference
  if (!pref) return { resourceTypes: [] as string[], explanationStyle: '', practiceStyle: '', feedbackStyle: '', interactionStyle: '' }

  // 资源偏好
  const resourceTypes: string[] = []
  if (pref.resourcePreferences) {
    for (const [key, val] of Object.entries(pref.resourcePreferences)) {
      if (val.declaredPreference === 'HIGH') {
        resourceTypes.push(resourceTypeLabels[key] || key)
      }
    }
  }

  // 讲解偏好
  const exp = pref.explanationPreferences
  const seqLabels: Record<string, string> = { EXAMPLE_THEN_PRINCIPLE: '先示例后原理', PRINCIPLE_THEN_EXAMPLE: '先原理后示例' }
  const granLabels: Record<string, string> = { FINE: '精细', MEDIUM: '适中', COARSE: '粗略' }
  const explanationStyle = exp
    ? [seqLabels[exp.preferredSequence || ''], granLabels[exp.contentGranularity || '']].filter(Boolean).join('、')
    : ''

  // 练习偏好
  const prac = pref.practicePreferences
  const diffLabels: Record<string, string> = { GRADUAL: '渐进式', IMMEDIATE_CHALLENGE: '直接挑战' }
  const practiceStyle = prac
    ? [diffLabels[prac.preferredDifficultyProgression || ''], prac.preferredQuestionsPerSession ? `每轮${prac.preferredQuestionsPerSession}题` : ''].filter(Boolean).join('、')
    : ''

  // 反馈偏好
  const fb = pref.feedbackPreferences
  const timingLabels: Record<string, string> = { IMMEDIATE: '即时反馈', DELAYED: '延迟反馈' }
  const detailLabels: Record<string, string> = { DETAILED: '详细', BRIEF: '简洁' }
  const feedbackStyle = fb
    ? [timingLabels[fb.feedbackTiming || ''], detailLabels[fb.feedbackDetailLevel || '']].filter(Boolean).join('、')
    : ''

  // 交互偏好
  const inter = pref.interactionPreferences
  const modeLabels: Record<string, string> = { GUIDED_DIALOGUE: '引导式对话', FREE_EXPLORATION: '自由探索' }
  const interactionStyle = inter ? modeLabels[inter.preferredInteractionMode || ''] || '' : ''

  return { resourceTypes, explanationStyle, practiceStyle, feedbackStyle, interactionStyle }
})

// ====== 计算属性：能力雷达 ======
const abilityProfile = computed(() => profileData.value?.abilityProfile)

const radarDimensions = [
  { code: 'KNOWLEDGE_UNDERSTANDING', name: '知识理解力', legacy: ['CONCEPT_UNDERSTANDING'] },
  { code: 'PROBLEM_ANALYSIS', name: '问题分析力', legacy: ['PROBLEM_DECOMPOSITION', 'COMPLEXITY_ANALYSIS'] },
  { code: 'SOLUTION_DESIGN', name: '方案设计力', legacy: ['ABSTRACTION_MODELING', 'ALGORITHM_DESIGN'] },
  { code: 'PRACTICAL_APPLICATION', name: '实践应用力', legacy: ['CODING_IMPLEMENTATION'] },
  { code: 'ERROR_REFLECTION', name: '纠错反思力', legacy: ['DEBUGGING'] },
  { code: 'TRANSFER_INNOVATION', name: '迁移创新力', legacy: ['KNOWLEDGE_TRANSFER'] }
]

const radarAxes = computed(() => {
  const abilities = abilityProfile.value?.abilities
  if (!abilities) return []
  return radarDimensions.map(dimension => {
    const current = abilities[dimension.code]
    const legacyItems = dimension.legacy.map(code => abilities[code]).filter(Boolean)
    const item = current || legacyItems.sort((a, b) => (a?.score ?? 100) - (b?.score ?? 100))[0]
    return {
      code: dimension.code,
      name: dimension.name,
      value: item?.score ?? 0,
      trend: item.trend || '',
      focus: item?.improvementFocus || '',
      evaluated: !!item
    }
  })
})

const abilitySummary = computed(() => {
  const evaluated = radarAxes.value.filter(axis => axis.evaluated)
  const strongest = evaluated.slice().sort((a, b) => b.value - a.value)[0]
  const weakest = evaluated.slice().sort((a, b) => a.value - b.value)[0]
  if (!strongest || !weakest) return '正在收集你的学习表现'
  return `当前优势：${strongest.name}\n优先提升：${weakest.name}`
})

// ====== 计算属性：常见误区 ======
const weakPoints = computed(() => {
  const patterns = profileData.value?.commonMisconceptions?.patterns
  if (!patterns) return []

  return Object.values(patterns)
    .filter(p => p.status === 'ACTIVE')
    .sort((a, b) => {
      const sev: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (sev[b.severity || ''] || 0) - (sev[a.severity || ''] || 0)
    })
    .map(p => ({
      id: p.misconceptionId || '',
      title: p.title || '未知误区',
      description: p.description || '',
      severity: p.severity || 'MEDIUM',
      frequency: p.frequency || '',
      symptoms: p.typicalSymptoms || [],
      actions: p.intervention?.recommendedActions || [],
      lastObserved: p.occurrenceStatistics?.lastObservedAt || ''
    }))
})

// ====== 计算属性：学习目标 ======
const learningGoals = computed(() => {
  const goals = profileData.value?.learningGoals?.goals
  if (!goals) return []
  return Object.values(goals).sort((a, b) => {
    const pri: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    return (pri[b.priority || ''] || 0) - (pri[a.priority || ''] || 0)
  })
})

// ====== 计算属性：元认知画像 ======
const metacognitiveProfile = computed(() => profileData.value?.metacognitiveProfile)
const hasMetacognitive = computed(() => !!metacognitiveProfile.value?.dimensions || metacognitiveProfile.value?.overallScore != null)

const metaDimensions = computed(() => {
  const dims = metacognitiveProfile.value?.dimensions
  if (!dims) return []
  return Object.values(dims).map(d => ({
    code: d.dimensionCode || '',
    name: d.dimensionName || d.dimensionCode || '',
    score: d.score ?? 0,
    level: d.level || '',
    trend: d.trend || ''
  }))
})

const calibrationStatusClass = computed(() => {
  const status = metacognitiveProfile.value?.calibrationStatistics?.calibrationStatus
  if (status === 'WELL_CALIBRATED') return 'success'
  if (status === 'OVERCONFIDENT') return 'warning'
  return 'danger'
})

// ====== 计算属性：学科画像 ======
const spaceColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']

const subjectProfileList = computed(() => {
  const subjects = profileData.value?.subjectProfiles
  if (!subjects) return []

  return Object.entries(subjects).map(([key, sp], idx) => {
    const statusMap: Record<string, { cls: string; label: string }> = {
      ACTIVE: { cls: 'good', label: '学习中' },
      PAUSED: { cls: 'warning', label: '已暂停' },
      ARCHIVED: { cls: 'normal', label: '已归档' }
    }
    const statusInfo = statusMap[sp.subjectStatus || ''] || { cls: 'normal', label: '未知' }

    // 计算章节平均掌握度
    const chapters = sp.knowledgeMastery?.chapters
    let mastery: number | null = null
    const chapterList: { name: string; mastery: number }[] = []
    if (chapters) {
      let total = 0, count = 0
      for (const [chKey, ch] of Object.entries(chapters)) {
        const m = ch.overallMastery ?? 0
        total += m; count++
        chapterList.push({ name: ch.chapterName || chKey, mastery: Math.round(m) })
      }
      if (count > 0) mastery = Math.round(total / count)
    }

    // 易错点
    const misconceptions: string[] = []
    if (sp.subjectMisconceptions?.patterns) {
      for (const p of Object.values(sp.subjectMisconceptions.patterns)) {
        if (p.status === 'ACTIVE' && p.title) misconceptions.push(p.title)
      }
    }

    // 偏好覆盖
    const prefOverride = sp.learningPreferenceOverride?.preferredResourceTypes
      ?.map(t => resourceTypeLabels[t] || t).join('、') || ''

    return {
      subjectId: key,
      subjectName: sp.subjectNameCache || key,
      statusClass: statusInfo.cls,
      statusLabel: statusInfo.label,
      mastery,
      color: spaceColors[idx % spaceColors.length],
      chapters: chapterList.slice(0, 4),
      misconceptions: misconceptions.slice(0, 3),
      preferenceOverride: prefOverride,
      confidence: sp.metadata?.confidence ?? null,
      completeness: sp.metadata?.completeness ?? null
    }
  })
})

// ====== 雷达图工具函数 ======
const getRadarPolygon = (cx: number, cy: number, r: number) => {
  const n = radarAxes.value.length || 6
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
  return getRadarDataPointsArray().map(p => `${p.x},${p.y}`).join(' ')
}

// ====== 工具函数 ======
const getMetaColor = (score: number) => {
  if (score >= 70) return '#12b886'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

const formatPercent = (val?: number | null) => {
  if (val == null) return '0'
  return Math.round(val * 100)
}

const formatTime = (time?: string) => {
  if (!time) return ''
  try {
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return time
  }
}

// ====== 编辑功能 ======
const uploading = ref(false)
const saving = ref(false)

const editData = reactive({
  username: '',
  bio: ''
})

const editErrors = reactive({
  username: '',
  bio: ''
})

const saveProfile = async () => {
  editErrors.username = ''
  editErrors.bio = ''

  const trimmedName = editData.username.trim()
  if (!trimmedName) {
    editErrors.username = '昵称不能为空'
    return
  }
  if (trimmedName.length > 20) {
    editErrors.username = '昵称不能超过20字'
    return
  }

  const trimmedBio = editData.bio.trim()
  if (trimmedBio.length > 500) {
    editErrors.bio = '个人简介不能超过500字'
    return
  }

  saving.value = true
  try {
    await userStore.updateProfile({
      username: trimmedName || undefined,
      bio: trimmedBio || undefined
    })
    ElMessage.success('资料更新成功')
    showEditDialog.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败')
  } finally {
    saving.value = false
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
    editData.bio = u.bio || ''
  }
  editErrors.username = ''
  editErrors.bio = ''
  showEditDialog.value = true
}

// ====== 账号与第三方绑定计算属性与方法 ======
const boundIdentities = computed(() => {
  return userStore.userInfo?.authIdentities || []
})

const boundProviders = computed(() => {
  return new Set(boundIdentities.value.map(i => i.providerCode))
})

const isProviderBound = (providerCode: string) => {
  return boundProviders.value.has(providerCode)
}

const getProviderInfo = (providerCode: string) => {
  return boundIdentities.value.find(i => i.providerCode === providerCode)
}

// 复制ID
const copyText = (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('用户ID已复制')
    }).catch(() => {
      fallbackCopyText(text)
    })
  } else {
    fallbackCopyText(text)
  }
}

const fallbackCopyText = (text: string) => {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    ElMessage.success('用户ID已复制')
  } catch (err) {
    ElMessage.error('复制失败，请手动选择复制')
  }
  document.body.removeChild(textArea)
}

// 第三方账号绑定与解绑
const handleBind = (providerCode: string) => {
  if (providerCode === 'github') {
    userApi.getGithubOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/github`)
      const clientId = 'Ov23liXm4K4A7VHJmGQi'
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email`
    }).catch(() => {
      ElMessage.error('获取绑定状态失败')
    })
  } else if (providerCode === 'gitee') {
    userApi.getGiteeOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/gitee`)
      const clientId = '71fa73bb6b064414b3cf1c78c5a36d7be15d0c0ecfbc09e6b3b8a6bedff9fcce'
      window.location.href = `https://gitee.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`
    }).catch(() => {
      ElMessage.error('获取绑定状态失败')
    })
  }
}

const handleUnbind = (providerCode: string) => {
  ElMessageBox.confirm(
    `确定要解绑 ${providerCode === 'github' ? 'GitHub' : 'Gitee'} 账号吗？解绑后将无法使用该账号快捷登录。`,
    '提示',
    {
      confirmButtonText: '确定解绑',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userStore.unbindAuth(providerCode)
      ElMessage.success(`${providerCode === 'github' ? 'GitHub' : 'Gitee'} 解绑成功`)
    } catch {
      ElMessage.error('解绑失败')
    }
  }).catch(() => {})
}

// ====== 初始化 ======
onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
  } catch {}

  try {
    profileLoading.value = true
    const data = await studentProfileApi.getProfile()
    if (data) {
      profileData.value = data
    }
  } catch {
    // 画像数据获取失败时各模块显示空状态
  } finally {
    profileLoading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
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

/* 画像完整度 */
.completeness-bar {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg) var(--spacing-xl);
}

.completeness-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.completeness-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.completeness-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color);
}

.completeness-meta {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ==================== 账户安全页面新样式 ==================== */
/* ==================== 账户安全页面新样式 ==================== */
.account-security-container {
  --account-container-bg: #ffffff;
  --account-card-bg: #ffffff;
  --account-card-hover: #ffffff;
  --account-text-primary: #111827;
  --account-text-secondary: #667085;
  --account-text-muted: #98a2b3;
  --account-border: #dfe7ee;

  padding: 0 !important;
  overflow: hidden;
  background: var(--account-container-bg) !important;
  border-color: var(--account-border) !important;
  margin-bottom: var(--spacing-xl);
}

.security-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 40px;
  padding: 24px 44px 44px;
}

/* 响应式样式适配 */
@media (max-width: 1100px) {
  .security-content {
    grid-template-columns: 1fr;
    gap: 36px;
  }
}

@media (max-width: 768px) {
  .security-content {
    padding: 20px 20px 20px;
    gap: 28px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .account-security-container {
  --account-container-bg: #151b25;
  --account-card-bg: #1a222e;
  --account-card-hover: #202a37;
  --account-text-primary: #f5f7fa;
  --account-text-secondary: #b4bdca;
  --account-text-muted: #7f8a99;
  --account-border: #2c3745;
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
  background: rgba(11, 183, 170, 0.08);
  color: var(--primary-color);
}

.section-badge.warning {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

/* 学习偏好 */
.preference-list {
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

.pref-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pref-tag {
  padding: 2px 8px;
  background: rgba(11, 183, 170, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--primary-color);
}

/* 雷达图 */
.radar-chart { display: flex; justify-content: center; min-width: 350px; }
.ability-radar-content { display: grid; grid-template-columns: 196px minmax(350px, 1fr); align-items: center; gap: 52px; padding: 20px 0 8px; }
.radar-summary { min-height: 314px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; text-align: left; padding: 24px; border-radius: 15px; color: #334155; background: linear-gradient(145deg, #f2fcfc 0%, #e7f9f8 100%); border: 1px solid #9de4e0; box-shadow: inset 0 1px rgba(255,255,255,.9); }
.radar-summary .summary-label { font-size: .86rem; font-weight: 700; color: #334155; }
.radar-summary strong { display: block; font-size: 4rem; letter-spacing: -.055em; line-height: .9; color: #10bbb5; margin-top: 20px; }
.radar-summary strong + span { margin-top: 8px; font-size: 1.2rem; font-weight: 700; color: #64748b; }
.radar-summary p { white-space: pre-line; font-size: .82rem; font-weight: 600; line-height: 1.8; margin: 28px 0 0; padding-top: 16px; border-top: 1px solid #b9e9e6; color: #475569; }
@media (max-width: 760px) { .ability-radar-content { grid-template-columns: 1fr; gap: 16px; }.radar-summary { min-height: auto; text-align: center; padding: 20px; }.radar-chart { min-width: 0; } }

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
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.weak-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.weak-severity {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.weak-severity.HIGH { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.weak-severity.MEDIUM { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.weak-severity.LOW { background: rgba(100, 116, 139, 0.1); color: #64748b; }

.weak-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
  line-height: 1.4;
}

.weak-symptoms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: var(--spacing-xs);
}

.symptom-label, .action-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.symptom-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  background: rgba(245, 158, 11, 0.08);
  color: #f59e0b;
  border-radius: var(--radius-sm);
}

.weak-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.weak-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.action-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  background: rgba(11, 183, 170, 0.06);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
}

/* 学习目标 */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.goal-item {
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.goal-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.goal-badges {
  display: flex;
  gap: var(--spacing-xs);
}

.goal-priority, .goal-status {
  font-size: 0.625rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.goal-priority.HIGH { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
.goal-priority.MEDIUM { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
.goal-priority.LOW { background: rgba(100, 116, 139, 0.08); color: #64748b; }
.goal-status.IN_PROGRESS { background: rgba(11, 183, 170, 0.08); color: var(--primary-color); }
.goal-status.COMPLETED { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.goal-status.PAUSED { background: rgba(100, 116, 139, 0.08); color: #64748b; }

.goal-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.goal-progress {
  margin-bottom: var(--spacing-sm);
}

.progress-detail {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 2px;
  display: block;
}

.goal-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 元认知画像 */
.metacognitive-section {
  margin-top: var(--spacing-xl);
}

.metacognitive-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.meta-score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.06), rgba(18, 184, 134, 0.06));
  border-radius: var(--radius-lg);
}

.meta-score-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
  line-height: 1;
}

.meta-score-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.meta-dimensions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.meta-dim-item {
  padding: var(--spacing-sm) 0;
}

.meta-dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.meta-dim-name {
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.meta-dim-score {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-color);
}

.meta-dim-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.meta-dim-trend {
  font-weight: 600;
}

.calibration-card, .support-card {
  padding: var(--spacing-lg);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.calibration-title, .support-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-md);
}

.calibration-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.calib-item {
  display: flex;
  flex-direction: column;
}

.calib-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.calib-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
}

.calib-value.success { color: #10b981; }
.calib-value.warning { color: #f59e0b; }
.calib-value.danger { color: #ef4444; }

.calib-status {
  font-size: 0.8125rem;
}

.support-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.support-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.support-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.support-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.support-interventions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: var(--spacing-xs);
}

.intervention-tag {
  font-size: 0.625rem;
  padding: 2px 8px;
  background: rgba(11, 183, 170, 0.06);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
}

/* 学科画像 */
.space-profiles-section {
  margin-top: var(--spacing-xl);
}

.space-profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.space-profile-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);
}

.space-profile-card:hover {
  box-shadow: 0 2px 8px  var(--color-shadow);
}

.sp-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

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
}

.sp-status.normal { color: var(--primary-color); background: rgba(11, 183, 170, 0.06); }
.sp-status.warning { color: var(--warn-color); background: rgba(245, 158, 11, 0.06); }
.sp-status.danger { color: var(--danger-color); background: rgba(239, 68, 68, 0.06); }
.sp-status.good { color: var(--accent-color); background: rgba(16, 185, 129, 0.06); }

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
}

.sp-tag.strength { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.sp-tag.weakness { background: rgba(239, 68, 68, 0.06); color: #ef4444; }

.sp-detail-value {
  font-size: 0.75rem;
  color: var(--text-regular);
}

.sp-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
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
  .metacognitive-grid {
    grid-template-columns: 1fr;
  }
  .space-profile-grid {
    grid-template-columns: 1fr;
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


</style>
