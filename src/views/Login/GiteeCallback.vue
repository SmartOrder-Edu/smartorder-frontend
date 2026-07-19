<template>
  <OAuthCallbackPage platform="gitee">
    <OAuthLoadingCard
      v-if="loginLoading && !isError"
      platform="gitee"
      :statusText="statusText"
      :subText="subText"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>
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
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>
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
        <svg viewBox="0 0 24 24" class="svg-git" fill="currentColor">
          <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>
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
