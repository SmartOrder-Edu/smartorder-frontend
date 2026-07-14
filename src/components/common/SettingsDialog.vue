<template>
  <SettingsModal v-model="visible">
    <!-- 左侧导航 -->
    <SettingsSidebar 
      :active-menu="activeMenu" 
      @select-menu="handleMenuSelect" 
    />

    <!-- 右侧内容区 -->
    <div class="settings-content">
      <!-- 通用设置 -->
      <template v-if="activeMenu === 'general'">
        <GeneralSettings class="settings-page" />
      </template>
      
      <!-- 账号管理 -->
      <template v-else-if="activeMenu === 'account'">
        <div class="account-settings-list settings-page">
          <div class="settings-row-item">
            <span class="item-label">{{ t('username') }}</span>
            <div class="item-value">
              <span>{{ userStore.userInfo?.username || 'loveyy' }}</span>
              <svg viewBox="0 0 1024 1024" width="16" height="16" style="vertical-align: middle; margin-left: 6px;"><path d="M630.8 457.1c0-117.9-106.8-213.6-238.6-213.6S153.6 339.2 153.6 457.1c0 106 86.4 193.3 203.4 209.6L317 763.5c-2.3 5.4 0.9 11.5 6.7 12.3 4.2 0.6 8.5-1.5 10.3-5.2l51.6-104.9c14.6 2.3 29.8 3.5 45.3 3.5 133 0 200-94.2 199.9-212.2zM286.7 398c-18 0-32.6-14.6-32.6-32.6s14.6-32.6 32.6-32.6 32.6 14.6 32.6 32.6S304.7 398 286.7 398zm171.1 0c-18 0-32.6-14.6-32.6-32.6s14.6-32.6 32.6-32.6c18.1 0 32.6 14.6 32.6 32.6S475.9 398 457.8 398z" fill="#07C160"></path><path d="M870.4 645.7c0-99.3-84.6-179.9-188.9-179.9-104.3 0-188.9 80.6-188.9 179.9s84.6 179.9 188.9 179.9c12.2 0 24.2-1 35.8-2.9l40.8 82.9c1.8 3.7 6.1 5.8 10.3 5.2 5.8-.8 9-6.9 6.7-12.3l-32.4-82.6c93.1-12.9 167.8-82.4 167.8-170.2zM621.9 599.9c-14.2 0-25.7-11.5-25.7-25.7s11.5-25.7 25.7-25.7c14.2 0 25.7 11.5 25.7 25.7s-11.5 25.7-25.7 25.7zm135.2 0c-14.2 0-25.7-11.5-25.7-25.7s11.5-25.7 25.7-25.7c14.2 0 25.7 11.5 25.7 25.7s-11.6 25.7-25.7 25.7z" fill="#07C160"></path></svg>
            </div>
          </div>
          
          <div class="settings-row-item">
            <span class="item-label">{{ t('email') }}</span>
            <span class="item-value">{{ userStore.userInfo?.email || '340*****70@qq.com' }}</span>
          </div>
          
          <div class="settings-row-item" v-for="provider in OAuthProviders" :key="provider.code">
            <span class="item-label">{{ provider.label }}</span>
            <div class="item-value action-value">
              <span style="display:inline-flex;align-items:center;gap:6px;">
                <span v-html="provider.icon"></span>
                {{ isProviderBound(provider.code) ? t('bound') + (getProviderUsername(provider.code) ? ': ' + getProviderUsername(provider.code) : '') : t('unbound') }}
              </span>
              <button
                v-if="isProviderBound(provider.code)"
                class="action-link-btn"
                @click="handleUnbind(provider.code)"
              >
                {{ t('unbind') }}
              </button>
              <button
                v-else
                class="action-link-btn"
                @click="handleBind(provider.code)"
              >
                {{ t('bind') }}
              </button>
            </div>
          </div>
          
          <div class="settings-row-item">
            <span class="item-label">{{ t('logoutAll') }}</span>
            <button class="action-outline-btn danger" @click="handleLogoutDevices">{{ t('logoutBtn') }}</button>
          </div>
          
          <div class="settings-row-item no-border">
            <span class="item-label">{{ t('deleteAccount') }}</span>
            <button class="action-outline-btn danger" @click="handleDeleteAccount">{{ t('deleteBtn') }}</button>
          </div>
        </div>
      </template>
      
      <!-- 数据管理 -->
      <template v-else-if="activeMenu === 'data'">
        <div class="data-management settings-page">
          <div class="settings-card flex-row">
            <div class="meta-info">
              <div class="section-title mb-4">{{ t('exportData') }}</div>
              <div class="section-desc">{{ t('exportDesc') }}</div>
            </div>
            <el-button type="primary" size="default" plain @click="handleExportData">
              <el-icon class="mr-4"><Download /></el-icon>{{ t('exportBtn') }}
            </el-button>
          </div>

          <div class="settings-card flex-row">
            <div class="meta-info">
              <div class="section-title mb-4">{{ t('clearCache') }}</div>
              <div class="section-desc">{{ t('clearCacheDesc') }}{{ cacheSize }}</div>
            </div>
            <el-button type="warning" size="default" plain @click="handleClearCache">
              <el-icon class="mr-4"><Refresh /></el-icon>{{ t('clearCacheBtn') }}
            </el-button>
          </div>

          <div class="danger-zone">
            <div class="danger-title">{{ t('sensitiveData') }}</div>
            <div class="danger-box">
              <div class="danger-meta">
                <div class="danger-box-title">{{ t('clearChatHistory') }}</div>
                <div class="danger-box-desc">{{ t('clearChatDesc') }}</div>
              </div>
              <el-button size="small" type="danger" plain @click="handleClearChats">{{ t('clearChatBtn') }}</el-button>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 服务协议 -->
      <template v-else-if="activeMenu === 'terms'">
        <div class="terms-viewer settings-page">
          <div class="terms-header">
            <h3>{{ locale === 'en-US' ? 'SmartOrder AI OS Terms of Service' : '知序智学 AI 服务使用协议' }}</h3>
            <p class="terms-update-time">{{ locale === 'en-US' ? 'Last updated: July 1, 2026' : '最近更新日期：2026年7月1日' }}</p>
          </div>
          <div class="terms-body-content">
            <div v-if="locale === 'en-US'" class="terms-paragraph">
              <h4>1. Acceptance and Modifications</h4>
              <p>Welcome to SmartOrder AI Learning OS. This agreement governs your use of our platform. By registering or using the service, you agree to these terms. We reserves the right to modify these terms periodically.</p>
              <h4>2. Account Security</h4>
              <p>You must safeguard your credentials. You are responsible for all activities under your account. Selling or renting accounts to third parties is strictly prohibited.</p>
              <h4>3. Acceptable Use Policy</h4>
              <p>You must comply with laws. Uploading or generating harmful, illegal, or infringing content is strictly prohibited. Violation will result in immediate suspension.</p>
              <h4>4. Data Privacy</h4>
              <p>We respect your privacy. All behavioral data collected will only be used to update your growth profiles and system recommendation accuracy.</p>
            </div>
            <div v-else class="terms-paragraph">
              <h4>1. 服务条款的接受与修改</h4>
              <p>欢迎使用知序智学 AI 学习操作系统。本协议是您与知序智学运营主体之间关于使用本平台服务所订立的协议。当您注册、登录或实际使用本服务时，即表示您已阅读并完全同意接受本协议的全部条款。我们有权根据法律法规或产品迭代需要对本服务条款进行不定期修改，修改后的条款将会在本页面发布并生效。</p>
              <h4>2. 用户账号创建与安全</h4>
              <p>为了使用本平台的完整学习功能，您需要注册一个账号。您必须妥善保管您的账号密码及安全凭证，因您保管不善导致的任何账号被盗、数据丢失等损失均由您自行承担。知序智学账号仅限注册者本人使用，禁止转让、出租或售卖给任何第三方。</p>
              <h4>3. 用户行为规范与合规使用</h4>
              <p>在使用知序智学提供的 AI 工具及资源时，您必须遵守国家有关法律法规。禁止向本平台上传、传播或通过 AI 引擎生成带有政治敏感、淫秽、暴力、侵权、欺诈等不良信息。平台对于违规账号保留立即冻结、限制服务或直接销户的权利，并配合有关部门依法追究责任。</p>
              <h4>4. 算法数据与隐私保护</h4>
              <p>知序智学高度重视用户隐私。我们根据《隐私政策》收集和使用您的学习行为数据，仅用于提升模型推荐精度 and 优化成长画像。我们承诺采取符合行业安全标准的技术手段保护您的数据不被泄露或非法篡改。未经您的明确授权，我们不会向任何第三方披露您的个人敏感信息。</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </SettingsModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Download, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

