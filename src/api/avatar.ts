import request from '@/utils/request'

export interface AvatarAuthInfo {
  wssUrl: string
  appId: string
  sceneId: string
}

export function getAvatarAuthInfo() {
  return request.get<AvatarAuthInfo>('/teacher/avatar/auth-info')
}
