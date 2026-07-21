import request from './request'

export interface AdminUserQuery {
  /** 页码 */
  page: number
  /** 每页数量 */
  size: number
  /** 用户名、邮箱或手机号关键词 */
  keyword?: string
  /** 用户角色：0=学生，1=管理员，2=教师 */
  role?: number
  /** 账号状态：0=禁用，1=正常 */
  status?: number
}

export interface AdminUserItem {
  /** 用户ID，后端雪花ID在前端按字符串处理 */
  id: string
  /** 用户名/昵称 */
  username?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像地址 */
  avatarUrl?: string
  /** 性别：0=未设置，1=男，2=女 */
  gender?: number
  /** 生日 */
  birthday?: string
  /** 个人简介 */
  bio?: string
  /** 用户角色：0=学生，1=管理员，2=教师 */
  role?: number
  /** VIP等级 */
  vipLevel?: number
  /** 账号状态：0=禁用，1=正常 */
  status?: number
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

export interface AdminUserPage {
  /** 用户列表 */
  records: AdminUserItem[]
  /** 总数量 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  size: number
}

export interface AdminUserStats {
  /** 未注销用户总数 */
  totalUsers: number
  /** 正常账号数 */
  normalUsers: number
  /** 禁用账号数 */
  disabledUsers: number
  /** 管理员数量 */
  adminUsers: number
  /** 学生数量 */
  studentUsers: number
}

export interface AdminUserUpdate {
  /** 用户名/昵称 */
  username?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像地址 */
  avatarUrl?: string
  /** 性别 */
  gender?: number
  /** 生日 */
  birthday?: string
  /** 个人简介 */
  bio?: string
  /** 用户角色 */
  role?: number
  /** VIP等级 */
  vipLevel?: number
  /** 账号状态 */
  status?: number
}

export const adminUserApi = {
  /** 分页查询管理端用户列表 */
  page(params: AdminUserQuery) {
    return request.get<AdminUserPage>('/admin/users/page', { params })
  },

  /** 获取用户统计指标 */
  stats() {
    return request.get<AdminUserStats>('/admin/users/stats')
  },

  /** 更新用户基础资料、角色、状态和 VIP 等级 */
  update(id: string | number, data: AdminUserUpdate) {
    return request.post(`/admin/users/${id}`, data)
  },

  /** 快捷设置用户角色 */
  updateRole(id: string | number, role: number) {
    return request.post(`/admin/users/${id}/role/${role}`)
  },

  /** 快捷启用或禁用账号 */
  updateStatus(id: string | number, status: number) {
    return request.post(`/admin/users/${id}/status/${status}`)
  }
}

export default adminUserApi
