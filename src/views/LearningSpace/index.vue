<template>
  <AppLayout>
    <!-- Loading -->
    <div v-if="dashStore.loading && !dashStore.dashboard" class="loading-state">
      <div class="skeleton-hero">
        <div class="skeleton-block hero-skel"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="dashStore.error && !dashStore.dashboard" class="error-state">
      <el-empty description="学习空间不存在或加载失败" :image-size="120">
        <el-button type="primary" @click="$router.push('/dashboard')">返回仪表盘</el-button>
      </el-empty>
    </div>

    <!-- Main Content -->
    <div v-else-if="dashboard" class="learning-space-page">
      <!-- Space Header -->
      <section class="space-hero">
        <div
          class="hero-bg"
          :class="{ 'has-cover': Boolean(dashboard.space.coverUrl) }"
          :style="heroBackgroundStyle"
        ></div>
        <div class="hero-content">
          <div class="hero-top">
            <button class="back-btn" @click="$router.push('/spaces')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
            <div class="hero-info">
              <span class="hero-eyebrow">学习空间</span>
              <h1 class="hero-title">{{ dashboard.space.name }}</h1>
              <p class="hero-goal" v-if="dashboard.currentGoal">{{ dashboard.currentGoal }}</p>
            </div>
            <div class="hero-actions">
              <div class="hero-badge" :class="dashboard.riskStatus">
                <span class="hero-badge-dot"></span>
                {{ riskLabel(dashboard.riskStatus) }}
              </div>
            </div>
          </div>

          <div class="hero-main-grid">
            <!-- 继续学习 hero 区块：本空间主入口 -->
            <div class="continue-study-block">
              <div class="csb-head">
                <span class="csb-eyebrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  继续本空间学习
                </span>
                <span class="csb-time" v-if="nextTodayTask?.estimatedDurationMinutes">
                  预计 {{ nextTodayTask.estimatedDurationMinutes }} 分钟
                </span>
              </div>
              <h2 class="csb-title">
                {{ nextTodayTask ? `继续学习：${nextTodayTask.title}` : '今日 Agent 暂未排定具体任务' }}
              </h2>
              <p class="csb-judge">Agent 判断：{{ todayFocusReason }}</p>
              <div class="csb-actions">
                <button class="csb-btn primary" @click="nextTodayTask ? handleStartFromHero() : handleContinueToday()">
                  {{ nextTodayTask ? '开始学习' : '规划今日任务' }}
                </button>
                <button class="csb-btn" @click="handleAdjustDuration">调整时长</button>
                <button class="csb-btn" @click="handleSimplerExplain">换个更基础的讲解</button>
                <button class="csb-btn" @click="handleAssessFirst">先测一下</button>
              </div>
            </div>

            <div class="hero-dashboard">
              <div class="progress-panel">
                <div class="progress-ring" :style="heroProgressStyle">
                  <div class="progress-ring-inner">
                    <strong>{{ Math.round(dashboard.progress) }}%</strong>
                    <span>总进度</span>
                  </div>
                </div>
                <div class="progress-copy">
                  <span class="progress-label">今日焦点</span>
                  <strong>{{ todayFocusTitle }}</strong>
                  <p>{{ todayFocusReason }}</p>
                </div>
              </div>

              <!-- Stats Row -->
              <div class="stats-row">
                <SpaceStatCard
                  :value="dashboard.progress"
                  label="完成进度"
                  :icon="BarChartIcon"
                  bg-color="#e0f2fe"
                  value-color="#0284c7"
                />
                <SpaceStatCard
                  :value="dashboard.streakDays"
                  label="连续学习"
                  suffix=" 天"
                  :icon="FlameIcon"
                  bg-color="#fff7ed"
                  value-color="#ea580c"
                />
                <SpaceStatCard
                  :value="dashboard.daysRemaining"
                  label="剩余天数"
                  suffix=" 天"
                  :icon="CalendarIcon"
                  bg-color="#ecfdf5"
                  value-color="#059669"
                />
                <SpaceStatCard
                  :value="riskLabel(dashboard.riskStatus)"
                  label="风险状态"
                  :icon="ZapIcon"
                  bg-color="#f5f3ff"
                  value-color="#7c3aed"
                />
              </div>
            </div>
          </div>

          <div
            v-if="dashboard.agentInsight || algorithmLoading || algorithmState || algorithmError"
            class="hero-support-row"
          >
            <!-- Agent Insight Banner -->
            <div class="agent-insight-banner" v-if="dashboard.agentInsight" @click="agentPanelRef?.open?.()">
              <div class="insight-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <span class="insight-text">{{ dashboard.agentInsight }}</span>
              <span class="insight-link">查看建议 →</span>
            </div>

            <div
              v-if="algorithmLoading || algorithmState || algorithmError"
              class="algorithm-diagnosis-band"
              :class="{ muted: algorithmError }"
            >
              <div class="adb-main">
                <span class="adb-eyebrow">学习诊断</span>
                <template v-if="algorithmLoading">
                  <h3>正在读取当前空间的掌握度证据</h3>
                  <p>会优先使用测评结果、题目知识点映射和近期答题证据。</p>
                </template>
                <template v-else-if="algorithmError">
                  <h3>诊断暂不可用</h3>
                  <p>{{ algorithmError }}</p>
                </template>
                <template v-else>
                  <h3>{{ algorithmNextActionTitle }}</h3>
                  <p>{{ algorithmNextActionReason }}</p>
                </template>
              </div>
              <div class="adb-stats" v-if="algorithmState">
                <div>
                  <strong>{{ algorithmAssessedCount }}/{{ algorithmKnowledgeCount }}</strong>
                  <span>已评估知识点</span>
                </div>
                <div>
                  <strong>{{ algorithmWeakCount }}</strong>
                  <span>薄弱点</span>
                </div>
                <div>
                  <strong>{{ algorithmMasteryPercent }}%</strong>
                  <span>平均掌握度</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content + Sidebar -->
      <div class="page-body">
        <div class="main-content">
          <!-- Tab Navigation -->
          <nav class="tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <span class="tab-icon" v-html="tab.icon"></span>
              {{ tab.label }}
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
          </nav>

          <!-- Tab: Today -->
          <div v-show="activeTab === 'today'" class="tab-content">
            <div class="section-header">
              <h3>今日任务</h3>
              <span class="task-count">{{ dashboard.todayTasks.length }} 项</span>
            </div>

            <div class="task-list" v-if="dashboard.todayTasks.length">
              <TaskCard
                v-for="task in dashboard.todayTasks"
                :key="task.id"
                :task="task"
                @start="handleStartTask"
                @complete="handleCompleteTask"
              />
            </div>
            <el-empty v-else description="今日暂无任务" :image-size="80" />

            <!-- Overdue tasks -->
            <div v-if="dashboard.overdueTasks.length" class="section-header mt-32">
              <h3 class="text-danger">已逾期任务</h3>
              <span class="task-count danger">{{ dashboard.overdueTasks.length }} 项</span>
            </div>
            <div class="task-list" v-if="dashboard.overdueTasks.length">
              <TaskCard
                v-for="task in dashboard.overdueTasks"
                :key="task.id"
                :task="task"
                @start="handleStartTask"
                @complete="handleCompleteTask"
              />
            </div>

            <!-- Quick actions -->
            <div class="quick-actions-row">
              <el-button @click="showAddTask = true">手动添加任务</el-button>
              <el-button type="primary" plain @click="$router.push('/ai-tutor')">
                请 Agent 调整今日安排
              </el-button>
            </div>
          </div>

          <!-- Tab: Agent Plan -->
          <div v-show="activeTab === 'plan'" class="tab-content">
            <div class="section-header">
              <h3>学习计划</h3>
              <span class="task-count" v-if="planDraft">{{ planDraft.phases?.length || 0 }} 个阶段</span>
            </div>

            <div v-if="planLoading" class="plan-loading">
              <div class="plan-skeleton"></div>
              <div class="plan-skeleton short"></div>
            </div>

            <template v-else-if="planDraft">
              <div class="plan-overview">
                <div class="plan-overview-main">
                  <span class="plan-eyebrow">已确认学习计划</span>
                  <h4>{{ planDraft.spaceName }}</h4>
                  <p>{{ planDraft.description }}</p>
                  <div class="plan-next-step" v-if="planNextStep">
                    <span>下一步</span>
                    <strong>{{ planNextStep }}</strong>
                  </div>
                </div>
                <div class="plan-overview-stats">
                  <div class="plan-stat">
                    <strong>{{ planTotalWeeks }}</strong>
                    <span>计划周数</span>
                  </div>
                  <div class="plan-stat">
                    <strong>{{ dashboard.pathProgress.completedNodes }}/{{ dashboard.pathProgress.totalNodes }}</strong>
                    <span>路径进度</span>
                  </div>
                  <div class="plan-stat">
                    <strong>{{ Math.round(dashboard.progress) }}%</strong>
                    <span>完成度</span>
                  </div>
                </div>
              </div>

              <div class="plan-meta-row">
                <span v-if="planDraft.startDate">开始：{{ planDraft.startDate }}</span>
                <span v-if="planDraft.targetEndDate">目标完成：{{ planDraft.targetEndDate }}</span>
                <span>{{ planKnowledgePointCount }} 个知识点</span>
                <span>{{ planResourceCount }} 个资源</span>
                <span :class="['plan-risk-pill', dashboard.riskStatus]">状态：{{ riskLabel(dashboard.riskStatus) }}</span>
              </div>

              <div class="plan-goals" v-if="planDraft.goals?.length">
                <span class="children-label">学习目标</span>
                <span v-for="goal in planDraft.goals" :key="goal" class="goal-chip">{{ goal }}</span>
              </div>

              <div class="plan-phase-list">
                <div
                  v-for="phase in planDraft.phases"
                  :key="phase.phaseIndex || phase.phaseName"
                  class="plan-phase-card"
                  :class="{ active: isActivePlanPhase(phase), collapsed: !isPhaseExpanded(phase) }"
                >
                  <button class="plan-phase-head" type="button" @click="togglePhase(phase)">
                    <div class="phase-head-main">
                      <span class="phase-index">
                        <span class="phase-number">{{ phase.phaseIndex || '-' }}</span>
                        <span>阶段</span>
                        <em v-if="isActivePlanPhase(phase)">当前关注</em>
                      </span>
                      <h4>{{ phase.phaseName || `第 ${phase.phaseIndex} 阶段` }}</h4>
                      <p>{{ phaseSummary(phase) }}</p>
                    </div>
                    <div class="phase-head-meta">
                      <span class="phase-duration">{{ phase.weeks || 0 }} 周</span>
                      <span>{{ phase.knowledgePoints?.length || 0 }} 知识点</span>
                      <span>{{ phase.resources?.length || 0 }} 资源</span>
                      <svg
                        class="phase-toggle-icon"
                        :class="{ open: isPhaseExpanded(phase) }"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        width="16"
                        height="16"
                      >
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </div>
                  </button>

                  <div v-show="isPhaseExpanded(phase)" class="phase-detail">
                    <div class="phase-section" v-if="phase.knowledgePoints?.length">
                      <span class="children-label">本阶段重点</span>
                      <div class="phase-kp-list">
                        <div v-for="(kp, index) in phase.knowledgePoints" :key="kp" class="phase-kp-item">
                          <span class="kp-order">{{ index + 1 }}</span>
                          <div class="kp-body">
                            <div class="kp-title-row">
                              <strong>{{ kp }}</strong>
                              <span v-if="knowledgeImportanceLabel(kp)" class="kp-importance">
                                {{ knowledgeImportanceLabel(kp) }}
                              </span>
                            </div>
                            <p v-if="knowledgeDescription(kp)">{{ knowledgeDescription(kp) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="phase-section" v-if="phase.resources?.length">
                      <span class="children-label">配套资源</span>
                      <div class="phase-resource-groups">
                        <div
                          v-for="group in phaseResourceGroups(phase)"
                          :key="group.type"
                          class="phase-resource-group"
                        >
                          <div class="resource-group-head">
                            <span v-html="resourceIcon(group.type)"></span>
                            <strong>{{ resourceTypeLabel(group.type) }}</strong>
                            <em>{{ group.items.length }} 项</em>
                          </div>
                          <div class="phase-resources">
                            <div
                              v-for="resource in group.items"
                              :key="resource.resourceType + resource.title"
                              class="phase-resource"
                            >
                              <strong>{{ resource.title }}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <el-empty v-else description="暂无 Agent 学习计划记录" :image-size="100">
              <el-button type="primary" plain @click="$router.push({ path: '/ai-tutor', query: { action: 'create_space' } })">
                与 Agent 重新规划
              </el-button>
            </el-empty>
          </div>

          <!-- Tab: Path -->
          <div v-show="activeTab === 'path'" class="tab-content">
            <div class="section-header path-section-header">
              <div>
                <h3>学习路径</h3>
                <span class="path-section-subtitle">用思维导图总览知识节点，用时间线查看执行细节</span>
              </div>
              <div class="path-header-actions">
                <div class="path-view-switch" role="tablist" aria-label="学习路径视图">
                  <button
                    type="button"
                    :class="{ active: pathViewMode === 'mindmap' }"
                    @click="pathViewMode = 'mindmap'"
                  >
                    思维导图
                  </button>
                  <button
                    type="button"
                    :class="{ active: pathViewMode === 'timeline' }"
                    @click="pathViewMode = 'timeline'"
                  >
                    时间线
                  </button>
                </div>
                <span class="task-count">{{ dashboard.pathProgress.completedNodes }}/{{ dashboard.pathProgress.totalNodes }} 阶段</span>
              </div>
            </div>
            <template v-if="dashboard.pathNodes.length">
              <LearningPathMindMap
                v-show="pathViewMode === 'mindmap'"
                :nodes="dashboard.pathNodes"
                :tasks="allTasks"
                :resources="dashboard.resources"
                :title="dashboard.space.name"
                :progress="dashboard.progress"
              />
              <PathTimeline
                v-show="pathViewMode === 'timeline'"
                :nodes="dashboard.pathNodes"
                :tasks="allTasks"
                :resources="dashboard.resources"
              />
            </template>
            <el-empty v-else description="学习路径即将由 Agent 生成" :image-size="100" />
          </div>

          <!-- Tab: Resources -->
          <div v-show="activeTab === 'resources'" class="tab-content">
            <div class="section-header">
              <h3>学习资料工坊</h3>
              <span class="task-count">{{ dashboard.resources.length }} 项</span>
            </div>

            <div class="resource-agent-panel">
              <div class="resource-agent-main">
                <span class="resource-agent-eyebrow">Resource Agent 建议</span>
                <h4>{{ resourcePackageTarget.title }}</h4>
                <p>{{ resourcePackageTarget.reason }}</p>
                <div class="resource-type-selector">
                  <button
                    v-for="type in packageTypeOptions"
                    :key="type.value"
                    class="type-chip"
                    :class="{ active: selectedPackageTypes.includes(type.value) }"
                    type="button"
                    @click="togglePackageType(type.value)"
                  >
                    <span :class="type.value" v-html="resourceIcon(type.value)"></span>{{ type.label }}
                  </button>
                </div>
              </div>
              <div class="resource-agent-actions">
                <el-button :loading="packagePreviewLoading" @click="handlePreviewResourcePackage">
                  预览资料包
                </el-button>
                <el-button type="primary" :loading="packageGenerating" @click="handleGenerateResourcePackage">
                  生成建议资料
                </el-button>
              </div>
            </div>

            <div v-if="packageRunningSteps.length" class="resource-progress">
              <div
                v-for="step in packageRunningSteps"
                :key="step.reason"
                class="resource-progress-step"
                :class="step.status"
              >
                <span class="step-dot"></span>
                <span>{{ step.reason }}</span>
              </div>
            </div>

            <div v-if="visibleResources.length" class="resource-management-toolbar">
              <div class="resource-search-box">
                <el-input
                  v-model="resourceSearchKeyword"
                  placeholder="搜索资料、知识点或描述"
                  clearable
                />
              </div>
              <div class="resource-filter-controls">
                <el-select v-model="resourceTypeFilter" placeholder="资源类型" class="resource-filter-select">
                  <el-option label="全部类型" value="all" />
                  <el-option
                    v-for="type in packageTypeOptions"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
                <el-select v-model="resourceStatusFilter" placeholder="生成状态" class="resource-filter-select">
                  <el-option label="全部状态" value="all" />
                  <el-option label="待生成" value="planned" />
                  <el-option label="生成中" value="generating" />
                  <el-option label="已生成" value="generated" />
                  <el-option label="失败" value="failed" />
                </el-select>
                <el-select v-model="resourceSortMode" placeholder="排序" class="resource-filter-select">
                  <el-option label="任务顺序" value="default" />
                  <el-option label="按生成状态" value="status" />
                  <el-option label="按资源类型" value="type" />
                  <el-option label="按标题" value="title" />
                </el-select>
              </div>
              <div class="resource-result-summary">
                <strong>{{ filteredResources.length }}</strong>
                <span>/ {{ visibleResources.length }} 项</span>
              </div>
            </div>

            <div v-if="groupedResources.length" class="resource-package-list">
              <section
                v-for="group in groupedResources"
                :key="group.key"
                class="resource-package-section"
              >
                <div class="resource-package-head">
                  <div>
                    <span class="resource-package-eyebrow">{{ group.label }}</span>
                    <h4>{{ group.title }}</h4>
                  </div>
                  <div class="resource-package-actions">
                    <span class="task-count">{{ group.items.length }} 项</span>
                    <button
                      v-if="hiddenResourceCount(group) > 0"
                      class="resource-group-toggle"
                      type="button"
                      @click="toggleResourceGroup(group.key)"
                    >
                      {{ isResourceGroupExpanded(group.key) ? '收起' : `展开 ${hiddenResourceCount(group)} 项` }}
                    </button>
                  </div>
                </div>

                <div class="resource-grid">
                  <div
                    v-for="r in visibleGroupResources(group)"
                    :key="r.id"
                    class="resource-card"
                    :class="{ disabled: isResourceBusy(r) }"
                    @click="handleResourceCardClick(r)"
                  >
                    <div class="res-icon" :class="resourceIconClass(r)">
                      <span v-html="resourceIconName(r)"></span>
                    </div>
                    <div class="res-body">
                      <h4 class="res-title">{{ r.title }}</h4>
                      <p v-if="bilibiliPreview(r)?.title" class="res-video-title">
                        {{ bilibiliPreview(r)?.title }}
                      </p>
                      <p class="res-desc">{{ r.description }}</p>
                      <div class="res-meta">
                        <span class="res-type">{{ resourceTypeLabel(r.resourceType) }}</span>
                        <span class="res-source" :class="r.source">
                          {{ resourceSourceLabel(r) }}
                        </span>
                        <span v-if="r.status" class="res-status" :class="displayResourceStatus(r)">
                          {{ resourceStatusLabel(displayResourceStatus(r)) }}
                        </span>
                      </div>
                      <p
                        v-if="r.agentReason && ['generating', 'failed'].includes(displayResourceStatus(r))"
                        class="res-reason"
                      >
                        Agent 判断：{{ r.agentReason }}
                      </p>
                      <p
                        v-if="resourceGenerationHint(r)"
                        class="res-generation-hint"
                        :class="displayResourceStatus(r)"
                      >
                        {{ resourceGenerationHint(r) }}
                      </p>
                      <div v-if="streamingResourceContent(r)" class="res-stream-preview">
                        <div class="stream-preview-head">
                          <span class="stream-dot"></span>
                          <span>{{ displayResourceStatus(r) === 'generated' ? '生成完成' : '实时生成中' }}</span>
                        </div>
                        <pre>{{ streamingResourceContent(r) }}</pre>
                      </div>
                      <div class="res-tags">
                        <span v-if="r.knowledgePoint">{{ r.knowledgePoint }}</span>
                        <span v-if="r.studyScenario">{{ r.studyScenario }}</span>
                        <span v-if="bilibiliPreview(r)?.upName">{{ bilibiliPreview(r)?.upName }}</span>
                        <span v-if="bilibiliPreview(r)?.durationSeconds">
                          {{ formatDuration(bilibiliPreview(r)?.durationSeconds) }}
                        </span>
                      </div>
                      <div class="res-actions">
                        <el-button
                          v-if="canGenerateResource(r)"
                          size="small"
                          type="primary"
                          plain
                          :loading="isResourceBusy(r)"
                          @click.stop="handleGenerateSingleResource(r)"
                        >
                          {{ r.status === 'failed' ? '重试生成' : '生成' }}
                        </el-button>
                        <el-button
                          v-else-if="r.status === 'generated'"
                          size="small"
                          text
                          @click.stop="goResourceDetail(r)"
                        >
                          查看
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <el-empty
              v-else
              :description="visibleResources.length ? '没有符合筛选条件的资料' : '暂无资源，等待 Agent 为任务生成资料包'"
              :image-size="100"
            >
              <el-button v-if="visibleResources.length" @click="resetResourceFilters">清空筛选</el-button>
            </el-empty>

            <!-- Assessment Summary -->
            <div class="section-header mt-32">
              <h3>测评摘要</h3>
            </div>
            <div class="assessment-summary">
              <div class="assess-stat">
                <span class="assess-value green">{{ algorithmMasteryPercent }}%</span>
                <span class="assess-label">平均掌握度</span>
              </div>
              <div class="assess-stat">
                <span class="assess-value blue">{{ algorithmAssessedCount }}</span>
                <span class="assess-label">已评估知识点</span>
              </div>
              <div class="assess-stat">
                <span class="assess-value purple">{{ algorithmWeakCount }}</span>
                <span class="assess-label">薄弱知识点</span>
              </div>
            </div>
            <div class="weakness-list" v-if="weaknesses.length">
              <span class="weakness-tag" v-for="w in weaknesses" :key="w">{{ w }}</span>
            </div>

            <el-dialog
              v-model="packagePreviewVisible"
              title="确认生成资料包"
              width="680px"
              :close-on-click-modal="false"
            >
              <div v-if="resourcePackagePreview" class="package-preview">
                <span class="resource-agent-eyebrow">待确认方案</span>
                <h3>{{ resourcePackagePreview.title }}</h3>
                <p>{{ resourcePackagePreview.reason }}</p>
                <div class="preview-resource-list">
                  <div
                    v-for="r in resourcePackagePreview.resources"
                    :key="r.resourceType + r.title"
                    class="preview-resource-item"
                  >
                    <span class="preview-icon" v-html="resourceIcon(r.resourceType)"></span>
                    <div>
                      <strong>{{ r.title }}</strong>
                      <p>{{ r.description }}</p>
                    </div>
                    <em>{{ resourceTypeLabel(r.resourceType) }}</em>
                  </div>
                </div>
              </div>
              <template #footer>
                <el-button @click="packagePreviewVisible = false">取消</el-button>
                <el-button type="primary" :loading="packageGenerating" @click="handleGenerateResourcePackage">
                  确认生成
                </el-button>
              </template>
            </el-dialog>
          </div>

          <!-- Tab: Records -->
          <div v-show="activeTab === 'records'" class="tab-content">
            <div class="section-header">
              <h3>学习记录</h3>
              <span class="task-count">{{ recordRangeLabel }}</span>
            </div>

            <LearningContributionCalendar
              v-if="displayRecords.length"
              :records="displayRecords"
            />

            <div class="records-table" v-if="displayRecords.length">
              <div
                v-for="rec in [...displayRecords].reverse()"
                :key="rec.id"
                class="record-row"
              >
                <span class="record-date">{{ rec.recordDate }}</span>
                <span class="record-duration">{{ rec.studyDurationMinutes }}分钟</span>
                <span class="record-tasks">{{ rec.tasksCompleted }}/{{ rec.tasksPlanned }} 任务</span>
                <span class="record-focus">
                  <template v-for="i in 5" :key="i">
                    <span class="focus-dot" :class="{ filled: i <= rec.focusLevel }"></span>
                  </template>
                </span>
                <span class="record-reflection" v-if="rec.aiReflection">{{ rec.aiReflection }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无学习记录" :image-size="80" />
          </div>
        </div>

        <!-- Agent Sidebar -->
        <SpaceAgentPanel
          ref="agentPanelRef"
          :space-name="dashboard.space.name"
          :insight="dashboard.agentInsight"
          :agent-actions="dashboard.recentAgentActions"
          @quick-action="handleAgentQuickAction"
          @send-message="handleAgentMessage"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import SpaceStatCard from '@/components/SpaceStatCard.vue'
import { BarChartIcon, FlameIcon, CalendarIcon, ZapIcon } from '@/assets/icons'
import TaskCard from '@/components/TaskCard.vue'
import PathTimeline from '@/components/PathTimeline.vue'
import LearningPathMindMap from '@/components/LearningPathMindMap.vue'
import SpaceAgentPanel from '@/components/SpaceAgentPanel.vue'
import LearningContributionCalendar from './components/LearningContributionCalendar.vue'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import { useStudyEntry } from '@/composables/useStudyEntry'
import { agentApi } from '@/api/agent'
import {
  resourceGenerationJobApi,
  resourcePackageApi,
  streamGenerateResourcePackage,
  type ResourcePackageStreamEvent,
  type ResourcePackageStreamEventName,
} from '@/api/spaceDashboard'
import { learningResourceApi } from '@/api/learningResource'
import { fetchLearningState } from '@/api/algorithm'
import type {
  ResourceGenerationJobVO,
  ResourcePackageGenerateDTO,
  ResourcePackageVO,
  ResourceStatus,
  ResourceType,
  ResourceVO,
  RiskStatus,
  TaskVO,
  LearningRecordVO,
} from '@/types/learningSpace'
import type { LearningPlanDraft, PhaseInfo, ResourceInfo, KnowledgeNode } from '@/types/planExecute'
import type { LearningAlgorithmState } from '@/api/algorithm'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()
const { enterStudy, enterTask } = useStudyEntry()

const activeTab = ref('today')
const pathViewMode = ref<'mindmap' | 'timeline'>('mindmap')
const showAddTask = ref(false)
const planDraft = ref<LearningPlanDraft | null>(null)
const planLoading = ref(false)
const expandedPhaseKeys = ref<string[]>([])
const resourcePackagePreview = ref<ResourcePackageVO | null>(null)
const packagePreviewVisible = ref(false)
const packagePreviewLoading = ref(false)
const packageGenerating = ref(false)
const packageRunningSteps = ref<{ reason: string; status: string }[]>([])
const selectedPackageTypes = ref<ResourceType[]>(['doc', 'html', 'mind_map', 'quiz', 'link'])
const resourceSearchKeyword = ref('')
const resourceTypeFilter = ref<'all' | ResourceType>('all')
const resourceStatusFilter = ref<'all' | ResourceStatus>('all')
const resourceSortMode = ref<'default' | 'status' | 'type' | 'title'>('default')
const expandedResourceGroupKeys = ref<string[]>([])
const generatingResourceIds = ref<string[]>([])
const packageStreamAbortController = ref<AbortController | null>(null)
const streamingResources = ref<Record<string, {
  status: 'generating' | 'generated' | 'failed'
  content: string
  title: string
  resourceType: ResourceType
  message?: string
}>>({})
const optimisticPackageResources = ref<ResourceVO[]>([])
const resourceGenerationJobs = ref<ResourceGenerationJobVO[]>([])
const resourcePollingTimer = ref<ReturnType<typeof setInterval> | null>(null)
const resourcePollingInFlight = ref(false)
const algorithmState = ref<LearningAlgorithmState | null>(null)
const algorithmLoading = ref(false)
const algorithmError = ref('')
const agentPanelRef = ref<InstanceType<typeof SpaceAgentPanel> | null>(null)

const spaceId = computed(() => String(route.params.spaceId || ''))
const dashboard = computed(() => dashStore.dashboard)
const mockLearningRecords = computed<LearningRecordVO[]>(() => buildMockLearningRecords())
const displayRecords = computed(() => {
  const records = dashboard.value?.recentRecords || []
  return records.length ? records : mockLearningRecords.value
})
const recordRangeLabel = computed(() => (
  dashboard.value?.recentRecords?.length ? '近 7 天' : 'Mock 近 4 周'
))

const tabs = computed(() => [
  { id: 'today', label: '今日', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', badge: dashboard.value?.todayTasks.length || 0 },
  { id: 'plan', label: '计划', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>', badge: planDraft.value?.phases?.length || 0 },
  { id: 'path', label: '路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>', badge: dashboard.value?.pathProgress?.totalNodes || 0 },
  { id: 'resources', label: '资源与测评', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', badge: dashboard.value?.resources.length || 0 },
  { id: 'records', label: '记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>', badge: displayRecords.value.length },
])

const fallbackWeaknesses = ['洛必达法则适用条件', '无穷小阶数比较', '间断点分类']
const algorithmWeakPoints = computed(() => algorithmState.value?.weakPoints || [])
const algorithmWeakCount = computed(() => algorithmWeakPoints.value.length)
const algorithmKnowledgeCount = computed(() => Number(algorithmState.value?.knowledgeCount || 0))
const algorithmAssessedCount = computed(() => Number(algorithmState.value?.assessedCount || 0))
const algorithmAverageMastery = computed(() => {
  const states = algorithmState.value?.knowledgeStates || []
  if (!states.length) return null
  return states.reduce((sum, item) => sum + clampNumber(item.mastery, 0, 1), 0) / states.length
})
const algorithmMasteryPercent = computed(() => {
  const mastery = algorithmAverageMastery.value
  if (mastery == null) return Math.round(dashboard.value?.progress || 0)
  return Math.round(mastery * 100)
})
const weaknesses = computed(() => {
  const names = algorithmWeakPoints.value.map(item => item.name).filter(Boolean)
  return names.length ? names.slice(0, 6) : fallbackWeaknesses
})
const algorithmNextAction = computed(() => algorithmState.value?.nextAction || null)
const algorithmNextActionTitle = computed(() => {
  const action = algorithmNextAction.value
  if (!action) return '暂无足够诊断证据'
  if (action.knowledgeName) return `建议先处理「${action.knowledgeName}」`
  return actionTypeLabel(action.type)
})
const algorithmNextActionReason = computed(() =>
  algorithmNextAction.value?.reason || '当前证据不足，建议先完成一次诊断测评。'
)
const packageTypeOptions: { value: ResourceType; label: string }[] = [
  { value: 'doc', label: '文档' },
  { value: 'html', label: 'HTML' },
  { value: 'mind_map', label: '思维导图' },
  { value: 'quiz', label: '练习' },
  { value: 'image', label: '图解' },
  { value: 'link', label: 'B站推荐' },
]
const resourceGroupPreviewLimit = 6
const resourceStatusSortOrder: Record<ResourceStatus, number> = {
  generating: 0,
  failed: 1,
  planned: 2,
  generated: 3,
}

function buildMockLearningRecords(): LearningRecordVO[] {
  const records = [
    { daysAgo: 27, minutes: 35, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '完成基础概念回顾，开始建立学习节奏。' },
    { daysAgo: 26, minutes: 50, completed: 2, planned: 2, focus: 4, mood: 'focused', rating: 4, reflection: '专注度提升，例题理解更稳定。' },
    { daysAgo: 24, minutes: 18, completed: 1, planned: 2, focus: 2, mood: 'tired', rating: 2, reflection: '学习时间偏短，建议拆成更小任务。' },
    { daysAgo: 23, minutes: 72, completed: 3, planned: 3, focus: 5, mood: 'motivated', rating: 5, reflection: '高强度学习日，关键概念掌握明显提升。' },
    { daysAgo: 21, minutes: 42, completed: 2, planned: 3, focus: 3, mood: 'normal', rating: 3, reflection: '完成练习，但错题需要二次复盘。' },
    { daysAgo: 20, minutes: 95, completed: 4, planned: 4, focus: 5, mood: 'focused', rating: 5, reflection: '进入稳定输出状态，可以推进下一节。' },
    { daysAgo: 18, minutes: 28, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '保持最低学习量，避免中断。' },
    { daysAgo: 17, minutes: 64, completed: 2, planned: 3, focus: 4, mood: 'focused', rating: 4, reflection: '专项练习效果较好，继续巩固薄弱点。' },
    { daysAgo: 16, minutes: 88, completed: 3, planned: 3, focus: 4, mood: 'motivated', rating: 4, reflection: '任务完成质量较高，可增加综合题。' },
    { daysAgo: 13, minutes: 22, completed: 1, planned: 2, focus: 2, mood: 'low', rating: 2, reflection: '状态偏低，建议减少新知识输入。' },
    { daysAgo: 12, minutes: 55, completed: 2, planned: 3, focus: 4, mood: 'normal', rating: 4, reflection: '恢复正常节奏，错题回顾有效。' },
    { daysAgo: 10, minutes: 76, completed: 3, planned: 3, focus: 5, mood: 'focused', rating: 5, reflection: '今天适合推进核心知识点。' },
    { daysAgo: 9, minutes: 46, completed: 2, planned: 2, focus: 4, mood: 'normal', rating: 4, reflection: '复习任务完成，保持当前节奏。' },
    { daysAgo: 6, minutes: 31, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '开始新一轮复习，先处理基础题。' },
    { daysAgo: 5, minutes: 67, completed: 2, planned: 3, focus: 4, mood: 'focused', rating: 4, reflection: '薄弱点练习有效，建议明天继续。' },
    { daysAgo: 4, minutes: 104, completed: 4, planned: 4, focus: 5, mood: 'motivated', rating: 5, reflection: '本周最高活跃日，学习效率很好。' },
    { daysAgo: 3, minutes: 44, completed: 2, planned: 3, focus: 3, mood: 'normal', rating: 3, reflection: '完成主要任务，留一个复盘尾巴。' },
    { daysAgo: 2, minutes: 58, completed: 2, planned: 2, focus: 4, mood: 'focused', rating: 4, reflection: '连续学习状态稳定。' },
    { daysAgo: 1, minutes: 39, completed: 1, planned: 2, focus: 3, mood: 'normal', rating: 3, reflection: '轻量复习，适合作为过渡。' },
    { daysAgo: 0, minutes: 82, completed: 3, planned: 3, focus: 5, mood: 'focused', rating: 5, reflection: '今天状态集中，可以继续完成高优任务。' },
  ]

  return records.map((record, index) => ({
    id: 9000 + index,
    recordDate: formatMockDate(record.daysAgo),
    studyDurationMinutes: record.minutes,
    tasksCompleted: record.completed,
    tasksPlanned: record.planned,
    focusLevel: record.focus,
    mood: record.mood,
    selfRating: record.rating,
    aiReflection: record.reflection,
  }))
}

function formatMockDate(daysAgo: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const spaceCoverThemes: Record<string, string> = {
  course: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
  exam: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  project: 'linear-gradient(135deg, #d97706 0%, #facc15 100%)',
  career: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  competition: 'linear-gradient(135deg, #dc2626 0%, #fb7185 100%)',
}

const heroBackgroundStyle = computed(() => {
  const coverUrl = dashboard.value?.space.coverUrl
  if (coverUrl) {
    return {
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.42), rgba(2, 132, 199, 0.18)), url(${JSON.stringify(coverUrl)})`,
    }
  }
  return {
    background: spaceCoverThemes[dashboard.value?.space.type || 'course'] || spaceCoverThemes.course,
  }
})

const nextTodayTask = computed(() => {
  const tasks = dashboard.value?.todayTasks || []
  return tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status === 'pending') || tasks[0]
})

const todayFocusTitle = computed(() => {
  if (nextTodayTask.value?.title) return nextTodayTask.value.title
  if (algorithmNextAction.value?.knowledgeName) return `诊断建议：${algorithmNextAction.value.knowledgeName}`
  return '等待 Agent 生成新的学习任务'
})

const todayFocusReason = computed(() => {
  if (nextTodayTask.value?.aiSuggestion) return nextTodayTask.value.aiSuggestion
  if (algorithmNextAction.value?.reason) return algorithmNextAction.value.reason
  if (dashboard.value?.agentInsight) return dashboard.value.agentInsight
  return '保持节奏，按当前学习计划推进即可。'
})

const heroProgressStyle = computed(() => {
  const progress = Math.min(Math.max(Number(dashboard.value?.progress || 0), 0), 100)
  return {
    background: `conic-gradient(#0bb7aa ${progress * 3.6}deg, rgba(226, 232, 240, 0.75) 0deg)`,
  }
})

const planTotalWeeks = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (Number(phase.weeks) || 0), 0)
)

const planKnowledgePointCount = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (phase.knowledgePoints?.length || 0), 0)
)

const planResourceCount = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (phase.resources?.length || 0), 0)
)

const knowledgeNodeMap = computed(() => {
  const map = new Map<string, KnowledgeNode>()
  ;(planDraft.value?.knowledgeGraph?.nodes || []).forEach(node => {
    if (node.name) map.set(normalizeText(node.name), node)
  })
  return map
})

const currentPlanPhaseKey = computed(() => {
  const phases = planDraft.value?.phases || []
  if (!phases.length) return ''

  const runtimePhase = findPhaseByRuntimeContext(phases)
  if (runtimePhase) return phaseKey(runtimePhase)

  const rawProgress = dashboard.value?.pathProgress?.percent ?? dashboard.value?.progress ?? 0
  const progress = Math.min(Math.max(Number(rawProgress) || 0, 0), 100)
  const index = Math.min(phases.length - 1, Math.floor((progress / 100) * phases.length))
  return phaseKey(phases[index])
})

const activePlanPhase = computed(() => {
  const key = currentPlanPhaseKey.value
  return (planDraft.value?.phases || []).find(phase => phaseKey(phase) === key) || null
})

const planNextStep = computed(() => {
  if (nextTodayTask.value?.title) return nextTodayTask.value.title
  const phase = activePlanPhase.value
  const firstKnowledgePoint = phase?.knowledgePoints?.[0]
  if (firstKnowledgePoint) return `进入「${firstKnowledgePoint}」`
  return ''
})

// PathTimeline 需要的全集任务：合并今日 / 待办 / 逾期，按 id 去重
const allTasks = computed<TaskVO[]>(() => {
  const d = dashboard.value
  if (!d) return []
  const map = new Map<string, TaskVO>()
  ;[...(d.todayTasks || []), ...(d.pendingTasks || []), ...(d.overdueTasks || [])]
    .forEach(t => map.set(t.id, t))
  return [...map.values()]
})

const resourcePackageTarget = computed(() => {
  const task = nextTodayTask.value
  const phase = activePlanPhase.value
  const knowledgePoint = task?.title || phase?.knowledgePoints?.[0] || dashboard.value?.currentGoal || dashboard.value?.space.name || '当前目标'
  if (task) {
    return {
      title: `为「${task.title}」生成今日任务资料包`,
      reason: task.aiSuggestion || `Agent 将围绕「${knowledgePoint}」补齐讲义、框架、练习和视频推荐。`,
      knowledgePoint,
      taskId: task.id,
      pathNodeId: task.pathNodeId,
    }
  }
  return {
    title: `为「${knowledgePoint}」生成阶段资料包`,
    reason: dashboard.value?.agentInsight || 'Agent 将基于当前空间目标生成可直接学习的资料组合。',
    knowledgePoint,
    taskId: null,
    pathNodeId: dashboard.value?.pathProgress?.currentNodeId || null,
  }
})

const visibleResources = computed(() => {
  const resources = [...(dashboard.value?.resources || [])]
  const seen = new Set(resources.map(resource => resource.id).filter(Boolean))
  optimisticPackageResources.value.forEach(resource => {
    if (!resource.id || seen.has(resource.id)) return
    resources.unshift(resource)
    seen.add(resource.id)
  })
  return resources
})

const filteredResources = computed(() => {
  const keyword = normalizeText(resourceSearchKeyword.value)
  const resources = visibleResources.value.filter(resource => {
    if (resourceTypeFilter.value !== 'all' && resource.resourceType !== resourceTypeFilter.value) return false
    if (resourceStatusFilter.value !== 'all' && displayResourceStatus(resource) !== resourceStatusFilter.value) return false
    if (!keyword) return true
    const searchable = [
      resource.title,
      resource.description,
      resource.knowledgePoint,
      resource.studyScenario,
      resource.agentReason,
      resourceTypeLabel(resource.resourceType),
      resourceSourceLabel(resource),
      bilibiliPreview(resource)?.title,
      bilibiliPreview(resource)?.upName,
    ].filter(Boolean).join(' ')
    return normalizeText(searchable).includes(keyword)
  })

  return [...resources].sort((a, b) => {
    if (resourceSortMode.value === 'status') {
      const statusDiff = resourceStatusSortOrder[displayResourceStatus(a)] - resourceStatusSortOrder[displayResourceStatus(b)]
      if (statusDiff !== 0) return statusDiff
    }
    if (resourceSortMode.value === 'type') {
      const typeDiff = resourceTypeLabel(a.resourceType).localeCompare(resourceTypeLabel(b.resourceType), 'zh-CN')
      if (typeDiff !== 0) return typeDiff
    }
    if (resourceSortMode.value === 'title') {
      return a.title.localeCompare(b.title, 'zh-CN')
    }
    return 0
  })
})

const groupedResources = computed(() => {
  const groups = new Map<string, { key: string; title: string; label: string; items: ResourceVO[] }>()
  ;(filteredResources.value || []).forEach(resource => {
    const key = resource.taskId ? `task-${resource.taskId}` : resource.knowledgePoint ? `kp-${resource.knowledgePoint}` : 'space'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: resource.knowledgePoint || taskTitle(resource.taskId) || '空间通用资料',
        label: resource.taskId ? '任务资料包' : resource.knowledgePoint ? '知识点资料包' : '空间资料',
        items: [],
      })
    }
    groups.get(key)!.items.push(resource)
  })
  return [...groups.values()]
})

