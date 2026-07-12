<template>
  <AppLayout>
    <div class="exam-page">
      <!-- 页面标题与学习空间切换 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">AI 练习与智能测评</h1>
          <p class="page-desc">AI 智能出题评测，精准诊断掌握度；通过专项训练与错题巩固，助你实现针对性高效提升。</p>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <template v-if="learningSpaceStore.loading || learningSpaceStore.activeSpaces.length > 0">
              <el-select
                v-model="selectedSpaceId"
                filterable
                placeholder="切换学习空间"
                class="space-select"
                :loading="learningSpaceStore.loading"
              >
                <el-option
                  v-for="space in learningSpaceStore.activeSpaces"
                  :key="space.id"
                  :label="space.name"
                  :value="space.id"
                />
                <template #empty>
                  <div class="select-empty-tip">
                    <el-icon class="select-empty-icon"><Warning /></el-icon>
                    <span>暂无学习空间</span>
                    <el-button
                      type="primary"
                      link
                      size="small"
                      @click="router.push('/spaces')"
                    >去创建</el-button>
                  </div>
                </template>
              </el-select>
            </template>
            <template v-else>
              <el-button
                type="primary"
                style="margin-right: 16px;"
                @click="router.push('/spaces')"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 4px;">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                立即创建学习空间
              </el-button>
            </template>
            
            <button class="btn-notification">
              <el-icon><Bell /></el-icon>
              <span class="notification-badge"></span>
            </button>
          </div>
          
          <div class="header-filters">
            <el-select v-model="filterType" placeholder="全部类型" class="filter-select" size="default">
              <el-option label="全部类型" value="all" />
              <el-option label="阶段测评" value="stage" />
              <el-option label="专项训练" value="special" />
            </el-select>
            <el-select v-model="filterSort" placeholder="综合排序" class="filter-select" size="default">
              <el-option label="综合排序" value="default" />
              <el-option label="最新创建" value="time" />
              <el-option label="最高分" value="score" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 无学习空间提示横幅 -->
      <el-alert
        v-if="!learningSpaceStore.loading && learningSpaceStore.activeSpaces.length === 0"
        type="warning"
        :closable="false"
        show-icon
        class="no-space-alert"
      >
        <template #title>
          您还没有任何学习空间，无法使用测评功能。
          <el-button
            type="primary"
            size="small"
            style="margin-left: 12px;"
            @click="router.push('/spaces')"
          >立即创建学习空间</el-button>
        </template>
      </el-alert>

      <!-- 双栏驾驶舱布局 -->
      <div class="exam-layout">
        <!-- 左侧数据与任务主区域 -->
        <div class="exam-main">
          
          <!-- 1. 核心学习数据总览 (4卡片) -->
          <div class="metrics-grid">
            <!-- 总体评分双栏卡片 -->
            <div class="stat-card score-card">
              <div class="stat-score-wrapper">
                <!-- 左半部 圆环图 -->
                <div class="score-left">
                  <div class="stat-circle" :style="{ '--percent': overallScore + '%' }">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" stroke-width="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" stroke-width="8" stroke-linecap="round" :stroke-dasharray="`${overallScore * 3.27} 327`" transform="rotate(-90 60 60)" />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color: #3b5bdb" />
                          <stop offset="100%" style="stop-color: #12b886" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div class="circle-inner">
                      <span class="circle-score">{{ overallScore }}<small>分</small></span>
                      <span class="circle-trend text-success">较上周 ↑ 8分</span>
                    </div>
                  </div>
                </div>
                <!-- 分割线 -->
                <div class="score-divider"></div>
                <!-- 右半部 平均正确率 -->
                <div class="score-right">
                  <span class="accuracy-label">平均正确率</span>
                  <span class="accuracy-val">{{ avgAccuracy }}%</span>
                  <span class="accuracy-trend text-success">较上周 ↑ 5%</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card">
               <div class="stat-header">
                 <span class="stat-label">本周测评次数</span>
                 <div class="card-icon calendar-icon-bg">
                   <el-icon><Calendar /></el-icon>
                 </div>
               </div>
               <div class="stat-value">{{ weeklyCount }} <span class="unit">次</span></div>
               <div class="stat-trend success">较上周 ↑ 2次</div>
            </div>
            
            <div class="stat-card warning-theme">
               <div class="stat-header">
                 <span class="stat-label">薄弱知识点</span>
                 <div class="card-icon warning-icon-bg">
                   <el-icon><Warning /></el-icon>
                 </div>
               </div>
               <div class="stat-value">{{ weakCount }} <span class="unit">个</span></div>
               <div class="stat-trend success">较上周 ↓ 1个</div>
            </div>
            
            <div class="stat-card trend-theme">
               <div class="stat-header">
                 <span class="stat-label">学习提升趋势</span>
                 <div class="mini-sparkline">
                   <svg width="46" height="20" viewBox="0 0 46 20">
                     <path d="M0,16 Q10,12 20,4 T46,12" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
                     <circle cx="46" cy="12" r="2.5" fill="#10b981"/>
                   </svg>
                 </div>
               </div>
               <div class="stat-value success">+{{ weeklyProgress }}% <el-icon class="arrow-up-right"><TopRight /></el-icon></div>
               <div class="stat-trend">近7天正确率提升</div>
            </div>
          </div>

          <!-- 2. AI智能诊断推荐区域 -->
          <div class="ai-recommend-section">
             <div class="recommend-section-header">
                <svg class="ai-title-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                  <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m16.5-6.5l-2.2 2.2m-9.6 9.6l-2.2 2.2m14-2.2l-2.2-2.2m-9.6-9.6L4.5 7.5" stroke-linecap="round"/>
                </svg>
                <span class="bh-text"><strong>AI 智能诊断推荐</strong> · 结合你的学习画像、历史测评和错题表现，定制以下专项训练方向</span>
             </div>
             
             <div class="recommend-cards">
                <div class="recommend-item" v-for="(rec, index) in recommendations" :key="index">
                   <div class="rec-card-top">
                      <div class="rec-icon-wrapper" :class="rec.type">
                         <el-icon><component :is="rec.icon" /></el-icon>
                      </div>
                      <div class="rec-card-title-info">
                         <h4 class="rec-title">{{ rec.title }}</h4>
                         <div class="rec-tags">
                            <span class="tag difficulty" :class="rec.difficultyClass">{{ rec.difficulty }}</span>
                            <span class="tag">{{ rec.count }}题</span>
                            <span class="tag">预计{{ rec.time }}分钟</span>
                          </div>
                      </div>
                   </div>
                   <p class="rec-desc">{{ rec.desc }}</p>
                   <div class="rec-card-bottom">
                      <el-button type="primary" size="small" class="start-rec-btn" @click="startRecommended(rec)">开始训练</el-button>
                   </div>
                </div>
             </div>
          </div>

          <!-- 3. 当前学习任务/测评任务 -->
          <div class="tasks-section">
            <div class="exam-tabs-wrapper">
               <div class="exam-tabs new-tabs">
                 <span
                   v-for="tab in examTabs"
                   :key="tab.value"
                   class="tab-item"
                   :class="{ active: activeTab === tab.value }"
                   @click="activeTab = tab.value"
                 >
                   {{ tab.label }}
                   <span class="tab-count" v-if="tab.count">{{ tab.count }}</span>
                 </span>
               </div>
               <a class="view-all-link">查看全部记录 <el-icon><ArrowRight /></el-icon></a>
            </div>

            <!-- 测评列表 -->
            <div class="exam-list new-exam-list">
              <div
                v-for="exam in filteredExams"
                :key="exam.id"
                class="new-exam-card"
              >
                <!-- 状态徽章区 -->
                <div class="ex-left">
                  <div class="ex-status-badge" :class="exam.status">
                    <div class="badge-dot">
                      <el-icon v-if="exam.status === 'ongoing'"><Loading /></el-icon>
                      <el-icon v-else-if="exam.status === 'available'"><Aim /></el-icon>
                      <el-icon v-else-if="exam.hasResult"><Check /></el-icon>
                      <el-icon v-else><Warning /></el-icon>
                    </div>
                    <span class="badge-text">{{ exam.hasResult ? '已完成' : (exam.status === 'ongoing' ? '进行中' : '推荐') }}</span>
                  </div>
                </div>
                
                <!-- 标题与 Meta 区 -->
                <div class="ex-main">
                  <h3 class="ex-title">
                    {{ exam.title }}
                    <span class="ex-topic-tag" v-for="tag in getExamTags(exam)" :key="tag">{{ tag }}</span>
                  </h3>
                  <div class="ex-meta">
                    <span>题量 {{ exam.total }}题</span><span class="divider">|</span>
                    <span>已完成 {{ getCompletedCount(exam) }}题</span><span class="divider">|</span>
                    <span>预计 {{ exam.duration }} 分钟</span><span class="divider">|</span>
                    <span>正确率 {{ getAccuracyText(exam) }}</span><span class="divider">|</span>
                    <span>难度 <span class="diff-text" :class="getDifficultyText(exam)">{{ getDifficultyText(exam) }}</span></span>
                  </div>
                </div>
                
                <!-- 进度条区 -->
                <div class="ex-progress">
                  <div class="ex-prog-text">{{ getProgressPercent(exam) }}%</div>
                  <div class="ex-prog-bar">
                    <div class="ex-prog-fill" :class="{ 'zero-fill': getProgressPercent(exam) === 0 }" :style="{ width: getProgressPercent(exam) + '%' }"></div>
                  </div>
                </div>
                
                <!-- SVG 趋势折线图列 (Sparkline) -->
                <div class="ex-sparkline-col">
                  <svg v-if="exam.status !== 'available'" class="ex-sparkline" width="68" height="24">
                    <path :d="exam.title.includes('二叉树') ? 'M0,18 Q20,10 40,15 T68,4' : 'M0,20 Q15,8 35,16 T68,6'" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
                    <circle cx="68" cy="4" r="2.2" fill="#10b981" v-if="exam.title.includes('二叉树')"/>
                    <circle cx="68" cy="6" r="2.2" fill="#10b981" v-else/>
                  </svg>
                  <span v-else class="ex-sparkline-empty">--</span>
                </div>
                
                <!-- 分数展示区 -->
                <div class="ex-score-col" v-if="exam.hasResult">
                   <div class="ex-score-label">得分</div>
                   <div class="ex-score-val">{{ exam.score }}<span class="ex-score-grade">分</span></div>
                   <div class="ex-score-status text-success">优秀</div>
                </div>
                <div class="ex-score-col" v-else>
                   <template v-if="exam.status === 'ongoing'">
                     <div class="ex-score-label">上次得分</div>
                     <div class="ex-score-val">{{ exam.title.includes('二叉树') ? 80 : 70 }}<span class="ex-score-grade">分</span></div>
                     <div class="ex-score-status text-success">较上次 ↑{{ exam.title.includes('二叉树') ? 6 : 10 }}分</div>
                   </template>
                   <template v-else>
                     <span class="ex-score-empty">--</span>
                   </template>
                </div>
                
                <!-- 操作区 -->
                <div class="ex-actions">
                  <el-button 
                    type="primary" 
                    :class="{'start-btn': exam.status === 'available', 'report-btn': exam.hasResult}"
                    round 
                    @click="startExam(exam)"
                  >
                    {{ exam.hasResult ? '查看报告' : (exam.status === 'ongoing' ? '继续测评' : '开始训练') }}
                  </el-button>
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 能力分析 + 成长趋势分析 -->
          <div class="bottom-analysis-grid">
             <!-- 多维能力掌握度卡片（合并了雷达图与题型分布） -->
             <div class="analysis-card ability-analysis-card">
                <div class="card-header-dashboard">
                   <h3 class="analysis-title">多维能力掌握度</h3>
                   <span class="analysis-sub">知识掌握维度与题型能力分布</span>
                </div>
                
                <div class="ability-card-content">
                  <!-- 左侧 雷达图 -->
                  <div class="radar-chart-section">
                    <div ref="radarChartRef" style="height: 200px; width: 220px; margin: 0 auto;"></div>
                    <div class="legend radar-legend">
                       <span class="leg-item"><span class="dot my box"></span>我的掌握度</span>
                       <span class="leg-item"><span class="dot avg box"></span>班级平均</span>
                    </div>
                  </div>
                  <!-- 竖向分割线 -->
                  <div class="ability-divider"></div>
                  <!-- 右侧 题型指标 -->
                  <div class="ability-grid-section">
                     <div class="ability-grid">
                        <div class="ability-item" v-for="ab in abilities" :key="ab.name">
                           <div class="ab-icon" :class="ab.type">
                             <el-icon><component :is="ab.icon" /></el-icon>
                           </div>
                           <div class="ab-info">
                              <div class="ab-name">{{ ab.name }}</div>
                              <div class="ab-score">正确率 <strong>{{ ab.score }}%</strong></div>
                              <div class="ab-trend success">较上周 ↑ {{ ab.trend }}%</div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
             </div>

             <!-- 成绩趋势分析卡片 -->
             <div class="analysis-card trend-analysis-card">
                <div class="card-header">
                   <h3>最近成绩趋势</h3>
                   <div class="legend">
                      <span class="leg-item"><span class="dot my"></span>我的正确率</span>
                      <span class="leg-item"><span class="dot avg"></span>班级平均</span>
                   </div>
                   <el-select v-model="trendPeriod" size="small" style="width: 90px;">
                      <el-option label="近7天" value="7" />
                      <el-option label="近30天" value="30" />
                   </el-select>
                </div>
                <div ref="trendChartRef" style="height: 190px; width: 100%"></div>
             </div>
          </div>
        </div>

        <!-- 右侧智能助手面板 (exam-sidebar) -->
        <div class="exam-sidebar smart-assistant-panel">
          <!-- 1. AI 智能助理诊断问候卡片 [NEW] -->
          <div class="sidebar-card assistant-card">
             <div class="assistant-header">
                <div class="assistant-mascot-wrapper">
                   <!-- 浮动机器人 Mascot -->
                   <svg class="floating-mascot" viewBox="0 0 160 160" width="64" height="64">
                      <!-- 机器人手部 -->
                      <path d="M40 95 C 30 90, 25 80, 30 75 C 35 70, 45 75, 45 85" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" />
                      <path d="M120 95 C 130 90, 135 80, 130 75 C 125 70, 115 75, 115 85" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" />
                      <!-- 机器人耳朵/耳机 -->
                      <rect x="25" y="65" width="10" height="25" rx="5" fill="#0bb7aa" />
                      <rect x="125" y="65" width="10" height="25" rx="5" fill="#0bb7aa" />
                      <path d="M30 65 A 50 50 0 0 1 130 65" fill="none" stroke="#cbd5e1" stroke-width="3" />
                      <!-- 机器人身体/头部 -->
                      <rect x="32" y="45" width="96" height="70" rx="35" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
                      <!-- 机器人屏幕脸 -->
                      <rect x="42" y="55" width="76" height="42" rx="16" fill="#0f172a" />
                      <!-- 机器人发光眼睛 -->
                      <ellipse cx="62" cy="76" rx="6" ry="6" fill="#0bb7aa" />
                      <ellipse cx="98" cy="76" rx="6" ry="6" fill="#0bb7aa" />
                      <path d="M72 82 Q80 86 88 82" fill="none" stroke="#0bb7aa" stroke-width="2.5" stroke-linecap="round" />
                      <!-- 机器人反光/微光 -->
                      <path d="M45 52 Q80 40 115 52" fill="none" stroke="#f8fafc" stroke-width="2" opacity="0.3" />
                      <!-- 底部底座/浮空底座 -->
                      <ellipse cx="80" cy="130" rx="35" ry="8" fill="#e2e8f0" opacity="0.8" />
                      <!-- 小星星装饰 -->
                      <path d="M135 45 L138 48 L141 45 L138 42 Z" fill="#0bb7aa" />
                      <path d="M25 105 L28 108 L31 105 L28 102 Z" fill="#4f6ef6" />
                   </svg>
                </div>
                <div class="assistant-meta">
                   <span class="assistant-badge">AI PERSONAL TUTOR</span>
                   <h4 class="assistant-title-text">学习助手</h4>
                </div>
             </div>
             
             <!-- 对话气泡 -->
             <div class="assistant-bubble">
                <div class="bubble-arrow"></div>
                <p class="bubble-content">
                  你好，谢同学！检测到你正在进行的 <strong>数据结构与算法</strong> 空间中，<strong>二叉树遍历</strong> 掌握度偏弱。建议通过下方智能出题定制一套专项测评，开始巩固提升！
                </p>
             </div>

             <!-- 快捷出题交互 -->
             <div class="assistant-cta">
                <button class="btn-assistant-generate" @click="showGenerateDialog = true">
                   <svg class="ai-spark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="margin-right: 4px;">
                     <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m16.5-6.5l-2.2 2.2m-9.6 9.6l-2.2 2.2m14-2.2l-2.2-2.2m-9.6-9.6L4.5 7.5" stroke-linecap="round"/>
                   </svg>
                   AI 智能诊断出题
                </button>
             </div>
          </div>

          <!-- 2. 错题本提醒卡片 -->
          <div class="sidebar-card wrong-card">
             <div class="card-title">错题本提醒</div>
             <div class="wrong-remind-grid">
                <div class="remind-item">
                   <div class="rm-label">今日待复习</div>
                   <div class="rm-val"><strong>18</strong> 题</div>
                </div>
                <div class="remind-item">
                   <div class="rm-label">高优先级</div>
                   <div class="rm-val"><strong>6</strong> 题</div>
                </div>
             </div>
             <div class="go-wrong-wrapper">
                 <el-button class="go-wrong-btn" type="primary" plain>
                   去错题本复习 <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                 </el-button>
                 <div class="wrong-icon-bg">
                   <svg viewBox="0 0 100 100" width="70" height="70">
                     <rect x="22" y="15" width="56" height="70" rx="8" fill="#14b8a6" />
                     <rect x="28" y="15" width="50" height="70" rx="4" fill="#ffffff" />
                     <rect x="22" y="15" width="6" height="70" fill="#0d9488" />
                     <line x1="38" y1="30" x2="68" y2="30" stroke="#0bb7aa" stroke-width="3" stroke-linecap="round" />
                     <line x1="38" y1="42" x2="60" y2="42" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
                     <line x1="38" y1="54" x2="64" y2="54" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
                     <path d="M48 85 L48 94 L53 90 L58 94 L58 85 Z" fill="#f59e0b" />
                   </svg>
                 </div>
             </div>
          </div>
          
          <!-- 3. 学习连续性卡片 -->
          <div class="sidebar-card streak-card">
             <div class="card-title">学习连续性</div>
             <div class="streak-info">
                <div class="streak-text">
                   <div class="rm-label">连续学习天数</div>
                   <div class="rm-val"><strong>12</strong> 天</div>
                   <div class="streak-sub">最长连续 15 天</div>
                </div>
                <div class="streak-icon">🔥</div>
             </div>
             <div class="streak-week">
                <div class="day-item" v-for="day in weekDays" :key="day.name">
                   <div class="day-circle" :class="{ active: day.active, current: day.current }">
                      <el-icon v-if="day.active"><Check /></el-icon>
                      <span v-else>•</span>
                   </div>
                   <div class="day-name">{{ day.name }}</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- AI 生成测评对话框 -->
      <el-dialog
        v-model="showGenerateDialog"
        title="AI 智能诊断出题"
        width="760px"
        class="question-generate-dialog"
      >
        <div class="generate-layout">
          <div class="generate-form">
            <div class="form-grid">
              <div class="form-item">
                <label>学习空间</label>
                <el-select
                  v-model="selectedSpaceId"
                  filterable
                  placeholder="选择学习空间"
                  style="width: 100%"
                  :loading="learningSpaceStore.loading"
                >
                  <el-option
                    v-for="space in learningSpaceStore.activeSpaces"
                    :key="space.id"
                    :label="space.name"
                    :value="space.id"
                  />
                </el-select>
              </div>
              <div class="form-item">
                <label>课程名称</label>
                <el-input v-model="generateCourseName" placeholder="例如：数据结构" />
              </div>
            </div>

            <div class="form-item">
              <label>出题主题</label>
              <el-input v-model="generateTopic" placeholder="例如：排序" />
            </div>

            <div class="form-item">
              <div class="field-heading">
                <label>题型与题量</label>
                <span class="total-badge">{{ totalGenerateCount }} 题</span>
              </div>
              <div class="question-type-list">
                <div
                  v-for="row in questionTypeRows"
                  :key="row.questionType"
                  class="question-type-row"
                  :class="{ active: row.enabled }"
                >
                  <div class="type-main">
                    <el-switch v-model="row.enabled" size="small" />
                    <div class="type-icon-wrapper" :class="{ enabled: row.enabled }">
                      <svg v-if="row.questionType === 'single_choice'" viewBox="0 0 24 24" class="type-svg-icon">
                        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="9" r="2" fill="currentColor"/>
                        <line x1="13" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="9" cy="15" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="13" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'multiple_choice'" viewBox="0 0 24 24" class="type-svg-icon">
                        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                        <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor"/>
                        <line x1="14" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <rect x="7" y="13" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="14" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'fill_blank'" viewBox="0 0 24 24" class="type-svg-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="6" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                        <line x1="6" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="12" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'judge'" viewBox="0 0 24 24" class="type-svg-icon">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" class="type-svg-icon">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div class="type-copy">
                      <strong>{{ row.label }}</strong>
                      <span>{{ row.description }}</span>
                    </div>
                  </div>
                  <div class="type-control">
                    <el-input-number
                      v-model="row.count"
                      :min="1"
                      :max="10"
                      :disabled="!row.enabled"
                      controls-position="right"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="questionTypeRows.find(r => r.questionType === 'code')?.enabled" class="form-item">
              <label>编程语言</label>
              <el-select v-model="codeProgrammingLanguage" style="width: 100%;">
                <el-option label="C" value="C" />
                <el-option label="C++" value="C++" />
                <el-option label="Java" value="Java" />
              </el-select>
            </div>

            <div class="form-item difficulty-section">
              <div class="field-heading" style="margin-bottom: 32px;">
                <label>难度级别</label>
                <span class="total-badge" style="background: var(--el-color-primary-light-9); color: var(--el-color-primary);">{{ generateDifficultyDesc }}</span>
              </div>
              <div class="difficulty-slider-wrapper" style="padding: 0 20px 24px;">
                <el-slider v-model="generateDifficulty" :min="1" :max="5" :step="1" :marks="difficultyMarks" show-stops :show-tooltip="false" />
              </div>
            </div>
          </div>

          <aside class="generate-summary">
            <div class="summary-title">生成预览</div>
            <div class="summary-receipt">
              <div class="summary-line">
                <span>学习空间</span>
                <strong>{{ selectedSpaceName || '未选择' }}</strong>
              </div>
              <div class="summary-line">
                <span>生成数量</span>
                <strong>{{ totalGenerateCount }} 题</strong>
              </div>
              <div class="summary-line">
                <span>预计耗时</span>
                <strong>{{ estimatedMinutes }} 分钟</strong>
              </div>
            </div>
            
            <div class="summary-mix-container">
              <span class="mix-label">题型组合</span>
              <div class="summary-mix-tags">
                <template v-if="selectedQuestionRows.length">
                  <span
                    v-for="row in selectedQuestionRows"
                    :key="row.questionType"
                    class="mix-tag"
                  >
                    {{ row.label }} <strong class="tag-count">{{ row.count }}</strong>
                  </span>
                </template>
                <span v-else class="mix-tag empty">请选择题型</span>
              </div>
            </div>

            <div
              v-if="generating || generationJobNo || generationError"
              class="generation-progress-card"
            >
              <div class="progress-head">
                <span class="progress-step-text">
                  <span class="pulse-dot"></span>
                  {{ generationStep }}
                </span>
                <strong class="progress-percentage">{{ generationProgress }}%</strong>
              </div>
              <el-progress :percentage="generationProgress" :stroke-width="6" :show-text="false" />
              <div v-if="generationJobNo" class="job-no">任务号：{{ generationJobNo }}</div>
              <div v-if="generationPreviewItems.length" class="token-preview-list">
                <div
                  v-for="item in generationPreviewItems"
                  :key="item.questionType"
                  class="token-preview-item"
                >
                  <div class="token-preview-meta">
                    <span class="token-preview-label">{{ item.label }}</span>
                    <small class="token-preview-count">{{ item.tokenCount }} 段</small>
                  </div>
                  <p class="token-preview-text">{{ item.text || '正在接收题目结构...' }}</p>
                </div>
              </div>
              <p v-if="generationError" class="generation-error">{{ generationError }}</p>
            </div>
          </aside>
        </div>
        <template #footer>
          <el-button v-if="generating" class="btn-secondary" @click="stopGenerate">停止接收</el-button>
          <el-button v-else class="btn-secondary" @click="showGenerateDialog = false">取消</el-button>
          <el-button
            type="primary"
            class="btn-primary"
            :loading="generating"
            :disabled="!canGenerate"
            @click="generateExam"
          >
            {{ generating ? '正在生成...' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, Calendar, TopRight, Aim, MagicStick, Close, Document, EditPen, Select, DocumentCopy, Check, ArrowRight, Loading, DataAnalysis, CircleCheckFilled, MoreFilled, Bell } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useLearningSpaceStore } from '@/stores/learningSpace'

