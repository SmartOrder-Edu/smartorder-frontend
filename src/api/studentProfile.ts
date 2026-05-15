import request from './request'

export interface StudentProfileData {
  id?: number
  userId?: number
  learningStylePreference?: string
  strengths?: string
  weaknesses?: string
  dailyAvailableMinutes?: number
  preferredTimeSlots?: string
  concentrationDurationMinutes?: number
  subjectsOfInterest?: string
  academicLevel?: string
  major?: string
  semester?: string
  gpa?: number
  profileVersion?: number
  lastAnalyzedAt?: string
}

export const studentProfileApi = {
  /** 获取当前用户的学生画像 */
  getProfile() {
    return request.get<StudentProfileData>('/student-profile')
  },

  /** 更新学生画像 */
  updateProfile(data: StudentProfileData) {
    return request.put<string>('/student-profile', data)
  }
}

export default studentProfileApi
