import request from '@/utils/request'
import type { ResourceSquareVO, PublishResourceDTO, SquareListQueryParams, RateResourceDTO } from '@/types/resource-square'

/** 发布文件到资源广场 */
export function publishToSquare(data: PublishResourceDTO) {
  return request.post<ResourceSquareVO>('/resource-square/publish', data)
}

/** 下架资源广场中的资源 */
export function unpublishFromSquare(id: string) {
  return request.delete<string>(`/resource-square/${id}`)
}

/** 获取资源广场列表（分页） */
export function getSquareList(params: SquareListQueryParams) {
  return request.get<{ records: ResourceSquareVO[]; total: number; size: number; current: number }>(
    '/resource-square/list',
    { params }
  )
}

/** 获取资源广场详情 */
export function getSquareDetail(id: string) {
  return request.get<ResourceSquareVO>(`/resource-square/${id}`)
}

/** 转存资源到我的云盘 */
export function downloadFromSquare(id: string) {
  return request.post<any>(`/resource-square/${id}/download`)
}

/** 给资源评分 */
export function rateSquareResource(id: string, data: RateResourceDTO) {
  return request.post<string>(`/resource-square/${id}/rate`, data)
}