const filterType = ref('all')
const filterSort = ref('default')
import {
  fetchEvaluationQuestions,
  fetchEvaluationTasks,
  streamGenerateQuestions,
  type EvaluationQuestion,
  type EvaluationSession,
  type GenerateQuestionPayload,
  type QuestionGenerationTokenEvent,
  type QuestionTypeCode
} from '@/api/evaluationQuestion'
import { startSession } from '@/api/evaluationSession'
import { formatQuestionStreamPreview } from '@/utils/questionStreamPreview'

interface QuestionTypeRow {
  questionType: QuestionTypeCode
  label: string
  description: string
  count: number
  enabled: boolean
  isChoice?: boolean
}

interface GenerationPreviewItem {
  questionType: QuestionTypeCode
  label: string
  text: string
  tokenCount: number
}

interface GenerationPreviewBuffer {
  raw: string
  tokenCount: number
}

const learningSpaceStore = useLearningSpaceStore()
const router = useRouter()
const route = useRoute()
const activeTab = ref('ongoing')
const showGenerateDialog = ref(false)
const generating = ref(false)
const selectedSpaceId = ref<string | null>(null)
const generateCourseName = ref('数据结构')
const generateTopic = ref('排序')
const generateDifficulty = ref(3)
const generationProgress = ref(0)
const generationStep = ref('等待生成')
const generationPreviewItems = ref<GenerationPreviewItem[]>([])
const generatedSessionId = ref<string | null>(null)
const generatedSessionTitle = ref('')
const generationPreviewBuffers = ref<Partial<Record<QuestionTypeCode, GenerationPreviewBuffer>>>(
  {}
)
const generationJobNo = ref('')
const generationTokenCount = ref(0)
const generationError = ref('')
const codeProgrammingLanguage = ref('C')
const questionBank = ref<EvaluationQuestion[]>([])
const questionBankLoading = ref(false)
let generationAbortController: AbortController | null = null
const difficultyDescMap: Record<number, string> = {
  1: '识记 - 回忆基本知识点',
  2: '理解 - 理解核心原理',
  3: '应用 - 场景应用与分析',
  4: '综合 - 多知识点融合设计',
  5: '进阶 - 复杂推理与高阶思维'
}
const difficultyMarks = {
  1: '识记',
  2: '理解',
  3: '应用',
  4: '综合',
  5: '进阶'
}
const generateDifficultyDesc = computed(() => difficultyDescMap[generateDifficulty.value] || '')
const questionTypeRows = ref<QuestionTypeRow[]>([
  {
    questionType: 'single_choice',
    label: '单选题',
    description: '适合快速检查概念和细节',
    count: 5,
    enabled: true,
    isChoice: true
  },
  {
    questionType: 'multiple_choice',
    label: '多选题',
    description: '适合区分易混知识点',
    count: 3,
    enabled: true,
    isChoice: true
  },
  {
    questionType: 'fill_blank',
    label: '填空题',
    description: '适合术语、公式和关键步骤',
    count: 2,
    enabled: true
  },
  {
    questionType: 'judge',
    label: '判断题',
    description: '适合高频误区诊断',
    count: 2,
    enabled: true
  },
  {
    questionType: 'short_answer',
    label: '简答题',
    description: '适合解释原理和过程',
    count: 2,
    enabled: false
  }
])

