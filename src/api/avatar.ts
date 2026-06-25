import request from '@/utils/request'

export function getAvatarAuthInfo() {
  return request({
    url: '/teacher/avatar/auth-info',
    method: 'get'
  })
}