const generationJobByResourceId = computed(() => {
  const map = new Map<string, ResourceGenerationJobVO>()
  resourceGenerationJobs.value.forEach(job => {
    if (job.resourceId && !map.has(job.resourceId)) {
      map.set(job.resourceId, job)
    }
  })
  return map
})

function riskLabel(s: RiskStatus) {
  const m: Record<string, string> = { good: '良好', normal: '正常', warning: '注意', danger: '危险' }
  return m[s] || s
}

function clampNumber(value: unknown, min: number, max: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return min
  return Math.min(Math.max(num, min), max)
}

function actionTypeLabel(type?: string) {
  const map: Record<string, string> = {
    diagnostic_quiz: '先做诊断题',
    weakness_practice: '安排补弱练习',
    verification_quiz: '先做验证题',
    advance_or_review: '推进新内容或轻量复习',
  }
  return map[type || ''] || '下一步学习动作'
}

function resourceIcon(t: string) {
  const m: Record<string, string> = { doc: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M537.152 414.72h-288.64a29.44 29.44 0 0 1-26.24-30.72 29.44 29.44 0 0 1 26.24-32h288.64a29.44 29.44 0 0 1 26.24 32 29.44 29.44 0 0 1-26.24 30.72z m209.92 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z m0 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z" fill="#333333"></path><path d="M192.832 0a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h640a128 128 0 0 0 128-128l7.04-670.72L748.992 0h-556.16z m512 64l192 192h-160.64a31.36 31.36 0 0 1-31.36-31.36V64z m128 896h-640a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h448v192a64 64 0 0 0 64 64h192v576a64 64 0 0 1-64 64z" fill="#333333"></path></svg>', html: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M112 16h736v992H112z" fill="#AED796"></path><path d="M392.176 846.08c8.032 4.544 18.208 2.032 22.704-5.616l159.344-256.496c4.496-7.648 1.648-17.504-6.384-22.048s-18.208-2.032-22.704 5.616l-159.344 256.496c-4.512 7.632-1.648 17.504 6.384 22.048z m204.416-50.672a15.84 15.84 0 0 0 22.464 0l79.344-79.344c0.336-0.288 0.752-0.384 1.056-0.704a15.776 15.776 0 0 0 4.592-11.52 15.808 15.808 0 0 0-4.656-11.264c-0.224-0.224-0.512-0.304-0.752-0.496l-79.552-79.552a15.872 15.872 0 1 0-22.464 22.464l68.944 68.944-68.992 68.992a15.888 15.888 0 0 0 0.016 22.48zM261.6 716.064l79.328 79.344a15.84 15.84 0 0 0 22.464 0 15.84 15.84 0 0 0 0-22.464L294.4 703.952l68.944-68.944a15.872 15.872 0 1 0-22.464-22.464l-79.552 79.552c-0.224 0.208-0.528 0.288-0.736 0.496a15.744 15.744 0 0 0-4.656 11.264 15.808 15.808 0 0 0 4.592 11.52c0.32 0.288 0.736 0.4 1.072 0.688zM896 128h-32V32a32 32 0 0 0-32-32H128a32 32 0 0 0-32 32v960a32 32 0 0 0 32 32h704a32 32 0 0 0 32-32V416h32a32 32 0 0 0 32-32V160a32 32 0 0 0-32-32z m-64 0H352a32 32 0 0 0-32 32v224a32 32 0 0 0 32 32h480v576H128V32h704v96z" fill="#2B3139"></path><path d="M352 160h544v224H352z" fill="#FFFFFF"></path><path d="M387.696 213.824h35.184v39.664h32.944v-39.664h35.184V328h-35.184v-45.264H422.88V328h-35.184v-114.176zM535.856 243.088h-31.984v-29.264h99.136v29.264h-31.984V328h-35.168v-84.912zM615.872 213.824h50.048l16.32 67.168h0.32l16.32-67.168h50.064V328H715.68v-73.248h-0.336l-19.84 73.248H669.28l-19.824-73.248h-0.336V328h-33.248v-114.176zM767.056 213.824h35.184v84.912h50.528V328h-85.712v-114.176z" fill="#2B3139"></path></svg>', video: '🎵', mind_map: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke="#701A75" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="25" y="42" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><path d="M41 50 H52 V32 H62 M52 50 V68 H62" stroke-width="5"/><rect x="62" y="24" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><rect x="62" y="60" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/></g></svg>', quiz: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M320.618717 709.570751l311.023685-316.464605-159.049412-162.715919-320.259024 320.694953-3.094478 19.460214L312.765865 710.198038l7.852852-0.627287z m365.842198-372.018875l110.612237-112.471584 7.225565-44.74918L685.639201 62.11571l-47.529503 2.531659-116.408244 116.51569 164.759461 156.388817zM100.216981 789.613762l138.302903-59.706847-112.839975-92.719728-46.859237 112.450095-14.23419 51.919487 35.630499-11.943007z m9.216919 79.440283c-24.663726 0.084934-44.587498 20.031219-44.608987 44.694945 0.021489 24.659633 19.946284 44.649919 44.608987 44.75839h806.904567c24.661679 0 44.651966-19.990287 44.651965-44.649919v-0.108471c0-24.663726-19.990287-44.654013-44.61001-44.694945H109.4339z m806.450219-111.931278c24.856108 0 45.105291-20.206204 45.10529-45.128827s-20.249183-45.083801-45.10529-45.083801H468.374922c-24.90011 0-45.083801 20.24816-45.083801 45.299719 0 24.74866 20.183691 44.912909 45.083801 44.912909h447.509197z" fill="#59C666"></path></svg>', case_study: '📋', flashcard_set: '🃏', image: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M853.161077 892.549156 362.595248 892.549156l-209.432916-0.413416c-0.605797-0.001023-1.210571-0.031722-1.813299-0.092098-24.848944-2.484587-47.825238-14.060227-64.696488-32.594349-16.990976-18.665105-26.349111-42.85504-26.349111-68.112284L60.303434 264.62596c0-55.80805 45.403073-101.211123 101.211123-101.211123l691.645496 0c55.80805 0 101.2101 45.403073 101.2101 101.211123l0 225.51315c0 0.275269-0.00614 0.551562-0.01842 0.825808-0.021489 0.494257-1.971911 51.723012 15.481599 85.46244 4.716418 9.118682 1.14815 20.335141-7.970532 25.052582-9.116635 4.714372-20.335141 1.149173-25.052582-7.970532-21.300119-41.176818-19.844977-97.642854-19.618826-103.738689L917.191392 264.62596c0-35.307134-28.724205-64.031339-64.031339-64.031339L161.51558 200.594621c-35.307134 0-64.031339 28.724205-64.031339 64.031339l0 526.71105c0 32.755008 24.320918 59.957557 56.717769 63.61997l208.4311 0.412392 490.528989 0c35.307134 0 64.031339-28.725228 64.031339-64.032362l-0.382717-93.676519c-0.104377-1.749854-1.587148-19.548218-19.549242-42.499953-0.050142-0.063445-0.098237-0.125867-0.147356-0.190335L875.401614 626.481358 758.174726 471.362464c-0.415462-0.550539-38.995129-50.852178-86.271876-45.534056-38.335097 4.314259-75.954903 45.163619-108.789729 118.131491-17.615193 39.141462-34.650171 68.26885-52.082192 89.046059-17.607006 20.985964-35.679617 33.519418-55.251372 38.316677-43.422975 10.638291-81.049944-18.99461-120.886231-50.372248l-5.057179-3.980661c-46.555315-36.57808-68.750827-28.223808-158.330028 59.60247-7.330966 7.187703-19.101033 7.071046-26.288736-0.25992-7.187703-7.330966-7.071046-19.101033 0.25992-26.287713 46.658669-45.74588 77.544097-72.726372 107.085924-84.282568 33.357735-13.048177 64.274886-6.266727 100.242052 21.99392l5.092995 4.00829c33.9226 26.719548 63.219857 49.795103 89.028663 43.466977 25.618471-6.279007 53.30095-42.114167 82.279958-106.508779 39.139415-86.97591 85.837994-134.027529 138.79716-139.849118 68.454068-7.515161 117.823476 57.404408 119.891578 60.171428l117.122511 154.980747 21.599947 28.343535c26.276457 33.630958 27.333532 61.638849 27.367301 64.72514 0.001023 0.042979 0.001023 0.084934 0.001023 0.127913l0.38374 94.059236C954.371176 847.146083 908.969127 892.549156 853.161077 892.549156z" fill="#FF9000"></path><path d="M312.328401 446.967868c-42.324968 0-76.759221-34.434254-76.759221-76.759221s34.434254-76.759221 76.759221-76.759221 76.759221 34.434254 76.759221 76.759221S354.654392 446.967868 312.328401 446.967868zM312.328401 330.628186c-21.824051 0-39.579437 17.755386-39.579437 39.579437s17.755386 39.579437 39.579437 39.579437 39.579437-17.755386 39.579437-39.579437S334.153476 330.628186 312.328401 330.628186z" fill="#FF9000"></path></svg>', audio: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M113.7664 540.4672c0-219.9552 178.2784-398.2336 398.2336-398.2336S910.2336 320.512 910.2336 540.4672v284.4672c0 31.4368-25.4976 56.9344-56.9344 56.9344h-56.9344c-31.4368 0-56.9344-25.4976-56.9344-56.9344V597.2992c0-31.4368 25.4976-56.9344 56.9344-56.9344h56.9344c0-188.5184-152.7808-341.2992-341.2992-341.2992S170.7008 351.9488 170.7008 540.4672h56.9344c31.4368 0 56.9344 25.4976 56.9344 56.9344v227.5328c0 31.4368-25.4976 56.9344-56.9344 56.9344h-56.9344c-31.4368 0-56.9344-25.4976-56.9344-56.9344V540.4672z" fill="#323233"></path></svg>', link: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M209.8 496.7c17.1 0 31.1-13.9 31.1-31.1 0-17.1-13.9-31-31.1-31s-31 13.9-31 31c-0.1 17.2 13.8 31.1 31 31.1zM345.1 750.2h-66c-37.3 0-45.9-8.6-45.9-45.9V534l-0.2-2.2h-0.2c-1.6-12.7-12.2-22.3-25.1-22.3-12.9 0-23.5 9.6-25.1 22.3h-0.4v172.4c0 66 30.8 96.8 96.8 96.8h66c14 0 25.4-11.4 25.4-25.4 0.1-14.1-11.3-25.4-25.3-25.4z" fill="#6B400D"></path><path d="M959.3 251.8c0-71.9-58.5-130.4-130.4-130.4H194.7c-71.9 0-130.4 58.5-130.4 130.4v523.3c0 71.9 58.5 130.4 130.4 130.4h634.2c71.9 0 130.4-58.5 130.4-130.4V251.8z m-50.6 523.3c0 44-35.8 79.8-79.8 79.8H194.7c-44 0-79.8-35.8-79.8-79.8V251.8c0-44 35.8-79.8 79.8-79.8h634.2c44 0 79.8 35.8 79.8 79.8v523.3z" fill="#6B400D"></path><path d="M684.1 469.8L486.1 343c-8.6-4.8-17.8-7-29.7-7-34 0-56 17.4-56 44.3v266.2c0 26.9 22 44.3 56 44.3 6.4 0 18.8-0.9 29.9-7.1l197.4-126.5c17.7-9 28.2-25.5 28.2-43.9 0-18.3-10.5-34.7-27.8-43.5z m-27.5 55.7L472 643.7c-3.2 1.5-4.9 1.5-8.1 1.5-8.1 0-16.2-6-16.2-15.1V396.7c0-9 8.1-15.1 16.2-15.1 3.2 0 6.5 0 8.1 1.5l184.6 118.2c6.5 4.5 8.1 10.5 8.1 12 0 3.2 0 9.2-8.1 12.2z" fill="#6B400D"></path><path d="M656.6 501.4L472 383.2c-1.6-1.5-4.9-1.5-8.1-1.5-8.1 0-16.2 6-16.2 15.1v233.4c0 9 8.1 15.1 16.2 15.1 3.2 0 4.9 0 8.1-1.5l184.6-118.2c8.1-3 8.1-9 8.1-12 0-1.6-1.7-7.7-8.1-12.2z" fill="#FFD524"></path></svg>', ppt: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M219.424 18.304h530.272l201.152 219.424v768H219.424V18.304z" fill="#FFFFFF"></path><path d="M733.696 253.728V50.304H251.424v923.424h667.424v-720h-185.152z m217.152-16v768H219.424V18.304h530.272l201.152 219.424z m-58.08-16l-127.04-138.624v138.624h127.04z" fill="#465F78"></path><path d="M64 256m32 0l448 0q32 0 32 32l0 448q0 32-32 32l-448 0q-32 0-32-32l0-448q0-32 32-32Z" fill="#FF501A"></path><path d="M640 416h224v37.344h-224V416zM640 509.344h224v37.312h-224v-37.312zM640 602.656h224V640h-224v-37.344z" fill="#FF501A"></path><path d="M224 658.88V384h89.056c33.76 0 55.744 1.376 66.016 4.128 15.744 4.128 28.928 13.12 39.552 27.008 10.624 13.76 15.936 31.552 15.936 53.44 0 16.864-3.072 31.04-9.184 42.56-6.112 11.488-13.952 20.544-23.424 27.2a80.352 80.352 0 0 1-28.704 12.928c-13.248 2.624-32.448 3.936-57.568 3.936h-36.16v103.68H224z m55.488-228.384v78.016h30.4c21.856 0 36.48-1.44 43.84-4.32a36.576 36.576 0 0 0 23.616-34.88c0.032-10.016-2.88-18.24-8.768-24.736a38.4 38.4 0 0 0-22.336-12.192c-6.624-1.28-19.936-1.888-39.936-1.888h-26.816z" fill="#FFFFFF"></path></svg>' }
  return m[t] || '📄'
}

function resourceIconClass(resource: ResourceVO) {
  return bilibiliPreview(resource) ? 'link' : resource.resourceType
}

function resourceIconName(resource: ResourceVO) {
  return resourceIcon(bilibiliPreview(resource) ? 'link' : resource.resourceType)
}

function isResourceGroupExpanded(groupKey: string) {
  return expandedResourceGroupKeys.value.includes(groupKey)
}

function visibleGroupResources(group: { key: string; items: ResourceVO[] }) {
  if (isResourceGroupExpanded(group.key)) return group.items
  return group.items.slice(0, resourceGroupPreviewLimit)
}

function hiddenResourceCount(group: { key: string; items: ResourceVO[] }) {
  return Math.max(group.items.length - resourceGroupPreviewLimit, 0)
}

function toggleResourceGroup(groupKey: string) {
  if (isResourceGroupExpanded(groupKey)) {
    expandedResourceGroupKeys.value = expandedResourceGroupKeys.value.filter(key => key !== groupKey)
    return
  }
  expandedResourceGroupKeys.value = [...expandedResourceGroupKeys.value, groupKey]
}

function resetResourceFilters() {
  resourceSearchKeyword.value = ''
  resourceTypeFilter.value = 'all'
  resourceStatusFilter.value = 'all'
  resourceSortMode.value = 'default'
  expandedResourceGroupKeys.value = []
}

function resourceTypeLabel(t: string) {
  const m: Record<string, string> = { doc: '文档', html: 'HTML', ppt: 'PPT', video: '视频', mind_map: '思维导图', quiz: '练习题', case_study: '案例', flashcard_set: '闪卡', image: '图片', audio: '音频', link: 'B站推荐' }
  return m[t] || t
}

function resourceSourceLabel(resource: ResourceVO) {
  if (resource.source === 'curated') return resource.resourceType === 'link' ? 'AI筛选' : '精选'
  if (resource.isAiGenerated) return 'AI生成'
  return '用户上传'
}

function bilibiliPreview(resource: ResourceVO): any | null {
  if (resource.resourceType !== 'link' || !resource.metadata) return null
  try {
    const metadata = JSON.parse(resource.metadata)
    return metadata.bilibiliPreview || null
  } catch {
    return null
  }
}

function resourceStatusLabel(status: string) {
  const m: Record<string, string> = { planned: '待生成', generating: '生成中', generated: '可使用', failed: '失败' }
  return m[status] || status
}

function formatDuration(seconds: number | string | undefined) {
  const value = Number(seconds || 0)
  if (!value) return ''
  const min = Math.floor(value / 60)
  const sec = value % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

function displayResourceStatus(resource: ResourceVO) {
  const streaming = resource.id ? streamingResources.value[resource.id] : undefined
  if (streaming?.status) return streaming.status
  if (generatingResourceIds.value.includes(resource.id)) return 'generating'
  const job = latestGenerationJob(resource)
  if (job?.status === 'pending' || job?.status === 'generating') return 'generating'
  if (job?.status === 'failed' && resource.status !== 'generated') return 'failed'
  return resource.status || 'generated'
}

function latestGenerationJob(resource: ResourceVO) {
  return resource.id ? generationJobByResourceId.value.get(resource.id) : undefined
}

function resourceGenerationHint(resource: ResourceVO) {
  const status = displayResourceStatus(resource)
  const streaming = resource.id ? streamingResources.value[resource.id] : undefined
  if (streaming?.message) return streaming.message
  if (streaming?.content && status === 'generating') return '内容正在实时返回，生成完成后会自动保存。'
  const job = latestGenerationJob(resource)
  if (status === 'generating') return '后台正在生成内容，完成后会自动刷新。'
  if (status === 'failed') {
    return job?.errorMessage ? `生成失败：${job.errorMessage}` : '生成失败，可重试。'
  }
  return ''
}

function taskTitle(taskId: string | null | undefined) {
  if (!taskId) return ''
  return allTasks.value.find(task => task.id === taskId)?.title || ''
}

function goResourceDetail(resource: ResourceVO) {
  if (!resource?.id) return
  router.push(`/resources/${resource.id}`)
}

function canGenerateResource(resource: ResourceVO) {
  const status = displayResourceStatus(resource)
  return status === 'planned' || status === 'failed'
}

function streamingResourceContent(resource: ResourceVO) {
  if (!resource.id) return ''
  const content = streamingResources.value[resource.id]?.content || ''
  return content.length > 900 ? `${content.slice(-900)}` : content
}

function isResourceBusy(resource: ResourceVO) {
  return displayResourceStatus(resource) === 'generating'
}

function handleResourceCardClick(resource: ResourceVO) {
  if (isResourceBusy(resource)) return
  if (resource.status === 'generated' || !resource.status) {
    goResourceDetail(resource)
  }
}

async function handleGenerateSingleResource(resource: ResourceVO) {
  if (!resource.id || isResourceBusy(resource)) return
  generatingResourceIds.value = [...generatingResourceIds.value, resource.id]
  try {
    if (displayResourceStatus(resource) === 'failed') {
      await learningResourceApi.retryGeneration(resource.id)
      ElMessage.success('已重新提交生成任务')
    } else {
      await learningResourceApi.generate(resource.id)
      ElMessage.success('资料已生成，可以开始学习')
    }
    await dashStore.fetchDashboard(spaceId.value)
    await refreshResourceGenerationJobs()
    startResourceGenerationPolling()
  } catch (e: any) {
    ElMessage.error(e?.message || '资料生成失败，请稍后重试')
    await dashStore.fetchDashboard(spaceId.value).catch(() => {})
    await refreshResourceGenerationJobs().catch(() => {})
  } finally {
    generatingResourceIds.value = generatingResourceIds.value.filter(id => id !== resource.id)
  }
}

async function refreshResourceGenerationJobs(showError = false) {
  if (!spaceId.value || resourcePollingInFlight.value) return
  resourcePollingInFlight.value = true
  try {
    resourceGenerationJobs.value = await resourceGenerationJobApi.list(spaceId.value, 20)
  } catch (e: any) {
    if (showError) ElMessage.error(e?.message || '资源生成状态刷新失败')
  } finally {
    resourcePollingInFlight.value = false
  }
}

function hasActiveResourceGeneration() {
  const resources = dashboard.value?.resources || []
  return generatingResourceIds.value.length > 0
    || resources.some(resource => resource.status === 'generating')
    || resourceGenerationJobs.value.some(job => job.status === 'pending' || job.status === 'generating')
}

function startResourceGenerationPolling() {
  if (resourcePollingTimer.value) return
  resourcePollingTimer.value = setInterval(async () => {
    await refreshResourceGenerationJobs()
    if (spaceId.value && hasActiveResourceGeneration()) {
      await dashStore.fetchDashboard(spaceId.value)
      return
    }
    stopResourceGenerationPolling()
  }, 4000)
}

function stopResourceGenerationPolling() {
  if (!resourcePollingTimer.value) return
  clearInterval(resourcePollingTimer.value)
  resourcePollingTimer.value = null
}

function normalizeText(text: string | null | undefined) {
  return String(text || '').trim().toLowerCase()
}

function phaseKey(phase: PhaseInfo) {
  return `${phase.phaseIndex || 'x'}-${phase.phaseName || ''}`
}

function isPhaseExpanded(phase: PhaseInfo) {
  return expandedPhaseKeys.value.includes(phaseKey(phase))
}

function togglePhase(phase: PhaseInfo) {
  const key = phaseKey(phase)
  expandedPhaseKeys.value = isPhaseExpanded(phase)
    ? expandedPhaseKeys.value.filter(item => item !== key)
    : [...expandedPhaseKeys.value, key]
}

function isActivePlanPhase(phase: PhaseInfo) {
  return phaseKey(phase) === currentPlanPhaseKey.value
}

function phaseSummary(phase: PhaseInfo) {
  const points = phase.knowledgePoints || []
  if (!points.length) return '暂无明确知识点，等待 Agent 补全阶段内容'
  return points.slice(0, 3).join(' / ') + (points.length > 3 ? ` 等 ${points.length} 个重点` : '')
}

function phaseResourceGroups(phase: PhaseInfo) {
  const groups = new Map<string, ResourceInfo[]>()
  ;(phase.resources || []).forEach(resource => {
    const type = resource.resourceType || 'doc'
    const list = groups.get(type) || []
    list.push(resource)
    groups.set(type, list)
  })
  return [...groups.entries()].map(([type, items]) => ({ type, items }))
}

function knowledgeNodeByName(name: string) {
  return knowledgeNodeMap.value.get(normalizeText(name))
}

function knowledgeDescription(name: string) {
  return knowledgeNodeByName(name)?.description || ''
}

function knowledgeImportanceLabel(name: string) {
  const importance = Number(knowledgeNodeByName(name)?.importance || 0)
  if (!importance) return ''
  if (importance >= 4) return '重点'
  if (importance >= 3) return '常规'
  return '了解'
}

function findPhaseByRuntimeContext(phases: PhaseInfo[]) {
  const d = dashboard.value
  if (!d) return null

  const candidateNodeIds = [nextTodayTask.value?.pathNodeId, d.pathProgress?.currentNodeId]
    .filter((id): id is string => Boolean(id))
  for (const nodeId of candidateNodeIds) {
    const node = d.pathNodes.find(item => item.id === nodeId)
    const matched = node ? findPhaseByText(phases, node.title) : null
    if (matched) return matched
  }

  if (nextTodayTask.value?.title) {
    return findPhaseByText(phases, nextTodayTask.value.title)
  }

  return null
}

function findPhaseByText(phases: PhaseInfo[], text: string | null | undefined) {
  const normalized = normalizeText(text)
  if (!normalized) return null

  return phases.find(phase => {
    const phaseName = normalizeText(phase.phaseName)
    const points = (phase.knowledgePoints || []).map(normalizeText).filter(Boolean)
    return (!!phaseName && phaseName === normalized)
      || (!!phaseName && phaseName.includes(normalized))
      || (!!phaseName && normalized.includes(phaseName))
      || points.some(point => point === normalized || point.includes(normalized) || normalized.includes(point))
  }) || null
}

function togglePackageType(type: ResourceType) {
  if (selectedPackageTypes.value.includes(type)) {
    if (selectedPackageTypes.value.length === 1) {
      ElMessage.info('至少保留一种资料类型')
      return
    }
    selectedPackageTypes.value = selectedPackageTypes.value.filter(item => item !== type)
    return
  }
  selectedPackageTypes.value = [...selectedPackageTypes.value, type]
}

function buildPackagePayload(): ResourcePackageGenerateDTO {
  const target = resourcePackageTarget.value
  return {
    taskId: target.taskId,
    pathNodeId: target.pathNodeId,
    knowledgePoint: target.knowledgePoint,
    resourceTypes: selectedPackageTypes.value,
    userIntent: target.reason,
    packageMode: target.taskId ? 'task' : 'review',
    targetMinutes: nextTodayTask.value?.estimatedDurationMinutes || 30,
  }
}

async function handlePreviewResourcePackage() {
  if (!spaceId.value) return
  packagePreviewLoading.value = true
  packageRunningSteps.value = []
  try {
    resourcePackagePreview.value = await resourcePackageApi.preview(spaceId.value, buildPackagePayload())
    packageRunningSteps.value = resourcePackagePreview.value.agentActions.map(action => ({
      reason: action.reason,
      status: action.status,
    }))
    packagePreviewVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '资料包预览失败')
  } finally {
    packagePreviewLoading.value = false
  }
}

function abortPackageStream() {
  if (!packageStreamAbortController.value) return
  packageStreamAbortController.value.abort()
  packageStreamAbortController.value = null
}

function upsertOptimisticResource(resource: ResourceVO) {
  if (!resource?.id) return
  const exists = optimisticPackageResources.value.some(item => item.id === resource.id)
  if (exists) {
    optimisticPackageResources.value = optimisticPackageResources.value.map(item =>
      item.id === resource.id ? { ...item, ...resource } : item
    )
    return
  }
  optimisticPackageResources.value = [{ ...resource, status: resource.status || 'generating' }, ...optimisticPackageResources.value]
}

function updateOptimisticResourceStatus(resourceId: string | undefined, status: ResourceVO['status']) {
  if (!resourceId) return
  optimisticPackageResources.value = optimisticPackageResources.value.map(resource =>
    resource.id === resourceId ? { ...resource, status } : resource
  )
}

function setStreamingState(resource: ResourceVO, status: 'generating' | 'generated' | 'failed', message?: string) {
  if (!resource.id) return
  streamingResources.value = {
    ...streamingResources.value,
    [resource.id]: {
      status,
      content: streamingResources.value[resource.id]?.content || '',
      title: resource.title,
      resourceType: resource.resourceType,
      message,
    },
  }
}

function appendStreamingContent(resourceId: string | undefined, chunk: string | undefined) {
  if (!resourceId || !chunk) return
  const current = streamingResources.value[resourceId] || {
    status: 'generating' as const,
    content: '',
    title: '',
    resourceType: 'doc' as ResourceType,
  }
  streamingResources.value = {
    ...streamingResources.value,
    [resourceId]: {
      ...current,
      status: current.status === 'failed' ? 'failed' : 'generating',
      content: `${current.content}${chunk}`,
    },
  }
}

function handleResourcePackageStreamEvent(eventName: ResourcePackageStreamEventName, payload: ResourcePackageStreamEvent) {
  if (eventName === 'package-start' && payload.package) {
    resourcePackagePreview.value = payload.package
    optimisticPackageResources.value = payload.package.resources || []
    packageRunningSteps.value = payload.package.agentActions?.map(action => ({
      reason: action.reason,
      status: action.status,
    })) || packageRunningSteps.value
    optimisticPackageResources.value.forEach(resource => setStreamingState(resource, 'generating'))
    return
  }

  if (eventName === 'resource-start' && payload.resource) {
    upsertOptimisticResource(payload.resource)
    setStreamingState(payload.resource, 'generating', '内容正在实时返回，生成完成后会自动保存。')
    return
  }

  if (eventName === 'resource-token') {
    appendStreamingContent(payload.resourceId, payload.chunk)
    return
  }

  if (eventName === 'resource-done') {
    if (!payload.resourceId) return
    const current = streamingResources.value[payload.resourceId]
    if (current) {
      streamingResources.value = {
        ...streamingResources.value,
        [payload.resourceId]: { ...current, status: 'generated', message: '生成完成，内容已保存。' },
      }
    }
    updateOptimisticResourceStatus(payload.resourceId, 'generated')
    return
  }

  if (eventName === 'resource-failed') {
    if (!payload.resourceId) return
    const current = streamingResources.value[payload.resourceId] || {
      status: 'failed' as const,
      content: '',
      title: payload.title || '',
      resourceType: (payload.resourceType as ResourceType) || 'doc',
    }
    streamingResources.value = {
      ...streamingResources.value,
      [payload.resourceId]: {
        ...current,
        status: 'failed',
        message: payload.message || '生成失败，可稍后重试。',
      },
    }
    updateOptimisticResourceStatus(payload.resourceId, 'failed')
    return
  }

  if (eventName === 'package-done') {
    packageRunningSteps.value = packageRunningSteps.value.map(step => ({ ...step, status: 'success' }))
    return
  }

  if (eventName === 'package-failed') {
    packageRunningSteps.value = packageRunningSteps.value.map(step => ({ ...step, status: 'failed' }))
  }
}

async function handleGenerateResourcePackage() {
  if (!spaceId.value) return
  abortPackageStream()
  const controller = new AbortController()
  packageStreamAbortController.value = controller
  packageGenerating.value = true
  packagePreviewVisible.value = false
  streamingResources.value = {}
  optimisticPackageResources.value = []
  packageRunningSteps.value = [
    { reason: '资源 Agent 正在分析当前任务和知识点', status: 'running' },
    { reason: '正在生成资料内容并实时返回片段', status: 'running' },
    { reason: 'Supervisor Agent 正在检查资料来源和使用场景', status: 'running' },
  ]
  try {
    await streamGenerateResourcePackage(spaceId.value, buildPackagePayload(), {
      signal: controller.signal,
      onEvent: handleResourcePackageStreamEvent,
    })
    await dashStore.fetchDashboard(spaceId.value)
    await refreshResourceGenerationJobs()
    optimisticPackageResources.value = []
    if (hasActiveResourceGeneration()) startResourceGenerationPolling()
    ElMessage.success('资料包已生成并保存')
  } catch (e: any) {
    if (controller.signal.aborted) return
    packageRunningSteps.value = packageRunningSteps.value.map(step => ({ ...step, status: 'failed' }))
    ElMessage.error(e?.message || '资料包生成失败')
  } finally {
    if (packageStreamAbortController.value === controller) {
      packageStreamAbortController.value = null
    }
    packageGenerating.value = false
  }
}

async function handleStartTask(task: TaskVO) {
  try {
    await dashStore.startTask(task.id)
    enterTask(task, { spaceId: spaceId.value, source: 'space_task' })
  } catch {
    ElMessage.error('开始任务失败')
  }
}

async function handleCompleteTask(task: TaskVO) {
  try {
    await ElMessageBox.prompt('请输入实际学习时长（分钟）', '完成任务', {
      confirmButtonText: '确认完成',
      inputType: 'number',
      inputValue: String(task.estimatedDurationMinutes || 20),
    })
    const minutes = Number((document.querySelector('.el-message-box__input input') as HTMLInputElement)?.value || task.estimatedDurationMinutes || 20)
    await dashStore.completeTask(task.id, minutes)
    ElMessage.success('任务完成！')
  } catch {
    // cancelled
  }
}

function handleContinueToday() {
  const task = nextTodayTask.value
  if (!task) {
    router.push({ path: '/ai-tutor', query: { action: 'adjust_today', spaceId: spaceId.value } })
    return
  }
  if (task.status === 'pending') {
    dashStore.startTask(task.id).finally(() => {
      enterTask(task, { spaceId: spaceId.value, source: 'space_hero' })
    })
    return
  }
  enterTask(task, { spaceId: spaceId.value, source: 'space_hero' })
}

/** 继续学习 hero 区块的"开始学习"主按钮 */
function handleStartFromHero() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('今日 Agent 暂未排定具体任务，已为你打开 AI 总学习伙伴。')
    router.push({ path: '/ai-tutor', query: { action: 'adjust_today', spaceId: spaceId.value } })
    return
  }
  if (task.status === 'pending') {
    dashStore.startTask(task.id).catch(() => {})
  }
  enterTask(task, { spaceId: spaceId.value, source: 'space_hero' })
}

