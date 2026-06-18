import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录 - 知序智学', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register/index.vue'),
    meta: { title: '注册 - 知序智学', guest: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/Onboarding/index.vue'),
    meta: { title: '学习画像引导 - 知序智学', requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard/index.vue'),
    meta: { title: '学习指挥台 - 知序智学', requiresAuth: true }
  },
  {
    path: '/daily-plan',
    name: 'DailyPlan',
    component: () => import('@/views/DailyPlan/index.vue'),
    meta: { title: '今日总计划 - 知序智学', requiresAuth: true }
  },
  {
    path: '/space/:spaceId',
    name: 'LearningSpace',
    component: () => import('@/views/LearningSpace/index.vue'),
    meta: { title: '学习空间 - 知序智学', requiresAuth: true }
  },
  {
    path: '/ai-tutor',
    name: 'AITutor',
    component: () => import('@/views/AITutor/index.vue'),
    meta: { title: 'AI 总学习伙伴 - 知序智学', requiresAuth: true }
  },
  {
    path: '/learning-path',
    name: 'LearningPath',
    component: () => import('@/views/LearningPath/index.vue'),
    meta: { title: '学习路径 - 知序智学', requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/Tasks/index.vue'),
    meta: { title: '任务中心 - 知序智学', requiresAuth: true }
  },
  {
    path: '/study/:taskId',
    name: 'StudyExecution',
    component: () => import('@/views/StudyExecution/index.vue'),
    meta: { title: '学习执行 - 知序智学', requiresAuth: true }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('@/views/Resources/index.vue'),
    meta: { title: '资源中心 - 知序智学', requiresAuth: true }
  },
  {
    path: '/spaces',
    name: 'Spaces',
    component: () => import('@/views/Spaces/index.vue'),
    meta: { title: '学习空间管理 - 知序智学', requiresAuth: true }
  },
  {
    path: '/knowledge-base',
    name: 'KnowledgeBase',
    component: () => import('@/views/KnowledgeBase/index.vue'),
    meta: { title: '知识库管理 - 知序智学', requiresAuth: true }
  },
  {
    path: '/knowledge-base/:id',
    name: 'KnowledgeBaseDetail',
    component: () => import('@/views/KnowledgeBase/Detail.vue'),
    meta: { title: '知识库详情 - 知序智学', requiresAuth: true }
  },
  {
    path: '/knowledge-graph',
    name: 'KnowledgeGraph',
    component: () => import('@/views/KnowledgeGraph/index.vue'),
    meta: { title: '知识图谱 - 知序智学', requiresAuth: true }
  },
  {
    path: '/exam',
    name: 'Exam',
    component: () => import('@/views/Exam/index.vue'),
    meta: { title: '测评中心 - 知序智学', requiresAuth: true }
  },
  {
    path: '/exam/session',
    name: 'ExamSession',
    component: () => import('@/views/ExamSession/index.vue'),
    meta: { title: '开始测评 - 知序智学', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { title: '成长画像 - 知序智学', requiresAuth: true }
  },
  {
    path: '/cloud-drive',
    name: 'CloudDrive',
    component: () => import('@/views/CloudDrive/index.vue'),
    meta: { title: '个人云盘 - 知序智学', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages/index.vue'),
    meta: { title: '消息 - 知序智学', requiresAuth: true }
  },
  {
    path: '/preview',
    name: 'FilePreview',
    component: () => import('@/views/CloudDrive/preview.vue'),
    meta: { title: '在线文件预览 - 知序智学', requiresAuth: true }
  },
  {
    path: '/feedback',
    name: 'FeedbackSubmit',
    component: () => import('@/views/feedback/FeedbackSubmit.vue'),
    meta: { title: '意见反馈 - 知序智学', requiresAuth: true }
  },
  {
    path: '/admin/feedback',
    name: 'FeedbackReviewList',
    component: () => import('@/views/feedback/FeedbackReviewList.vue'),
    meta: { title: '反馈智能管理台 - 知序智学', requiresAuth: true }
  },
  {
    path: '/admin/prize',
    name: 'PrizeManagement',
    component: () => import('@/views/feedback/PrizeManagement.vue'),
    meta: { title: '反馈奖品管理 - 知序智学', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound/index.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '知序智学'}`

  const userStore = useUserStore()
  const isLoggedIn = userStore.isLogin

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转登录页并记录来源
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && isLoggedIn) {
    // 已登录访问游客页，跳转 AI 总学习伙伴
    next({ name: 'AITutor' })
  } else if (
    to.meta.requiresAuth &&
    isLoggedIn &&
    userStore.userInfo &&
    !userStore.profileInitialized &&
    to.name !== 'Onboarding'
  ) {
    // 已登录但未初始化画像，引导至画像引导页
    next({ name: 'Onboarding' })
  } else {
    next()
  }
})

export default router