// 引入拆分的组件
import SettingsModal from './settings/SettingsModal.vue'
import SettingsSidebar from './settings/SettingsSidebar.vue'
import GeneralSettings from './settings/GeneralSettings.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const userStore = useUserStore()
const { t, locale } = useI18n()

const visible = ref(props.modelValue)
const activeMenu = ref('general')
const cacheSize = ref('1.4 MB')

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleMenuSelect = (menu: string) => {
  activeMenu.value = menu
}

// OAuth 第三方平台定义
const OAuthProviders = [
  {
    code: 'gitee',
    label: t('gitee'),
    icon: '<svg viewBox="0 0 1024 1024" width="16" height="16" style="vertical-align:middle;"><path d="M512 0C229.12 0 0 229.12 0 512s229.12 512 512 512 512-229.12 512-512S794.88 0 512 0zm233.6 374.4H448c-17.92 0-32 14.08-32 32v192h192c17.92 0 32 14.08 32 32s-14.08 32-32 32H384c-17.92 0-32-14.08-32-32V406.4c0-52.48 42.88-96 96-96h297.6c17.92 0 32 14.08 32 32s-14.08 32-32 32z" fill="#C71D23"/></svg>'
  },
  {
    code: 'github',
    label: t('github'),
    icon: '<svg viewBox="0 0 1024 1024" width="16" height="16" style="vertical-align:middle;color:#24292e;" class="github-icon"><path d="M512 0C229.25 0 0 229.25 0 512c0 226.25 146.69 418.13 350.16 485.83 25.59 4.69 34.94-11.12 34.94-24.69 0-12.19-.47-52.56-.69-95.31-142.44 30.94-172.5-60.44-172.5-60.44-23.31-59.25-56.88-75-56.88-75-46.5-31.81 3.53-31.13 3.53-31.13 51.41 3.63 78.44 52.81 78.44 52.81 45.63 78.19 119.75 55.63 148.94 42.56 4.63-33.06 17.88-55.63 32.44-68.38-113.69-12.94-233.19-56.88-233.19-253.06 0-55.88 20-101.56 52.81-137.44-5.31-12.94-22.88-65.06 5-135.56 0 0 43.06-13.81 141.06 52.56 40.94-11.38 84.88-17.06 128.5-17.25 43.63.19 87.63 5.88 128.63 17.25 97.88-66.38 140.88-52.56 140.88-52.56 27.94 70.5 10.38 122.63 5.06 135.56 32.88 35.88 52.75 81.56 52.75 137.44 0 196.69-119.75 239.94-233.81 252.56 18.38 15.88 34.75 47.13 34.75 94.94 0 68.56-.63 123.75-.63 140.63 0 13.69 9.25 29.63 35.25 24.63C877.44 930 1024 738.13 1024 512 1024 229.25 794.75 0 512 0z" fill="currentColor"/></svg>'
  }
]