const selectedQuestionRows = computed(() =>
  questionTypeRows.value.filter(row => row.enabled && row.count > 0)
)
const totalGenerateCount = computed(() =>
  selectedQuestionRows.value.reduce((sum, row) => sum + row.count, 0)
)
const generationMixText = computed(() =>
  selectedQuestionRows.value.map(row => `${row.label} ${row.count}`).join(' / ')
)
const selectedSpaceName = computed(
  () =>
    learningSpaceStore.activeSpaces.find(space => space.id === selectedSpaceId.value)?.name || ''
)
const canGenerate = computed(
  () => !generating.value && !!selectedSpaceId.value && totalGenerateCount.value > 0
)
const estimatedMinutes = computed(() => Math.max(1, Math.ceil(totalGenerateCount.value / 4)))

const overallScore = computed(() => {
  const finished = exams.value.filter(e => e.hasResult)
  if (finished.length === 0) return 86
  return Math.round(finished.reduce((sum, e) => sum + e.score, 0) / finished.length)
})

const avgAccuracy = computed(() => {
  const finished = exams.value.filter(e => e.hasResult)
  if (finished.length === 0) return 78
  return Math.round(finished.reduce((sum, e) => sum + e.accuracy, 0) / finished.length)
})

const weeklyCount = computed(() => {
  const finishedOrOngoing = exams.value.filter(e => e.status === 'ongoing' || e.hasResult)
  return finishedOrOngoing.length > 0 ? finishedOrOngoing.length : 6
})