function handleAdjustDuration() {
  ElMessage.info('Agent 已记录你的时长偏好，下次会话将据此调整（mock）。')
}

function handleSimplerExplain() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('暂无可调整的学习会话。')
    return
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero', mode: 'learn' })
  ElMessage.success('已为你切换到更基础的讲解节奏。')
}

function handleAssessFirst() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('暂无可测评的学习会话。')
    return
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero', mode: 'assessment' })
}

function handleAgentQuickAction(label: string) {
  // Navigate to AI Tutor with the question pre-filled, or open agent panel
  router.push({ path: '/ai-tutor', query: { message: label, spaceId: spaceId.value } })
}

function handleAgentMessage(text: string) {
  // The SpaceAgentPanel handles local echo; for real SSE, post to /agent/chat/stream
  console.log('Agent message:', text, 'spaceId:', spaceId.value)
}

async function loadLearningPlan(id: string) {
  planLoading.value = true
  planDraft.value = null
  expandedPhaseKeys.value = []
  try {
    planDraft.value = await agentApi.getLearningPlanBySpace(id)
    const phases = planDraft.value?.phases || []
    if (phases.length) {
      const runtimePhase = findPhaseByRuntimeContext(phases) || phases[0]
      expandedPhaseKeys.value = [phaseKey(runtimePhase)]
    }
  } catch (e) {
    console.warn('Failed to load learning plan draft:', e)
    planDraft.value = null
  } finally {
    planLoading.value = false
  }
}

