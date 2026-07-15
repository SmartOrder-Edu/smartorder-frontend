/** 广场资源分类 */
export type SquareCategory = 'doc' | 'mindmap' | 'video' | 'quiz' | 'case'

/** 排序方式 */
export type SquareSortBy = 'newest' | 'download' | 'rating'

/** 发布到资源广场的请求体 */
export interface PublishResourceDTO {
  fileId: string
  title: string
  description: string
  tags: string
  category: SquareCategory
}

/** 资源广场列表查询参数 */
export interface SquareListQueryParams {
  keyword?: string
  category?: string
  sortBy?: SquareSortBy
  pageNum?: number
  pageSize?: number
}

/** 评分请求 */
export interface RateResourceDTO {
  rating: number
}

/** 资源广场 VO */
export interface ResourceSquareVO {
  id: string
  title: string
  description: string
  tags: string[]
  category: SquareCategory
  userId: string
  publisherName: string
  fileId: string
  coverUrl: string
  downloadCount: number
  viewCount: number
  ratingAvg: number
  ratingCount: number
  status: number
  fileType: string
  fileSize: number
  createTime: string
  updateTime: string
  hasDownloaded: boolean
  userRating: number | null
}

/** 分页响应 */
export interface SquarePageResult {
  records: ResourceSquareVO[]
  total: number
  size: number
  current: number
}

/** Agent 精选推荐结果 */
export interface FeaturedResourceVO {
  /** 精选资源（含当前用户态：hasDownloaded / userRating） */
  resource: ResourceSquareVO
  /** 精选来源：agent=LLM基于画像挑选 / hot=热门回退 */
  reason: 'agent' | 'hot'
}
