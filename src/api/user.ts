import request from './request'

export interface LoginParams {
  email?: string
  phone?: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  shortToken: string
}

export interface RegisterParams {
  username: string
  email?: string
  phone?: string
  password: string
  confirmPassword: string
  verificationCode: string
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

export interface AuthIdentity {
  providerCode: string
  providerUsername: string
  providerEmail: string
  emailVerified: number
  status: number
  firstLoginTime: string
  lastLoginTime: string
}

export interface BindAuthParams {
  providerCode: string
  code: string
  state: string
}

export interface UserInfoResponse {
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
  authIdentities?: AuthIdentity[]
}

export const userApi = {
  /** 密码登录，返回accessToken和shortToken，refreshToken通过HttpOnly Cookie自动携带 */
  login(params: LoginParams) {
    return request.post<LoginResponse>('/auth/login', params)
  },

  /** 获取 GitHub OAuth state（防 CSRF） */
  getGithubOAuthState() {
    return request.get<string>('/auth/github/state')
  },

  /** GitHub 登录，接收 code 和 state，返回系统 accessToken，刷新 token 写入 Cookie */
  githubLogin(code: string, state?: string) {
    return request.post<string>('/auth/github/login', { code, state })
  },

  /** 获取 Gitee OAuth state（防 CSRF） */
  getGiteeOAuthState() {
    return request.get<string>('/auth/gitee/state')
  },

  /** Gitee 登录，接收 code 和 state，返回系统 accessToken，刷新 token 写入 Cookie */
  giteeLogin(code: string, state?: string) {
    return request.post<string>('/auth/gitee/login', { code, state })
  },

  /** 邮箱注册 */
  register(params: RegisterParams) {
    return request.post<string>('/auth/register', params)
  },

  /** 发送邮箱验证码 */
  sendEmailCode(email: string) {
    return request.get<string>('/auth/sendVerificationCode/email', { params: { email } })
  },

  /** 刷新shortToken（refreshToken通过Cookie自动携带） */
  refreshToken() {
    return request.post<{ shortToken: string }>('/auth/refreshToken')
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
  },

  /** 绑定第三方账号 */
  bindAuth(params: BindAuthParams) {
    return request.post<string>('/users/bindings', params)
  },

  /** 解绑第三方账号 */
  unbindAuth(providerCode: string) {
    return request.delete<string>(`/users/bindings/${providerCode}`)
  },

  /** 获取第三方绑定列表 */
  getBindings() {
    return request.get<AuthIdentity[]>('/users/bindings')
  }
}

export default userApi
