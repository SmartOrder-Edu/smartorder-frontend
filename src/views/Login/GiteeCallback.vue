<template>
  <OAuthCallbackPage platform="gitee">
    <OAuthLoadingCard
      v-if="loginLoading && !isError"
      platform="gitee"
      :statusText="statusText"
      :subText="subText"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git">
          <path d="M11.984 0C5.369 0 0 5.371 0 11.984c0 5.296 3.434 9.788 8.198 11.349.6.15.82-.26.82-.578 0-.286-.01-1.04-.015-2.04-3.334.724-4.038-1.607-4.038-1.607-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.333-5.466-5.931 0-1.31.469-2.382 1.237-3.221-.124-.303-.536-1.523.117-3.177 0 0 1.008-.321 3.301 1.23.957-.266 1.983-.399 3.004-.404 1.02.005 2.047.138 3.006.404 2.291-1.551 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.177.77.839 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.772 24 17.28 24 11.984 24 5.371 18.63 0 11.984 0z"/>
        </svg>
      </template>
    </OAuthLoadingCard>

    <OAuthSuccessState
      v-else-if="!loginLoading && !isError"
      platform="gitee"
      :statusText="statusText"
      :subText="subText"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git">
          <path d="M11.984 0C5.369 0 0 5.371 0 11.984c0 5.296 3.434 9.788 8.198 11.349.6.15.82-.26.82-.578 0-.286-.01-1.04-.015-2.04-3.334.724-4.038-1.607-4.038-1.607-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.333-5.466-5.931 0-1.31.469-2.382 1.237-3.221-.124-.303-.536-1.523.117-3.177 0 0 1.008-.321 3.301 1.23.957-.266 1.983-.399 3.004-.404 1.02.005 2.047.138 3.006.404 2.291-1.551 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.177.77.839 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.772 24 17.28 24 11.984 24 5.371 18.63 0 11.984 0z"/>
        </svg>
      </template>
    </OAuthSuccessState>

    <OAuthErrorState
      v-else
      platform="gitee"
      :statusText="statusText"
      :subText="subText"
      @back="goBack"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git">
          <path d="M11.984 0C5.369 0 0 5.371 0 11.984c0 5.296 3.434 9.788 8.198 11.349.6.15.82-.26.82-.578 0-.286-.01-1.04-.015-2.04-3.334.724-4.038-1.607-4.038-1.607-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.333-5.466-5.931 0-1.31.469-2.382 1.237-3.221-.124-.303-.536-1.523.117-3.177 0 0 1.008-.321 3.301 1.23.957-.266 1.983-.399 3.004-.404 1.02.005 2.047.138 3.006.404 2.291-1.551 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.177.77.839 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.772 24 17.28 24 11.984 24 5.371 18.63 0 11.984 0z"/>
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

const statusText = ref('正在连接 Gitee 认证中心...')
const subText = ref('请稍候，这通常需要几秒钟')
const loginLoading = ref(false)
const isError = ref(false)

onMounted(() => {
  const code = route.query.code as string
  const state = route.query.state as string
  const error = route.query.error as string
  const errorDescription = route.query.error_description as string

  if (code) {
    doLogin(code, state)
  } else if (error) {
    isError.value = true
    statusText.value = '授权失败'
    if (error === 'access_denied') {
      subText.value = '您取消了 Gitee 授权，或您的账户权限不足'
      ElMessage.warning('您取消了 Gitee 授权')
    } else {
      subText.value = errorDescription || `Gitee 错误代码: ${error}`
      ElMessage.error(errorDescription || `授权失败: ${error}`)
    }
  } else {
    isError.value = true
    statusText.value = '授权参数缺失'
    subText.value = '未检测到 Gitee 授权 code，请重新尝试'
    ElMessage.error('授权参数缺失')
  }
})

const doLogin = async (code: string, state?: string) => {
  loginLoading.value = true
  isError.value = false
  try {
    statusText.value = '正在安全验证 Gitee 身份...'
    subText.value = '正在核对您的 Gitee 账户凭证...'

    const isNewUser = await userStore.giteeLogin(code, state)

    if (isNewUser) {
      statusText.value = '欢迎加入知序智学！'
      subText.value = '正在为您创建专属学习空间，请稍候...'
    } else {
      statusText.value = '身份核验成功，正在同步画像...'
      subText.value = '正在加载您的个性化学习数据，即将进入空间...'
    }

    // 获取最新的用户信息
    await userStore.fetchUserInfo()

    ElMessage.success(isNewUser ? '欢迎！账号已自动创建' : 'Gitee 登录成功！')

    // 延迟一秒钟，体验动态过场效果
    setTimeout(() => {
      router.push('/')
    }, 1200)

  } catch (error: any) {
    console.error(error)
    statusText.value = '登录认证失败'
    subText.value = error.message || '可能由于网络抖动或配置失效，请重新尝试。'
    ElMessage.error('登录认证失败，请检查网络并重试')
    isError.value = true
  } finally {
    loginLoading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}
</script>
