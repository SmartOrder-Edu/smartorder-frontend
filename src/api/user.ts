import request from './request'

export interface LoginParams {
  email?: string
  phone?: string
  password: string
}

export interface RegisterParams {
  username: string
  email?: string
  phone?: string
  password: string
  confirmPassword: string
  verificationCode: string
  /** 身份：undergraduate|graduate|self|career */
  identity?: string
  /** 学习方向：ai|cs|os|ds|ee|other */
  direction?: string
  /** 当前基础：beginner|some|course|advanced */
  level?: string
  /** 近期目标：exam|project|skill|competition */
  goal?: string
  /** 自由文本自我描述（最长500字符） */
  selfDescription?: string
}

export interface UpdateUserParams {
  username?: string
  email?: string
  phone?: string
  avatarUrl?: string
  gender?: number
  birthday?: string
  bio?: string
  role?: number
}

export interface ChangePasswordParams {
  newPassword: string
  confirmPassword: string
  email: string
  verificationCode: number
}

export interface UserInfoResponse {
  id: number
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
}

export const userApi = {
  /** 密码登录，返回accessToken，refreshToken通过HttpOnly Cookie自动携带 */
  login(params: LoginParams) {
    return request.post<string>('/auth/login', params)
  },

  /** 邮箱注册 */
  register(params: RegisterParams) {
    return request.post<string>('/auth/register', params)
  },

  /** 发送邮箱验证码 */
  sendEmailCode(email: string) {
    return request.get<string>('/auth/sendVerificationCode/email', { params: { email } })
  },

  /** 刷新accessToken（refreshToken通过Cookie自动携带） */
  refreshToken() {
    return request.post<string>('/auth/refreshToken')
  },

  /** 登出 */
  logout() {
    return request.post('/auth/logout')
  },

  /** 修改密码 */
  changePassword(params: ChangePasswordParams) {
    return request.post<string>('/auth/changePassword', params)
  },

  /** 获取当前用户信息 */
  getUserInfo() {
    return request.get<UserInfoResponse>('/users/info')
  },

  /** 更新用户资料 */
  updateProfile(data: UpdateUserParams) {
    return request.post<string>('/users/profile', data)
  },

  /** 上传用户头像 */
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.put<string>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /** 注销账号 */
  cancelAccount(verificationCode: string) {
    return request.post<string>('/users/cancel/', null, { params: { verificationCode } })
  }
}

export default userApi