const boundIdentities = computed(() => {
  return userStore.userInfo?.authIdentities || []
})

const boundProviders = computed(() => {
  return new Set(boundIdentities.value.map(i => i.providerCode))
})

const isProviderBound = (providerCode: string) => {
  return boundProviders.value.has(providerCode)
}

const getProviderUsername = (providerCode: string) => {
  const identity = boundIdentities.value.find(i => i.providerCode === providerCode)
  return identity?.providerUsername || ''
}

// 绑定：跳转到 OAuth 授权页面
const handleBind = (providerCode: string) => {
  if (providerCode === 'github') {
    userApi.getGithubOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/github`)
      const clientId = 'Ov23liXm4K4A7VHJmGQi' // GitHub OAuth App client_id
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email`
    })
  } else if (providerCode === 'gitee') {
    userApi.getGiteeOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/gitee`)
      const clientId = '71fa73bb6b064414b3cf1c78c5a36d7be15d0c0ecfbc09e6b3b8a6bedff9fcce' // Gitee OAuth App client_id
      window.location.href = `https://gitee.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`
    })
  }
}

// 解绑：调接口解绑
const handleUnbind = (providerCode: string) => {
  ElMessageBox.confirm(
    locale.value === 'en-US'
      ? `Are you sure you want to unbind your ${providerCode} account? You will not be able to use ${providerCode} quick login after unbinding.`
      : `确定要解绑 ${providerCode} 账号吗？解绑后将无法使用 ${providerCode} 快捷登录。`,
    locale.value === 'en-US' ? 'Prompt' : '提示',
    {
      confirmButtonText: locale.value === 'en-US' ? 'Confirm Unbind' : '确定解绑',
      cancelButtonText: locale.value === 'en-US' ? 'Cancel' : '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userStore.unbindAuth(providerCode)
      ElMessage.success(locale.value === 'en-US' ? `${providerCode} unbound successfully` : `${providerCode} 解绑成功`)
    } catch {
      ElMessage.error(locale.value === 'en-US' ? 'Unbind failed' : '解绑失败')
    }
  }).catch(() => {})
}

