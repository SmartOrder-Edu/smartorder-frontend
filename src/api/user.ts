import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userInfo: {
    id: string
    username: string
    email: string
    avatar?: string
  }
}

export interface UserInfoResponse {
  id: string
  username: string
  email: string
  avatar?: string
  roles: string[]
}

export const userApi = {
  login(params: LoginParams) {
    return request.post<LoginResponse>('/auth/login', params)
  },

  logout() {
    return request.post('/auth/logout')
  },

  getUserInfo() {
    return request.get<UserInfoResponse>('/user/info')
  },

  updateUserInfo(data: Partial<UserInfoResponse>) {
    return request.put('/user/info', data)
  }
}

export default userApi
