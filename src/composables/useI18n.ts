import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

export const translations = {
  'zh-CN': {
    settings: '系统设置',
    generalSettings: '通用设置',
    accountSettings: '账号管理',
    dataSettings: '数据管理',
    serviceTerms: '服务协议',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    language: '语言',
    langSystem: '跟随系统',
    langZh: '简体中文',
    langEn: 'English',
    username: '用户名',
    email: '邮箱',
    gitee: 'Gitee',
    github: 'GitHub',
    unbind: '解绑',
    change: '变更',
    logoutAll: '登出所有设备',
    logoutBtn: '登出',
    deleteAccount: '注销账号',
    deleteBtn: '注销',
    exportData: '导出个人数据',
    exportDesc: '打包导出你的对话历史、成长画像与学习成果（JSON 格式）',
    exportBtn: '导出数据',
    clearCache: '清理本地缓存',
    clearCacheDesc: '清空头像、图表缓存并重新载入，当前估算大小：',
    clearCacheBtn: '立即清理',
    sensitiveData: '敏感数据管理',
    clearChatHistory: '清空全部对话历史',
    clearChatDesc: '这会从云端彻底删除您的所有聊天对话记录，此操作不可逆。',
    clearChatBtn: '清空历史',
    closeSettings: '关闭设置',
    saveFailed: '设置同步失败，已保存在本地',
    exportSuccess: '您的个人数据已导出并开始下载！',
    clearSuccess: '已成功清理浏览器缓存',
    send: '发送',
    thinking: '已思考',
    deepThinking: '深度思考',
    searchWeb: '智能搜索',
    placeholder: '给 DeepSeek 发送消息',
    newChat: '开启新对话'
  },
  'en-US': {
    settings: 'Settings',
    generalSettings: 'General',
    accountSettings: 'Account',
    dataSettings: 'Data',
    serviceTerms: 'Terms',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
    langSystem: 'System Default',
    langZh: '简体中文',
    langEn: 'English',
    username: 'Username',
    email: 'Email',
    gitee: 'Gitee',
    github: 'GitHub',
    unbind: 'Unbind',
    change: 'Change',
    logoutAll: 'Logout all devices',
    logoutBtn: 'Logout',
    deleteAccount: 'Delete Account',
    deleteBtn: 'Delete',
    exportData: 'Export Personal Data',
    exportDesc: 'Pack and export your conversation history, growth profile, and learning outcomes (JSON format)',
    exportBtn: 'Export Data',
    clearCache: 'Clear Local Cache',
    clearCacheDesc: 'Clear avatars, chart cache and reload, estimated size: ',
    clearCacheBtn: 'Clear Now',
    sensitiveData: 'Sensitive Data Management',
    clearChatHistory: 'Clear All Conversation History',
    clearChatDesc: 'This will completely delete all your chat history from the cloud. This action is irreversible.',
    clearChatBtn: 'Clear History',
    closeSettings: 'Close Settings',
    saveFailed: 'Sync settings failed, saved locally',
    exportSuccess: 'Personal data exported and download started!',
    clearSuccess: 'Browser cache cleared successfully',
    send: 'Send',
    thinking: 'Thought',
    deepThinking: 'Deep Think',
    searchWeb: 'Search Web',
    placeholder: 'Send a message to DeepSeek',
    newChat: 'New Chat'
  }
}

export function useI18n() {
  const appStore = useAppStore()

  const t = (key: keyof typeof translations['zh-CN']) => {
    const lang = appStore.resolvedLanguage
    return translations[lang]?.[key] || translations['zh-CN'][key] || key
  }

  return {
    t,
    locale: computed(() => appStore.resolvedLanguage)
  }
}