const weakCount = computed(() => {
  const weakExams = exams.value.filter(e => e.hasResult && e.accuracy < 70)
  return weakExams.length > 0 ? weakExams.length : 4
})

const weeklyProgress = ref(12)
const radarChartRef = ref(null)
const trendChartRef = ref(null)
const trendPeriod = ref('7')

const recommendations = ref([
  { title: '二叉树专项突破', type: 'warning', icon: 'Aim', difficulty: '中等', difficultyClass: 'warning', count: 24, time: 25, desc: '强化二叉树遍历、构造与应用能力' },
  { title: '链表易错题复习', type: 'success', icon: 'DocumentCopy', difficulty: '基础', difficultyClass: 'success', count: 18, time: 18, desc: '针对高频错题，巩固链表操作技巧' },
  { title: '图算法应用训练', type: 'primary', icon: 'MagicStick', difficulty: '困难', difficultyClass: 'danger', count: 20, time: 30, desc: '提升图的遍历与最短路径应用能力' }
])

const startRecommended = (rec) => {
  ElMessage.success('开始训练: ' + rec.title)
}

const abilities = ref([
  { name: '单选题', icon: 'Document', score: 82, trend: 6, type: 'single' },
  { name: '填空题', icon: 'EditPen', score: 76, trend: 4, type: 'fill' },
  { name: '判断题', icon: 'Select', score: 88, trend: 8, type: 'judge' },
  { name: '代码分析题', icon: 'DocumentCopy', score: 68, trend: 2, type: 'code' }
])

const weekDays = ref([
  { name: '一', active: true },
  { name: '二', active: true },
  { name: '三', active: true },
  { name: '四', active: true },
  { name: '五', active: true },
  { name: '六', active: true },
  { name: '日', active: false, current: true }
])

onMounted(() => {
  setTimeout(() => {
    initCharts()
  }, 100)
})

