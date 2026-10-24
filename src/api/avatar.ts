import request from '@/utils/request'

export interface AvatarAuthInfo {
  wssUrl: string
  appId: string
  sceneId: string
  uid?: string
  scene?: string
  interactMode?: string
  avatarId?: string
  voice?: string
}

// 从后端运行配置读取数字人展示开关。
export function getAvatarConfig() {
  return request.get<{ enabled: boolean }>('/teacher/avatar/config')
}

export function getAvatarAuthInfo() {
  return request.get<AvatarAuthInfo>('/teacher/avatar/auth-info')
}
