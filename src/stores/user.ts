import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  roles?: string[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isLogin = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.username || '')
  const userRoles = computed(() => userInfo.value?.roles || [])

  function setToken(newToken: string) {
    token.value = newToken
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function logout() {
    token.value = ''
    userInfo.value = null
  }

  function updateUserInfo(partial: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partial }
    }
  }

  return {
    token,
    userInfo,
    isLogin,
    userName,
    userRoles,
    setToken,
    setUserInfo,
    logout,
    updateUserInfo
  }
})
