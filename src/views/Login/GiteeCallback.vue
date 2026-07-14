<template>
  <div class="callback-container">
    <!-- 炫丽背景装饰 -->
    <div class="bg-gradient"></div>
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="glass-card">
      <!-- 动态科技加载圈 -->
      <div class="loading-wrapper">
        <template v-if="!isError">
          <div class="loading-ring ring-outer"></div>
          <div class="loading-ring ring-inner"></div>
        </template>
        <template v-else>
          <div class="error-ring"></div>
        </template>
        <div class="gitee-icon" :class="{ 'gitee-error': isError }">
          <svg viewBox="0 0 24 24" class="svg-git">
            <path d="M11.984 0C5.369 0 0 5.371 0 11.984c0 5.296 3.434 9.788 8.198 11.349.6.15.82-.26.82-.578 0-.286-.01-1.04-.015-2.04-3.334.724-4.038-1.607-4.038-1.607-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.333-5.466-5.931 0-1.31.469-2.382 1.237-3.221-.124-.303-.536-1.523.117-3.177 0 0 1.008-.321 3.301 1.23.957-.266 1.983-.399 3.004-.404 1.02.005 2.047.138 3.006.404 2.291-1.551 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.177.77.839 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.772 24 17.28 24 11.984 24 5.371 18.63 0 11.984 0z"/>
          </svg>
        </div>
      </div>

      <!-- 动态状态文本 -->
      <h3 class="status-title" :class="{ 'text-error': isError }">{{ statusText }}</h3>
      <p class="status-subtitle">{{ subText }}</p>

      <!-- 返回按钮 -->
      <div v-if="isError" class="action-wrapper animate-fade-in">
        <button class="back-btn" @click="goBack">返回登录页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

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

<style scoped>
.callback-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: #0b0f19;
  font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
  color: #fff;
}

/* 动感渲染背景 */
.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(26, 54, 93, 0.6) 0%, rgba(11, 15, 25, 1) 100%);
  z-index: 1;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 2;
  opacity: 0.55;
  animation: floatAround 20s infinite ease-in-out alternate;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #c71d23 0%, transparent 80%);
  top: -10%;
  left: 10%;
}

.blob-2 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, #f36d26 0%, transparent 80%);
  bottom: -10%;
  right: 15%;
  animation-delay: -5s;
}

/* 玻璃拟态卡片 */
.glass-card {
  position: relative;
  z-index: 10;
  width: 460px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  text-align: center;
}

/* 科技风加载器 */
.loading-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  margin: 0 auto 32px auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-ring {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.ring-outer {
  width: 100%;
  height: 100%;
  border-top-color: #c71d23;
  border-bottom-color: #f36d26;
}

.ring-inner {
  width: 76%;
  height: 76%;
  border-left-color: #c71d23;
  border-right-color: #f36d26;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

.gitee-icon {
  position: relative;
  width: 32px;
  height: 32px;
  z-index: 12;
}

.svg-git {
  width: 100%;
  height: 100%;
  fill: #c71d23;
  filter: drop-shadow(0 0 8px rgba(199, 29, 35, 0.5));
  animation: pulse 2s infinite ease-in-out;
}

/* 状态文字样式 */
.status-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  letter-spacing: 0.5px;
  color: #f1f3f5;
  background: linear-gradient(120deg, #fff 40%, #dee2e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-subtitle {
  font-size: 14px;
  color: #868e96;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

/* 动画定义 */
@keyframes floatAround {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(5%, 5%) scale(1.1);
  }
  100% {
    transform: translate(-5%, -5%) scale(0.9);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 错误状态样式 */
.error-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.4);
}

.gitee-error {
  opacity: 0.6;
}

.gitee-error .svg-git {
  fill: #ff6b6b !important;
  filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.6)) !important;
  animation: none !important;
}

.text-error {
  background: linear-gradient(120deg, #ff8787 40%, #ff6b6b 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

/* 按钮包装 */
.action-wrapper {
  margin-top: 32px;
}

.back-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, rgba(199, 29, 35, 0.2) 0%, rgba(243, 109, 38, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  outline: none;
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(199, 29, 35, 0.4) 0%, rgba(243, 109, 38, 0.4) 100%);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 20px rgba(199, 29, 35, 0.25);
  transform: translateY(-2px);
}

.back-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(199, 29, 35, 0.2);
}
</style>