async function loadAlgorithmState(id: string) {
  if (!id) return
  algorithmLoading.value = true
  algorithmError.value = ''
  try {
    algorithmState.value = await fetchLearningState(id)
  } catch (e) {
    console.warn('Failed to load learning algorithm state:', e)
    algorithmState.value = null
    algorithmError.value = '无法读取算法诊断，当前页面会继续使用学习空间已有任务和记录。'
  } finally {
    algorithmLoading.value = false
  }
}

function loadDashboard() {
  const id = spaceId.value
  if (id) {
    dashStore.fetchDashboard(id).then(async () => {
      await refreshResourceGenerationJobs()
      if (hasActiveResourceGeneration()) startResourceGenerationPolling()
    })
    loadLearningPlan(id)
    loadAlgorithmState(id)
  }
}

function syncActiveTabFromRoute() {
  const tab = String(route.query.tab || '')
  if (['today', 'plan', 'path', 'resources', 'records'].includes(tab)) {
    activeTab.value = tab
  }
}

onMounted(() => {
  syncActiveTabFromRoute()
  loadDashboard()
})
onUnmounted(() => {
  abortPackageStream()
  stopResourceGenerationPolling()
})
watch(() => route.params.spaceId, () => {
  abortPackageStream()
  stopResourceGenerationPolling()
  resourceGenerationJobs.value = []
  streamingResources.value = {}
  optimisticPackageResources.value = []
  resetResourceFilters()
  loadDashboard()
  syncActiveTabFromRoute()
  if (!route.query.tab) activeTab.value = 'today'
})
watch(() => route.query.tab, syncActiveTabFromRoute)
watch(currentPlanPhaseKey, key => {
  if (key && !expandedPhaseKeys.value.includes(key)) {
    expandedPhaseKeys.value = [key, ...expandedPhaseKeys.value]
  }
})
watch(
  () => dashboard.value?.resources?.map(resource => `${resource.id}:${resource.status}`).join('|') || '',
  () => {
    if (hasActiveResourceGeneration()) startResourceGenerationPolling()
  }
)
watch(
  [resourceSearchKeyword, resourceTypeFilter, resourceStatusFilter, resourceSortMode],
  () => {
    expandedResourceGroupKeys.value = []
  }
)
</script>