const initCharts = () => {
  if (radarChartRef.value) {
    const radarChart = echarts.init(radarChartRef.value)
    radarChart.setOption({
      radar: {
        indicator: [
          { name: '树', max: 100 },
          { name: '链表', max: 100 },
          { name: '图', max: 100 },
          { name: '排序', max: 100 },
          { name: '栈与队列', max: 100 }
        ],
        radius: '65%',
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 12 },
        splitArea: { areaStyle: { color: ['transparent'] } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [85, 90, 60, 75, 88],
            name: '我的掌握度',
            itemStyle: { color: '#0bb7aa' },
            areaStyle: { color: 'rgba(11, 183, 170, 0.2)' },
            lineStyle: { width: 2 }
          },
          {
            value: [70, 75, 55, 65, 80],
            name: '班级平均',
            itemStyle: { color: '#94a3b8' },
            areaStyle: { color: 'transparent' },
            lineStyle: { type: 'dashed', width: 2 }
          }
        ]
      }]
    })
    window.addEventListener('resize', () => radarChart.resize())
  }

  if (trendChartRef.value) {
    const trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      grid: { top: 10, right: 10, bottom: 20, left: 35 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['05-09', '05-10', '05-11', '05-12', '05-13', '05-14', '05-15'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
           formatter: '{value}%',
           color: '#94a3b8',
           fontSize: 11
        }
      },
      series: [
        {
          name: '我的正确率',
          type: 'line',
          data: [65, 60, 78, 85, 82, 88, 90],
          smooth: true,
          symbolSize: 6,
          itemStyle: { color: '#0bb7aa' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(11, 183, 170, 0.2)' },
              { offset: 1, color: 'rgba(11, 183, 170, 0)' }
            ])
          }
        },
        {
          name: '班级平均',
          type: 'line',
          data: [50, 55, 60, 58, 62, 65, 68],
          smooth: true,
          symbolSize: 0,
          itemStyle: { color: '#94a3b8' },
          lineStyle: { width: 2, type: 'dashed' }
        }
      ]
    })
    window.addEventListener('resize', () => trendChart.resize())
  }
}


const exams = ref<any[]>([])

const examTabs = computed(() => [
  {
    value: 'ongoing',
    label: '进行中',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    count: exams.value.filter(exam => exam.status === 'ongoing').length
  },
  {
    value: 'available',
    label: '推荐测评',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    count: exams.value.filter(exam => exam.status === 'available' || exam.status === 'error').length
  },
  {
    value: 'completed',
    label: '已完成',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
    count: exams.value.filter(exam => exam.hasResult).length
  },
  {
    value: 'wrong',
    label: '错题复习',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    count: exams.value.reduce((sum, exam) => sum + exam.wrongCount, 0)
  }
])

const filteredExams = computed(() => {
  return exams.value.filter(e => {
    if (activeTab.value === 'ongoing') return e.status === 'ongoing'
    if (activeTab.value === 'available') return e.status === 'available' || e.status === 'error'
    if (activeTab.value === 'completed') return e.hasResult
    if (activeTab.value === 'wrong') return e.wrongCount > 0
    return true
  })
})

const getExamTags = (exam: any) => {
  if (exam.title.includes('二叉树')) return ['二叉树', '树的遍历']
  if (exam.title.includes('链表')) return ['链表', '双指针']
  if (exam.title.includes('图')) return ['图', 'BFS/DFS']
  if (exam.title.includes('栈') || exam.title.includes('队列')) return ['栈', '队列']
  return [exam.topic || '专项']
}

const getCompletedCount = (exam: any) => {
  if (exam.hasResult) return exam.total
  if (exam.status === 'ongoing') {
    if (exam.title.includes('二叉树')) return 8
    if (exam.title.includes('链表')) return 5
    return Math.round(exam.total * 0.4)
  }
  return 0
}

const getAccuracyText = (exam: any) => {
  if (exam.hasResult) return `${exam.accuracy}%`
  if (exam.status === 'ongoing') {
    if (exam.title.includes('二叉树')) return '75%'
    if (exam.title.includes('链表')) return '60%'
    return '70%'
  }
  return '--'
}

const getDifficultyText = (exam: any) => {
  if (exam.title.includes('图')) return '困难'
  if (exam.title.includes('二叉树')) return '中等'
  return '基础'
}

const getProgressPercent = (exam: any) => {
  if (exam.hasResult) return 100
  if (exam.status === 'ongoing') {
    if (exam.title.includes('二叉树')) return 66
    if (exam.title.includes('链表')) return 33
    return 50
  }
  return 0
}

const getScoreClass = (score: number) => {
  if (score >= 80) return 'good'
  if (score >= 60) return 'medium'
  return 'poor'
}

const startExam = (exam: any) => {
  const spaceId = exam.learningSpaceId || selectedSpaceId.value
  if (!spaceId) {
    ElMessage.warning('请先选择学习空间，或先生成一套题库')
    return
  }

  router.push({
    name: 'ExamSession',
    query: {
      sessionId: exam.id,  // 携带 sessionId，走完整 session 流程
      rawStatus: exam.rawStatus, // 传递后端原始状态，供答题页判断是否调用 start
      spaceId,
      title: exam.title
    }
  })
}

const reviewWrong = (exam: any) => {
  router.push({
    name: 'AITutor',
    query: {
      action: 'review_wrong',
      jobId: exam.id,
      title: exam.title
    }
  })
}

const retakeExam = (exam: any) => {
  console.log('Retake exam:', exam.title)
}

const getQuestionTypeLabel = (questionType: QuestionTypeCode | string) => {
  return (
    questionTypeRows.value.find(row => row.questionType === questionType)?.label || String(questionType)
  )
}

const refreshGenerationPreviewItems = () => {
  const orderedTypes = selectedQuestionRows.value.map(row => row.questionType)
  const items = Object.entries(generationPreviewBuffers.value).map(([questionType, buffer]) => ({
    questionType: questionType as QuestionTypeCode,
    label: getQuestionTypeLabel(questionType as QuestionTypeCode),
    text: formatQuestionStreamPreview(buffer?.raw || ''),
    tokenCount: buffer?.tokenCount || 0
  }))

  generationPreviewItems.value = items.sort((left, right) => {
    const leftIndex = orderedTypes.indexOf(left.questionType)
    const rightIndex = orderedTypes.indexOf(right.questionType)
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex
    const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex
    return normalizedLeftIndex - normalizedRightIndex
  })
}

const appendGenerationPreviewChunk = (data: QuestionGenerationTokenEvent) => {
  const current = generationPreviewBuffers.value[data.questionType] || {
    raw: '',
    tokenCount: 0
  }
  generationPreviewBuffers.value = {
    ...generationPreviewBuffers.value,
    [data.questionType]: {
      raw: `${current.raw}${data.chunk}`.slice(-2400),
      tokenCount: current.tokenCount + 1
    }
  }
  refreshGenerationPreviewItems()
}

const buildTopicText = () => {
  return generateTopic.value.trim() || '基础知识'
}

const buildGeneratePayload = (): GenerateQuestionPayload | null => {
  if (!selectedSpaceId.value) return null

  return {
    learningSpaceId: selectedSpaceId.value,
    courseName: generateCourseName.value.trim() || selectedSpaceName.value || '操作系统',
    topic: buildTopicText(),
    questionTypeCountList: selectedQuestionRows.value.map((row, index) => ({
      questionType: row.questionType,
      count: row.count,
      difficulty: generateDifficulty.value,
      optionCount: row.isChoice ? 4 : undefined,
      programmingLanguage: row.questionType === 'code' ? codeProgrammingLanguage.value : undefined,
      sort: index + 1
    }))
  }
}

const addGeneratedExamCard = (payload: GenerateQuestionPayload) => {
  exams.value.unshift({
    id: Date.now(),
    title: `${payload.topic || 'AI 题库'}专项测评`,
    description: `${payload.courseName || '课程'} · ${generationMixText.value} · 难度 ${generateDifficulty.value}`,
    total: totalGenerateCount.value,
    duration: Math.max(10, totalGenerateCount.value * 2),
    accuracy: 0,
    score: 0,
    hasResult: false,
    wrongCount: 0,
    weakPoints: [],
    learningSpaceId: payload.learningSpaceId,
    status: 'available',
    statusText: generationJobNo.value ? `已生成 ${generationJobNo.value}` : '可参与'
  })
}

const resetGenerationState = () => {
  generationProgress.value = 0
  generationStep.value = '等待生成'
  generationPreviewItems.value = []
  generationPreviewBuffers.value = {}
  generationJobNo.value = ''
  generationTokenCount.value = 0
  generationError.value = ''
  generatedSessionId.value = null
  generatedSessionTitle.value = ''
}

const stopGenerate = () => {
  generationAbortController?.abort()
  generationAbortController = null
  generating.value = false
  generationStep.value = '已停止接收'
  ElMessage.info('已停止接收生成进度')
}

