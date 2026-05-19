import request from './request'

/** 学生画像 JSON 维度数据 */
export interface StudentProfileData {
  id?: number
  userId?: number
  subjectId?: number | null
  profileVersion?: number
  // 8 个 JSON 画像维度
  basicProfile?: Record<string, any>
  knowledgeProfile?: Record<string, any>
  abilityProfile?: Record<string, any>
  preferenceProfile?: Record<string, any>
  cognitiveProfile?: Record<string, any>
  weaknessProfile?: Record<string, any>
  behaviorProfile?: Record<string, any>
  emotionProfile?: Record<string, any>
  profileSummary?: string
  confidenceScore?: number
  lastUpdateReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProfileInitParams {
  identity?: string
  grade?: string
  direction?: string
  directionDetail?: string
  level?: string
  levelDetail?: string
  goal?: string
  goalDetail?: string
  goalDeadline?: string
  dailyStudyTime?: string
  selfDescription?: string
}

export const studentProfileApi = {
  /** 获取当前用户的学生画像 */
  getProfile() {
    return request.get<StudentProfileData>('/student-profile')
  },

  /** 更新学生画像 */
  updateProfile(data: StudentProfileData) {
    return request.put<string>('/student-profile', data)
  },

  /** 引导页初始化画像 */
  initProfile(params: ProfileInitParams) {
    return request.post<string>('/student-profile/init', params)
  }
}

export default studentProfileApi
