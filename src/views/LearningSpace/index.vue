<template>
  <AppLayout>
    <div class="learning-space-page">
    <!-- 空间头部 -->
    <section class="space-hero">
      <div class="hero-bg" :style="{ background: spaceData.colorGradient }"></div>
      <div class="hero-content">
        <div class="hero-left">
          <button class="back-btn" @click="$router.push('/dashboard')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <div class="hero-info">
            <h1 class="hero-title">{{ spaceData.name }}</h1>
            <p class="hero-goal">目标：{{ spaceData.goal }}</p>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-stat">
            <span class="hero-stat-value">{{ spaceData.progress }}%</span>
            <span class="hero-stat-label">完成进度</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value">{{ spaceData.streakDays }} 天</span>
            <span class="hero-stat-label">连续学习</span>
          </div>
          <div class="hero-stat warning" v-if="spaceData.status === 'warning'">
            <span class="hero-stat-value">关注</span>
            <span class="hero-stat-label">正确率下降</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 空间子导航 -->
    <div class="space-tabs">
      <button
        v-for="tab in spaceTabs"
        :key="tab.id"
        class="space-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon" v-html="tab.icon"></span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 空间 Agent -->
      <div v-if="activeTab === 'agent'" class="tab-panel">
        <div class="space-agent-card glass">
          <div class="agent-card-header">
            <div class="agent-card-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div>
              <span class="agent-card-name">{{ spaceData.name }} Agent</span>
              <span class="agent-card-status">在线 · 已监控该空间 {{ spaceData.streakDays }} 天</span>
            </div>
          </div>
          <div class="agent-card-body">
            <p class="agent-insight-text" v-html="spaceData.agentInsight"></p>
          </div>
          <div class="agent-card-actions">
            <button class="agent-quick-btn" @click="askAgent('我最近哪里学得不好？')">我最近哪里学得不好？</button>
            <button class="agent-quick-btn" @click="askAgent('帮我调整学习计划')">帮我调整学习计划</button>
            <button class="agent-quick-btn" @click="askAgent('生成一套练习题')">生成一套练习题</button>
            <button class="agent-quick-btn primary" @click="startChat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              与 Agent 对话
            </button>
          </div>
        </div>

        <!-- Agent 近期提醒 -->
        <div class="agent-alerts">
          <h3 class="panel-title">Agent 近期提醒</h3>
          <div class="alert-list">
            <div class="alert-item warning">
              <div class="alert-dot"></div>
              <div class="alert-content">
                <p class="alert-text">你在"洛必达法则适用条件"上连续 3 次出错，建议今天集中练习</p>
                <span class="alert-time">2 小时前</span>
              </div>
            </div>
            <div class="alert-item info">
              <div class="alert-dot"></div>
              <div class="alert-content">
                <p class="alert-text">本周学习时长比上周下降了 20%，注意保持节奏</p>
                <span class="alert-time">昨天</span>
              </div>
            </div>
            <div class="alert-item success">
              <div class="alert-dot"></div>
              <div class="alert-content">
                <p class="alert-text">连续 5 天完成学习任务，继续保持！</p>
                <span class="alert-time">今天</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前路径 -->
      <div v-if="activeTab === 'path'" class="tab-panel">
        <div class="path-timeline">
          <div
            class="path-node"
            v-for="(node, idx) in spaceData.pathNodes"
            :key="node.id"
            :class="{ completed: node.status === 'completed', current: node.status === 'current', locked: node.status === 'locked' }"
          >
            <div class="path-node-marker">
              <div class="path-line" v-if="idx < spaceData.pathNodes.length - 1"></div>
              <div class="path-dot"></div>
            </div>
            <div class="path-node-content">
              <span class="path-week">Week {{ node.week }}</span>
              <h4 class="path-name">{{ node.name }}</h4>
              <p class="path-desc">{{ node.description }}</p>
              <div class="path-meta">
                <span class="path-duration">{{ node.duration }}</span>
                <span class="path-status-tag" :class="node.status">{{ statusLabel(node.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日任务 (此空间内) -->
      <div v-if="activeTab === 'tasks'" class="tab-panel">
        <div class="space-task-list">
          <div
            class="space-task-card"
            v-for="task in spaceData.tasks"
            :key="task.id"
          >
            <div class="task-check" :class="{ done: task.status === 'done' }">
              <svg v-if="task.status === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="18" height="18">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div class="task-info">
              <span class="task-type-tag" :class="task.type">{{ typeLabel(task.type) }}</span>
              <h4 class="task-name">{{ task.title }}</h4>
              <p class="task-desc">{{ task.agentReason }}</p>
            </div>
            <div class="task-meta">
              <span class="task-time">{{ task.minutes }} 分钟</span>
              <button class="task-do-btn" v-if="task.status !== 'done'" @click="doTask(task)">开始</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源 -->
      <div v-if="activeTab === 'resources'" class="tab-panel">
        <div class="resource-grid">
          <div class="resource-card" v-for="r in spaceData.resources" :key="r.id">
            <div class="resource-type-icon" :class="r.type">
              <svg v-if="r.type === 'doc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <svg v-else-if="r.type === 'quiz'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <svg v-else-if="r.type === 'mindmap'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <div class="resource-info">
              <h4 class="resource-title">{{ r.title }}</h4>
              <span class="resource-type">{{ typeLabel(r.type) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 测评 / 错题 / 知识图谱 / 记录 占位 -->
      <div v-if="activeTab === 'exam'" class="tab-panel placeholder-panel">
        <el-empty description="该学习空间的测评数据">
          <el-button type="primary" @click="ElMessage.info('AI 正在生成测评...')">AI 生成测评</el-button>
        </el-empty>
      </div>
      <div v-if="activeTab === 'wrong'" class="tab-panel placeholder-panel">
        <el-empty description="暂无错题记录" />
      </div>
      <div v-if="activeTab === 'graph'" class="tab-panel placeholder-panel">
        <el-empty description="知识图谱" />
      </div>
      <div v-if="activeTab === 'records'" class="tab-panel placeholder-panel">
        <el-empty description="学习记录" />
      </div>
    </div>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const activeTab = ref('agent')

const spaceDataMap: Record<string, any> = {
  math: {
    id: 'math', name: '高等数学', goal: '三周内掌握极限与连续',
    progress: 42, streakDays: 5, status: 'warning',
    colorGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    agentInsight: '你在<b>洛必达法则适用条件</b>上连续出错，正确率降至 40%。<br/>建议今天优先完成 10 道极限专项练习题。我注意到你在<b>证明题</b>上也有畏难倾向，后续可以调整为<b>例题驱动</b>的学习方式。',
    pathNodes: [
      { id: 'p1', week: 1, name: '函数与极限', description: '函数定义、极限概念、左右极限', duration: '3天', status: 'completed' },
      { id: 'p2', week: 2, name: '极限运算法则', description: '四则运算法则、夹逼准则、两个重要极限', duration: '4天', status: 'completed' },
      { id: 'p3', week: 2, name: '无穷小与无穷大', description: '无穷小比较、等价无穷小替换', duration: '2天', status: 'current' },
      { id: 'p4', week: 3, name: '洛必达法则', description: '0/0型、∞/∞型、适用条件判断', duration: '4天', status: 'locked' },
      { id: 'p5', week: 3, name: '连续性与间断点', description: '连续定义、间断点分类、闭区间连续性质', duration: '3天', status: 'locked' },
      { id: 'p6', week: 3, name: '章节综合练习', description: '综合题训练、易错点回顾', duration: '2天', status: 'locked' }
    ],
    tasks: [
      { id: 'm1', title: '洛必达法则 10 道专项练习', type: 'practice', minutes: 35, agentReason: '你在此知识点连续出错，需针对性巩固', status: 'todo' },
      { id: 'm2', title: '无穷小比较方法复习', type: 'review', minutes: 20, agentReason: '等价无穷小替换是解题关键技巧', status: 'todo' },
      { id: 'm3', title: '极限综合应用题', type: 'practice', minutes: 30, agentReason: '检验前两周学习效果', status: 'todo' }
    ],
    resources: [
      { id: 'r1', title: '洛必达法则详解与适用条件', type: 'doc' },
      { id: 'r2', title: '极限专项练习 20 题', type: 'quiz' },
      { id: 'r3', title: '极限与连续思维导图', type: 'mindmap' },
      { id: 'r4', title: '高等数学上·错题回顾', type: 'doc' }
    ]
  },
  english: {
    id: 'english', name: '英语四级', goal: '12月通过四级考试',
    progress: 61, streakDays: 12, status: 'normal',
    colorGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    agentInsight: '词汇保持稳定，但<b>听力</b>持续偏弱。建议每天保持 20 分钟精听训练。<br/>最近阅读理解正确率提升了 8%，继续保持！',
    pathNodes: [
      { id: 'e1', week: 1, name: '核心词汇 800 词', description: '高频词汇 + 词根词缀', duration: '2周', status: 'completed' },
      { id: 'e2', week: 3, name: '听力基础训练', description: '短对话精听、听写练习', duration: '2周', status: 'current' },
      { id: 'e3', week: 5, name: '阅读理解强化', description: '快速阅读技巧、长难句分析', duration: '2周', status: 'locked' },
      { id: 'e4', week: 7, name: '写作模板训练', description: '作文模板、常用句式', duration: '2周', status: 'locked' },
      { id: 'e5', week: 9, name: '真题模拟', description: '全套真题模拟 + 分析', duration: '3周', status: 'locked' }
    ],
    tasks: [
      { id: 'e1', title: '核心词汇 40 个复习', type: 'review', minutes: 15, agentReason: '保持每日词汇输入', status: 'todo' },
      { id: 'e2', title: '听力精听练习', type: 'practice', minutes: 20, agentReason: '听力偏弱，需每日训练', status: 'todo' },
      { id: 'e3', title: '阅读理解 2 篇', type: 'practice', minutes: 25, agentReason: '阅读正确率提升期，加大训练', status: 'done' }
    ],
    resources: [
      { id: 'er1', title: '四级核心词根词缀整理', type: 'mindmap' },
      { id: 'er2', title: '听力精听材料精选', type: 'doc' },
      { id: 'er3', title: '阅读理解题型技巧', type: 'doc' },
      { id: 'er4', title: '四级翻译模板', type: 'doc' }
    ]
  },
  se: {
    id: 'se', name: '软件工程', goal: '完成课程项目需求分析与原型设计',
    progress: 35, streakDays: 3, status: 'danger',
    colorGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    agentInsight: '项目任务已<b>延期 1 天</b>，需求分析阶段还没完成。<br/>建议今天集中完成用户故事与用例图，否则后续原型设计无法开展。',
    pathNodes: [
      { id: 's1', week: 1, name: '需求获取方法', description: '访谈、问卷、观察法', duration: '3天', status: 'completed' },
      { id: 's2', week: 1, name: '用户故事编写', description: '用户角色、故事模板、验收标准', duration: '3天', status: 'current' },
      { id: 's3', week: 2, name: '用例建模', description: '用例图、用例描述、活动图', duration: '4天', status: 'locked' },
      { id: 's4', week: 2, name: '原型设计', description: '低保真/高保真原型、原型工具', duration: '5天', status: 'locked' },
      { id: 's5', week: 3, name: '需求评审与迭代', description: '评审会议、需求变更管理', duration: '3天', status: 'locked' }
    ],
    tasks: [
      { id: 's1', title: '补齐用户故事与验收标准', type: 'project', minutes: 45, agentReason: '延期任务，优先完成', status: 'todo' },
      { id: 's2', title: '绘制用例图', type: 'project', minutes: 30, agentReason: '用户故事完成后可开始', status: 'todo' },
      { id: 's3', title: '复习需求工程理论', type: 'review', minutes: 20, agentReason: '巩固理论基础', status: 'todo' }
    ],
    resources: [
      { id: 'sr1', title: '用户故事模板与示例', type: 'doc' },
      { id: 'sr2', title: 'UML 用例图绘制指南', type: 'doc' },
      { id: 'sr3', title: '需求文档模板', type: 'doc' }
    ]
  },
  os: {
    id: 'os', name: '操作系统', goal: '操作系统期末复习',
    progress: 70, streakDays: 8, status: 'good',
    colorGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    agentInsight: '概念理解不错，但<b>同步互斥 PV 操作</b>题错误率偏高。<br/>昨天已完成重点复习，今天可以暂缓，把时间分给高数和软件工程。',
    pathNodes: [
      { id: 'o1', week: 1, name: '进程与线程', description: '进程概念、线程模型、状态转换', duration: '3天', status: 'completed' },
      { id: 'o2', week: 1, name: '进程调度', description: '调度算法与评价指标', duration: '2天', status: 'completed' },
      { id: 'o3', week: 2, name: '进程同步与互斥', description: '临界区、信号量、PV操作', duration: '4天', status: 'current' },
      { id: 'o4', week: 2, name: '经典同步问题', description: '生产者消费者、读者写者、哲学家', duration: '3天', status: 'locked' },
      { id: 'o5', week: 3, name: '死锁', description: '死锁条件、预防、避免、检测', duration: '2天', status: 'locked' }
    ],
    tasks: [
      { id: 'o1', title: 'PV 操作经典题型回顾', type: 'review', minutes: 20, agentReason: '昨日已完成重点复习，今日可选做', status: 'todo' }
    ],
    resources: [
      { id: 'or1', title: '进程同步与互斥图解', type: 'mindmap' },
      { id: 'or2', title: 'PV 操作经典题集', type: 'quiz' },
      { id: 'or3', title: '生产者消费者问题详解', type: 'doc' }
    ]
  }
}

const spaceId = computed(() => route.params.spaceId as string)
const spaceData = computed(() => spaceDataMap[spaceId.value] || spaceDataMap.math)

const spaceTabs = [
  { id: 'agent', label: '空间 Agent', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' },
  { id: 'path', label: '当前路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
  { id: 'tasks', label: '今日任务', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { id: 'resources', label: '资源', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { id: 'exam', label: '测评', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { id: 'wrong', label: '错题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { id: 'graph', label: '知识图谱', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/></svg>' },
  { id: 'records', label: '学习记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>' }
]

const typeLabel = (t: string) => {
  const m: Record<string, string> = { practice: '练习', review: '复习', project: '项目', learn: '学习', test: '测试', doc: '文档', quiz: '练习', mindmap: '思维导图' }
  return m[t] || t
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return m[s] || s
}

const askAgent = (q: string) => { ElMessage.info(`向 ${spaceData.value.name} Agent 提问：${q}`) }
const startChat = () => { ElMessage.success(`开始与 ${spaceData.value.name} Agent 对话`) }
const doTask = (task: any) => { ElMessage.success(`开始任务：${task.title}`) }
</script>

<style scoped lang="scss">
.learning-space-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 空间头部 */
.space-hero {
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.06;
}

.hero-content {
  position: relative;
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  &:hover { background: var(--background-color-base); color: var(--primary-color); }
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.hero-goal {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.hero-right {
  display: flex;
  gap: var(--spacing-2xl);
}

.hero-stat {
  text-align: center;

  &.warning .hero-stat-value { color: var(--warn-color); }
}

.hero-stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
}

.hero-stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 子导航 */
.space-tabs {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow-x: auto;
}

.space-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;

  .tab-icon {
    display: flex;
    align-items: center;
    svg { width: 16px; height: 16px; }
  }

  &:hover { color: var(--primary-color); background: rgba(59, 91, 219, 0.04); }

  &.active {
    color: var(--primary-color);
    background: rgba(59, 91, 219, 0.08);
    font-weight: 600;
  }
}

/* Tab 内容 */
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 空间 Agent 卡片 */
.space-agent-card {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border: 1px solid rgba(59, 91, 219, 0.1);
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.agent-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  svg { width: 22px; height: 22px; }
}

.agent-card-name {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
}

.agent-card-status {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.agent-insight-text {
  font-size: 0.875rem;
  color: var(--text-regular);
  line-height: 1.8;
  margin: 0 0 var(--spacing-md);
}

.agent-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.agent-quick-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { border-color: var(--primary-color); color: var(--primary-color); }

  &.primary {
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
    border-color: transparent;
    color: white;
    &:hover { opacity: 0.9; }
  }
}

/* Agent 提醒 */
.agent-alerts {
  .panel-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 var(--spacing-md);
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);

  &.warning { border-left: 3px solid var(--warn-color); }
  &.info { border-left: 3px solid var(--primary-color); }
  &.success { border-left: 3px solid var(--accent-color); }
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  .alert-item.warning & { background: var(--warn-color); }
  .alert-item.info & { background: var(--primary-color); }
  .alert-item.success & { background: var(--accent-color); }
}

.alert-text {
  font-size: 0.8125rem;
  color: var(--text-regular);
  margin: 0;
  line-height: 1.5;
}

.alert-time {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 路径时间线 */
.path-timeline {
  padding-left: var(--spacing-lg);
}

.path-node {
  display: flex;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);

  &.locked { opacity: 0.4; }
}

.path-node-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.path-line {
  position: absolute;
  top: 20px;
  width: 2px;
  height: calc(100% + var(--spacing-lg));
  background: var(--border-light);
  .path-node.completed & { background: var(--accent-color); }
}

.path-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--border-light);
  border: 3px solid white;
  box-shadow: 0 0 0 1px var(--border-light);
  flex-shrink: 0;
  z-index: 1;

  .path-node.completed & { background: var(--accent-color); box-shadow: 0 0 0 1px var(--accent-color); }
  .path-node.current & { background: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); animation: pulse-ring 2s infinite; }
}

.path-node-content {
  flex: 1;
  padding-bottom: var(--spacing-sm);
}

.path-week {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.path-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 2px 0;
}

.path-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.path-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.path-duration {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.path-status-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);

  &.completed { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  &.current { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.locked { background: var(--background-color-base); color: var(--text-muted); }
}

/* 任务列表 */
.space-task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.space-task-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
}

.task-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);

  &.done {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
  }
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-type-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  &.practice { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.review { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
  &.project { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
}

.task-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 4px 0;
}

.task-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.task-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-do-btn {
  padding: 4px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { background: var(--primary-color); color: white; }
}

/* 资源网格 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.resource-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); transform: translateY(-1px); }
}

.resource-type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.doc { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.quiz { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  &.mindmap { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
}

.resource-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  margin: 0;
}

.resource-type {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.placeholder-panel {
  padding: var(--spacing-3xl) 0;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 1px var(--primary-color); }
  50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
}
</style>