const fetchQuestionBank = async () => {
  questionBankLoading.value = true
  try {
    const sessions = await fetchEvaluationTasks({
      learningSpaceId: selectedSpaceId.value || undefined
    })
    questionBank.value = [] // 默认关闭请求，所以这里置空
    exams.value = sessions.map((session: EvaluationSession) => {
      const isFinished = session.status === 'finished'
      const isDoing = session.status === 'doing'
      const isError = session.status === 'error'
      // todo / 其余未知状态 → available（可参与）
      const uiStatus = isFinished ? 'completed' : isDoing ? 'ongoing' : isError ? 'error' : 'available'
      const statusText = isFinished ? '已完成' : isDoing ? '进行中' : isError ? '生成失败' : '可参与'
      return {
        id: session.id,
        generationTaskId: session.taskId,  // 出题生成任务ID，用于按任务查题
        title: session.topic || '专项测评',
        description: session.description || '',
        total: session.totalQuestionCount || 0,
        duration: (session.totalQuestionCount || 0) * 2, // 预估每题2分钟
        accuracy: session.accuracy ? Math.round(session.accuracy * 100) : 0,
        score: session.actualScore || 0,
        hasResult: isFinished,
        wrongCount: isFinished ? (session.totalQuestionCount || 0) - (session.answeredCount || 0) : 0,
        weakPoints: [],
        learningSpaceId: session.learningSpaceId,
        rawStatus: session.status,  // 后端原始状态，用于业务判断
        status: uiStatus,
        statusText
      }
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '题库数据加载失败')
  } finally {
    questionBankLoading.value = false
  }
}

const generateExam = async () => {
  if (!selectedSpaceId.value) {
    ElMessage.warning('请先选择学习空间')
    return
  }
  if (selectedQuestionRows.value.length === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }

  const payload = buildGeneratePayload()
  if (!payload) return

  resetGenerationState()
  generating.value = true
  generationProgress.value = 2
  generationStep.value = '正在创建任务'
  generationAbortController = new AbortController()

  try {
    await streamGenerateQuestions(payload, {
      signal: generationAbortController.signal,
      onJobCreated(data) {
        generationJobNo.value = data.jobNo
        generationProgress.value = 8
        generationStep.value = `任务已创建，共 ${data.totalCount} 题`
      },
      onToken(data) {
        generationTokenCount.value += 1
        generationProgress.value = Math.min(
          92,
          Math.max(
            generationProgress.value,
            12 + Math.floor(Math.sqrt(generationTokenCount.value) * 4)
          )
        )
        generationStep.value = `${getQuestionTypeLabel(data.questionType)}生成中`
        appendGenerationPreviewChunk(data)
      },
      onSessionCreated(data) {
        // 保存 sessionId，供跳转答题页使用
        generatedSessionId.value = data.sessionId
        generatedSessionTitle.value = data.title
      }
    })

    generationProgress.value = 100
    generationStep.value = '题库生成完成'
    addGeneratedExamCard(payload)
    await fetchQuestionBank()

    // 如果有 sessionId，自动跳转到答题页
    if (generatedSessionId.value) {
      const targetSpaceId = selectedSpaceId.value || payload.learningSpaceId
      router.push({
        name: 'ExamSession',
        query: {
          sessionId: generatedSessionId.value,
          spaceId: targetSpaceId,
          title: generatedSessionTitle.value
        }
      })
    } else {
      activeTab.value = 'available'
    }
    showGenerateDialog.value = false
    ElMessage.success('题库已生成并保存')
  } catch (error: any) {
    if (error?.name === 'AbortError') return
    generationError.value = error?.message || '题库生成失败'
    generationStep.value = '生成失败'
    ElMessage.error(generationError.value)
  } finally {
    generating.value = false
    generationAbortController = null
  }
}

onMounted(async () => {
  await learningSpaceStore.fetchSpaces('active')
  
  const querySpaceId = route.query.spaceId ? String(route.query.spaceId) : null
  if (querySpaceId) {
    selectedSpaceId.value = querySpaceId
  } else if (!selectedSpaceId.value && learningSpaceStore.activeSpaces.length > 0) {
    selectedSpaceId.value = learningSpaceStore.activeSpaces[0].id
  }
  
  await fetchQuestionBank()
})

watch(selectedSpaceId, async (spaceId, oldSpaceId) => {
  if (spaceId === oldSpaceId) return
  if (spaceId) {
    router.replace({ query: { ...route.query, spaceId } })
  }
  await fetchQuestionBank()
})
</script>

<style lang="scss" scoped>

/* ==========================================
   全页面基调与驾驶舱布局
   ========================================== */
.exam-page {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header 区域 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.space-select {
  width: 260px;
}

.space-select :deep(.el-input__wrapper) {
  border-radius: 12px;
  border-color: rgba(15, 23, 42, 0.08);
  padding: 8px 12px;
  height: 38px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.3s;
  
  &:hover, &.is-focus {
    border-color: rgba(11, 183, 170, 0.3);
    box-shadow: 0 4px 12px rgba(11, 183, 170, 0.06);
  }
}

.btn-notification {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3);
    color: #0bb7aa;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(11, 183, 170, 0.06);
  }
}

.notification-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  border: 1px solid white;
}

.header-filters {
  display: flex;
  gap: 8px;
}

.filter-select :deep(.el-input__wrapper) {
  border-radius: 10px;
  border-color: rgba(15, 23, 42, 0.06);
  width: 110px;
  height: 32px;
}

/* 双栏主布局 */
.exam-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.exam-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.exam-sidebar {
  width: 330px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ==========================================
   卡片规范定义（大留白、弱边框、圆角、多层投影）
   ========================================== */
.stat-card,
.ai-recommend-section,
.new-exam-card,
.analysis-card,
.sidebar-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.015), 0 1px 3px rgba(15, 23, 42, 0.01);
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-sizing: border-box;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.04), 0 1px 5px rgba(15, 23, 42, 0.015);
    border-color: rgba(11, 183, 170, 0.12);
  }
}

/* ==========================================
   1. 核心学习数据总览 (Metrics Grid)
   ========================================== */
.metrics-grid {
  display: grid;
  grid-template-columns: 1.6fr repeat(3, 1fr);
  gap: 20px;
}

.stat-card.score-card {
  background: linear-gradient(135deg, #ffffff 0%, rgba(240, 253, 250, 0.6) 100%);
  border: 1px solid rgba(11, 183, 170, 0.12);
  padding: 20px 24px;
  display: flex;
  align-items: center;
}

.stat-score-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.score-left {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
}

.stat-circle {
  width: 96px;
  height: 96px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
}

.circle-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  text-align: center;
}

.circle-score {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;

  small {
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
    margin-left: 1px;
  }
}

.circle-trend {
  font-size: 0.65rem;
  font-weight: 700;
  margin-top: 4px;
}

.score-divider {
  width: 1px;
  height: 64px;
  background: rgba(15, 23, 42, 0.08);
  margin: 0 16px;
  flex-shrink: 0;
}

.score-divider + .score-right {
  padding-left: 0;
}

.score-right {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.accuracy-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.accuracy-val {
  font-size: 1.8rem;
  font-weight: 850;
  color: #0bb7aa;
  line-height: 1.1;
  font-family: 'Outfit', 'Inter', sans-serif;
}

.accuracy-trend {
  font-size: 0.65rem;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.06);
  color: #10b981;
  padding: 1px 6px;
  border-radius: 10px;
  width: fit-content;
  margin-top: 2px;
}

.text-success {
  color: #10b981;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.card-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.calendar-icon-bg {
  background: rgba(79, 110, 246, 0.06);
  color: #4f6ef6;
}

.warning-icon-bg {
  background: rgba(245, 158, 11, 0.06);
  color: #f59e0b;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'Outfit', 'Inter', sans-serif;

  .unit {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
    margin-left: 2px;
  }
}

.stat-trend {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(15, 23, 42, 0.03);
  padding: 2px 8px;
  border-radius: 12px;
  width: fit-content;

  &.success {
    background: rgba(16, 185, 129, 0.06);
    color: #10b981;
  }
}

.mini-sparkline {
  display: flex;
  align-items: center;
}

.arrow-up-right {
  font-size: 0.8rem;
  font-weight: bold;
}

/* ==========================================
   2. AI智能诊断推荐区域 (AI Recommend Banner)
   ========================================== */
.ai-recommend-section {
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.45) 0%, rgba(240, 253, 250, 0.45) 100%);
  border: 1px solid rgba(11, 183, 170, 0.1);
  padding: 24px;
  border-radius: 24px;
}