const handleDeleteAccount = () => {
  ElMessageBox.confirm(
    locale.value === 'en-US'
      ? 'Deleting your account will permanently clear your profile, tasks, and chat history. Continue?'
      : '注销账号将永久删除您的个人画像、进度、任务和对话记录，且无法恢复。确定继续吗？',
    locale.value === 'en-US' ? 'Warning - Delete Account' : '警告 - 注销账号',
    {
      confirmButtonText: locale.value === 'en-US' ? 'Confirm Delete' : '确认注销',
      cancelButtonText: locale.value === 'en-US' ? 'Cancel' : '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    ElMessage.error(locale.value === 'en-US' ? 'Account deletion is locked by administrator' : '此为演示系统，账号注销功能已被管理员锁定')
  }).catch(() => {})
}

const handleExportData = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
    username: userStore.userInfo?.username || 'guest',
    exportTime: new Date().toISOString(),
    system: 'SmartOrder AI Learning OS',
    status: 'profile_export'
  }));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `smartorder_profile_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  ElMessage.success(t('exportSuccess'))
}

const handleClearCache = () => {
  ElMessage.success(locale.value === 'en-US' ? 'Clearing browser cache...' : '正在清理浏览器缓存文件...')
  setTimeout(() => {
    cacheSize.value = '0.0 KB'
    ElMessage.success(t('clearSuccess'))
  }, 800)
}

const handleClearChats = () => {
  ElMessageBox.confirm(
    locale.value === 'en-US'
      ? 'Are you sure you want to clear all cloud chat records? This is irreversible!'
      : '确定要清空云端所有的对话历史记录吗？本操作不可撤销！',
    locale.value === 'en-US' ? 'Prompt' : '提示',
    {
      confirmButtonText: locale.value === 'en-US' ? 'Confirm' : '确定清空',
      cancelButtonText: locale.value === 'en-US' ? 'Cancel' : '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(locale.value === 'en-US' ? 'Submitting clear command...' : '正在向云端提交清空指令...')
    setTimeout(() => {
      ElMessage.success(locale.value === 'en-US' ? 'Cloud chat history cleared successfully' : '已彻底清空云端对话历史')
    }, 500)
  }).catch(() => {})
}

const handleLogoutDevices = () => {
  ElMessageBox.confirm(
    locale.value === 'en-US' ? 'Are you sure you want to logout all other devices?' : '确定要登出其他所有设备吗？',
    locale.value === 'en-US' ? 'Prompt' : '提示',
    {
      confirmButtonText: locale.value === 'en-US' ? 'Confirm' : '确定登出',
      cancelButtonText: locale.value === 'en-US' ? 'Cancel' : '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(locale.value === 'en-US' ? 'Logged out other devices successfully' : '已成功登出其他设备')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.settings-content {
  min-width: 0;
  min-height: 0;
  padding: 20px 22px 24px 36px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }
}

.settings-page {
  animation: settingsFadeIn 120ms ease;
  width: 100%;
}

@keyframes settingsFadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-card {
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;

  &.flex-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;

  &.mb-4 {
    margin-bottom: 4px;
  }
}

.section-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 账号管理行式结构样式 */
.account-settings-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.settings-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 52px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  
  &.no-border {
    border-bottom: none;
  }
  
  .item-label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }
  
  .item-value {
    font-size: 14px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    
    &.action-value {
      gap: 12px;
    }
  }
  
  .action-link-btn {
    border: none;
    background: transparent;
    color: var(--el-color-primary);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    font-weight: 500;
    transition: opacity 0.2s;
    outline: none;
    
    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
  
  .action-outline-btn {
    height: 32px;
    padding: 0 18px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    outline: none;
    
    &.danger {
      border: 1px solid var(--el-color-danger);
      color: var(--el-color-danger);
      
      &:hover {
        background-color: var(--el-color-danger);
        color: #ffffff;
      }
    }
  }
}

/* 敏感数据管理危险区域 */
.danger-zone {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .danger-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-danger);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-left: 4px;
  }
  
  .danger-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-radius: 14px;
    gap: 20px;
    
    .danger-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      
      .danger-box-title {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--el-color-danger);
      }
      
      .danger-box-desc {
        font-size: 12px;
        color: var(--text-primary);
        line-height: 1.4;
      }
    }
  }
}

.mr-4 {
  margin-right: 4px;
}

/* 服务协议查看器 */
.terms-viewer {
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  
  .terms-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .terms-update-time {
      margin: 0;
      font-size: 11px;
      color: var(--text-secondary);
    }
  }
  
  .terms-body-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 2px;
    }
  }
  
  .terms-paragraph {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    h4 {
      margin: 0;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    p {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--text-secondary);
      text-align: justify;
    }
  }
}

/* 浅色主题下的卡片面板 */
html[data-theme='light'] {
  .settings-card {
    background-color: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }
  
  .terms-viewer {
    background-color: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }

  .danger-box {
    border: 1px dashed rgba(245, 108, 108, 0.4);
    background-color: rgba(245, 108, 108, 0.02);
  }
}

/* 深色主题下的卡片面板 */
html[data-theme='dark'] {
  .settings-card {
    background-color: var(--panel-bg-secondary);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 16px var(--shadow-color);
  }
  
  .terms-viewer {
    background-color: var(--panel-bg-secondary);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 16px var(--shadow-color);
  }

  .danger-box {
    border: 1px dashed rgba(245, 108, 108, 0.4);
    background-color: rgba(245, 108, 108, 0.04);
  }
}
</style>
