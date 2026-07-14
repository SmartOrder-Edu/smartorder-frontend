import request from '@/utils/request'

/** 用户文件配额（userSpace/version 经 json-bigint 处理为 string，避免雪花ID精度丢失） */
export interface UserFileQuotaVO {
  /** 用户ID（雪花ID，按 string 接收） */
  userId: string
  /** 已用空间（字节，后端 Long，按 string 接收，前端使用时再 Number()） */
  userSpace: string
  /** 乐观锁版本号 */
  version: number
}

/** 获取当前登录用户的存储配额信息 */
export function getQuota() {
  return request.get<UserFileQuotaVO>('/quota', { showError: false })
}

/** 初始化配额（新用户首次访问网盘时调用） */
export function initQuota() {
  return request.post<UserFileQuotaVO>('/quota/init')
}
