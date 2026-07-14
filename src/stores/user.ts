import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'
import type { UserInfoResponse, UpdateUserParams } from '@/api/user'
import { studentProfileApi } from '@/api/studentProfile'
import { chatWebSocket } from '@/utils/websocket'

const TOKEN_KEY = 'token'
const SHORT_TOKEN_KEY = 'shortToken'
const ACCOUNT_KEY = 'remembered_account'

export interface UserInfo {
  id: string
  username: string
  email: string
  phone?: string
  avatarUrl?: string
  gender?: number
  birthday?: string
  bio?: string
  role?: number
  vipLevel?: number
  vipStartTime?: string
  vipExpireTime?: string
  status?: number
  profileInitialized?: boolean
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const shortToken = ref<string>(localStorage.getItem(SHORT_TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLogin = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.username || '')
  const userRoles = computed(() => userInfo.value?.role != null ? [userInfo.value!.role!] : [])
  const profileInitialized = computed(() => userInfo.value?.profileInitialized ?? false)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function setShortToken(newShortToken: string) {
    shortToken.value = newShortToken
    localStorage.setItem(SHORT_TOKEN_KEY, newShortToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  async function login(email: string, password: string) {
    const response = await userApi.login({ email, password })
    // 后端 Result.success(tokens.get("accessToken"), ...) 返回纯字符串，拦截器解包后也是字符串
    if (typeof response === 'string') {
      setToken(response)
    } else {
      setToken(response.accessToken)
      setShortToken(response.shortToken)
    }
  }

  async function githubLogin(code: string, state?: string) {
    const response = await userApi.githubLogin(code, state)
    setToken(response)
  }

  async function register(params: {
    username: string; email: string; password: string; confirmPassword: string; verificationCode: string
  }) {
    await userApi.register(params)
  }

  async function fetchUserInfo() {
    const info = await userApi.getUserInfo()
    // 查询画像状态：profileConfidenceScore > 0 表示已初始化
    try {
      const profile = await studentProfileApi.getProfile()
      info.profileInitialized = !!(profile && profile.profileConfidenceScore && profile.profileConfidenceScore > 0)
    } catch {
      info.profileInitialized = false
    }
    setUserInfo(info as UserInfo)
  }

  async function logout() {
    try {
      await userApi.logout()
    } catch {}
    token.value = ''
    shortToken.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SHORT_TOKEN_KEY)
    chatWebSocket.disconnect()
  }

  function saveRememberedAccount(account: string) {
    localStorage.setItem(ACCOUNT_KEY, account)
  }

  function getRememberedAccount(): string {
    return localStorage.getItem(ACCOUNT_KEY) || ''
  }

  function clearRememberedAccount() {
    localStorage.removeItem(ACCOUNT_KEY)
  }

  function updateUserInfo(partial: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partial }
    }
  }

  async function updateProfile(data: UpdateUserParams) {
    await userApi.updateProfile(data)
    updateUserInfo(data)
  }

  async function uploadAvatar(file: File) {
    const url = await userApi.uploadAvatar(file)
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatarUrl: url }
    }
    return url
  }

  async function changePassword(params: { newPassword: string; confirmPassword: string; email: string; verificationCode: number }) {
    await userApi.changePassword(params)
  }

  return {
    token,
    shortToken,
    userInfo,
    isLogin,
    userName,
    userRoles,
    profileInitialized,
    setToken,
    setShortToken,
    setUserInfo,
    login,
    githubLogin,
    register,
    fetchUserInfo,
    logout,
    saveRememberedAccount,
    getRememberedAccount,
    clearRememberedAccount,
    updateUserInfo,
    updateProfile,
    uploadAvatar,
    changePassword
  }
})
