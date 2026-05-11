import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/ai-tutor'
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
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard/index.vue'),
    meta: { title: '总学习指挥台 - 知序智学', requiresAuth: true }
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
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { title: '学习画像 - 知序智学', requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About/index.vue'),
    meta: { title: '关于' }
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
  } else {
    next()
  }
})

export default router