.recommend-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.ai-title-spark {
  color: #0bb7aa;
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.bh-text {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;

  strong {
    font-weight: 800;
    color: #0bb7aa;
    background: rgba(11, 183, 170, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    margin-right: 4px;
  }
}

.recommend-cards {
  display: flex;
  gap: 16px;
}

.recommend-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.015);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(11, 183, 170, 0.08);
    border-color: rgba(11, 183, 170, 0.18);
    background: #ffffff;
  }
}

.rec-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rec-icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;

  &.warning { background: rgba(245, 158, 11, 0.06); color: #f59e0b; }
  &.success { background: rgba(16, 185, 129, 0.06); color: #16b981; }
  &.primary { background: rgba(79, 110, 246, 0.06); color: #4f6ef6; }
}

.rec-card-title-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rec-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.rec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .tag {
    font-size: 0.65rem;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 4px;
    color: #64748b;
    font-weight: 600;
    white-space: nowrap;

    &.difficulty {
      &.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.06); }
      &.success { color: #16b981; background: rgba(16, 185, 129, 0.06); }
      &.danger { color: #ef4444; background: rgba(239, 68, 68, 0.06); }
    }
  }
}

.rec-desc {
  margin: 12px 0;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  flex-grow: 1;
}

.rec-card-bottom {
  display: flex;
  justify-content: flex-start;
  margin-top: 4px;
}

.start-rec-btn {
  background: linear-gradient(135deg, #4f6ef6 0%, #0bb7aa 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  padding: 6px 14px !important;
  height: 28px !important;
  border-radius: 20px !important;
  box-shadow: 0 4px 10px rgba(11, 183, 170, 0.2) !important;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(11, 183, 170, 0.35) !important;
  }
}

/* ==========================================
   3. 当前学习任务/测评任务 (Exam Tabs & List)
   ========================================== */
.tasks-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exam-tabs-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-tabs {
  background: rgba(148, 163, 184, 0.08);
  padding: 4px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.new-tabs .tab-item {
  padding: 8px 18px;
  border-radius: 10px;
  color: #64748b;
  background: transparent;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.3s ease;

  &:hover {
    color: #0f172a;
    background: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: linear-gradient(135deg, #0bb7aa 0%, #10b981 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(11, 183, 170, 0.2);
    font-weight: 700;
  }
}

.new-tabs .tab-count {
  padding: 1px 6px;
  font-size: 0.7rem;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.05);
  color: #64748b;
  font-weight: 700;
}

.new-tabs .tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.view-all-link {
  font-size: 0.8rem;
  color: #0bb7aa;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.new-exam-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.new-exam-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.012), 0 1px 2px rgba(15, 23, 42, 0.008);
  border: 1px solid rgba(15, 23, 42, 0.03);
  transition: all 0.3s ease;
  gap: 24px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(11, 183, 170, 0.07);
    border-color: rgba(11, 183, 170, 0.16);
  }
}

.ex-left {
  flex-shrink: 0;
  width: 54px;
}

.ex-status-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.badge-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;

  .el-icon {
    font-size: 0.9rem;
  }
}

.ex-status-badge.ongoing .badge-dot { background: rgba(245, 158, 11, 0.06); color: #f59e0b; }
.ex-status-badge.available .badge-dot { background: rgba(16, 185, 129, 0.06); color: #16b981; }
.ex-status-badge.completed .badge-dot { background: rgba(79, 110, 246, 0.06); color: #4f6ef6; }

.badge-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.ex-status-badge.ongoing .badge-text { color: #f59e0b; }
.ex-status-badge.available .badge-text { color: #16b981; }
.ex-status-badge.completed .badge-text { color: #4f6ef6; }

.ex-main {
  flex: 1;
  min-width: 0;
}

.ex-title {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ex-topic-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.ex-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #64748b;

  .divider {
    color: rgba(15, 23, 42, 0.05);
  }
}

.diff-text {
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;

  &.中等 { color: #f59e0b; background: rgba(245, 158, 11, 0.06); }
  &.困难 { color: #ef4444; background: rgba(239, 68, 68, 0.06); }
  &.基础 { color: #16b981; background: rgba(16, 185, 129, 0.06); }
}

.ex-progress {
  width: 100px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.ex-prog-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-align: right;
  font-family: 'Outfit', sans-serif;
}

.ex-prog-bar {
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.ex-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #0bb7aa 100%);
  border-radius: 3px;

  &.zero-fill {
    background: #cbd5e1;
  }
}

.ex-sparkline-col {
  width: 70px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.ex-score-col {
  width: 90px;
  text-align: right;
  flex-shrink: 0;
}

.ex-score-label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.ex-score-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
}

.ex-score-grade {
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 1px;
}

.ex-score-status {
  font-size: 0.65rem;
  font-weight: 700;
}

.ex-score-empty {
  font-size: 0.85rem;
  color: #cbd5e1;
  font-weight: bold;
}

.ex-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.ex-actions .el-button {
  padding: 8px 18px;
  font-weight: 600;
  border-radius: 20px;
  height: 32px;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.ex-actions .el-button.start-btn {
  background: #10b981 !important;
  border-color: #10b981 !important;
  color: white !important;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);

  &:hover {
    background: #0bb7aa !important;
    border-color: #0bb7aa !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(11, 183, 170, 0.25);
  }
}

.ex-actions .el-button.report-btn {
  background: white !important;
  border-color: rgba(15, 23, 42, 0.08) !important;
  color: #475569 !important;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3) !important;
    color: #0bb7aa !important;
    background: rgba(11, 183, 170, 0.02) !important;
  }
}

.more-icon {
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #475569;
  }
}

/* ==========================================
   4. 能力分析与成绩趋势 (Bottom Analysis)
   ========================================== */
.bottom-analysis-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
}

.analysis-card {
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
  }
}

.card-header-dashboard {
  margin-bottom: 20px;
  
  .analysis-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
  }
  
  .analysis-sub {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    white-space: nowrap;
  }
}

/* 合并的掌握度卡片内容 */
.ability-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex: 1;
}

.radar-chart-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.radar-legend {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
}

.dot.box {
  border-radius: 2px;
  width: 10px;
  height: 5px;
  display: inline-block;
  
  &.my.box { background: #0bb7aa; }
  &.avg.box { border: 1px dashed #94a3b8; background: transparent; }
}

.ability-divider {
  width: 1px;
  height: 130px;
  background: rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}

.ability-grid-section {
  flex: 1;
}

.ability-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ability-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.02);
  min-width: 0;
  transition: all 0.2s;
  
  &:hover {
    background: #ffffff;
    border-color: rgba(11, 183, 170, 0.12);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.015);
  }
}

.ab-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  flex-shrink: 0;

  &.single { color: #4f6ef6; background: rgba(79, 110, 246, 0.06); }
  &.fill { color: #8b5cf6; background: rgba(139, 92, 246, 0.06); }
  &.judge { color: #10b981; background: rgba(16, 185, 129, 0.06); }
  &.code { color: #6366f1; background: rgba(99, 102, 241, 0.06); }
}

.ab-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ab-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.ab-score {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 1px 0;

  strong {
    font-size: 1.15rem;
    font-weight: 800;
    color: #1e293b;
    margin-left: 1px;
    font-family: 'Outfit', sans-serif;
  }
}

.ab-trend {
  font-size: 0.65rem;
  font-weight: 700;
  color: #10b981;
}

.legend {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.my { background: #0bb7aa; }
  &.avg { background: #94a3b8; }
}

/* ==========================================
   5. 右侧智能助手面板 (Smart Assistant Panel)
   ========================================== */
.smart-assistant-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* AI 智能助理卡片 */
.assistant-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 250, 0.4) 100%);
  border: 1px solid rgba(11, 183, 170, 0.1);
  padding: 24px;
  position: relative;
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.assistant-mascot-wrapper {
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.08) 0%, rgba(79, 110, 246, 0.04) 100%);
  border: 1.5px solid rgba(11, 183, 170, 0.15);
  border-radius: 18px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.06);
  flex-shrink: 0;
  
  .floating-mascot {
    animation: sidebar-float 4s ease-in-out infinite;
  }
}

@keyframes sidebar-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.assistant-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assistant-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #0bb7aa;
  background: rgba(11, 183, 170, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  width: fit-content;
}

.assistant-title-text {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.assistant-bubble {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.03);
  border-radius: 16px;
  padding: 14px 16px;
  position: relative;
  margin-bottom: 16px;
}

.bubble-arrow {
  position: absolute;
  top: -8px;
  left: 26px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #f8fafc;
}

.bubble-content {
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.5;

  strong {
    color: #4f6ef6;
    font-weight: 700;
  }
}

.assistant-cta {
  width: 100%;
}

.btn-assistant-generate {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #4f6ef6 0%, #0bb7aa 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 14px rgba(11, 183, 170, 0.28) !important;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(11, 183, 170, 0.45) !important;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .ai-spark-icon {
    stroke: currentColor;
    transition: transform 0.3s ease;
  }
  
  &:hover .ai-spark-icon {
    transform: rotate(20deg) scale(1.1);
  }
}

/* 错题提醒卡片 */
.wrong-card .card-title,
.streak-card .card-title {
  margin: 0 0 14px;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.wrong-remind-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.remind-item {
  flex: 1;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.02);
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.warning-theme {
    background: rgba(239, 68, 68, 0.02);
    border-color: rgba(239, 68, 68, 0.06);
    
    strong { color: #ef4444; }
  }
}

.go-wrong-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
}

.go-wrong-btn {
  width: 120px;
  border-radius: 20px !important;
  height: 32px;
  font-weight: 600;
  font-size: 0.75rem;
  border-color: rgba(79, 110, 246, 0.15) !important;
  color: #4f6ef6 !important;
  background: white !important;
  transition: all 0.3s;

  &:hover {
    background: rgba(79, 110, 246, 0.04) !important;
    border-color: #4f6ef6 !important;
    transform: translateY(-1px);
  }
}

.wrong-icon-bg {
  position: absolute;
  right: 6px;
  bottom: -4px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
}

/* 学习连续性卡片 */
.streak-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.streak-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.streak-sub {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.streak-icon {
  font-size: 2.2rem;
  filter: drop-shadow(0 4px 6px rgba(245, 158, 11, 0.25));
  animation: flame-flicker 1.5s ease-in-out infinite alternate;
}

@keyframes flame-flicker {
  0% { transform: scale(1); }
  100% { transform: scale(1.08) rotate(2deg); }
}

.streak-week {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.day-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  transition: all 0.2s;

  &.active {
    background: #10b981 !important;
    color: white !important;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
  }

  &.current {
    border: 2px solid #0bb7aa;
    background: white;
  }
}

.day-name {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

/* ==========================================
   AI 出题 Dialog & 表单
   ========================================== */
:deep(.el-overlay-dialog) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.question-generate-dialog) {
  margin: 0 !important;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15) !important;
}

:deep(.question-generate-dialog .el-dialog__header) {
  padding: 24px 24px 16px !important;
  margin-right: 0 !important;
  border-bottom: none !important;
}

:deep(.question-generate-dialog .el-dialog__title) {
  font-weight: 800 !important;
  font-size: 1.15rem !important;
  color: #0f172a !important;
}

:deep(.question-generate-dialog .el-dialog__body) {
  padding: 16px 24px 24px !important;
}

:deep(.question-generate-dialog .el-dialog__footer) {
  padding: 16px 24px 24px !important;
  border-top: none !important;
}

.generate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 24px;
}

