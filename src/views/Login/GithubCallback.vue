<template>
  <OAuthCallbackPage platform="github">
    <OAuthLoadingCard
      v-if="loginLoading && !isError"
      platform="github"
      :statusText="statusText"
      :subText="subText"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </template>
    </OAuthLoadingCard>

    <OAuthSuccessState
      v-else-if="!loginLoading && !isError"
      platform="github"
      :statusText="statusText"
      :subText="subText"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </template>
    </OAuthSuccessState>

    <OAuthErrorState
      v-else
      platform="github"
      :statusText="statusText"
      :subText="subText"
      @back="goBack"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </template>
    </OAuthErrorState>
  </OAuthCallbackPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import OAuthCallbackPage from '@/components/oauth/OAuthCallbackPage.vue'
import OAuthLoadingCard from '@/components/oauth/OAuthLoadingCard.vue'
import OAuthSuccessState from '@/components/oauth/OAuthSuccessState.vue'
import OAuthErrorState from '@/components/oauth/OAuthErrorState.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const statusText = ref('正在连接 GitHub 认证中心...')
const subText = ref('请稍候，这通常需要几秒钟')
const loginLoading = ref(false)
const isError = ref(false)

onMounted(() => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (code) {
    doLogin(code, state)
  } else {
    isError.value = true
    statusText.value = '授权参数缺失'
    subText.value = '未检测到 GitHub 授权 code，请重新尝试'
    ElMessage.error('授权参数缺失')
  }
})

const doLogin = async (code: string, state?: string) => {
  loginLoading.value = true
  isError.value = false
  try {
    statusText.value = '正在安全验证 GitHub 身份...'
    subText.value = '正在核对您的 GitHub 账户凭证...'
    
    await userStore.githubLogin(code, state)
    
    statusText.value = '身份核验成功，正在同步画像...'
    subText.value = '正在加载您的个性化学习数据，即将进入空间...'
    
    // 获取最新的用户信息
    await userStore.fetchUserInfo()
    
    ElMessage.success('GitHub 登录成功！')
    
    // 延迟一秒钟，体验动态过场效果
    setTimeout(() => {
      // 这里的逻辑会交给全局路由守卫拦截：如果未初始化画像，则自动去 /onboarding
      router.push('/')
    }, 1200)

  } catch (error: any) {
    console.error(error)
    isError.value = true
    statusText.value = '登录认证失败'
    subText.value = error.message || '可能由于网络抖动或配置失效，请重新尝试。'
    ElMessage.error('登录认证失败，请检查网络并重试')
  } finally {
    loginLoading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}
</script>