<style scoped lang="scss">
.learning-space-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Loading / Error ========== */
.loading-state, .error-state {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.skeleton-hero { min-height: 180px; border-radius: 16px; overflow: hidden; }
.skeleton-block {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  width: 100%;
  height: 100%;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ========== Hero ========== */
.space-hero {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero-content {
  position: relative;
  padding: 24px 28px;
  background: var(--color-card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid #f0f0f0;
  border-radius: 16px;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: #f9fafb; color: #3b82f6; }
}

.hero-info { flex: 1; }

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.hero-goal {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 2px 0 0;
}

.hero-badge {
  font-size: 0.75rem;
  padding: 4px 14px;
  border-radius: 99px;
  font-weight: 500;

  &.good { background: #ecfdf5; color: #10b981; }
  &.normal { background: #eff6ff; color: #3b82f6; }
  &.warning { background: #fef3c7; color: #d97706; }
  &.danger { background: #fef2f2; color: #ef4444; }
}

.stats-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.agent-insight-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #d1d5db; }
}

.insight-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.insight-text {
  flex: 1;
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.5;
}

.insight-link {
  font-size: 0.75rem;
  color: #3b82f6;
  white-space: nowrap;
}

/* ========== Page Body ========== */
.page-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* ========== Tab Nav ========== */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  .tab-icon { display: flex; align-items: center; }
  &:hover { color: #374151; background: #f9fafb; }

  &.active {
    color: #3b82f6;
    background: #eff6ff;
    font-weight: 600;
  }
}

.tab-badge {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #e5e7eb;
  color: #6b7280;
  .tab-btn.active & { background: #dbeafe; color: #3b82f6; }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== Section ========== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  h3 { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0; }
  .text-danger { color: #ef4444; }
}

.task-count {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;

  &.danger { color: #ef4444; }
}

.mt-32 { margin-top: 32px; }

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-actions-row {
  display: flex;
  gap: 10px;
  padding-top: 8px;
}

/* ========== Agent Plan ========== */
.plan-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-skeleton {
  height: 120px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  &.short { height: 64px; }
}

.plan-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: stretch;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
}

.plan-overview-main {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 4px 0 6px;
    font-size: 1.0625rem;
    color: #1a1a2e;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.6;
  }
}

.plan-eyebrow {
  font-size: 0.6875rem;
  color: #3b82f6;
  font-weight: 600;
}

.plan-next-step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  max-width: 680px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);

  span {
    color: #0a9e94;
    font-size: 0.75rem;
    font-weight: 700;
  }

  strong {
    min-width: 0;
    color: #334155;
    font-size: 0.8125rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.plan-overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(86px, 1fr));
  gap: 12px;
}

.plan-stat {
  min-width: 86px;
  padding: 12px;
  border-radius: 10px;
  background: #f9fafb;
  text-align: center;

  strong {
    display: block;
    color: #1a1a2e;
    font-size: 1.125rem;
    line-height: 1.2;
  }

  span {
    color: #9ca3af;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;
  }
}

.plan-meta-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  span {
    padding: 4px 10px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 0.75rem;
  }
}

.plan-risk-pill {
  &.good,
  &.normal {
    background: #ecfdf5;
    color: #047857;
  }

  &.warning {
    background: #fffbeb;
    color: #b45309;
  }

  &.danger {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.children-label {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
}

.plan-goals {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: white;

  .children-label {
    margin: 0 4px 0 0;
  }
}

.goal-chip,
.kp-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 500;
}

.plan-phase-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-phase-card {
  position: relative;
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background: white;

  &.active {
    border-color: rgba(11, 183, 170, 0.32);
    box-shadow: 0 10px 28px rgba(11, 183, 170, 0.08);
  }

  &.active::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: #0bb7aa;
  }
}

.plan-phase-head {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  h4 {
    margin: 3px 0 0;
    font-size: 0.9375rem;
    color: #1a1a2e;
    line-height: 1.45;
  }

  p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 0.75rem;
    line-height: 1.45;
  }

  &:hover {
    background: #f8fafc;
  }
}

.phase-head-main {
  min-width: 0;
}

.phase-index {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;

  em {
    margin-left: 2px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #ecfdfb;
    color: #0a9e94;
    font-style: normal;
    font-size: 0.625rem;
  }
}

.phase-number {
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecfdfb;
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 0 0 1px rgba(11, 183, 170, 0.12);
}

.plan-phase-card.active .phase-number {
  background: #0bb7aa;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.phase-head-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;

  > span:not(.phase-duration) {
    padding: 3px 8px;
    border-radius: 999px;
    background: #f8fafc;
  }
}

.phase-duration {
  padding: 3px 10px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.phase-toggle-icon {
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.18s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.phase-detail {
  padding: 0 18px 18px;
}

.phase-section + .phase-section {
  margin-top: 16px;
}

.phase-kp-list {
  display: grid;
  gap: 8px;
}

.phase-kp-item {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.kp-order {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
}

.kp-body {
  min-width: 0;

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 0.75rem;
    line-height: 1.5;
  }
}

.kp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  strong {
    color: #1f2937;
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}

.kp-importance {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 0.625rem;
  font-weight: 700;
}

.phase-resource-groups {
  display: grid;
  gap: 10px;
}

.phase-resource-group {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: #ffffff;
  overflow: hidden;
}

.resource-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);

  strong {
    color: #334155;
    font-size: 0.8125rem;
  }

  em {
    margin-left: auto;
    color: #94a3b8;
    font-size: 0.6875rem;
    font-style: normal;
  }
}

.phase-resources {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
}

.phase-resource {
  padding: 10px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);

  &:nth-child(1),
  &:nth-child(2) {
    border-top: 0;
  }

  &:nth-child(odd) {
    border-right: 1px solid rgba(148, 163, 184, 0.08);
  }

  strong {
    display: block;
    color: #374151;
    font-size: 0.8125rem;
    line-height: 1.4;
    word-break: break-word;
  }
}

/* ========== Resource Grid ========== */
.resource-agent-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  margin-bottom: 16px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(11, 183, 170, 0.18);
  background: linear-gradient(135deg, #ffffff, #ecfdfb);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.resource-agent-main {
  min-width: 0;

  h4 {
    margin: 4px 0 6px;
    color: #0f172a;
    font-size: 1rem;
    line-height: 1.4;
  }

  p {
    margin: 0 0 12px;
    color: #64748b;
    font-size: 0.8125rem;
    line-height: 1.55;
  }
}

.resource-agent-eyebrow,
.resource-package-eyebrow {
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 800;
}

.resource-type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;

  &.active {
    border-color: rgba(11, 183, 170, 0.32);
    background: #ecfdfb;
    color: #0a9e94;
  }
}

.resource-agent-actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.resource-progress {
  display: grid;
  gap: 8px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.resource-progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.75rem;

  &.success { color: #059669; }
  &.running { color: #0284c7; }
  &.failed { color: #dc2626; }
  &.waiting_user_confirm { color: #d97706; }
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 14%, transparent);
}

.resource-management-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  margin: 0 0 18px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
}

.resource-search-box {
  min-width: 0;
}

.resource-filter-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.resource-filter-select {
  width: 118px;
}

.resource-result-summary {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  min-width: 72px;
  color: #64748b;
  font-size: 0.75rem;
  white-space: nowrap;

  strong {
    color: #0f172a;
    font-size: 1rem;
  }
}

.resource-package-list {
  display: grid;
  gap: 18px;
}

.resource-package-section {
  padding-top: 2px;
}

.resource-package-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h4 {
    margin: 3px 0 0;
    color: #0f172a;
    font-size: 0.95rem;
  }
}

.resource-package-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.resource-group-toggle {
  border: 0;
  background: transparent;
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.resource-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { box-shadow: 0 2px 12px  var(--color-shadow); transform: translateY(-1px); }

  &.disabled {
    cursor: wait;
    opacity: 0.78;
  }
}

.res-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;

  &.doc, &.ppt { background: #eff6ff; } &.html { background: #f0fdf4; } &.video { background: #fef2f2; }
  &.mind_map { background: #ede9fe; } &.quiz { background: #ecfdf5; }
  &.case_study { background: #fef3c7; } &.flashcard_set { background: #fce7f3; }
  &.image { background: #f0fdf4; } &.audio { background: #fff7ed; } &.link { background: #f3f4f6; }
}

.res-icon :deep(svg) { width: 24px; height: 24px; }
.res-icon.mind_map :deep(svg) { width: 32px; height: 32px; }

.res-body { flex: 1; min-width: 0; }
.res-title { font-size: 0.875rem; font-weight: 600; color: #1a1a2e; margin: 0 0 2px; }
.res-video-title {
  margin: 0 0 5px;
  color: #334155;
  font-size: 0.78rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.res-desc {
  color: #6b7280;
  display: -webkit-box;
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0 0 6px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.res-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.res-type { font-size: 0.6875rem; color: #9ca3af; }
.res-source {
  font-size: 0.6875rem;
  padding: 1px 6px; border-radius: 99px;
  &.ai { background: #ede9fe; color: #7c3aed; }
  &.curated { background: #f0fdf4; color: #16a34a; }
  &.user { background: #f3f4f6; color: #6b7280; }
}
.res-status {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 99px;

  &.generated { background: #ecfdf5; color: #059669; }
  &.planned { background: #fffbeb; color: #d97706; }
  &.generating { background: #eff6ff; color: #2563eb; }
  &.failed { background: #fef2f2; color: #dc2626; }
}

.res-reason {
  margin: 8px 0 0;
  color: #475569;
  font-size: 0.72rem;
  line-height: 1.5;
}

.res-generation-hint {
  margin: 7px 0 0;
  font-size: 0.72rem;
  line-height: 1.45;

  &.generating { color: #2563eb; }
  &.failed { color: #dc2626; }
}

.res-stream-preview {
  margin-top: 9px;
  padding: 9px 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.stream-preview-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: #2563eb;
  font-size: 0.68rem;
  font-weight: 800;
}

.stream-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.res-stream-preview pre {
  max-height: 150px;
  margin: 0;
  overflow: auto;
  color: #334155;
  font-family: inherit;
  font-size: 0.72rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.res-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
  max-height: 24px;
  overflow: hidden;

  span {
    padding: 2px 7px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 0.65rem;
    font-weight: 700;
  }
}

.res-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.package-preview {
  h3 {
    margin: 4px 0 8px;
    color: #0f172a;
    font-size: 1.05rem;
  }

  > p {
    margin: 0 0 14px;
    color: #64748b;
    font-size: 0.8125rem;
    line-height: 1.55;
  }
}

.preview-resource-list {
  display: grid;
  gap: 10px;
}

.preview-resource-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;

  strong {
    display: block;
    color: #1f2937;
    font-size: 0.8125rem;
  }

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 0.72rem;
    line-height: 1.45;
  }

  em {
    color: #94a3b8;
    font-size: 0.7rem;
    font-style: normal;
    white-space: nowrap;
  }
}

.preview-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f8fafc;
}

.preview-icon :deep(svg) { width: 22px; height: 22px; }
.resource-group-head :deep(svg) { width: 1em; height: 1em; vertical-align: middle; }
.type-chip :deep(svg) { width: 1em; height: 1em; vertical-align: middle; }
.type-chip .mind_map :deep(svg) { width: 1.5em; height: 1.5em; }

/* ========== Assessment Summary ========== */
.assessment-summary {
  display: flex;
  gap: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.assess-stat { text-align: center; }
.assess-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  &.green { color: #10b981; } &.blue { color: #3b82f6; } &.purple { color: #7c3aed; }
}
.assess-label { font-size: 0.75rem; color: #9ca3af; }

.weakness-list { display: flex; gap: 8px; flex-wrap: wrap; }
.weakness-tag {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 99px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.records-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  font-size: 0.8125rem;
}

.record-date { color: #6b7280; font-weight: 500; min-width: 80px; }
.record-duration { color: #3b82f6; font-weight: 600; min-width: 64px; }
.record-tasks { color: #374151; }
.record-focus { display: flex; gap: 2px; }
.focus-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #e5e7eb;
  &.filled { background: #f59e0b; }
}
.record-reflection {
  color: #9ca3af;
  font-size: 0.75rem;
  flex: 1;
  text-align: right;
}

/* ========== Refined Learning Space Experience ========== */
.learning-space-page {
  max-width: 1480px;
  gap: 24px;
  padding-bottom: 24px;
}

.space-hero {
  border-radius: 18px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.space-hero::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 17px;
  background:
    radial-gradient(circle at 14% 18%, rgba(11, 183, 170, 0.18), transparent 30%),
    radial-gradient(circle at 88% 18%, rgba(59, 130, 246, 0.15), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  pointer-events: none;
}

.hero-bg {
  opacity: 0.22;
  filter: saturate(130%);
}

.hero-bg.has-cover {
  opacity: 0.36;
  filter: saturate(112%) contrast(104%);
}

.hero-content {
  padding: 24px;
  background: var(--color-card-bg-secondary);
  border-color: rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.hero-top {
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border-color: rgba(148, 163, 184, 0.24);
  color: #475569;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.back-btn:hover {
  background: #ecfdfb;
  color: #0a9e94;
  border-color: rgba(11, 183, 170, 0.28);
  transform: translateX(-2px);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 5px;
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(1.35rem, 1.6vw, 1.82rem);
  color: #0f172a;
  letter-spacing: 0;
  line-height: 1.2;
}

.hero-goal {
  max-width: 720px;
  margin-top: 5px;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.45;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 14%, transparent);
}

.hero-badge.good,
.hero-badge.normal {
  background: #ecfdf5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.18);
}

.hero-badge.warning {
  background: #fffbeb;
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.22);
}

.hero-badge.danger {
  background: #fef2f2;
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.hero-primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.hero-primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(11, 183, 170, 0.28);
}

.hero-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.9fr);
  gap: 20px;
  align-items: stretch;
}

.hero-dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.progress-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border-radius: 15px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(236, 253, 251, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.035);
}

.progress-ring {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  padding: 7px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
}

.progress-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
}

.progress-ring-inner strong {
  color: #0f172a;
  font-size: 1.12rem;
  line-height: 1.1;
}

.progress-ring-inner span {
  color: #94a3b8;
  font-size: 0.66rem;
  font-weight: 700;
}

.progress-copy {
  min-width: 0;
}

.progress-label {
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 700;
}

.progress-copy strong {
  display: block;
  margin-top: 3px;
  color: #1e293b;
  font-size: 0.95rem;
  line-height: 1.35;
}

.progress-copy p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 0;
}

.stats-row :deep(.stat-card) {
  min-height: 74px;
  gap: 11px;
  padding: 13px 14px;
  border-radius: 14px;
  box-shadow: 0 7px 18px rgba(15, 23, 42, 0.035);
}

.stats-row :deep(.stat-icon) {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.stats-row :deep(.stat-value) {
  font-size: 1rem;
}

.agent-insight-banner {
  min-height: 100%;
  margin-top: 0;
  padding: 13px 14px;
  border-radius: 14px;
  background: var(--color-card-bg-secondary);
  border-color: rgba(11, 183, 170, 0.15);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.03);
}

.agent-insight-banner:hover {
  border-color: rgba(11, 183, 170, 0.35);
  transform: translateY(-1px);
}

.insight-icon {
  background: linear-gradient(135deg, #ecfdfb, #e0f2fe);
  color: #0a9e94;
}

.insight-text {
  color: #334155;
}

.insight-link {
  color: #0a9e94;
  font-weight: 700;
}

.algorithm-diagnosis-band {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin-top: 0;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  background: linear-gradient(135deg, rgba(240, 249, 255, 0.88), rgba(236, 253, 245, 0.72));

  &.muted {
    border-color: rgba(148, 163, 184, 0.2);
    background: #f8fafc;
  }
}

.adb-eyebrow {
  display: inline-flex;
  margin-bottom: 3px;
  color: #0284c7;
  font-size: 0.68rem;
  font-weight: 800;
}

.hero-support-row {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 14px;
  margin-top: 16px;
}

.hero-support-row > :only-child {
  grid-column: 1 / -1;
}

.adb-main {
  min-width: 0;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 0.88rem;
    line-height: 1.32;
  }

  p {
    margin: 3px 0 0;
    color: #475569;
    font-size: 0.76rem;
    line-height: 1.4;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}

.adb-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(78px, 1fr));
  gap: 6px;

  div {
    min-width: 0;
    padding: 7px 9px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  strong {
    display: block;
    color: #0f172a;
    font-size: 0.86rem;
    line-height: 1.2;
  }

  span {
    color: #64748b;
    font-size: 0.66rem;
    font-weight: 700;
  }
}

/* 继续学习 hero 区块 */
.continue-study-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  margin-top: 0;
  padding: 22px;
  border-radius: 17px;
  background:
    linear-gradient(135deg, rgba(11, 183, 170, 0.16), rgba(2, 132, 199, 0.1)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(236, 253, 251, 0.76));
  border: 1px solid rgba(11, 183, 170, 0.28);
  box-shadow: 0 12px 28px rgba(11, 183, 170, 0.12);

  .csb-head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }

  .csb-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: #0a9e94;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    svg { color: #0bb7aa; }
  }

  .csb-time {
    font-size: 12px;
    color: #475569;
    background: var(--color-card-bg-secondary);
    padding: 2px 9px;
    border-radius: 999px;
  }

  .csb-title {
    margin: 0;
    font-size: clamp(1.1rem, 1.45vw, 1.45rem);
    font-weight: 700;
    color: #0f172a;
    line-height: 1.32;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .csb-judge {
    margin: 12px 0 0;
    font-size: 13px;
    color: #334155;
    line-height: 1.5;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .csb-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
    max-width: none;
    margin-top: auto;
    padding-top: 20px;
  }

  .csb-btn {
    min-height: 36px;
    padding: 8px 15px;
    border-radius: 11px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: #475569;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s ease;
    &:hover:not(:disabled) {
      border-color: #0bb7aa;
      color: #0bb7aa;
      transform: translateY(-1px);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &.primary {
      background: linear-gradient(135deg, #0bb7aa, #0284c7);
      color: #fff;
      border-color: transparent;
      font-weight: 600;
      box-shadow: 0 5px 14px rgba(11, 183, 170, 0.28);
      &:hover:not(:disabled) { color: #fff; opacity: 0.92; }
    }
  }
}

@media (max-width: 640px) {
  .continue-study-block .csb-btn { flex: 1 1 calc(50% - 4px); justify-content: center; }
}

.page-body {
  gap: 22px;
}

.main-content {
  display: flex;
  flex-direction: column;
}

.tab-nav {
  position: sticky;
  top: 0;
  z-index: 8;
  gap: 6px;
  padding: 6px;
  margin-bottom: 18px;
  border-radius: 16px;
  background: var(--color-card-bg-secondary);
  backdrop-filter: blur(14px);
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  overflow-x: auto;
}

.tab-btn {
  min-height: 38px;
  padding: 8px 16px;
  border-radius: 11px;
  color: #64748b;
}

.tab-btn:hover {
  color: #0f172a;
  background: #f8fafc;
}

.tab-btn.active {
  color: #0a9e94;
  background: #ecfdfb;
  box-shadow: inset 0 0 0 1px rgba(11, 183, 170, 0.15);
}

.tab-badge {
  background: #e2e8f0;
  color: #64748b;
}

.tab-btn.active .tab-badge {
  background: rgba(11, 183, 170, 0.14);
  color: #0a9e94;
}

.tab-content {
  padding: 20px;
  border-radius: 18px;
  background: var(--color-card-bg-secondary);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.section-header {
  margin-bottom: 8px;
}

.section-header h3 {
  color: #0f172a;
  font-size: 1.05rem;
}

.path-section-header {
  align-items: flex-start;
  gap: 14px;
}

.path-section-subtitle {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.path-header-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}

.path-view-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.16);

  button {
    min-height: 28px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;

    &:hover {
      color: #0f172a;
    }

    &.active {
      background: #ffffff;
      color: #0a9e94;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    }
  }
}

.task-count {
  padding: 3px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 600;
}

.task-count.danger {
  background: #fef2f2;
  color: #dc2626;
}

.task-list {
  gap: 12px;
}

.quick-actions-row {
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.plan-overview,
.plan-goals,
.plan-phase-card,
.resource-card,
.assessment-summary,
.record-row {
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.plan-overview {
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.plan-stat {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.plan-phase-card {
  border-radius: 16px;
}

.resource-grid {
  gap: 14px;
}

.resource-card {
  border-radius: 16px;
}

.resource-card:hover {
  border-color: rgba(11, 183, 170, 0.24);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
}

@media (max-width: 1200px) {
  .page-body {
    flex-direction: column;
  }

  .main-content {
    width: 100%;
  }
}

@media (max-width: 980px) {
  .hero-main-grid,
  .hero-support-row {
    grid-template-columns: 1fr;
  }

  .hero-main-grid {
    gap: 16px;
  }

  .stats-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .hero-actions {
    align-items: flex-end;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .learning-space-page {
    gap: 16px;
  }

  .hero-content,
  .tab-content {
    padding: 18px;
    border-radius: 18px;
  }

  .space-hero {
    border-radius: 18px;
  }

  .hero-top {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
  }

  .hero-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .progress-panel {
    align-items: flex-start;
  }

  .progress-ring {
    width: 72px;
    height: 72px;
  }

  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-support-row {
    gap: 12px;
    margin-top: 14px;
  }

  .continue-study-block .csb-actions {
    justify-content: flex-start;
    max-width: none;
  }

  .tab-nav {
    margin-bottom: 14px;
  }

  .tab-btn {
    flex: 0 0 auto;
  }

  .path-section-header,
  .path-header-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .path-header-actions {
    width: 100%;
  }

  .path-view-switch {
    width: 100%;

    button {
      flex: 1;
    }
  }

  .phase-resources,
  .resource-grid {
    grid-template-columns: 1fr;
  }

  .resource-management-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .resource-filter-controls {
    justify-content: stretch;
  }

  .resource-filter-select {
    flex: 1 1 120px;
    width: auto;
  }

  .resource-result-summary {
    justify-content: flex-start;
  }

  .plan-overview,
  .plan-phase-head {
    grid-template-columns: 1fr;
  }

  .plan-overview-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .phase-head-meta {
    flex-wrap: wrap;
    white-space: normal;
  }

  .plan-next-step {
    grid-template-columns: 1fr;

    strong {
      white-space: normal;
    }
  }

  .phase-resource {
    border-right: 0;

    &:nth-child(2) {
      border-top: 1px solid rgba(148, 163, 184, 0.08);
    }
  }

  .assessment-summary {
    gap: 10px;
    justify-content: space-between;
  }

  .record-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .record-reflection {
    width: 100%;
    text-align: left;
  }
}

@media (max-width: 520px) {
  .hero-actions,
  .quick-actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-primary-action {
    width: 100%;
  }

  .hero-badge {
    justify-content: center;
  }

  .progress-panel {
    flex-direction: column;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .algorithm-diagnosis-band {
    grid-template-columns: 1fr;
  }

  .adb-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .resource-filter-controls {
    flex-direction: column;
  }

  .resource-filter-select {
    width: 100%;
  }

  .resource-package-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
