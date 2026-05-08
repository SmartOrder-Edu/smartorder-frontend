/**
 * 全局类型定义
 */

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type MaybeRef<T> = T | Ref<T>

export type MaybePromise<T> = T | Promise<T>

export type Recordable<T = any> = Record<string, T>

export type EmitType = ReturnType<typeof defineEmits>

export type TargetContext = '_self' | '_blank'

export interface ComponentSize {
  large?: number | string
  default?: number | string
  small?: number | string
}

export interface AppInfo {
  name: string
  version: string
  description?: string
  author?: string
}

export interface MenuItem {
  path: string
  name: string
  icon?: string
  children?: MenuItem[]
  meta?: {
    title?: string
    hidden?: boolean
    roles?: string[]
  }
}

export interface Pagination {
  page: number
  pageSize: number
  total?: number
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export type ErrorCode = 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504