.generate-form {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .form-item {
    margin-bottom: 0;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.generate-form label,
.field-heading label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  
  label { margin-bottom: 0; }
}

.total-badge {
  font-size: 0.75rem;
  color: #0bb7aa;
  font-weight: 800;
  background: rgba(11, 183, 170, 0.08);
  padding: 2px 8px;
  border-radius: 12px;
}

/* 题型行卡片 */
.question-type-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.question-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 12px;
  background: #fff;
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  &.active {
    border-color: #0bb7aa;
    background: rgba(11, 183, 170, 0.02);
  }
}

.type-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.type-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &.enabled {
    background: rgba(11, 183, 170, 0.15);
    color: #0bb7aa;
  }
}

.type-svg-icon {
  width: 16px;
  height: 16px;
}

.type-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  strong {
    font-size: 0.8rem;
    color: #0f172a;
    font-weight: 700;
  }
  
  span {
    font-size: 0.7rem;
    color: #94a3b8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.type-control {
  flex-shrink: 0;
}

:deep(.question-type-row .el-input-number) {
  width: 80px;
}

.difficulty-section {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

:deep(.difficulty-slider-wrapper .el-slider__runway) {
  height: 6px !important;
  background-color: #f1f5f9 !important;
}

:deep(.difficulty-slider-wrapper .el-slider__bar) {
  height: 6px !important;
  background: #0bb7aa !important;
}

:deep(.difficulty-slider-wrapper .el-slider__button) {
  width: 14px !important;
  height: 14px !important;
  border: 2px solid #0bb7aa !important;
  background-color: #fff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

/* 生成预览 Panel */
.generate-summary {
  align-self: start;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 16px;
  background: #f8fafc;
  padding: 18px;
}

.summary-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(11, 183, 170, 0.15);
}

.summary-receipt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.summary-line span {
  color: #64748b;
}

.summary-line strong {
  color: #0f172a;
  font-weight: 600;
}

.summary-mix-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.08);
}

.mix-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.summary-mix-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mix-tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(11, 183, 170, 0.06);
  color: #0bb7aa;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  
  .tag-count {
    color: #4f6ef6;
  }

  &.empty {
    color: #94a3b8;
    background: transparent;
    padding: 0;
  }
}

/* 进度环与生成进度卡片 */
.generation-progress-card {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.08);
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-step-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pulse-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #0bb7aa;
  box-shadow: 0 0 6px #0bb7aa;
  animation: pulse-step 1.5s infinite;
}

@keyframes pulse-step {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0bb7aa;
}

.job-no {
  margin-top: 4px;
  font-size: 0.65rem;
  font-family: monospace;
  color: #94a3b8;
  text-align: right;
}

.token-preview-list {
  display: grid;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 12px;
  padding-right: 4px;
}

.token-preview-item {
  padding: 6px 10px;
  border-radius: 8px;
  border-left: 2px solid #0bb7aa;
  background: rgba(0, 0, 0, 0.015);
}

.token-preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.token-preview-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f172a;
}

.token-preview-count {
  color: #94a3b8;
  font-size: 0.65rem;
}

.token-preview-text {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.4;
  color: #64748b;
  word-break: break-word;
  font-family: monospace;
}

.generation-error {
  margin: 8px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.03);
  padding: 8px;
  border-radius: 6px;
  border-left: 2.5px solid #ef4444;
}

/* 中屏响应式优化 */
@media (max-width: 1350px) {
  .metrics-grid {
    gap: 12px;
  }
  .stat-card {
    padding: 16px;
  }
  .stat-card.score-card {
    padding: 12px 16px;
  }
  .score-left, .stat-circle {
    width: 84px;
    height: 84px;
  }
  .circle-score {
    font-size: 1.6rem;
  }
  .accuracy-val {
    font-size: 1.5rem;
  }
  .score-divider {
    margin: 0 8px;
    height: 52px;
  }
  .stat-value {
    font-size: 1.35rem;
  }
  .recommend-cards {
    gap: 10px;
  }
  .recommend-item {
    padding: 14px;
  }
  .rec-icon-wrapper {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  .ability-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .ability-card-content {
    flex-direction: column;
    align-items: stretch;
  }
  .ability-divider {
    width: 100%;
    height: 1px;
    margin: 12px 0;
  }
  .ability-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端响应式 */
@media (max-width: 1024px) {
  .exam-layout {
    flex-direction: column;
  }
  .exam-sidebar {
    width: 100%;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .recommend-cards {
    flex-direction: column;
  }
  .bottom-analysis-grid {
    grid-template-columns: 1fr;
  }
  .ability-card-content {
    flex-direction: column;
    align-items: stretch;
  }
  .ability-divider {
    width: 100%;
    height: 1px;
    margin: 12px 0;
  }
}

.no-space-alert {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.05);
}

.select-empty-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: #64748b;
  font-size: 13px;
}

.select-empty-icon {
  color: #f59e0b;
  font-size: 15px;
  flex-shrink: 0;
}
</style>
