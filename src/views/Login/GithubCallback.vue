<template>
  <div class="callback-container">
    <!-- 炫丽背景装饰 -->
    <div class="bg-gradient"></div>
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="glass-card">
      <!-- 动态科技加载圈 -->
      <div class="loading-wrapper">
        <div class="loading-ring ring-outer"></div>
        <div class="loading-ring ring-inner"></div>
        <div class="github-icon">
          <svg viewBox="0 0 24 24" class="svg-git">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
      </div>

      <!-- 动态状态文本 -->
      <h3 class="status-title">{{ statusText }}</h3>
      <p class="status-subtitle">{{ subText }}</p>


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

const statusText = ref('正在连接 GitHub 认证中心...')
const subText = ref('请稍候，这通常需要几秒钟')
const loginLoading = ref(false)

// 挂载时触发
onMounted(() => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (code) {
    doLogin(code, state)
  } else {
    statusText.value = '授权参数缺失'
    subText.value = '未检测到 GitHub 授权 code，请重新尝试'
    ElMessage.error('授权参数缺失')
  }
})

const doLogin = async (code: string, state?: string) => {
  loginLoading.value = true
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
    statusText.value = '登录认证失败'
    subText.value = error.message || '可能由于网络抖动或配置失效，您可以尝试下方模拟模式。'
    ElMessage.error('登录认证失败，请检查网络或使用模拟测试登录')
  } finally {
    loginLoading.value = false
  }
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
  background: radial-gradient(circle, #3b5bdb 0%, transparent 80%);
  top: -10%;
  left: 10%;
}

.blob-2 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, #12b886 0%, transparent 80%);
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
  border-top-color: #3b5bdb;
  border-bottom-color: #12b886;
}

.ring-inner {
  width: 76%;
  height: 76%;
  border-left-color: #3b5bdb;
  border-right-color: #12b886;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

.github-icon {
  position: relative;
  width: 32px;
  height: 32px;
  z-index: 12;
}

.svg-git {
  width: 100%;
  height: 100%;
  fill: #fff;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
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
</style>
